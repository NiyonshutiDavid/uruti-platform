import 'dart:convert';
import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/app_constants.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/message_notification_handler.dart';
import '../services/notification_service.dart';
import '../services/realtime_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated }

/// Helper to collect device info for session tracking.
Future<Map<String, String>> _getDeviceInfo() async {
  final info = DeviceInfoPlugin();
  String? deviceId;
  String? deviceName;
  String platform = 'unknown';
  String? osName;
  try {
    if (Platform.isAndroid) {
      final a = await info.androidInfo;
      deviceId = a.id;
      deviceName = '${a.brand} ${a.model}';
      platform = 'android';
      osName = 'Android ${a.version.release}';
    } else if (Platform.isIOS) {
      final i = await info.iosInfo;
      deviceId = i.identifierForVendor;
      deviceName = i.utsname.machine;
      platform = 'ios';
      osName = '${i.systemName} ${i.systemVersion}';
    }
  } catch (_) {}
  return {
    if (deviceId != null) 'device_id': deviceId,
    if (deviceName != null) 'device_name': deviceName,
    'platform': platform,
    if (osName != null) 'os': osName,
  };
}

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  AuthStatus _status = AuthStatus.initial;
  UserModel? _user;
  String? _error;
  String? _token;

  AuthStatus get status => _status;
  UserModel? get user => _user;
  String? get error => _error;
  String? get token => _token;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isLoading => _status == AuthStatus.loading;
  String get backendUrl => AppConstants.apiBaseUrl;

  String _normalizeBackendUrl(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return trimmed;
    final withScheme =
        trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : 'http://$trimmed';
    final uri = Uri.tryParse(withScheme);
    if (uri == null) return withScheme;
    return uri.replace(path: '').toString().replaceAll(RegExp(r'/$'), '');
  }

  Future<void> setBackendUrl(String rawUrl) async {
    final normalized = _normalizeBackendUrl(rawUrl);
    if (normalized.isEmpty) return;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.backendUrlKey, normalized);

    // Reconfigure API endpoints and clear stale auth state from prior backend.
    AppConstants.configure(normalized, aiBackendUrl: normalized);
    await _clearSession();
    _status = AuthStatus.unauthenticated;
    _error = null;
    notifyListeners();
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey);
    final userJson = prefs.getString(AppConstants.userKey);

    if (token != null) {
      _api.setToken(token);
      _token = token;
      try {
        if (userJson != null) {
          _user = UserModel.fromJson(jsonDecode(userJson));
          _status = AuthStatus.authenticated;
          notifyListeners();
        }
        // Refresh user in background
        _user = await _api.getCurrentUser();
        _status = AuthStatus.authenticated;
        await _saveUser(_user!);
        if (_user!.isActive) {
          await NotificationService.instance.syncTokenWithBackend();
          // Register/refresh device session for linked-device tracking
          final devInfo = await _getDeviceInfo();
          await _api.registerSession(
            deviceId: devInfo['device_id'],
            deviceName: devInfo['device_name'],
            platform: devInfo['platform'],
            os: devInfo['os'],
          );
          if (_token != null && _token!.trim().isNotEmpty) {
            await RealtimeService.instance.connect(_token!);
            MessageNotificationHandler.instance.start(this);
          }
        }
      } catch (_) {
        await _clearSession();
      }
    } else {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _status = AuthStatus.loading;
    _error = null;
    notifyListeners();

    try {
      final devInfo = await _getDeviceInfo();
      final response = await _api.login(
        email,
        password,
        deviceId: devInfo['device_id'],
        deviceName: devInfo['device_name'],
        platform: devInfo['platform'],
        os: devInfo['os'],
      );
      final token = response['access_token'] as String;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.tokenKey, token);
      _api.setToken(token);
      _token = token;

      _user = await _api.getCurrentUser();
      await _saveUser(_user!);

      // Only sync push token for active accounts
      if (_user!.isActive) {
        await NotificationService.instance.syncTokenWithBackend();
      }

      // Start listening for message notifications at OS level
      MessageNotificationHandler.instance.start(this);
      await RealtimeService.instance.connect(token);

      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    } catch (e) {
      _error =
          'Cannot reach server at ${AppConstants.apiBaseUrl}. Ensure backend is running and that the physical-device backend URL in main.dart matches your current LAN IP.';
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    required String role,
  }) async {
    _status = AuthStatus.loading;
    _error = null;
    notifyListeners();

    try {
      await _api.register(
        email: email,
        password: password,
        fullName: fullName,
        role: role,
      );
      return await login(email, password);
    } on ApiException catch (e) {
      _error = e.message;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Registration failed. Try again.';
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    MessageNotificationHandler.instance.stop();
    await RealtimeService.instance.disconnect();
    try {
      await NotificationService.instance.unregisterCurrentToken();
    } catch (_) {}
    await _api.logout();
    await _clearSession();
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      _user = await _api.getCurrentUser();
      await _saveUser(_user!);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> updateUserLocally(UserModel updated) async {
    _user = updated;
    await _saveUser(updated);
    notifyListeners();
  }

  Future<void> changePassword(String oldPassword, String newPassword) async {
    await _api.changePassword(oldPassword, newPassword);
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> _saveUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.userKey, jsonEncode(user.toJson()));
  }

  Future<void> _clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userKey);
    _api.setToken(null);
    _token = null;
    _user = null;
  }
}

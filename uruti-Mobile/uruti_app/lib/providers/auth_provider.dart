import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/app_constants.dart';
import '../models/models.dart';
import '../services/api_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated }

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
      final response = await _api.login(email, password);
      final token = response['access_token'] as String;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.tokenKey, token);
      _api.setToken(token);
      _token = token;

      _user = await _api.getCurrentUser();
      await _saveUser(_user!);

      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Connection error. Check your internet.';
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

  void updateUserLocally(UserModel updated) {
    _user = updated;
    _saveUser(updated);
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

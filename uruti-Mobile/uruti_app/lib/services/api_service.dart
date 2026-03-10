import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/app_constants.dart';
import '../models/models.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  /// Convenience singleton accessor used by screens.
  static ApiService get instance => _instance;

  String? _token;
  static const Duration _authTimeout = Duration(seconds: 12);

  Future<String?> get token async {
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(AppConstants.tokenKey);
    return _token;
  }

  void setToken(String? t) {
    _token = t;
  }

  Future<Map<String, String>> _headers({bool auth = false}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final tok = await token;
      if (tok != null) headers['Authorization'] = 'Bearer $tok';
    }
    return headers;
  }

  String? _safeAvatarUrl(dynamic raw) {
    final value = raw?.toString().trim() ?? '';
    if (value.isEmpty) return null;
    final uri = Uri.tryParse(value);
    if (uri == null) return null;
    if (uri.hasScheme && (uri.path.isEmpty || uri.path == '/')) {
      return null;
    }
    return value;
  }

  MediaType _imageMediaTypeFromPath(String filePath) {
    final ext = filePath.toLowerCase();
    if (ext.endsWith('.png')) return MediaType('image', 'png');
    if (ext.endsWith('.gif')) return MediaType('image', 'gif');
    if (ext.endsWith('.webp')) return MediaType('image', 'webp');
    if (ext.endsWith('.heic')) return MediaType('image', 'heic');
    if (ext.endsWith('.heif')) return MediaType('image', 'heif');
    return MediaType('image', 'jpeg');
  }

  Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    final body = utf8.decode(response.bodyBytes).trim();

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (body.isEmpty) return <String, dynamic>{};
      try {
        final decoded = jsonDecode(body);
        if (decoded is Map<String, dynamic>) return decoded;
        if (decoded is Map) {
          return Map<String, dynamic>.from(decoded);
        }
        return <String, dynamic>{'data': decoded};
      } catch (_) {
        return <String, dynamic>{};
      }
    }

    String message = 'Request failed';
    if (body.isNotEmpty) {
      try {
        final decoded = jsonDecode(body);
        if (decoded is Map) {
          message =
              decoded['detail']?.toString() ??
              decoded['message']?.toString() ??
              message;
        } else if (decoded is String && decoded.trim().isNotEmpty) {
          message = decoded;
        }
      } catch (_) {}
    }

    throw ApiException(statusCode: response.statusCode, message: message);
  }

  Future<List<dynamic>> _handleListResponse(http.Response response) async {
    final body = utf8.decode(response.bodyBytes).trim();
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (body.isEmpty) return <dynamic>[];
      try {
        final decoded = jsonDecode(body);
        if (decoded is List<dynamic>) return decoded;
        if (decoded is Map && decoded['items'] is List<dynamic>) {
          return decoded['items'] as List<dynamic>;
        }
        return <dynamic>[];
      } catch (_) {
        return <dynamic>[];
      }
    }

    String message = 'Request failed';
    if (body.isNotEmpty) {
      try {
        final decoded = jsonDecode(body);
        if (decoded is Map) {
          message =
              decoded['detail']?.toString() ??
              decoded['message']?.toString() ??
              message;
        } else if (decoded is String && decoded.trim().isNotEmpty) {
          message = decoded;
        }
      } catch (_) {}
    }

    throw ApiException(statusCode: response.statusCode, message: message);
  }

  // ──────────────────── AUTH ────────────────────
  Future<Map<String, dynamic>> login(
    String email,
    String password, {
    String? deviceId,
    String? deviceName,
    String? platform,
    String? os,
  }) async {
    try {
      final res = await http
          .post(
            Uri.parse('${AppConstants.apiV1}/auth/login'),
            headers: await _headers(),
            body: jsonEncode({
              'email': email,
              'password': password,
              if (deviceId != null) 'device_id': deviceId,
              if (deviceName != null) 'device_name': deviceName,
              if (platform != null) 'platform': platform,
              if (os != null) 'os': os,
            }),
          )
          .timeout(_authTimeout);
      return _handleResponse(res);
    } on TimeoutException {
      throw ApiException(
        statusCode: 0,
        message:
            'Connection timed out while reaching ${AppConstants.apiBaseUrl}. For physical devices, set BACKEND_URL to your machine LAN IP (example: http://192.168.x.x:8010).',
      );
    }
  }

  /// Register / refresh a session for the current device on the backend.
  Future<void> registerSession({
    String? deviceId,
    String? deviceName,
    String? platform,
    String? os,
  }) async {
    try {
      await http.post(
        Uri.parse('${AppConstants.apiV1}/auth/sessions/register'),
        headers: await _headers(auth: true),
        body: jsonEncode({
          if (deviceId != null) 'device_id': deviceId,
          if (deviceName != null) 'device_name': deviceName,
          if (platform != null) 'platform': platform,
          if (os != null) 'os': os,
        }),
      );
    } catch (_) {
      // Non-critical — don't crash if session tracking is temporarily unavailable
    }
  }

  Future<UserModel> register({
    required String email,
    required String password,
    required String fullName,
    required String role,
  }) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/auth/register'),
      headers: await _headers(),
      body: jsonEncode({
        'email': email,
        'password': password,
        'full_name': fullName,
        'role': role,
      }),
    );
    return UserModel.fromJson(await _handleResponse(res));
  }

  Future<UserModel> getCurrentUser() async {
    try {
      final res = await http
          .get(
            Uri.parse('${AppConstants.apiV1}/auth/me'),
            headers: await _headers(auth: true),
          )
          .timeout(_authTimeout);
      return UserModel.fromJson(await _handleResponse(res));
    } on TimeoutException {
      throw ApiException(
        statusCode: 0,
        message: 'Connection timed out while validating session.',
      );
    }
  }

  // ──────────────────── PROFILE ────────────────────
  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final res = await http.put(
      Uri.parse('${AppConstants.apiV1}/users/me'),
      headers: await _headers(auth: true),
      body: jsonEncode(data),
    );
    return UserModel.fromJson(await _handleResponse(res));
  }

  Future<UserModel> getUserProfile(int userId, [String? token]) async {
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/users/$userId'),
      headers: await _headers(auth: true),
    );
    return UserModel.fromJson(await _handleResponse(res));
  }

  // ──────────────────── CONNECTIONS ────────────────────
  Future<List<dynamic>> getConnections([String? token, String? status]) async {
    final query = status != null ? '?status=$status' : '';
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/connections$query'),
      headers: await _headers(auth: true),
    );
    return _handleListResponse(res);
  }

  Future<List<dynamic>> getDiscoverUsers(String? token, {String? role}) async {
    final params = <String, String>{'limit': '50'};
    if (role != null && role != 'All') params['role'] = role;
    final uri = Uri.parse(
      '${AppConstants.apiV1}/users/',
    ).replace(queryParameters: params);
    final res = await http.get(uri, headers: await _headers(auth: true));
    return _handleListResponse(res);
  }

  Future<void> sendConnectionRequest(int userId, [String? token]) async {
    final headers = await _headers(auth: true);
    headers['Content-Type'] = 'application/json';
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/connections/request'),
      headers: headers,
      body: jsonEncode({'user_id': userId}),
    );
    _handleResponse(res);
  }

  /// Upload profile avatar image, returns updated UserModel.
  Future<UserModel> uploadAvatar(String filePath) async {
    final token = await this.token;
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${AppConstants.apiV1}/profile/avatar'),
    );
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        filePath,
        contentType: _imageMediaTypeFromPath(filePath),
        filename: File(filePath).uri.pathSegments.last,
      ),
    );
    final streamed = await request.send();
    final body = await streamed.stream.bytesToString();
    if (streamed.statusCode != 200 && streamed.statusCode != 201) {
      throw Exception('Upload failed (${streamed.statusCode}): $body');
    }
    // Returns {avatar_url: ...} — refresh current user
    return getCurrentUser();
  }

  /// Upload profile cover image, returns updated UserModel.
  Future<UserModel> uploadCoverImage(String filePath) async {
    final token = await this.token;
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${AppConstants.apiV1}/profile/cover'),
    );
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        filePath,
        contentType: _imageMediaTypeFromPath(filePath),
        filename: File(filePath).uri.pathSegments.last,
      ),
    );

    final streamed = await request.send();
    final body = await streamed.stream.bytesToString();
    if (streamed.statusCode != 200 && streamed.statusCode != 201) {
      throw Exception('Cover upload failed (${streamed.statusCode}): $body');
    }
    return getCurrentUser();
  }

  Future<void> respondToConnection(int connectionId, String action) async {
    // action = 'accept' | 'reject'
    final res = await http.put(
      Uri.parse(
        '${AppConstants.apiV1}/connections/request/$connectionId/$action',
      ),
      headers: await _headers(auth: true),
    );
    _handleResponse(res);
  }

  /// Get all pending connection requests (sent + received).
  Future<List<dynamic>> getPendingRequests() async {
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/connections/requests/pending'),
      headers: await _headers(auth: true),
    );
    return _handleListResponse(res);
  }

  /// Cancel a pending outgoing connection request.
  Future<void> cancelConnectionRequest(int requestId) async {
    final res = await http.delete(
      Uri.parse('${AppConstants.apiV1}/connections/request/$requestId/cancel'),
      headers: await _headers(auth: true),
    );
    _handleResponse(res);
  }

  /// Remove an accepted connection.
  Future<void> removeConnection(int connectionId) async {
    final res = await http.delete(
      Uri.parse('${AppConstants.apiV1}/connections/$connectionId'),
      headers: await _headers(auth: true),
    );
    _handleResponse(res);
  }

  /// Get IDs of connections currently online.
  Future<Set<int>> getOnlineConnectionIds() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.apiV1}/connections/online-ids'),
        headers: await _headers(auth: true),
      );
      final data = await _handleListResponse(res);
      return data
          .map<int>((e) => int.tryParse('$e') ?? 0)
          .where((id) => id > 0)
          .toSet();
    } catch (_) {
      return {};
    }
  }

  // ──────────────────── MESSAGES ────────────────────
  Future<List<dynamic>> getConversations([String? token]) async {
    try {
      DateTime parseApiDateTime(dynamic raw) {
        final value = (raw ?? '').toString().trim();
        if (value.isEmpty) return DateTime.fromMillisecondsSinceEpoch(0);
        final normalized = value.contains('Z') || value.contains('+')
            ? value
            : '${value}Z';
        return DateTime.tryParse(normalized)?.toLocal() ??
            DateTime.fromMillisecondsSinceEpoch(0);
      }

      final results = await Future.wait([
        http.get(
          Uri.parse('${AppConstants.apiV1}/connections/'),
          headers: await _headers(auth: true),
        ),
        http.get(
          Uri.parse('${AppConstants.apiV1}/messages/inbox'),
          headers: await _headers(auth: true),
        ),
        http.get(
          Uri.parse('${AppConstants.apiV1}/messages/sent'),
          headers: await _headers(auth: true),
        ),
      ]);

      final connections = await _handleListResponse(results[0]);
      final inbox = await _handleListResponse(results[1]);
      final sent = await _handleListResponse(results[2]);

      bool isOnline(Map<String, dynamic> connection) {
        final isActive = connection['is_active'] == true;
        final rawLastLogin = connection['last_login']?.toString();
        if (!isActive || rawLastLogin == null || rawLastLogin.isEmpty) {
          return false;
        }
        // Backend sends UTC timestamps without timezone indicator.
        // Append 'Z' so Dart parses as UTC, then compare against UTC now.
        final normalized =
            rawLastLogin.contains('Z') || rawLastLogin.contains('+')
            ? rawLastLogin
            : '${rawLastLogin}Z';
        final lastLogin = DateTime.tryParse(normalized)?.toUtc();
        if (lastLogin == null) return false;
        return DateTime.now().toUtc().difference(lastLogin).inMinutes <= 10;
      }

      String roleLabel(dynamic role) {
        final value = (role ?? '').toString().trim().toLowerCase();
        if (value.isEmpty) return '';
        return value[0].toUpperCase() + value.substring(1);
      }

      String fmtTime(dynamic isoTs) {
        final parsed = parseApiDateTime(isoTs);
        if (parsed.millisecondsSinceEpoch == 0) return '';
        final hour = parsed.hour % 12 == 0 ? 12 : parsed.hour % 12;
        final minute = parsed.minute.toString().padLeft(2, '0');
        final ampm = parsed.hour >= 12 ? 'PM' : 'AM';
        return '$hour:$minute $ampm';
      }

      final conversations = connections.map<Map<String, dynamic>>((connection) {
        final uid = int.tryParse('${connection['id'] ?? 0}') ?? 0;
        final thread = [
          ...inbox.where(
            (m) => m['sender_id'] == uid || m['receiver_id'] == uid,
          ),
          ...sent.where(
            (m) => m['sender_id'] == uid || m['receiver_id'] == uid,
          ),
        ];

        thread.sort((a, b) {
          final ta = parseApiDateTime(a['created_at']);
          final tb = parseApiDateTime(b['created_at']);
          return ta.compareTo(tb);
        });

        final last = thread.isNotEmpty ? thread.last : null;
        final unread = inbox
            .where((m) => m['sender_id'] == uid && m['is_read'] != true)
            .length;
        final displayNameRaw = (connection['display_name'] ?? '')
            .toString()
            .trim();
        final fullNameRaw = (connection['full_name'] ?? '').toString().trim();
        final emailRaw = (connection['email'] ?? '').toString().trim();
        final displayName = displayNameRaw.isNotEmpty
            ? displayNameRaw
            : (fullNameRaw.isNotEmpty
                  ? fullNameRaw
                  : (emailRaw.isNotEmpty ? emailRaw : 'Connection'));

        return {
          'other_user': {
            'id': uid,
            'full_name': displayName,
            'display_name': connection['display_name'],
            'role': roleLabel(connection['role']),
            'avatar_url':
                _safeAvatarUrl(connection['avatar_url']) ??
                _safeAvatarUrl(connection['avatar']),
            'phone': connection['phone'],
            'is_online': isOnline(Map<String, dynamic>.from(connection)),
          },
          'last_message': (last?['body'] ?? '').toString(),
          'last_message_time': (last?['created_at'] ?? '').toString(),
          'last_message_time_label': fmtTime(last?['created_at']),
          'unread_count': unread,
          'is_starred': false,
        };
      }).toList();

      conversations.sort((a, b) {
        final ta = parseApiDateTime(a['last_message_time']);
        final tb = parseApiDateTime(b['last_message_time']);
        return tb.compareTo(ta);
      });

      return conversations;
    } catch (_) {
      return [];
    }
  }

  Future<List<dynamic>> getMessages(int userId, [String? token]) async {
    // Backend has no /messages/{user_id} thread endpoint.
    // Fetch inbox + sent in parallel, then filter by the other user's ID.
    try {
      final results = await Future.wait([
        http.get(
          Uri.parse('${AppConstants.apiV1}/messages/inbox'),
          headers: await _headers(auth: true),
        ),
        http.get(
          Uri.parse('${AppConstants.apiV1}/messages/sent'),
          headers: await _headers(auth: true),
        ),
      ]);
      final inbox = await _handleListResponse(results[0]);
      final sent = await _handleListResponse(results[1]);
      final thread = [
        ...inbox.where(
          (m) => m['sender_id'] == userId || m['receiver_id'] == userId,
        ),
        ...sent.where(
          (m) => m['sender_id'] == userId || m['receiver_id'] == userId,
        ),
      ];
      thread.sort((a, b) {
        DateTime parseApiDateTime(dynamic raw) {
          final value = (raw ?? '').toString().trim();
          if (value.isEmpty) return DateTime.fromMillisecondsSinceEpoch(0);
          final normalized = value.contains('Z') || value.contains('+')
              ? value
              : '${value}Z';
          return DateTime.tryParse(normalized)?.toLocal() ??
              DateTime.fromMillisecondsSinceEpoch(0);
        }

        final ta = parseApiDateTime(a['created_at']);
        final tb = parseApiDateTime(b['created_at']);
        return ta.compareTo(tb);
      });
      return thread;
    } catch (_) {
      return [];
    }
  }

  Future<void> sendMessage(
    int receiverId,
    String content, {
    List<String>? attachments,
    String? token,
  }) async {
    final body = <String, dynamic>{'receiver_id': receiverId, 'body': content};
    if (attachments != null && attachments.isNotEmpty) {
      body['attachments'] = attachments;
    }

    final headers = await _headers(auth: true);
    if (token != null && token.trim().isNotEmpty) {
      headers['Authorization'] = 'Bearer ${token.trim()}';
    }

    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/messages/'),
      headers: headers,
      body: jsonEncode(body),
    );

    if (res.statusCode == 307 || res.statusCode == 308) {
      final retry = await http.post(
        Uri.parse('${AppConstants.apiV1}/messages'),
        headers: headers,
        body: jsonEncode(body),
      );
      await _handleResponse(retry);
      return;
    }

    _handleResponse(res);
  }

  Future<Map<String, dynamic>> uploadMessageAttachment(String filePath) async {
    final tok = await token;
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${AppConstants.apiV1}/messages/attachments/upload'),
    );

    if (tok != null) {
      request.headers['Authorization'] = 'Bearer $tok';
    }

    request.files.add(await http.MultipartFile.fromPath('file', filePath));

    final streamed = await request.send();
    final body = await streamed.stream.bytesToString();
    final json = jsonDecode(body) as Map<String, dynamic>;

    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw ApiException(
        statusCode: streamed.statusCode,
        message: json['detail']?.toString() ?? 'Attachment upload failed',
      );
    }

    return json;
  }

  Future<int> markThreadAsRead(int otherUserId) async {
    try {
      final res = await http.put(
        Uri.parse('${AppConstants.apiV1}/messages/read/thread/$otherUserId'),
        headers: await _headers(auth: true),
      );
      final data = await _handleResponse(res);
      return int.tryParse('${data['updated_count'] ?? 0}') ?? 0;
    } catch (_) {
      return 0;
    }
  }

  Future<void> deleteMessage(int messageId) async {
    final res = await http.delete(
      Uri.parse('${AppConstants.apiV1}/messages/$messageId'),
      headers: await _headers(auth: true),
    );
    await _handleResponse(res);
  }

  Future<void> deleteMessageThread(int otherUserId) async {
    final res = await http.delete(
      Uri.parse('${AppConstants.apiV1}/messages/threads/$otherUserId'),
      headers: await _headers(auth: true),
    );
    await _handleResponse(res);
  }

  Future<Map<String, dynamic>> sendCallSignal({
    required int receiverId,
    required String action,
    required String callId,
    required bool isVideo,
    String? handle,
    Map<String, dynamic>? webrtcData,
  }) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/messages/call/signal'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        'receiver_id': receiverId,
        'action': action,
        'call_id': callId,
        'is_video': isVideo,
        if (handle != null && handle.trim().isNotEmpty) 'handle': handle.trim(),
        if (webrtcData != null) 'webrtc_data': webrtcData,
      }),
    );

    final data = await _handleResponse(res);
    return Map<String, dynamic>.from(data as Map);
  }

  // ──────────────────── NOTIFICATIONS ────────────────────
  Future<List<dynamic>> getNotifications([String? token]) async {
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/notifications'),
      headers: await _headers(auth: true),
    );
    return _handleListResponse(res);
  }

  Future<void> markNotificationRead(int id) async {
    final res = await http.put(
      Uri.parse('${AppConstants.apiV1}/notifications/$id/read'),
      headers: await _headers(auth: true),
    );
    _handleResponse(res);
  }

  Future<void> markAllNotificationsRead() async {
    final res = await http.put(
      Uri.parse('${AppConstants.apiV1}/notifications/read-all'),
      headers: await _headers(auth: true),
    );
    _handleResponse(res);
  }

  Future<void> registerDeviceToken(
    String token, {
    String platform = 'unknown',
    String? deviceId,
  }) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/notifications/device-token'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        'token': token,
        'platform': platform,
        if (deviceId != null && deviceId.trim().isNotEmpty)
          'device_id': deviceId,
      }),
    );
    _handleResponse(res);
  }

  Future<void> unregisterDeviceToken(String token) async {
    final req = http.Request(
      'DELETE',
      Uri.parse('${AppConstants.apiV1}/notifications/device-token'),
    );
    req.headers.addAll(await _headers(auth: true));
    req.body = jsonEncode({'token': token});

    final streamed = await req.send();
    final response = await http.Response.fromStream(streamed);
    _handleResponse(response);
  }

  // ──────────────────── PITCH COACH ────────────────────
  Future<List<dynamic>> getPitchSessions() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.apiV1}/pitch-coach/sessions'),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>> getPitchAnalysis(int sessionId) async {
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/pitch-coach/sessions/$sessionId'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(res);
  }

  Future<Map<String, dynamic>> getPitchLiveFeedback({
    required int ventureId,
    required String pitchType,
    required int durationSeconds,
    required int targetDurationSeconds,
    required int currentSlide,
    required int totalSlides,
    required List<Map<String, dynamic>> slideTransitions,
    String transcript = '',
  }) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/pitch/live-feedback'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        'venture_id': ventureId,
        'pitch_type': pitchType,
        'duration_seconds': durationSeconds,
        'target_duration_seconds': targetDurationSeconds,
        'current_slide': currentSlide,
        'total_slides': totalSlides,
        'slide_transitions': slideTransitions,
        'transcript': transcript,
      }),
    );
    return _handleResponse(res);
  }

  Future<Map<String, dynamic>> uploadPitchVideo(
    int ventureId,
    String filePath, {
    required String pitchType,
    required int durationSeconds,
    required int targetDurationSeconds,
    String? notes,
  }) async {
    final tok = await token;
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${AppConstants.apiV1}/ventures/$ventureId/pitch-video'),
    );

    if (tok != null) {
      request.headers['Authorization'] = 'Bearer $tok';
    }

    request.files.add(await http.MultipartFile.fromPath('file', filePath));
    request.fields['pitch_type'] = pitchType;
    request.fields['duration'] = durationSeconds.toString();
    request.fields['target_duration'] = targetDurationSeconds.toString();
    if (notes != null && notes.trim().isNotEmpty) {
      request.fields['notes'] = notes.trim();
    }

    final streamed = await request.send();
    final body = await streamed.stream.bytesToString();
    final json = jsonDecode(body) as Map<String, dynamic>;

    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw ApiException(
        statusCode: streamed.statusCode,
        message: json['detail']?.toString() ?? 'Pitch upload failed',
      );
    }

    return json;
  }

  Future<Map<String, dynamic>> uploadVentureLogo(
    int ventureId,
    String filePath,
  ) async {
    final tok = await token;
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${AppConstants.apiV1}/ventures/$ventureId/logo'),
    );

    if (tok != null) {
      request.headers['Authorization'] = 'Bearer $tok';
    }

    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        filePath,
        contentType: _imageMediaTypeFromPath(filePath),
      ),
    );

    final streamed = await request.send();
    final body = await streamed.stream.bytesToString();
    final json = body.isEmpty
        ? <String, dynamic>{}
        : (jsonDecode(body) as Map<String, dynamic>);

    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw ApiException(
        statusCode: streamed.statusCode,
        message: json['detail']?.toString() ?? 'Venture logo upload failed',
      );
    }

    return json;
  }

  Future<Map<String, dynamic>> uploadVentureBanner(
    int ventureId,
    String filePath,
  ) async {
    final tok = await token;
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${AppConstants.apiV1}/ventures/$ventureId/banner'),
    );

    if (tok != null) {
      request.headers['Authorization'] = 'Bearer $tok';
    }

    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        filePath,
        contentType: _imageMediaTypeFromPath(filePath),
      ),
    );

    final streamed = await request.send();
    final body = await streamed.stream.bytesToString();
    final json = body.isEmpty
        ? <String, dynamic>{}
        : (jsonDecode(body) as Map<String, dynamic>);

    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw ApiException(
        statusCode: streamed.statusCode,
        message: json['detail']?.toString() ?? 'Venture banner upload failed',
      );
    }

    return json;
  }

  // ──────────────────── AI CHAT ────────────────────
  Future<Map<String, dynamic>> sendAiMessage(
    String message, {
    String? sessionId,
    String model = 'uruti-ai',
    Map<String, dynamic>? startupContext,
    String? fileContent,
    String? fileName,
  }) async {
    final body = <String, dynamic>{'message': message, 'model': model};
    if (sessionId != null) body['session_id'] = sessionId;
    if (startupContext != null) body['startup_context'] = startupContext;
    if (fileContent != null) body['file_content'] = fileContent;
    if (fileName != null) body['file_name'] = fileName;
    final res = await http.post(
      Uri.parse('${AppConstants.aiApiV1}/ai/chat'),
      headers: await _headers(auth: true),
      body: jsonEncode(body),
    );
    return _handleResponse(res);
  }

  Future<List<dynamic>> getAiModels() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.aiApiV1}/ai/models'),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  /// Returns list of past chat sessions [{session_id, first_message, message_count, created_at, model_used}]
  Future<List<dynamic>> getAiChatSessions() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.aiApiV1}/ai/history'),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  /// Returns all messages for a specific session
  Future<List<dynamic>> getAiChatSession(String sessionId) async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.aiApiV1}/ai/history/$sessionId'),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  Future<void> clearAiChatHistory() async {
    await http.delete(
      Uri.parse('${AppConstants.aiApiV1}/ai/history'),
      headers: await _headers(auth: true),
    );
  }

  Future<void> clearAiChatSession(String sessionId) async {
    await http.delete(
      Uri.parse('${AppConstants.aiApiV1}/ai/history/$sessionId'),
      headers: await _headers(auth: true),
    );
  }

  // ──────────────────── ADVISORY TRACKS ────────────────────
  Future<List<dynamic>> getAdvisoryTracks() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.apiV1}/advisory/tracks'),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>> getUserTrackProgress(int trackId) async {
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/advisory/tracks/$trackId/progress'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(res);
  }

  Future<void> markMaterialComplete(int trackId, int materialId) async {
    final res = await http.post(
      Uri.parse(
        '${AppConstants.apiV1}/advisory/tracks/$trackId/materials/$materialId/complete',
      ),
      headers: await _headers(auth: true),
    );
    _handleResponse(res);
  }

  Future<void> unmarkMaterialComplete(int trackId, int materialId) async {
    final res = await http.delete(
      Uri.parse(
        '${AppConstants.apiV1}/advisory/tracks/$trackId/materials/$materialId/complete',
      ),
      headers: await _headers(auth: true),
    );
    _handleResponse(res);
  }

  // ──────────────────── BOOKMARKS ────────────────────
  Future<List<dynamic>> getBookmarks() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.apiV1}/bookmarks/'),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>> createBookmark(
    int ventureId, {
    String? notes,
    List<String>? tags,
  }) async {
    final body = <String, dynamic>{'venture_id': ventureId};
    if (notes != null && notes.trim().isNotEmpty) body['notes'] = notes.trim();
    if (tags != null && tags.isNotEmpty) body['tags'] = tags;

    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/bookmarks/'),
      headers: await _headers(auth: true),
      body: jsonEncode(body),
    );
    return _handleResponse(res);
  }

  Future<void> deleteBookmark(int bookmarkId) async {
    final res = await http.delete(
      Uri.parse('${AppConstants.apiV1}/bookmarks/$bookmarkId'),
      headers: await _headers(auth: true),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) return;
    _handleResponse(res);
  }

  Future<Map<String, dynamic>> checkBookmarkStatus(int ventureId) async {
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/bookmarks/venture/$ventureId/check'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(res);
  }

  // ──────────────────── VENTURES ────────────────────
  Future<List<dynamic>> getVentures({
    int skip = 0,
    int limit = 100,
    String? stage,
    String? industry,
    bool? isSeekingFunding,
    double? minScore,
    String? search,
  }) async {
    try {
      final query = <String, String>{
        'skip': '$skip',
        'limit': '$limit',
        if (stage != null && stage.isNotEmpty && stage != 'All') 'stage': stage,
        if (industry != null && industry.isNotEmpty && industry != 'All')
          'industry': industry,
        if (isSeekingFunding != null)
          'is_seeking_funding': isSeekingFunding.toString(),
        if (minScore != null) 'min_score': minScore.toString(),
        if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      };

      final res = await http.get(
        Uri.parse(
          '${AppConstants.apiV1}/ventures/',
        ).replace(queryParameters: query),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  /// Returns the current user's ventures (for startup context in AI chat)
  Future<List<dynamic>> getMyVentures() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.apiV1}/ventures/my-ventures'),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  /// Fetches a single venture by its ID.
  Future<Map<String, dynamic>> getVentureById(int ventureId) async {
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/ventures/$ventureId'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(res);
  }

  /// Creates a new venture for the current user.
  Future<Map<String, dynamic>> createVenture(Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/ventures/'),
      headers: await _headers(auth: true),
      body: jsonEncode(data),
    );
    return _handleResponse(res);
  }

  /// Updates a venture by ID.
  Future<Map<String, dynamic>> updateVenture(
    int id,
    Map<String, dynamic> data,
  ) async {
    final res = await http.put(
      Uri.parse('${AppConstants.apiV1}/ventures/$id'),
      headers: await _headers(auth: true),
      body: jsonEncode(data),
    );
    return _handleResponse(res);
  }

  /// Deletes a venture by ID.
  Future<void> deleteVenture(int id) async {
    final res = await http.delete(
      Uri.parse('${AppConstants.apiV1}/ventures/$id'),
      headers: await _headers(auth: true),
    );
    _handleResponse(res);
  }

  /// Triggers backend model analysis for a venture and returns updated venture.
  Future<Map<String, dynamic>> analyzeVenture(int id) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/ventures/$id/analyze'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(res);
  }

  // ──────────────────── MEETINGS ────────────────────
  /// Returns meetings for the current user. Optionally filter by upcoming/status.
  Future<List<dynamic>> getMeetings({
    bool? upcoming,
    String? statusFilter,
  }) async {
    try {
      final params = <String, String>{};
      if (upcoming == true) params['upcoming'] = 'true';
      if (statusFilter != null) params['status_filter'] = statusFilter;
      final uri = Uri.parse(
        '${AppConstants.apiV1}/meetings/',
      ).replace(queryParameters: params.isEmpty ? null : params);
      final res = await http.get(uri, headers: await _headers(auth: true));
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  /// Creates a new meeting (schedule meeting with another user).
  Future<Map<String, dynamic>> createMeeting(Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/meetings/'),
      headers: await _headers(auth: true),
      body: jsonEncode(data),
    );
    return _handleResponse(res);
  }

  /// Accepts a pending meeting request.
  Future<Map<String, dynamic>> acceptMeeting(int meetingId) async {
    final res = await http.put(
      Uri.parse('${AppConstants.apiV1}/meetings/$meetingId/accept'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(res);
  }

  /// Rejects/declines a pending meeting request.
  Future<Map<String, dynamic>> rejectMeeting(int meetingId) async {
    final res = await http.put(
      Uri.parse('${AppConstants.apiV1}/meetings/$meetingId/reject'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(res);
  }

  /// Returns the upcoming meetings for the current user.
  Future<List<dynamic>> getUpcomingMeetings() async {
    return getMeetings(upcoming: true);
  }

  // ──────────────────── AVAILABILITY ────────────────────
  /// Returns the current user's availability slots.
  Future<List<dynamic>> getMyAvailability() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.apiV1}/availability/my-slots'),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  /// Returns availability slots for another user.
  Future<List<dynamic>> getUserAvailability(int userId) async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.apiV1}/availability/$userId'),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  /// Creates an availability slot.
  Future<Map<String, dynamic>> createAvailabilitySlot(
    Map<String, dynamic> data,
  ) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/availability/'),
      headers: await _headers(auth: true),
      body: jsonEncode(data),
    );
    return _handleResponse(res);
  }

  /// Deletes an availability slot.
  Future<void> deleteAvailabilitySlot(int slotId) async {
    final res = await http.delete(
      Uri.parse('${AppConstants.apiV1}/availability/$slotId'),
      headers: await _headers(auth: true),
    );
    _handleResponse(res);
  }

  // ──────────────────── USERS (for discovery) ────────────────────
  Future<List<dynamic>> getAllUsers({String? role}) async {
    final query = role != null ? '?role=$role' : '';
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/users$query'),
      headers: await _headers(auth: true),
    );
    return _handleListResponse(res);
  }

  // ──────────────────── SETTINGS ────────────────────
  Future<void> changePassword(String oldPassword, String newPassword) async {
    // Backend: PUT /api/v1/users/me/credentials — field name is current_password
    final res = await http.put(
      Uri.parse('${AppConstants.apiV1}/users/me/credentials'),
      headers: await _headers(auth: true),
      body: jsonEncode({
        'current_password': oldPassword,
        'new_password': newPassword,
      }),
    );
    _handleResponse(res);
  }

  Future<void> logout() async {
    try {
      await http.post(
        Uri.parse('${AppConstants.apiV1}/auth/logout'),
        headers: await _headers(auth: true),
      );
    } catch (_) {}
    _token = null;
  }

  Future<Map<String, dynamic>> approveQrLogin({
    required String requestId,
    required String code,
  }) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/auth/qr/approve'),
      headers: await _headers(auth: true),
      body: jsonEncode({'request_id': requestId, 'code': code}),
    );
    return _handleResponse(res);
  }

  /// Request a new QR login challenge (generates QR payload for another device).
  Future<Map<String, dynamic>> requestQrLogin() async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/auth/qr/request'),
      headers: await _headers(),
    );
    return _handleResponse(res);
  }

  /// Poll QR login status. Returns {status, access_token?, token_type?}.
  Future<Map<String, dynamic>> pollQrLoginStatus({
    required String requestId,
    required String code,
  }) async {
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/auth/qr/status/$requestId?code=$code'),
      headers: await _headers(),
    );
    return _handleResponse(res);
  }

  /// Fetch active device sessions for the current user.
  Future<List<dynamic>> getActiveSessions() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.apiV1}/auth/sessions'),
        headers: await _headers(auth: true),
      );
      final data = await _handleResponse(res);
      return (data['sessions'] as List?) ?? [];
    } catch (_) {
      return [];
    }
  }

  /// Revoke / log out a specific device session.
  Future<void> revokeSession(String sessionId) async {
    final res = await http.delete(
      Uri.parse('${AppConstants.apiV1}/auth/sessions/$sessionId'),
      headers: await _headers(auth: true),
    );
    await _handleResponse(res);
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException({required this.statusCode, required this.message});

  @override
  String toString() => 'ApiException[$statusCode]: $message';
}

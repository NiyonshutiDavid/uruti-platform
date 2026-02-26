import 'dart:convert';
import 'package:http/http.dart' as http;
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

  Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    final body = utf8.decode(response.bodyBytes);
    final json = jsonDecode(body);
    if (response.statusCode >= 200 && response.statusCode < 300) return json;
    throw ApiException(
      statusCode: response.statusCode,
      message: json['detail']?.toString() ?? 'Request failed',
    );
  }

  Future<List<dynamic>> _handleListResponse(http.Response response) async {
    final body = utf8.decode(response.bodyBytes);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(body);
    }
    final json = jsonDecode(body);
    throw ApiException(
      statusCode: response.statusCode,
      message: json['detail']?.toString() ?? 'Request failed',
    );
  }

  // ──────────────────── AUTH ────────────────────
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/auth/login'),
      headers: await _headers(),
      body: jsonEncode({'email': email, 'password': password}),
    );
    return _handleResponse(res);
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
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/auth/me'),
      headers: await _headers(auth: true),
    );
    return UserModel.fromJson(await _handleResponse(res));
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
    request.files.add(await http.MultipartFile.fromPath('file', filePath));
    final streamed = await request.send();
    final body = await streamed.stream.bytesToString();
    if (streamed.statusCode != 200 && streamed.statusCode != 201) {
      throw Exception('Upload failed (${streamed.statusCode}): $body');
    }
    // Returns {avatar_url: ...} — refresh current user
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

  // ──────────────────── MESSAGES ────────────────────
  Future<List<dynamic>> getConversations([String? token]) async {
    final res = await http.get(
      Uri.parse('${AppConstants.apiV1}/messages/inbox'),
      headers: await _headers(auth: true),
    );
    return _handleListResponse(res);
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
        final ta = a['created_at'] as String? ?? '';
        final tb = b['created_at'] as String? ?? '';
        return ta.compareTo(tb);
      });
      return thread;
    } catch (_) {
      return [];
    }
  }

  Future<void> sendMessage(
    int receiverId,
    String content, [
    String? token,
  ]) async {
    final res = await http.post(
      Uri.parse('${AppConstants.apiV1}/messages'),
      headers: await _headers(auth: true),
      body: jsonEncode({'receiver_id': receiverId, 'body': content}),
    );
    _handleResponse(res);
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
      Uri.parse('${AppConstants.apiV1}/ai/chat'),
      headers: await _headers(auth: true),
      body: jsonEncode(body),
    );
    return _handleResponse(res);
  }

  /// Returns list of past chat sessions [{session_id, first_message, message_count, created_at, model_used}]
  Future<List<dynamic>> getAiChatSessions() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConstants.apiV1}/ai/history'),
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
        Uri.parse('${AppConstants.apiV1}/ai/history/$sessionId'),
        headers: await _headers(auth: true),
      );
      return _handleListResponse(res);
    } catch (_) {
      return [];
    }
  }

  Future<void> clearAiChatHistory() async {
    await http.delete(
      Uri.parse('${AppConstants.apiV1}/ai/history'),
      headers: await _headers(auth: true),
    );
  }

  Future<void> clearAiChatSession(String sessionId) async {
    await http.delete(
      Uri.parse('${AppConstants.apiV1}/ai/history/$sessionId'),
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
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException({required this.statusCode, required this.message});

  @override
  String toString() => 'ApiException[$statusCode]: $message';
}

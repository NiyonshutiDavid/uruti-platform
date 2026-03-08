import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import '../core/app_constants.dart';

class RealtimeService {
  RealtimeService._();
  static final RealtimeService instance = RealtimeService._();

  WebSocketChannel? _channel;
  WebSocketChannel? _notificationsChannel;
  StreamSubscription? _socketSub;
  StreamSubscription? _notificationsSub;
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;
  String? _token;
  bool _connecting = false;
  bool _socketReady = false;
  int _reconnectAttempts = 0;

  final StreamController<Map<String, dynamic>> _eventsCtrl =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get events => _eventsCtrl.stream;

  bool get isConnected => _socketReady;

  Future<void> connect(String token) async {
    if (token.trim().isEmpty) return;
    if (_channel != null && _token == token) return;
    if (_connecting) return;

    _connecting = true;
    _token = token;

    await _disposeSocket();

    try {
      final uri = _buildWsUri(token);
      final notificationsUri = _buildNotificationsWsUri(token);
      final channel = WebSocketChannel.connect(uri);
      final notificationsChannel = WebSocketChannel.connect(notificationsUri);
      _channel = channel;
      _notificationsChannel = notificationsChannel;
      _socketReady = true;
      _reconnectAttempts = 0;

      _socketSub = channel.stream.listen(
        (raw) {
          try {
            final decoded = jsonDecode(raw.toString());
            if (decoded is Map) {
              _eventsCtrl.add(Map<String, dynamic>.from(decoded));
            }
          } catch (_) {}
        },
        onDone: () => _scheduleReconnect(),
        onError: (_) => _scheduleReconnect(),
        cancelOnError: true,
      );

      _notificationsSub = notificationsChannel.stream.listen(
        (raw) {
          try {
            final decoded = jsonDecode(raw.toString());
            if (decoded is Map) {
              _eventsCtrl.add(Map<String, dynamic>.from(decoded));
            }
          } catch (_) {}
        },
        onDone: () => _scheduleReconnect(),
        onError: (_) => _scheduleReconnect(),
        cancelOnError: true,
      );

      channel.sink.add(jsonEncode({'event': 'ping'}));
      notificationsChannel.sink.add(jsonEncode({'event': 'ping'}));

      // Start periodic heartbeat to keep presence alive (updates last_login on server)
      _heartbeatTimer?.cancel();
      _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        try {
          _channel?.sink.add(jsonEncode({'event': 'ping'}));
          _notificationsChannel?.sink.add(jsonEncode({'event': 'ping'}));
        } catch (_) {}
      });
    } catch (_) {
      _scheduleReconnect();
    } finally {
      _connecting = false;
    }
  }

  Future<void> disconnect() async {
    _token = null;
    _socketReady = false;
    _reconnectAttempts = 0;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    await _disposeSocket();
  }

  Uri _buildWsUri(String token) {
    final base = Uri.parse(AppConstants.apiBaseUrl);
    final scheme = base.scheme == 'https' ? 'wss' : 'ws';
    return Uri(
      scheme: scheme,
      host: base.host,
      port: base.hasPort ? base.port : null,
      path: '/api/v1/messages/ws',
      queryParameters: {'token': token},
    );
  }

  Uri _buildNotificationsWsUri(String token) {
    final base = Uri.parse(AppConstants.apiBaseUrl);
    final scheme = base.scheme == 'https' ? 'wss' : 'ws';
    return Uri(
      scheme: scheme,
      host: base.host,
      port: base.hasPort ? base.port : null,
      path: '/api/v1/notifications/ws',
      queryParameters: {'token': token},
    );
  }

  Future<void> _disposeSocket() async {
    await _socketSub?.cancel();
    await _notificationsSub?.cancel();
    _socketSub = null;
    _notificationsSub = null;
    try {
      await _channel?.sink.close();
    } catch (_) {}
    try {
      await _notificationsChannel?.sink.close();
    } catch (_) {}
    _channel = null;
    _notificationsChannel = null;
    _socketReady = false;
  }

  void _scheduleReconnect() {
    if (_token == null || _token!.isEmpty) return;
    if (_reconnectTimer?.isActive == true) return;
    _socketReady = false;
    _reconnectAttempts += 1;
    final delaySeconds = _reconnectAttempts <= 5
        ? _reconnectAttempts
        : 5 + ((_reconnectAttempts - 5) ~/ 2);

    _reconnectTimer = Timer(Duration(seconds: delaySeconds), () {
      final token = _token;
      if (token != null && token.isNotEmpty) {
        connect(token);
      }
    });
  }
}

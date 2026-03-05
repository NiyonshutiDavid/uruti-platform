import 'dart:async';

import '../providers/auth_provider.dart';
import 'notification_service.dart';
import 'realtime_service.dart';

/// Listens to WebSocket events globally and shows OS-level local notifications
/// for incoming messages, connection requests, and other platform events.
///
/// The handler avoids duplicating notifications for the chat thread the user
/// is currently viewing by checking [activeConversationUserId].
class MessageNotificationHandler {
  MessageNotificationHandler._();
  static final MessageNotificationHandler instance =
      MessageNotificationHandler._();

  StreamSubscription<Map<String, dynamic>>? _sub;
  AuthProvider? _authProvider;

  /// Set this to the userId the user is currently chatting with so we skip
  /// notifications for that thread. Set to `null` when leaving the chat.
  String? activeConversationUserId;

  void start(AuthProvider authProvider) {
    _authProvider = authProvider;
    _sub?.cancel();
    _sub = RealtimeService.instance.events.listen(_onEvent);
  }

  void stop() {
    _sub?.cancel();
    _sub = null;
    _authProvider = null;
    activeConversationUserId = null;
  }

  void _onEvent(Map<String, dynamic> event) {
    final type = event['event']?.toString();
    final data = event['data'];
    if (data is! Map) return;

    final payload = Map<String, dynamic>.from(data.cast<dynamic, dynamic>());

    switch (type) {
      case 'message_created':
        _handleMessage(payload);
        break;
      case 'connection_request':
        _handleConnectionRequest(payload);
        break;
      case 'meeting_reminder':
        _handleMeetingReminder(payload);
        break;
      case 'notification':
        _handleGenericNotification(payload);
        break;
    }
  }

  void _handleMessage(Map<String, dynamic> msg) {
    final meId = _authProvider?.user?.id ?? 0;
    final senderId = int.tryParse('${msg['sender_id'] ?? 0}') ?? 0;

    // Don't notify for our own messages
    if (senderId == meId || senderId == 0) return;

    // Don't notify if user is already viewing this conversation
    if (activeConversationUserId != null &&
        senderId.toString() == activeConversationUserId) {
      return;
    }

    final senderName =
        (msg['sender_name'] ?? msg['sender_full_name'] ?? 'Someone').toString();
    final body = (msg['body'] ?? msg['content'] ?? '').toString();
    final hasAttachments =
        (msg['attachments'] is List && (msg['attachments'] as List).isNotEmpty);

    String preview;
    if (body.trim().isNotEmpty) {
      preview = body.length > 120 ? '${body.substring(0, 120)}…' : body;
    } else if (hasAttachments) {
      preview = '📎 Sent an attachment';
    } else {
      preview = 'New message';
    }

    NotificationService.instance.showLocalNotification(
      title: 'New message from $senderName',
      body: preview,
    );
  }

  void _handleConnectionRequest(Map<String, dynamic> data) {
    final fromName = (data['from_name'] ?? data['sender_name'] ?? 'Someone')
        .toString();
    NotificationService.instance.showLocalNotification(
      title: 'Connection Request',
      body: '$fromName wants to connect with you',
    );
  }

  void _handleMeetingReminder(Map<String, dynamic> data) {
    final title = (data['title'] ?? 'Meeting').toString();
    NotificationService.instance.showLocalNotification(
      title: 'Meeting Reminder',
      body: title,
    );
  }

  void _handleGenericNotification(Map<String, dynamic> data) {
    final title = (data['title'] ?? 'Uruti').toString();
    final body = (data['body'] ?? data['message'] ?? '').toString();
    if (title.isEmpty && body.isEmpty) return;
    NotificationService.instance.showLocalNotification(
      title: title,
      body: body,
    );
  }
}

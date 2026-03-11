import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/realtime_service.dart';
import '../main_scaffold.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<Map<String, dynamic>> _conversations = [];
  bool _loading = true;
  StreamSubscription<Map<String, dynamic>>? _realtimeSub;
  final Set<String> _deletedIds = {};

  String _asText(dynamic value) {
    if (value == null) return '';
    return value.toString().trim();
  }

  String _messagePreviewText(Map<String, dynamic> message) {
    final body = _asText(message['body']);
    if (body.isNotEmpty) return body;
    final attachments = message['attachments'];
    if (attachments is List && attachments.isNotEmpty) {
      return 'Attachment';
    }
    return 'New message';
  }

  Future<void> _handleMessageCreated(dynamic rawData) async {
    if (rawData is! Map) return;

    final message = Map<String, dynamic>.from(rawData.cast<dynamic, dynamic>());
    final meId = context.read<AuthProvider>().user?.id ?? 0;
    final senderId = int.tryParse('${message['sender_id'] ?? 0}') ?? 0;
    final receiverId = int.tryParse('${message['receiver_id'] ?? 0}') ?? 0;
    if (senderId <= 0 ||
        receiverId <= 0 ||
        (senderId != meId && receiverId != meId)) {
      return;
    }

    final otherUserId = senderId == meId ? receiverId : senderId;
    final index = _conversations.indexWhere((conversation) {
      final other =
          (conversation['other_user'] as Map?)?.cast<String, dynamic>() ?? {};
      return int.tryParse('${other['id'] ?? 0}') == otherUserId;
    });

    if (index < 0) {
      await _load(showLoading: false);
      return;
    }

    final conversation = Map<String, dynamic>.from(_conversations[index]);
    final currentUnread =
        int.tryParse('${conversation['unread_count'] ?? 0}') ?? 0;
    final isIncoming = receiverId == meId;
    final updatedConversation = {
      ...conversation,
      'last_message': _messagePreviewText(message),
      'last_message_time': _asText(message['created_at']),
      'unread_count': isIncoming ? currentUnread + 1 : 0,
    };

    if (!mounted) return;
    setState(() {
      _conversations.removeAt(index);
      _conversations.insert(0, updatedConversation);
    });
  }

  @override
  void initState() {
    super.initState();
    _load();

    _realtimeSub = RealtimeService.instance.events.listen((event) {
      if (!mounted || event['event'] != 'message_created') return;
      unawaited(_handleMessageCreated(event['data']));
    });

    final token = (context.read<AuthProvider>().token ?? '').trim();
    if (token.isNotEmpty) {
      RealtimeService.instance.connect(token);
    }
  }

  @override
  void dispose() {
    _realtimeSub?.cancel();
    super.dispose();
  }

  Future<void> _load({bool showLoading = true}) async {
    if (showLoading && mounted) {
      setState(() => _loading = true);
    }
    try {
      final token = context.read<AuthProvider>().token ?? '';
      final data = await ApiService.instance.getConversations(token);
      if (!mounted) return;
      setState(() {
        _conversations = List<Map<String, dynamic>>.from(data);
        _loading = false;
      });
    } catch (_) {
      if (mounted && showLoading) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final conversations = _conversations.where((c) {
      final otherId = ((c['other_user'] as Map?)?.containsKey('id') ?? false)
          ? '${(c['other_user'] as Map)['id']}'
          : '';
      return !_deletedIds.contains(otherId);
    }).toList();

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: Colors.white),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Messages',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        actions: [
          TextButton(
            onPressed: () => context.go('/discovery'),
            child: Text(
              '+ New',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? Center(
                    child: CircularProgressIndicator(
                      color: context.colors.accent,
                    ),
                  )
                : conversations.isEmpty
                ? _empty()
                : ListView.builder(
                    itemCount: conversations.length,
                    itemBuilder: (_, i) {
                      final conv = conversations[i];
                      final other =
                          conv['other_user'] as Map<String, dynamic>? ?? {};
                      final otherId = '${other['id'] ?? ''}';
                      return Column(
                        children: [
                          Dismissible(
                            key: ValueKey('conv_$otherId'),
                            direction: DismissDirection.endToStart,
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 24),
                              color: Colors.redAccent,
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Icon(
                                    Icons.delete_outline_rounded,
                                    color: Colors.white,
                                    size: 22,
                                  ),
                                  SizedBox(width: 6),
                                  Text(
                                    'Delete',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            confirmDismiss: (_) async {
                              return await showDialog<bool>(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  backgroundColor: context.colors.surface,
                                  title: Text(
                                    'Delete conversation?',
                                    style: TextStyle(
                                      color: context.colors.textPrimary,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  content: Text(
                                    'This will remove this conversation from your list.',
                                    style: TextStyle(
                                      color: context.colors.textSecondary,
                                    ),
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(ctx, false),
                                      child: Text(
                                        'Cancel',
                                        style: TextStyle(
                                          color: context.colors.textSecondary,
                                        ),
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: () => Navigator.pop(ctx, true),
                                      child: const Text(
                                        'Delete',
                                        style: TextStyle(
                                          color: Colors.redAccent,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                            onDismissed: (_) {
                              setState(() {
                                _deletedIds.add(otherId);
                              });
                            },
                            child: _ConversationTile(data: conv),
                          ),
                          Divider(height: 0, color: context.colors.divider),
                        ],
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _empty() => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.chat_bubble_outline,
          color: context.colors.textSecondary,
          size: 48,
        ),
        const SizedBox(height: 12),
        Text(
          'No conversations yet',
          style: TextStyle(color: context.colors.textSecondary, fontSize: 15),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: () => context.go('/discovery'),
          child: Text(
            'Find people to connect with',
            style: TextStyle(color: context.colors.accent),
          ),
        ),
      ],
    ),
  );
}

class _ConversationTile extends StatelessWidget {
  final Map<String, dynamic> data;
  const _ConversationTile({required this.data});

  String _asText(dynamic value) {
    if (value == null) return '';
    return value.toString().trim();
  }

  String? _safeAvatarUrl(dynamic raw) {
    final value = _asText(raw);
    if (value.isEmpty) return null;
    final uri = Uri.tryParse(value);
    if (uri == null) return null;
    if (uri.hasScheme && (uri.path.isEmpty || uri.path == '/')) {
      return null;
    }
    return value;
  }

  @override
  Widget build(BuildContext context) {
    final other = data['other_user'] as Map<String, dynamic>? ?? {};
    final displayName = _asText(other['display_name']);
    final fullName = _asText(other['full_name']);
    final name = displayName.isNotEmpty
        ? displayName
        : (fullName.isNotEmpty ? fullName : 'Connection');
    final role = _asText(other['role']);
    final avatar = _safeAvatarUrl(other['avatar_url']);
    final lastMsg = _asText(data['last_message']);
    final time = _asText(data['last_message_time']);
    final unread = (data['unread_count'] as int?) ?? 0;
    final isOnline = other['is_online'] == true;
    final userId = _asText(other['id']);

    Future<void> openThread() async {
      final parsed = int.tryParse(userId) ?? 0;
      if (parsed > 0) {
        await ApiService.instance.markThreadAsRead(parsed);
      }
      if (context.mounted) {
        context.push('/messages/$userId');
      }
    }

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      onTap: openThread,
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: context.colors.darkGreenMid,
            backgroundImage: avatar != null ? NetworkImage(avatar) : null,
            child: avatar == null
                ? Image.asset(
                    'assets/images/Uruti-icon-white.png',
                    width: 30,
                    height: 30,
                    fit: BoxFit.contain,
                  )
                : null,
          ),
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: isOnline ? context.colors.accent : Colors.grey,
                shape: BoxShape.circle,
                border: Border.all(color: context.colors.background, width: 2),
              ),
            ),
          ),
        ],
      ),
      title: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Flexible(
                  child: Text(
                    name,
                    style: TextStyle(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  isOnline ? 'Online' : 'Offline',
                  style: TextStyle(
                    color: isOnline ? context.colors.accent : Colors.grey,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Text(
            time,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 11),
          ),
        ],
      ),
      subtitle: Row(
        children: [
          Container(
            margin: const EdgeInsets.only(right: 6, top: 2),
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: context.colors.accent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              role,
              style: TextStyle(color: context.colors.accent, fontSize: 10),
            ),
          ),
          Expanded(
            child: Text(
              lastMsg,
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 12,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (unread > 0)
            Container(
              margin: const EdgeInsets.only(left: 6),
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: context.colors.accent,
                shape: BoxShape.circle,
              ),
              child: Text(
                '$unread',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

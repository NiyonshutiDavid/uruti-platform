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

  @override
  void initState() {
    super.initState();
    _load();

    _realtimeSub = RealtimeService.instance.events.listen((event) {
      if (!mounted || event['event'] != 'message_created') return;
      _load();
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

  Future<void> _load() async {
    try {
      final token = context.read<AuthProvider>().token ?? '';
      final data = await ApiService.instance.getConversations(token);
      setState(() {
        _conversations = List<Map<String, dynamic>>.from(data);
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final conversations = _conversations;

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Messages',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => context.go('/discovery'),
            child: Text(
              '+ New',
              style: TextStyle(
                color: AppColors.primary,
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
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : conversations.isEmpty
                ? _empty()
                : ListView.separated(
                    itemCount: conversations.length,
                    separatorBuilder: (_, __) =>
                        Divider(height: 0, color: context.colors.divider),
                    itemBuilder: (_, i) =>
                        _ConversationTile(data: conversations[i]),
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
            style: TextStyle(color: AppColors.primary),
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

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      onTap: () => context.push('/messages/$userId'),
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
          if (isOnline)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: context.colors.background,
                    width: 2,
                  ),
                ),
              ),
            ),
        ],
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              name,
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
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
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              role,
              style: TextStyle(color: AppColors.primary, fontSize: 10),
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
              decoration: const BoxDecoration(
                color: AppColors.primary,
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

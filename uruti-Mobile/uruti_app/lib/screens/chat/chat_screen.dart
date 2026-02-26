import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../main_scaffold.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<Map<String, dynamic>> _conversations = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
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

  @override
  Widget build(BuildContext context) {
    final other = data['other_user'] as Map<String, dynamic>? ?? {};
    final name = (other['full_name'] as String?) ?? 'User';
    final role = (other['role'] as String?) ?? '';
    final avatar = other['avatar_url'] as String?;
    final lastMsg = (data['last_message'] as String?) ?? '';
    final time = (data['last_message_time'] as String?) ?? '';
    final unread = (data['unread_count'] as int?) ?? 0;
    final userId = other['id'] as String? ?? '';

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      onTap: () => context.go('/messages/$userId'),
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
                color: AppColors.primary,
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

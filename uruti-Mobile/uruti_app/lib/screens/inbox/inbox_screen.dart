import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../main_scaffold.dart';

// ─── Root Screen ──────────────────────────────────────────────────────────────

class InboxScreen extends StatelessWidget {
  const InboxScreen({super.key});

  @override
  Widget build(BuildContext context) => const _MessagesHome();
}

// ─── Messages Home (WhatsApp-style) ──────────────────────────────────────────

class _MessagesHome extends StatefulWidget {
  const _MessagesHome();

  @override
  State<_MessagesHome> createState() => _MessagesHomeState();
}

class _MessagesHomeState extends State<_MessagesHome> {
  List<Map<String, dynamic>> _conversations = [];
  bool _loading = true;
  String _filter = 'All'; // All | Unread | Starred
  String _search = '';
  final _searchCtrl = TextEditingController();

  static const _filters = ['All', 'Unread', 'Starred'];

  @override
  void initState() {
    super.initState();
    _load();
    _searchCtrl.addListener(() => setState(() => _search = _searchCtrl.text));
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final token = context.read<AuthProvider>().token ?? '';
      final data = await ApiService.instance.getConversations(token);
      if (!mounted) return;
      setState(() {
        _conversations = List<Map<String, dynamic>>.from(data);
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    var list = _conversations;
    if (_filter == 'Unread') {
      list = list.where((c) => (c['unread_count'] as int? ?? 0) > 0).toList();
    } else if (_filter == 'Starred') {
      list = list.where((c) => c['is_starred'] == true).toList();
    }
    if (_search.trim().isNotEmpty) {
      final q = _search.trim().toLowerCase();
      list = list.where((c) {
        final other = (c['other_user'] as Map?)?.cast<String, dynamic>() ?? {};
        final name = (other['full_name'] as String? ?? '').toLowerCase();
        final msg = (c['last_message'] as String? ?? '').toLowerCase();
        return name.contains(q) || msg.contains(q);
      }).toList();
    }
    return list;
  }

  void _makeCall(BuildContext ctx, String userId, String name, bool isVideo) {
    showModalBottomSheet(
      context: ctx,
      backgroundColor: ctx.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: ctx.colors.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isVideo ? Icons.videocam_rounded : Icons.phone_rounded,
                color: AppColors.primary,
                size: 36,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              isVideo ? 'Video Call' : 'Voice Call',
              style: TextStyle(
                color: ctx.colors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              name,
              style: TextStyle(color: ctx.colors.textSecondary, fontSize: 14),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'Starting ${isVideo ? 'video' : 'voice'} call with $name…',
                      ),
                      backgroundColor: AppColors.primary,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  );
                },
                icon: Icon(
                  isVideo ? Icons.videocam_rounded : Icons.phone_rounded,
                  color: Colors.white,
                  size: 18,
                ),
                label: Text(
                  'Call ${name.split(' ').first}',
                  style: const TextStyle(color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(ctx),
                style: OutlinedButton.styleFrom(
                  foregroundColor: ctx.colors.textSecondary,
                  side: BorderSide(color: ctx.colors.divider),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Cancel'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final conversations = _filtered;

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Chats',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w800,
            fontSize: 22,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.edit_square, color: context.colors.textPrimary),
            tooltip: 'New Message',
            onPressed: () => context.go('/messages'),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Search bar ───────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 4, 14, 0),
            child: TextField(
              controller: _searchCtrl,
              style: TextStyle(color: context.colors.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search by name or message…',
                hintStyle: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 14,
                ),
                prefixIcon: Icon(
                  Icons.search,
                  color: context.colors.textSecondary,
                  size: 20,
                ),
                suffixIcon: _search.isNotEmpty
                    ? IconButton(
                        icon: Icon(
                          Icons.close,
                          color: context.colors.textSecondary,
                          size: 18,
                        ),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() => _search = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: context.colors.surface,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(22),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // ── Filter chips ─────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 6),
            child: Row(
              children: _filters.map((f) {
                final active = _filter == f;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _filter = f),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: active
                            ? AppColors.primary
                            : context.colors.surface,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        f,
                        style: TextStyle(
                          color: active
                              ? Colors.white
                              : context.colors.textSecondary,
                          fontSize: 13,
                          fontWeight: active
                              ? FontWeight.w700
                              : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // ── Divider ───────────────────────────────────────────────────────
          Divider(height: 1, color: context.colors.divider),

          // ── Conversation list ─────────────────────────────────────────────
          Expanded(
            child: _loading
                ? Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : conversations.isEmpty
                ? _EmptyState(
                    filter: _filter,
                    onCompose: () => context.go('/messages'),
                  )
                : RefreshIndicator(
                    color: AppColors.primary,
                    onRefresh: _load,
                    child: ListView.builder(
                      itemCount: conversations.length,
                      itemBuilder: (ctx, i) {
                        final c = conversations[i];
                        final other =
                            (c['other_user'] as Map?)
                                ?.cast<String, dynamic>() ??
                            {};
                        final name = other['full_name'] as String? ?? 'User';
                        final role = other['role'] as String? ?? '';
                        final avatarUrl = other['avatar_url'] as String?;
                        final lastMsg = c['last_message'] as String? ?? '';
                        final unread = c['unread_count'] as int? ?? 0;
                        final isOnline = other['is_online'] == true;
                        final uid = '${other['id'] ?? ''}';
                        final ts = c['last_message_time'] as String?;
                        final timeStr = _formatTime(ts);
                        final initials = name
                            .split(' ')
                            .where((p) => p.isNotEmpty)
                            .map((p) => p[0])
                            .take(2)
                            .join()
                            .toUpperCase();

                        return _ConversationTile(
                          name: name,
                          role: role,
                          lastMsg: lastMsg,
                          time: timeStr,
                          unread: unread,
                          isOnline: isOnline,
                          avatarUrl: avatarUrl,
                          initials: initials,
                          onTap: () => ctx.go('/messages/$uid'),
                          onVoiceCall: () => _makeCall(ctx, uid, name, false),
                          onVideoCall: () => _makeCall(ctx, uid, name, true),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        tooltip: 'New Message',
        onPressed: () => context.go('/messages'),
        child: const Icon(Icons.edit_rounded),
      ),
    );
  }
}

// ─── Conversation Tile ────────────────────────────────────────────────────────

class _ConversationTile extends StatelessWidget {
  final String name;
  final String role;
  final String lastMsg;
  final String time;
  final int unread;
  final bool isOnline;
  final String? avatarUrl;
  final String initials;
  final VoidCallback onTap;
  final VoidCallback onVoiceCall;
  final VoidCallback onVideoCall;

  const _ConversationTile({
    required this.name,
    required this.role,
    required this.lastMsg,
    required this.time,
    required this.unread,
    required this.isOnline,
    required this.avatarUrl,
    required this.initials,
    required this.onTap,
    required this.onVoiceCall,
    required this.onVideoCall,
  });

  @override
  Widget build(BuildContext context) {
    final hasUnread = unread > 0;

    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                // ── Avatar + online dot ───────────────────────────────────
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: AppColors.primary.withValues(
                        alpha: 0.15,
                      ),
                      backgroundImage: avatarUrl != null
                          ? NetworkImage(avatarUrl!)
                          : null,
                      child: avatarUrl == null
                          ? Text(
                              initials,
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            )
                          : null,
                    ),
                    if (isOnline)
                      Positioned(
                        bottom: 1,
                        right: 1,
                        child: Container(
                          width: 13,
                          height: 13,
                          decoration: BoxDecoration(
                            color: const Color(0xFF25D366),
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
                const SizedBox(width: 12),

                // ── Name + last message ───────────────────────────────────
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: context.colors.textPrimary,
                                      fontWeight: hasUnread
                                          ? FontWeight.w800
                                          : FontWeight.w600,
                                      fontSize: 15,
                                    ),
                                  ),
                                ),
                                if (role.isNotEmpty) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 1,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(
                                        alpha: 0.1,
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      role,
                                      style: TextStyle(
                                        color: AppColors.primary,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          // Time
                          Text(
                            time,
                            style: TextStyle(
                              color: hasUnread
                                  ? AppColors.primary
                                  : context.colors.textSecondary,
                              fontSize: 11,
                              fontWeight: hasUnread
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              lastMsg.isEmpty
                                  ? 'Tap to start chatting'
                                  : lastMsg,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: hasUnread
                                    ? context.colors.textPrimary
                                    : context.colors.textSecondary,
                                fontSize: 13,
                                fontWeight: hasUnread
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (hasUnread)
                            Container(
                              padding: const EdgeInsets.all(5),
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                unread > 99 ? '99+' : '$unread',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            )
                          else
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _CallIconBtn(
                                  icon: Icons.phone_outlined,
                                  onTap: onVoiceCall,
                                ),
                                const SizedBox(width: 2),
                                _CallIconBtn(
                                  icon: Icons.videocam_outlined,
                                  onTap: onVideoCall,
                                ),
                              ],
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 70),
            child: Divider(height: 1, color: context.colors.divider),
          ),
        ],
      ),
    );
  }
}

// ─── Call Icon Button ─────────────────────────────────────────────────────────

class _CallIconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _CallIconBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(20),
    child: Padding(
      padding: const EdgeInsets.all(4),
      child: Icon(icon, size: 18, color: AppColors.primary),
    ),
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final String filter;
  final VoidCallback onCompose;
  const _EmptyState({required this.filter, required this.onCompose});

  @override
  Widget build(BuildContext context) {
    final isFilter = filter != 'All';
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isFilter
                  ? Icons.filter_list_rounded
                  : Icons.chat_bubble_outline_rounded,
              size: 36,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isFilter ? 'No $filter messages' : 'No conversations yet',
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isFilter
                ? 'Try switching to All'
                : 'Start a conversation to connect\nwith investors and mentors',
            textAlign: TextAlign.center,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
          ),
          if (!isFilter) ...[
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onCompose,
              icon: const Icon(Icons.edit_rounded, size: 16),
              label: const Text('New Message'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Time formatter ───────────────────────────────────────────────────────────

String _formatTime(String? iso) {
  if (iso == null) return '';
  try {
    final dt = DateTime.parse(iso).toLocal();
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return 'now';
    if (diff.inMinutes < 60) {
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '$h:$m';
    }
    if (diff.inHours < 24) {
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '$h:$m';
    }
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days[dt.weekday - 1];
    }
    return '${dt.day}/${dt.month}/${dt.year.toString().substring(2)}';
  } catch (_) {
    return '';
  }
}

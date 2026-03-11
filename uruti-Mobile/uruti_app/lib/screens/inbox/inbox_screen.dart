import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/realtime_service.dart';
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
  StreamSubscription<Map<String, dynamic>>? _realtimeSub;
  Timer? _onlineRefreshTimer;
  Timer? _conversationPollTimer;

  static const _filters = ['All', 'Unread', 'Starred'];

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
  void initState() {
    super.initState();
    _load();
    _searchCtrl.addListener(() => setState(() => _search = _searchCtrl.text));

    _realtimeSub = RealtimeService.instance.events.listen((event) {
      if (!mounted) return;
      final eventType = event['event'];

      // Handle new messages
      if (eventType == 'message_created') {
        _load();
        return;
      }

      // Handle presence events
      if (eventType == 'user_online' || eventType == 'user_offline') {
        final data = event['data'];
        if (data is Map) {
          final userId = int.tryParse('${data['user_id'] ?? 0}') ?? 0;
          if (userId > 0) {
            _updateUserOnlineStatus(userId, eventType == 'user_online');
          }
        }
        return;
      }
    });

    final token = (context.read<AuthProvider>().token ?? '').trim();
    if (token.isNotEmpty) {
      RealtimeService.instance.connect(token);
    }

    // Periodically refresh online status every 30 seconds
    _onlineRefreshTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _refreshOnlineStatus(),
    );

    _conversationPollTimer = Timer.periodic(
      const Duration(seconds: 3),
      (_) => _load(),
    );
  }

  /// Update a single user's online status in the conversation list.
  void _updateUserOnlineStatus(int userId, bool isOnline) {
    if (!mounted) return;
    bool changed = false;
    for (int i = 0; i < _conversations.length; i++) {
      final other =
          (_conversations[i]['other_user'] as Map?)?.cast<String, dynamic>() ??
          {};
      final uid = int.tryParse('${other['id'] ?? 0}') ?? 0;
      if (uid == userId && other['is_online'] != isOnline) {
        _conversations[i] = {
          ..._conversations[i],
          'other_user': {...other, 'is_online': isOnline},
        };
        changed = true;
      }
    }
    if (changed) setState(() {});
  }

  /// Fetch online IDs from the backend and update conversation statuses.
  Future<void> _refreshOnlineStatus() async {
    if (!mounted || _conversations.isEmpty) return;
    try {
      final onlineIds = await ApiService.instance.getOnlineConnectionIds();
      if (!mounted) return;
      bool changed = false;
      for (int i = 0; i < _conversations.length; i++) {
        final other =
            (_conversations[i]['other_user'] as Map?)
                ?.cast<String, dynamic>() ??
            {};
        final uid = int.tryParse('${other['id'] ?? 0}') ?? 0;
        final isOnline = onlineIds.contains(uid);
        if (other['is_online'] != isOnline) {
          _conversations[i] = {
            ..._conversations[i],
            'other_user': {...other, 'is_online': isOnline},
          };
          changed = true;
        }
      }
      if (changed) setState(() {});
    } catch (_) {}
  }

  @override
  void dispose() {
    _realtimeSub?.cancel();
    _onlineRefreshTimer?.cancel();
    _conversationPollTimer?.cancel();
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

  void _showConnectionPicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ConnectionPickerSheet(
        onSelect: (userId) {
          Navigator.of(context).pop();
          context.push('/messages/$userId');
        },
      ),
    );
  }

  Future<void> _openThreadAndMarkRead(String uid) async {
    final otherUserId = int.tryParse(uid) ?? 0;
    if (otherUserId > 0) {
      await ApiService.instance.markThreadAsRead(otherUserId);
      if (mounted) {
        setState(() {
          _conversations = _conversations.map((conversation) {
            final other =
                (conversation['other_user'] as Map?)?.cast<String, dynamic>() ??
                {};
            final id = int.tryParse('${other['id'] ?? 0}') ?? 0;
            if (id == otherUserId) {
              return {...conversation, 'unread_count': 0};
            }
            return conversation;
          }).toList();
        });
      }
    }
  }

  List<Map<String, dynamic>> get _filtered {
    var list = _conversations.toList();
    if (_filter == 'Unread') {
      list = list.where((c) => (c['unread_count'] as int? ?? 0) > 0).toList();
    } else if (_filter == 'Starred') {
      list = list.where((c) => c['is_starred'] == true).toList();
    }
    if (_search.trim().isNotEmpty) {
      final q = _search.trim().toLowerCase();
      list = list.where((c) {
        final other = (c['other_user'] as Map?)?.cast<String, dynamic>() ?? {};
        final name = _asText(other['full_name']).toLowerCase();
        final msg = _asText(c['last_message']).toLowerCase();
        return name.contains(q) || msg.contains(q);
      }).toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final conversations = _filtered;

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: Colors.white),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Chats',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            fontSize: 22,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.edit_square, color: Colors.white),
            tooltip: 'New Message',
            onPressed: _showConnectionPicker,
          ),
          IconButton(
            icon: Icon(Icons.person_add_alt_1, color: Colors.white),
            tooltip: 'New Connection',
            onPressed: () => context.go('/connections?tab=discover'),
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
              style: TextStyle(color: Colors.white, fontSize: 14),
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
                    onCompose: _showConnectionPicker,
                    onNewConnection: () =>
                        context.go('/connections?tab=discover'),
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
                        final name = _asText(other['display_name']).isNotEmpty
                            ? _asText(other['display_name'])
                            : _asText(other['full_name']).isNotEmpty
                            ? _asText(other['full_name'])
                            : 'Connection';
                        final role = _asText(other['role']);
                        final avatarUrl = _safeAvatarUrl(other['avatar_url']);
                        final lastMsg = _asText(c['last_message']);
                        final unread = c['unread_count'] as int? ?? 0;
                        final isOnline = other['is_online'] == true;
                        final uid = '${other['id'] ?? ''}';
                        final ts = _asText(c['last_message_time']);
                        final timeStr = _formatTime(ts);
                        final initials = name
                            .split(' ')
                            .where((p) => p.isNotEmpty)
                            .map((p) => p[0])
                            .take(2)
                            .join()
                            .toUpperCase();

                        return Dismissible(
                          key: ValueKey('inbox_$uid'),
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
                              builder: (dlg) => AlertDialog(
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
                                    onPressed: () => Navigator.pop(dlg, false),
                                    child: Text(
                                      'Cancel',
                                      style: TextStyle(
                                        color: context.colors.textSecondary,
                                      ),
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: () => Navigator.pop(dlg, true),
                                    child: const Text(
                                      'Delete',
                                      style: TextStyle(color: Colors.redAccent),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                          onDismissed: (_) async {
                            final messenger = ScaffoldMessenger.of(context);
                            final otherUserId = int.tryParse(uid) ?? 0;
                            if (otherUserId > 0) {
                              try {
                                await ApiService.instance.deleteMessageThread(
                                  otherUserId,
                                );
                              } catch (_) {
                                messenger.showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Failed to delete conversation on server',
                                    ),
                                  ),
                                );
                              }
                            }
                            if (!mounted) return;
                            setState(() {
                              _conversations.removeWhere((conversation) {
                                final other =
                                    (conversation['other_user'] as Map?)
                                        ?.cast<String, dynamic>() ??
                                    {};
                                return '${other['id'] ?? ''}' == uid;
                              });
                            });
                          },
                          child: _ConversationTile(
                            name: name,
                            role: role,
                            lastMsg: lastMsg,
                            time: timeStr,
                            unread: unread,
                            isOnline: isOnline,
                            avatarUrl: avatarUrl,
                            initials: initials,
                            onTap: () async {
                              await _openThreadAndMarkRead(uid);
                              if (!context.mounted) return;
                              context.push('/messages/$uid');
                            },
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
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
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          color: isOnline
                              ? const Color(0xFF25D366)
                              : Colors.grey,
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

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final String filter;
  final VoidCallback onCompose;
  final VoidCallback? onNewConnection;
  const _EmptyState({
    required this.filter,
    required this.onCompose,
    this.onNewConnection,
  });

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
                : 'Find and connect with investors,\nmentors, and founders',
            textAlign: TextAlign.center,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
          ),
          if (!isFilter) ...[
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onCompose,
              icon: const Icon(Icons.edit_square, size: 16),
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
            if (onNewConnection != null) ...[
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: onNewConnection,
                icon: const Icon(Icons.person_add_alt_1, size: 16),
                label: const Text('New Connection'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: BorderSide(color: AppColors.primary),
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
        ],
      ),
    );
  }
}

// ─── Connection Picker Bottom Sheet ───────────────────────────────────────────

class _ConnectionPickerSheet extends StatefulWidget {
  final void Function(String userId) onSelect;
  const _ConnectionPickerSheet({required this.onSelect});

  @override
  State<_ConnectionPickerSheet> createState() => _ConnectionPickerSheetState();
}

class _ConnectionPickerSheetState extends State<_ConnectionPickerSheet> {
  List<Map<String, dynamic>> _connections = [];
  bool _loading = true;
  String _query = '';
  final _ctrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchConnections();
    _ctrl.addListener(() => setState(() => _query = _ctrl.text));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _fetchConnections() async {
    try {
      final data = await ApiService.instance.getConnections(null, 'accepted');
      if (!mounted) return;
      setState(() {
        _connections = List<Map<String, dynamic>>.from(
          data.map((c) => Map<String, dynamic>.from(c as Map)),
        );
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_query.trim().isEmpty) return _connections;
    final q = _query.trim().toLowerCase();
    return _connections.where((c) {
      final name = (c['full_name'] ?? '').toString().toLowerCase();
      final role = (c['role'] ?? '').toString().toLowerCase();
      return name.contains(q) || role.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final results = _filtered;
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: context.colors.background,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 10, bottom: 6),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: context.colors.textSecondary.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Title
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Text(
                  'New Message',
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: Icon(Icons.close, color: context.colors.textSecondary),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          // Search field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _ctrl,
              style: TextStyle(color: context.colors.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search connections…',
                hintStyle: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 14,
                ),
                prefixIcon: Icon(
                  Icons.search,
                  color: context.colors.textSecondary,
                  size: 20,
                ),
                suffixIcon: _query.isNotEmpty
                    ? IconButton(
                        icon: Icon(
                          Icons.close,
                          color: context.colors.textSecondary,
                          size: 18,
                        ),
                        onPressed: () {
                          _ctrl.clear();
                          setState(() => _query = '');
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
          const SizedBox(height: 8),
          Divider(height: 1, color: context.colors.divider),

          // Connection list
          Expanded(
            child: _loading
                ? Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : results.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _query.isNotEmpty
                              ? Icons.search_off_rounded
                              : Icons.people_outline_rounded,
                          size: 48,
                          color: context.colors.textSecondary,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _query.isNotEmpty
                              ? 'No connections found'
                              : 'No connections yet',
                          style: TextStyle(
                            color: context.colors.textSecondary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (_query.isEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Add connections to start messaging',
                            style: TextStyle(
                              color: context.colors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: results.length,
                    itemBuilder: (ctx, i) {
                      final c = results[i];
                      final name = c['full_name'] ?? 'User';
                      final role = (c['role'] ?? '').toString();
                      final avatarUrl = c['avatar_url']?.toString();
                      final uid = c['id'].toString();
                      final initials = name
                          .toString()
                          .split(' ')
                          .where((p) => p.isNotEmpty)
                          .map((p) => p[0])
                          .take(2)
                          .join()
                          .toUpperCase();

                      return ListTile(
                        leading: CircleAvatar(
                          radius: 22,
                          backgroundColor: AppColors.primary.withValues(
                            alpha: 0.15,
                          ),
                          backgroundImage:
                              avatarUrl != null && avatarUrl.isNotEmpty
                              ? NetworkImage(avatarUrl)
                              : null,
                          child: avatarUrl == null || avatarUrl.isEmpty
                              ? Text(
                                  initials,
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                )
                              : null,
                        ),
                        title: Text(
                          name,
                          style: TextStyle(
                            color: context.colors.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                        subtitle: role.isNotEmpty
                            ? Text(
                                role,
                                style: TextStyle(
                                  color: context.colors.textSecondary,
                                  fontSize: 12,
                                ),
                              )
                            : null,
                        onTap: () => widget.onSelect(uid),
                      );
                    },
                  ),
          ),
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

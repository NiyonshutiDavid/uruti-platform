import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/realtime_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List _notifs = [];
  bool _loading = true;
  StreamSubscription<Map<String, dynamic>>? _realtimeSub;
  final TextEditingController _searchCtrl = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _load();

    _realtimeSub = RealtimeService.instance.events.listen((event) {
      if (!mounted || event['event'] != 'notification_created') return;
      final raw = event['data'];
      if (raw is! Map) return;
      final next = Map<String, dynamic>.from(raw.cast<dynamic, dynamic>());
      final id = '${next['id'] ?? ''}';
      setState(() {
        _notifs.removeWhere((n) => '${(n as Map)['id'] ?? ''}' == id);
        _notifs.insert(0, next);
      });
    });

    final token = (context.read<AuthProvider>().token ?? '').trim();
    if (token.isNotEmpty) {
      RealtimeService.instance.connect(token);
    }
  }

  @override
  void dispose() {
    _realtimeSub?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final token = context.read<AuthProvider>().token ?? '';
      final data = await ApiService.instance.getNotifications(token);
      if (mounted) {
        setState(() {
          _notifs = data;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleNotificationTap(Map<String, dynamic> data) async {
    final id = (data['id'] as num?)?.toInt();
    if (id != null && data['is_read'] != true) {
      await ApiService.instance.markNotificationRead(id);
      if (!mounted) return;
      setState(() {
        data['is_read'] = true;
      });
    }

    final payloadRaw = data['data'];
    final payload = payloadRaw is Map
        ? Map<String, dynamic>.from(payloadRaw.cast<dynamic, dynamic>())
        : <String, dynamic>{};
    final kind = (payload['kind'] ?? '').toString();
    final type = (data['type'] ?? '').toString();

    if (!mounted) return;

    if (type == 'message' || kind == 'message') {
      final threadUserId =
          int.tryParse(
            '${payload['thread_user_id'] ?? payload['sender_id'] ?? 0}',
          ) ??
          0;
      if (threadUserId > 0) {
        context.go('/messages/$threadUserId');
        return;
      }
      context.go('/inbox');
      return;
    }

    if (kind.startsWith('connection')) {
      context.go('/connections');
      return;
    }

    if (kind == 'bookmark_created' || kind == 'bookmark_removed') {
      context.go('/deal-flow');
      return;
    }

    if (kind == 'new_venture' || kind == 'venture_updated') {
      context.go('/discovery');
      return;
    }

    context.go('/home');
  }

  void _dismissNotification(int index) {
    if (index < 0 || index >= _notifs.length) return;
    setState(() {
      _notifs.removeAt(index);
    });
  }

  @override
  Widget build(BuildContext context) {
    // Filter notifications by search query
    final filtered = _searchQuery.isEmpty
        ? _notifs
        : _notifs.where((n) {
            final m = n as Map;
            final title = (m['title'] as String? ?? '').toLowerCase();
            final message = (m['message'] as String? ?? '').toLowerCase();
            final type = (m['type'] as String? ?? '').toLowerCase();
            final q = _searchQuery.toLowerCase();
            return title.contains(q) || message.contains(q) || type.contains(q);
          }).toList();

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: Colors.white),
          tooltip: 'Back',
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              context.pop();
              return;
            }
            context.go('/home');
          },
        ),
        title: Text(
          'Notifications',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              await ApiService.instance.markAllNotificationsRead();
              if (!mounted) return;
              setState(() {
                _notifs = _notifs.map((n) {
                  final map = Map<String, dynamic>.from(
                    (n as Map).cast<String, dynamic>(),
                  );
                  map['is_read'] = true;
                  return map;
                }).toList();
              });
            },
            child: Text(
              'Mark all read',
              style: TextStyle(color: Colors.white, fontSize: 12),
            ),
          ),
        ],
      ),
      body: _loading
          ? Center(
              child: CircularProgressIndicator(color: context.colors.accent),
            )
          : Column(
              children: [
                // ── Search bar ─────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                  child: TextField(
                    controller: _searchCtrl,
                    style: TextStyle(
                      color: context.colors.textPrimary,
                      fontSize: 14,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search notifications…',
                      hintStyle: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 14,
                      ),
                      prefixIcon: Icon(
                        Icons.search_rounded,
                        color: context.colors.textSecondary,
                      ),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: Icon(
                                Icons.close_rounded,
                                color: context.colors.textSecondary,
                                size: 20,
                              ),
                              onPressed: () {
                                _searchCtrl.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: context.colors.card,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: context.colors.divider),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: context.colors.divider),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: context.colors.accent),
                      ),
                    ),
                    onChanged: (v) => setState(() => _searchQuery = v.trim()),
                  ),
                ),
                // ── Notification list ──────────────────────────────
                Expanded(
                  child: filtered.isEmpty
                      ? Center(
                          child: Text(
                            _searchQuery.isNotEmpty
                                ? 'No matching notifications'
                                : 'No notifications',
                            style: TextStyle(
                              color: context.colors.textSecondary,
                            ),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(12),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 8),
                          itemBuilder: (_, i) {
                            final data = filtered[i] as Map<String, dynamic>;
                            return GestureDetector(
                              onTap: () => _handleNotificationTap(data),
                              child: _NotifCard(
                                data: data,
                                onClose: () {
                                  final realIdx = _notifs.indexOf(filtered[i]);
                                  if (realIdx >= 0)
                                    _dismissNotification(realIdx);
                                },
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}

class _NotifCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final VoidCallback onClose;
  const _NotifCard({required this.data, required this.onClose});

  IconData get _icon {
    final type = data['type'] as String? ?? '';
    final kind = (data['data'] is Map)
        ? ((data['data'] as Map)['kind']?.toString() ?? '')
        : '';
    return kind.startsWith('connection') || type == 'connection'
        ? Icons.people_outline
        : kind == 'venture_updated'
        ? Icons.edit_outlined
        : kind == 'bookmark_created' || kind == 'bookmark_removed'
        ? Icons.bookmark_outline
        : kind == 'new_venture'
        ? Icons.rocket_launch_outlined
        : type == 'message'
        ? Icons.message_outlined
        : type == 'score'
        ? Icons.trending_up
        : Icons.notifications_outlined;
  }

  Color _color(BuildContext context) {
    final type = data['type'] as String? ?? '';
    final kind = (data['data'] is Map)
        ? ((data['data'] as Map)['kind']?.toString() ?? '')
        : '';
    return kind.startsWith('connection') || type == 'connection'
        ? context.colors.accent
        : kind == 'venture_updated'
        ? const Color(0xFF0EA5E9)
        : kind == 'bookmark_created' || kind == 'bookmark_removed'
        ? const Color(0xFFF59E0B)
        : kind == 'new_venture'
        ? const Color(0xFF8B5CF6)
        : type == 'message'
        ? const Color(0xFF3B82F6)
        : type == 'score'
        ? const Color(0xFFFFB800)
        : context.colors.textSecondary;
  }

  @override
  Widget build(BuildContext context) {
    final title = data['title'] as String? ?? '';
    final message = data['message'] as String? ?? '';
    final isRead = data['is_read'] as bool? ?? false;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isRead
            ? context.colors.card
            : context.colors.accent.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isRead
              ? context.colors.divider
              : context.colors.accent.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: _color(context).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(_icon, color: _color(context), size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  message,
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 12,
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              Icons.close_rounded,
              color: context.colors.textSecondary,
            ),
            tooltip: 'Dismiss',
            onPressed: onClose,
            visualDensity: VisualDensity.compact,
          ),
          if (!isRead)
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: context.colors.accent,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }
}

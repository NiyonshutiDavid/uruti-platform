import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/realtime_service.dart';
import '../../screens/main_scaffold.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List _notifs = [];
  bool _loading = true;
  StreamSubscription<Map<String, dynamic>>? _realtimeSub;

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Notifications',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
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
              style: TextStyle(color: AppColors.primary, fontSize: 12),
            ),
          ),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _notifs.isEmpty
          ? Center(
              child: Text(
                'No notifications',
                style: TextStyle(color: context.colors.textSecondary),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: _notifs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final data = _notifs[i] as Map<String, dynamic>;
                return GestureDetector(
                  onTap: () async {
                    final id = (data['id'] as num?)?.toInt();
                    if (id == null || data['is_read'] == true) return;
                    await ApiService.instance.markNotificationRead(id);
                    if (!mounted) return;
                    setState(() {
                      data['is_read'] = true;
                    });
                  },
                  child: _NotifCard(data: data),
                );
              },
            ),
    );
  }
}

class _NotifCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _NotifCard({required this.data});

  IconData get _icon {
    final type = data['type'] as String? ?? '';
    final kind = (data['data'] is Map)
        ? ((data['data'] as Map)['kind']?.toString() ?? '')
        : '';
    return kind.startsWith('connection') || type == 'connection'
        ? Icons.people_outline
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
        ? AppColors.primary
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
            : AppColors.primary.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isRead
              ? context.colors.divider
              : AppColors.primary.withValues(alpha: 0.2),
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
          if (!isRead)
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }
}

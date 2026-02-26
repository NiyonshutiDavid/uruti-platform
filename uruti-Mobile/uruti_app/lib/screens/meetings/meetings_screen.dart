import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/app_colors.dart';
import '../../services/api_service.dart';
import '../../screens/main_scaffold.dart';

// ─── Screen ───────────────────────────────────────────────────────────────────

class MeetingsScreen extends StatefulWidget {
  const MeetingsScreen({super.key});
  @override
  State<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends State<MeetingsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  List<Map<String, dynamic>> _upcoming = [];
  List<Map<String, dynamic>> _requests = [];
  bool _loadingUpcoming = true;
  bool _loadingRequests = true;
  String? _errorUpcoming;
  String? _errorRequests;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _loadUpcoming();
    _loadRequests();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  // ── Data loading ─────────────────────────────────────────────────────────────

  Future<void> _loadUpcoming() async {
    setState(() {
      _loadingUpcoming = true;
      _errorUpcoming = null;
    });
    try {
      final data = await ApiService.instance.getMeetings(
        upcoming: true,
        statusFilter: 'confirmed',
      );
      if (!mounted) return;
      setState(() {
        _upcoming = List<Map<String, dynamic>>.from(
          data.map((e) => Map<String, dynamic>.from(e as Map)),
        );
        _loadingUpcoming = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorUpcoming = e.toString();
        _loadingUpcoming = false;
      });
    }
  }

  Future<void> _loadRequests() async {
    setState(() {
      _loadingRequests = true;
      _errorRequests = null;
    });
    try {
      // Pending meetings where the current user is a participant
      final data = await ApiService.instance.getMeetings(
        statusFilter: 'scheduled',
      );
      if (!mounted) return;
      setState(() {
        _requests = List<Map<String, dynamic>>.from(
          data.map((e) => Map<String, dynamic>.from(e as Map)),
        );
        _loadingRequests = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorRequests = e.toString();
        _loadingRequests = false;
      });
    }
  }

  // ── Accept / Reject ──────────────────────────────────────────────────────────

  Future<void> _accept(int meetingId) async {
    try {
      await ApiService.instance.acceptMeeting(meetingId);
      _loadRequests();
      _loadUpcoming();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Meeting accepted')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _reject(int meetingId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ctx.colors.surface,
        title: Text(
          'Decline Meeting?',
          style: TextStyle(color: ctx.colors.textPrimary),
        ),
        content: Text(
          'This meeting request will be declined.',
          style: TextStyle(color: ctx.colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Cancel',
              style: TextStyle(color: ctx.colors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Decline',
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await ApiService.instance.rejectMeeting(meetingId);
      _loadRequests();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Meeting declined')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  // ── Build ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
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
          'Meetings',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: context.colors.textSecondary,
          labelStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
          tabs: [
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.event_available_outlined, size: 16),
                  SizedBox(width: 6),
                  Text('Upcoming'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.mark_email_unread_outlined, size: 16),
                  const SizedBox(width: 6),
                  const Text('Requests'),
                  if (_requests.isNotEmpty) ...[
                    const SizedBox(width: 4),
                    _CountBadge(count: _requests.length),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _UpcomingTab(
            meetings: _upcoming,
            loading: _loadingUpcoming,
            error: _errorUpcoming,
            onRefresh: _loadUpcoming,
          ),
          _RequestsTab(
            meetings: _requests,
            loading: _loadingRequests,
            error: _errorRequests,
            onRefresh: _loadRequests,
            onAccept: _accept,
            onReject: _reject,
          ),
        ],
      ),
    );
  }
}

// ─── Upcoming tab ─────────────────────────────────────────────────────────────

class _UpcomingTab extends StatelessWidget {
  final List<Map<String, dynamic>> meetings;
  final bool loading;
  final String? error;
  final VoidCallback onRefresh;

  const _UpcomingTab({
    required this.meetings,
    required this.loading,
    required this.error,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (error != null) {
      return _ErrorState(message: error!, onRetry: onRefresh);
    }
    if (meetings.isEmpty) {
      return _EmptyState(
        icon: Icons.event_outlined,
        message: 'No upcoming meetings',
        detail: 'Confirmed meetings will appear here.',
      );
    }
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      color: AppColors.primary,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: meetings.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) => _MeetingCard(meeting: meetings[i]),
      ),
    );
  }
}

// ─── Requests tab ─────────────────────────────────────────────────────────────

class _RequestsTab extends StatelessWidget {
  final List<Map<String, dynamic>> meetings;
  final bool loading;
  final String? error;
  final VoidCallback onRefresh;
  final Future<void> Function(int) onAccept;
  final Future<void> Function(int) onReject;

  const _RequestsTab({
    required this.meetings,
    required this.loading,
    required this.error,
    required this.onRefresh,
    required this.onAccept,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (error != null) {
      return _ErrorState(message: error!, onRetry: onRefresh);
    }
    if (meetings.isEmpty) {
      return _EmptyState(
        icon: Icons.inbox_outlined,
        message: 'No pending requests',
        detail: 'New meeting invitations will appear here.',
      );
    }
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      color: AppColors.primary,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: meetings.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) => _MeetingCard(
          meeting: meetings[i],
          showActions: true,
          onAccept: onAccept,
          onReject: onReject,
        ),
      ),
    );
  }
}

// ─── Meeting card ─────────────────────────────────────────────────────────────

class _MeetingCard extends StatelessWidget {
  final Map<String, dynamic> meeting;
  final bool showActions;
  final Future<void> Function(int)? onAccept;
  final Future<void> Function(int)? onReject;

  const _MeetingCard({
    required this.meeting,
    this.showActions = false,
    this.onAccept,
    this.onReject,
  });

  String _formatTime(String? raw) {
    if (raw == null || raw.isEmpty) return 'TBD';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    return DateFormat('EEE, MMM d • h:mm a').format(dt.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final id = meeting['id'] as int? ?? 0;
    final title = meeting['title'] as String? ?? 'Meeting';
    final type = meeting['meeting_type'] as String? ?? 'online';
    final startTime = _formatTime(meeting['start_time'] as String?);
    final hasUrl = (meeting['meeting_url'] as String? ?? '').isNotEmpty;

    final typeIcon = switch (type) {
      'video' || 'online' => Icons.videocam_outlined,
      'phone' => Icons.phone_outlined,
      'in_person' || 'in-person' => Icons.people_outline,
      _ => Icons.event_outlined,
    };
    final typeLabel = switch (type) {
      'video' || 'online' => 'Video Call',
      'phone' => 'Phone Call',
      'in_person' || 'in-person' => 'In Person',
      _ => type,
    };

    return Container(
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(typeIcon, color: AppColors.primary, size: 20),
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
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        typeLabel,
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                if (hasUrl)
                  Tooltip(
                    message: 'Join Meeting',
                    child: Icon(
                      Icons.open_in_new,
                      color: AppColors.primary,
                      size: 18,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(
                  Icons.schedule_outlined,
                  color: context.colors.textSecondary,
                  size: 14,
                ),
                const SizedBox(width: 4),
                Text(
                  startTime,
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            if (showActions) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => onReject?.call(id),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.redAccent),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      child: const Text(
                        'Decline',
                        style: TextStyle(color: Colors.redAccent, fontSize: 13),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => onAccept?.call(id),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      child: const Text(
                        'Accept',
                        style: TextStyle(color: Colors.white, fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

class _CountBadge extends StatelessWidget {
  final int count;
  const _CountBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(
        color: Colors.redAccent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        '$count',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String detail;
  const _EmptyState({
    required this.icon,
    required this.message,
    required this.detail,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: context.colors.textSecondary, size: 52),
          const SizedBox(height: 14),
          Text(
            message,
            style: TextStyle(
              color: context.colors.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            detail,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
          const SizedBox(height: 12),
          Text(
            'Could not load meetings',
            style: TextStyle(color: context.colors.textSecondary),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: onRetry,
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Retry', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_colors.dart';
import '../../providers/call_provider.dart';
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
  final Set<int> _deletedIds = {};

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
        statusFilter: 'scheduled',
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
        backgroundColor: context.colors.appBarBg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: Colors.white),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Meetings',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
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
            meetings: _upcoming
                .where((m) => !_deletedIds.contains(m['id'] as int? ?? 0))
                .toList(),
            loading: _loadingUpcoming,
            error: _errorUpcoming,
            onRefresh: _loadUpcoming,
            onDelete: (id) => setState(() => _deletedIds.add(id)),
          ),
          _RequestsTab(
            meetings: _requests
                .where((m) => !_deletedIds.contains(m['id'] as int? ?? 0))
                .toList(),
            loading: _loadingRequests,
            error: _errorRequests,
            onRefresh: _loadRequests,
            onAccept: _accept,
            onReject: _reject,
            onDelete: (id) => setState(() => _deletedIds.add(id)),
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
  final void Function(int) onDelete;

  const _UpcomingTab({
    required this.meetings,
    required this.loading,
    required this.error,
    required this.onRefresh,
    required this.onDelete,
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
        detail: 'Scheduled meetings will appear here.',
      );
    }
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      color: context.colors.accent,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: meetings.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final m = meetings[i];
          final id = m['id'] as int? ?? 0;
          return _DismissibleMeeting(
            meetingId: id,
            onDelete: onDelete,
            child: _MeetingCard(
              meeting: m,
              onTap: () => _showMeetingDetail(context, m),
            ),
          );
        },
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
  final void Function(int) onDelete;

  const _RequestsTab({
    required this.meetings,
    required this.loading,
    required this.error,
    required this.onRefresh,
    required this.onAccept,
    required this.onReject,
    required this.onDelete,
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
      color: context.colors.accent,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: meetings.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final m = meetings[i];
          final id = m['id'] as int? ?? 0;
          return _DismissibleMeeting(
            meetingId: id,
            onDelete: onDelete,
            child: _MeetingCard(
              meeting: m,
              showActions: true,
              onAccept: onAccept,
              onReject: onReject,
              onTap: () => _showMeetingDetail(context, m),
            ),
          );
        },
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
  final VoidCallback? onTap;

  const _MeetingCard({
    required this.meeting,
    this.showActions = false,
    this.onAccept,
    this.onReject,
    this.onTap,
  });

  String _formatTime(String? raw) {
    if (raw == null || raw.isEmpty) return 'TBD';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    return DateFormat('EEE, MMM d • h:mm a').format(dt.toLocal());
  }

  Future<void> _startMeetingCall(BuildContext context, String type) async {
    final normalizedType = type.toLowerCase();
    final isVideo = normalizedType == 'video' || normalizedType == 'online';
    final isVoice = normalizedType == 'phone';
    if (!isVideo && !isVoice) return;

    final calls = context.read<CallProvider>();
    if (calls.hasCall) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Finish current call before starting another.'),
        ),
      );
      return;
    }

    final calleeName =
        (meeting['participant_name'] as String?)?.trim().isNotEmpty == true
        ? (meeting['participant_name'] as String).trim()
        : (meeting['host_name'] as String?)?.trim().isNotEmpty == true
        ? (meeting['host_name'] as String).trim()
        : (meeting['title'] as String?)?.trim().isNotEmpty == true
        ? (meeting['title'] as String).trim()
        : 'Meeting Contact';

    await calls.startOutgoingCall(
      calleeId:
          '${meeting['participant_id'] ?? meeting['host_id'] ?? meeting['id'] ?? 'meeting'}',
      calleeName: calleeName,
      handle:
          (meeting['meeting_url'] as String?) ??
          (meeting['meeting_link'] as String?),
      isVideo: isVideo,
    );

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '${isVideo ? 'Video' : 'Voice'} call started with $calleeName',
        ),
        backgroundColor: context.colors.accent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final id = meeting['id'] as int? ?? 0;
    final title = meeting['title'] as String? ?? 'Meeting';
    final type = meeting['meeting_type'] as String? ?? 'online';
    final startTime = _formatTime(meeting['start_time'] as String?);
    final hasUrl = (meeting['meeting_url'] as String? ?? '').isNotEmpty;
    final canStartCall = type == 'video' || type == 'online' || type == 'phone';

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

    return GestureDetector(
      onTap: onTap,
      child: Container(
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
                      color: context.colors.accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      typeIcon,
                      color: context.colors.accent,
                      size: 20,
                    ),
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
                  if (hasUrl || canStartCall)
                    Tooltip(
                      message: canStartCall ? 'Start Call' : 'Join Meeting',
                      child: IconButton(
                        onPressed: () => _startMeetingCall(context, type),
                        icon: Icon(
                          canStartCall ? Icons.call_rounded : Icons.open_in_new,
                          color: context.colors.accent,
                          size: 18,
                        ),
                        splashRadius: 18,
                        visualDensity: VisualDensity.compact,
                        constraints: const BoxConstraints(),
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
                          style: TextStyle(
                            color: Colors.redAccent,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => onAccept?.call(id),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: context.colors.accent,
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
      ),
    );
  }
}

// ─── Dismissible wrapper ──────────────────────────────────────────────────────

class _DismissibleMeeting extends StatelessWidget {
  final int meetingId;
  final void Function(int) onDelete;
  final Widget child;

  const _DismissibleMeeting({
    required this.meetingId,
    required this.onDelete,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey('meeting_$meetingId'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        decoration: BoxDecoration(
          color: Colors.redAccent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Icon(Icons.delete_outline_rounded, color: Colors.white, size: 22),
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
              'Delete meeting?',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            content: Text(
              'This will remove this meeting from your list.',
              style: TextStyle(color: context.colors.textSecondary),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dlg, false),
                child: Text(
                  'Cancel',
                  style: TextStyle(color: context.colors.textSecondary),
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
      onDismissed: (_) => onDelete(meetingId),
      child: child,
    );
  }
}

// ─── Meeting Detail Sheet ─────────────────────────────────────────────────────

void _showMeetingDetail(BuildContext context, Map<String, dynamic> meeting) {
  final title = meeting['title'] as String? ?? 'Meeting';
  final type = meeting['meeting_type'] as String? ?? 'online';
  final status = meeting['status'] as String? ?? 'scheduled';
  final description = meeting['description'] as String? ?? '';
  final meetingUrl = meeting['meeting_url'] as String? ?? '';
  final location = meeting['location'] as String? ?? '';
  final startRaw = meeting['start_time'] as String?;
  final endRaw = meeting['end_time'] as String?;
  final hostName = meeting['host_name'] as String? ?? '';
  final participantName = meeting['participant_name'] as String? ?? '';

  String formatDt(String? raw) {
    if (raw == null || raw.isEmpty) return 'TBD';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    return DateFormat('EEE, MMM d, yyyy • h:mm a').format(dt.toLocal());
  }

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

  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Container(
      decoration: BoxDecoration(
        color: ctx.colors.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: ctx.colors.textSecondary.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: ctx.colors.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(typeIcon, color: ctx.colors.accent, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          color: ctx.colors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: _statusColor(status).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          status[0].toUpperCase() + status.substring(1),
                          style: TextStyle(
                            color: _statusColor(status),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(ctx),
                  icon: Icon(
                    Icons.close_rounded,
                    color: ctx.colors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Details rows
            _DetailRow(
              icon: Icons.category_outlined,
              label: 'Type',
              value: typeLabel,
              ctx: ctx,
            ),
            _DetailRow(
              icon: Icons.schedule_outlined,
              label: 'Start',
              value: formatDt(startRaw),
              ctx: ctx,
            ),
            _DetailRow(
              icon: Icons.schedule_outlined,
              label: 'End',
              value: formatDt(endRaw),
              ctx: ctx,
            ),
            if (hostName.isNotEmpty)
              _DetailRow(
                icon: Icons.person_outline,
                label: 'Host',
                value: hostName,
                ctx: ctx,
              ),
            if (participantName.isNotEmpty)
              _DetailRow(
                icon: Icons.person_outline,
                label: 'Participant',
                value: participantName,
                ctx: ctx,
              ),
            if (location.isNotEmpty)
              _DetailRow(
                icon: Icons.location_on_outlined,
                label: 'Location',
                value: location,
                ctx: ctx,
              ),
            if (description.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                'Description',
                style: TextStyle(
                  color: ctx.colors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(color: ctx.colors.textPrimary, fontSize: 14),
              ),
            ],

            const SizedBox(height: 24),

            // Join / Open Link button
            if (meetingUrl.isNotEmpty)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final uri = Uri.tryParse(meetingUrl);
                    if (uri != null && await canLaunchUrl(uri)) {
                      await launchUrl(
                        uri,
                        mode: LaunchMode.externalApplication,
                      );
                    }
                  },
                  icon: const Icon(Icons.videocam_rounded, size: 18),
                  label: const Text('Join Meeting'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            if (meetingUrl.isEmpty &&
                (type == 'video' || type == 'online' || type == 'phone'))
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    final calls = ctx.read<CallProvider>();
                    if (calls.hasCall) return;
                    final calleeName = participantName.isNotEmpty
                        ? participantName
                        : hostName.isNotEmpty
                        ? hostName
                        : title;
                    calls.startOutgoingCall(
                      calleeId:
                          '${meeting['participant_id'] ?? meeting['host_id'] ?? meeting['id'] ?? 'meeting'}',
                      calleeName: calleeName,
                      isVideo: type == 'video' || type == 'online',
                    );
                  },
                  icon: Icon(
                    type == 'phone'
                        ? Icons.call_rounded
                        : Icons.videocam_rounded,
                    size: 18,
                  ),
                  label: Text(
                    type == 'phone' ? 'Start Call' : 'Start Video Call',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    ),
  );
}

Color _statusColor(String s) => switch (s) {
  'scheduled' => AppColors.primary,
  'completed' => Colors.blueGrey,
  'cancelled' => Colors.redAccent,
  'rescheduled' => Colors.orange,
  _ => Colors.grey,
};

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final BuildContext ctx;
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.ctx,
  });

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Row(
      children: [
        Icon(icon, size: 16, color: ctx.colors.textSecondary),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(
            color: ctx.colors.textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(color: ctx.colors.textPrimary, fontSize: 13),
          ),
        ),
      ],
    ),
  );
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
            style: ElevatedButton.styleFrom(
              backgroundColor: context.colors.accent,
            ),
            child: const Text('Retry', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

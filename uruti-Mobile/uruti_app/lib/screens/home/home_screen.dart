import 'dart:async';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../main_scaffold.dart';

// ─── HomeScreen ───────────────────────────────────────────────────────────────
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _loading = true;

  // Shared stats
  List<dynamic> _ventures = [];
  List<dynamic> _connections = [];
  List<dynamic> _pending = [];
  List<dynamic> _notifications = [];
  int _unreadMessages = 0;
  int _pitchSessions = 0;

  // Investor extras
  List<dynamic> _bookmarks = [];

  // Founder extras
  List<dynamic> _upcomingMeetings = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = ApiService.instance;
    final results = await Future.wait([
      api.getMyVentures().catchError((_) => <dynamic>[]),
      api.getConnections(null, 'accepted').catchError((_) => <dynamic>[]),
      api.getConnections(null, 'pending').catchError((_) => <dynamic>[]),
      api.getNotifications().catchError((_) => <dynamic>[]),
      api.getConversations().catchError((_) => <dynamic>[]),
      api.getPitchSessions().catchError((_) => <dynamic>[]),
      _loadBookmarks(),
      api.getMeetings(upcoming: true).catchError((_) => <dynamic>[]),
    ]);

    if (!mounted) return;

    final inbox = results[4];
    setState(() {
      _ventures = results[0];
      _connections = results[1];
      _pending = results[2];
      _notifications = results[3];
      _unreadMessages = inbox
          .where((m) => m['is_read'] == false && m['receiver_id'] != null)
          .length;
      _pitchSessions = results[5].length;
      _bookmarks = results[6];
      _upcomingMeetings = List<dynamic>.from(results[7]).take(5).toList();
      _loading = false;
    });
  }

  Future<List<dynamic>> _loadBookmarks() => ApiService.instance.getBookmarks();

  /// Returns the average Uruti score across the user's ventures.
  /// Returns 0 when there are no ventures so the score card never shows
  /// inflated numbers from profile-completeness bonuses alone.
  int _computeScore(dynamic user) {
    if (_ventures.isEmpty) return 0;
    final scores = _ventures
        .map((v) => (v['uruti_score'] as num?)?.toDouble() ?? 0.0)
        .toList();
    final avg = scores.reduce((a, b) => a + b) / scores.length;
    return avg.round().clamp(0, 100);
  }

  List<Widget> _buildFounderContent({required int score}) => [
    // ── Stat cards ──
    Row(
      children: [
        _FsStatCard(
          icon: Icons.lightbulb_outline,
          label: 'Startup Ideas',
          value: _loading ? '…' : '${_ventures.length}',
          sub: _ventures.isEmpty
              ? 'Start capturing ideas'
              : '${_ventures.length} captured',
        ),
        const SizedBox(width: 10),
        _FsStatCard(
          icon: Icons.trending_up,
          label: 'Pitch Sessions',
          value: _loading ? '…' : '$_pitchSessions',
          sub: _pitchSessions == 0
              ? 'No sessions yet'
              : '$_pitchSessions session${_pitchSessions > 1 ? 's' : ''}',
        ),
        const SizedBox(width: 10),
        _FsStatCard(
          icon: Icons.people_outline,
          label: 'Connections',
          value: _loading ? '…' : '${_connections.length}',
          sub: _connections.isEmpty
              ? 'No connections yet'
              : '${_connections.length} built',
        ),
      ],
    ),
    const SizedBox(height: 16),
    // ── AI Readiness Score ──
    _FsScoreCard(score: score, loading: _loading),
    const SizedBox(height: 16),
    // ── Quick Actions ──
    _sectionTitle(context, 'Quick Actions'),
    const SizedBox(height: 10),
    Row(
      children: [
        _FsQuickAction(
          icon: Icons.lightbulb_outline,
          label: 'Capture\nNew Idea',
          onTap: () => context.go('/ventures'),
        ),
        const SizedBox(width: 10),
        _FsQuickAction(
          icon: Icons.mic_outlined,
          label: 'Start Pitch\nCoach',
          onTap: () => context.go('/coach'),
        ),
        const SizedBox(width: 10),
        _FsQuickAction(
          icon: Icons.person_add_alt_1_outlined,
          label: 'Build a\nConnection',
          onTap: () => context.go('/connections'),
        ),
      ],
    ),
    const SizedBox(height: 20),
    // ── Charts ──
    Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: _FsChartCard(
            title: 'Pitch Performance',
            subtitle: 'Improvement over the last month',
            child: const _FsEmptyChart(
              icon: Icons.trending_up,
              message: 'No pitch data yet. Start a session!',
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _FsChartCard(
            title: 'Investment Readiness',
            subtitle: 'Your startup portfolio status',
            child: _ventures.isEmpty
                ? const _FsEmptyChart(
                    icon: Icons.track_changes_outlined,
                    message: 'Capture your first idea!',
                  )
                : _FsInvestmentPie(ventures: _ventures),
          ),
        ),
      ],
    ),
    const SizedBox(height: 12),
    _FsChartCard(
      title: 'Startup Readiness Score',
      subtitle: 'Readiness scores for your top startups',
      child: _ventures.isEmpty
          ? const _FsEmptyChart(
              icon: Icons.lightbulb_outline,
              message:
                  'No readiness scores yet. Start by capturing your ideas!',
              height: 160,
            )
          : _FsReadinessBar(ventures: _ventures),
    ),
    const SizedBox(height: 20),
    // ── Notifications + Milestones ──
    Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: _FsListCard(
            title: 'Recent Notifications',
            subtitle: 'Latest activities',
            emptyIcon: Icons.notifications_none,
            emptyMsg: 'No notifications yet.',
            items: _notifications,
            itemBuilder: (n) => _FsNotifTile(n: n),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _FsListCard(
            title: 'Upcoming Milestones',
            subtitle: 'Important dates',
            emptyIcon: Icons.calendar_today_outlined,
            emptyMsg: 'No upcoming milestones.',
            items: _upcomingMeetings,
            itemBuilder: (m) => _FsMilestoneTile(m: m),
          ),
        ),
      ],
    ),
    const SizedBox(height: 20),
    // ── CTA ──
    ElevatedButton.icon(
      onPressed: () => context.go('/advisory-tracks'),
      icon: const Icon(Icons.smart_toy_outlined),
      label: const Text('Get AI Recommendations'),
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    const SizedBox(height: 12),
  ];

  List<Widget> _buildInvestorContent({
    required dynamic user,
    required int score,
  }) => [
    _AiScoreCard(score: score, loading: _loading),
    const SizedBox(height: 20),
    _InvestorHome(
      loading: _loading,
      bookmarkCount: _bookmarks.length,
      connectionCount: _connections.length,
      pendingRequests: _pending.length,
    ),
    const SizedBox(height: 20),
    _QuickActions(user: user, unreadMessages: _unreadMessages),
    const SizedBox(height: 20),
    _RecentActivity(loading: _loading, notifications: _notifications),
    const SizedBox(height: 20),
  ];

  List<Widget> _buildMentorContent({
    required dynamic user,
    required int score,
  }) => [
    _AiScoreCard(score: score, loading: _loading),
    const SizedBox(height: 20),
    _MentorHome(loading: _loading, connectionCount: _connections.length),
    const SizedBox(height: 20),
    _QuickActions(user: user, unreadMessages: _unreadMessages),
    const SizedBox(height: 20),
    _RecentActivity(loading: _loading, notifications: _notifications),
    const SizedBox(height: 20),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    if (user == null) return const SizedBox();

    final score = _computeScore(user);

    return Scaffold(
      backgroundColor: context.colors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          setState(() => _loading = true);
          await _load();
        },
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              backgroundColor: context.colors.background,
              floating: true,
              pinned: false,
              automaticallyImplyLeading: false,
              title: Row(
                children: [
                  GestureDetector(
                    onTap: () =>
                        MainScaffold.scaffoldKey.currentState?.openDrawer(),
                    child: Icon(
                      Icons.menu_rounded,
                      color: context.colors.textPrimary,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Image.asset(
                    'assets/images/Uruti-white.png',
                    height: 36,
                    fit: BoxFit.contain,
                  ),
                ],
              ),
              actions: [
                IconButton(
                  icon: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Icon(
                        Icons.notifications_outlined,
                        color: context.colors.textPrimary,
                      ),
                      if (_notifications.any((n) => n['is_read'] == false))
                        Positioned(
                          right: 0,
                          top: 0,
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                    ],
                  ),
                  onPressed: () => context.go('/notifications'),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => context.go('/profile'),
                    child: CircleAvatar(
                      radius: 17,
                      backgroundColor: context.colors.darkGreenMid,
                      backgroundImage: user.resolvedAvatarUrl != null
                          ? NetworkImage(user.resolvedAvatarUrl!)
                          : null,
                      child: user.resolvedAvatarUrl == null
                          ? Text(
                              user.fullName.isNotEmpty
                                  ? user.fullName[0].toUpperCase()
                                  : 'U',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            )
                          : null,
                    ),
                  ),
                ),
              ],
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _WelcomeBanner(user: user),
                  const SizedBox(height: 16),
                  if (user.isFounder)
                    ..._buildFounderContent(score: score)
                  else if (user.isInvestor)
                    ..._buildInvestorContent(user: user, score: score)
                  else if (user.isMentor)
                    ..._buildMentorContent(user: user, score: score)
                  else if (user.isAdmin) ...[
                    const _AdminHome(),
                    const SizedBox(height: 20),
                  ],
                  const SizedBox(height: 80),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── AI Score card ────────────────────────────────────────────────────────────
class _AiScoreCard extends StatelessWidget {
  final int score;
  final bool loading;
  const _AiScoreCard({required this.score, required this.loading});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFF1A3A0A),
            context.colors.darkGreenMid.withValues(alpha: 0.6),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI Readiness Score',
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    loading
                        ? _Shimmer(width: 60, height: 42)
                        : Text(
                            '$score',
                            style: TextStyle(
                              fontSize: 42,
                              fontWeight: FontWeight.w900,
                              color: AppColors.primary,
                            ),
                          ),
                    const SizedBox(width: 4),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Text(
                        '/100',
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ],
                ),
                Text(
                  loading ? '—' : _label(score),
                  style: TextStyle(
                    color: AppColors.primary.withValues(alpha: 0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 80,
            height: 80,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: loading ? 0 : score / 100,
                  backgroundColor: context.colors.divider,
                  color: AppColors.primary,
                  strokeWidth: 6,
                ),
                Text(
                  loading ? '…' : '$score%',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _label(int s) {
    if (s >= 80) return '✓ Investor-ready';
    if (s >= 60) return '↑ Good progress';
    if (s >= 40) return '→ Keep building';
    return '▶ Just getting started';
  }
}

// ─── Founder home ─────────────────────────────────────────────────────────────
// ─── Investor home ────────────────────────────────────────────────────────────
class _InvestorHome extends StatelessWidget {
  final bool loading;
  final int bookmarkCount;
  final int connectionCount;
  final int pendingRequests;
  const _InvestorHome({
    required this.loading,
    required this.bookmarkCount,
    required this.connectionCount,
    required this.pendingRequests,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(context, 'Investor Overview'),
        const SizedBox(height: 12),
        Row(
          children: [
            _StatCard(
              'Bookmarked\nStartups',
              loading ? '—' : '$bookmarkCount',
              Icons.bookmark_outline,
              AppColors.primary,
            ),
            const SizedBox(width: 12),
            _StatCard(
              'Connections',
              loading ? '—' : '$connectionCount',
              Icons.people_outline,
              const Color(0xFF3B82F6),
            ),
            const SizedBox(width: 12),
            _StatCard(
              'Pending\nRequests',
              loading ? '—' : '$pendingRequests',
              Icons.pending_outlined,
              const Color(0xFFFFB800),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _ActionCard(
          'Discover Startups',
          'Browse vetted startups matching your focus',
          Icons.explore_outlined,
          onTap: () => context.go('/discovery'),
        ),
      ],
    );
  }
}

// ─── Mentor home ──────────────────────────────────────────────────────────────
class _MentorHome extends StatelessWidget {
  final bool loading;
  final int connectionCount;
  const _MentorHome({required this.loading, required this.connectionCount});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(context, 'Mentorship Overview'),
        const SizedBox(height: 12),
        Row(
          children: [
            _StatCard(
              'Active\nConnections',
              loading ? '—' : '$connectionCount',
              Icons.people_outline,
              AppColors.primary,
            ),
            const SizedBox(width: 12),
            _StatCard(
              'Advisory\nTracks',
              '—',
              Icons.track_changes,
              const Color(0xFF3B82F6),
            ),
            const SizedBox(width: 12),
            _StatCard(
              'AI\nSessions',
              '—',
              Icons.smart_toy_outlined,
              const Color(0xFFFFB800),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _ActionCard(
          'Advisory Tracks',
          'Review and update mentee advisory plans',
          Icons.track_changes,
          onTap: () => context.go('/advisory-tracks'),
        ),
      ],
    );
  }
}

// ─── Admin home ───────────────────────────────────────────────────────────────
class _AdminHome extends StatelessWidget {
  const _AdminHome();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(context, 'Platform Overview'),
        const SizedBox(height: 12),
        Row(
          children: [
            _StatCard(
              'Users',
              '—',
              Icons.people_alt_outlined,
              AppColors.primary,
            ),
            const SizedBox(width: 12),
            _StatCard(
              'Active\nToday',
              '—',
              Icons.online_prediction,
              const Color(0xFF3B82F6),
            ),
            const SizedBox(width: 12),
            _StatCard(
              'New This\nWeek',
              '—',
              Icons.person_add_outlined,
              const Color(0xFFFFB800),
            ),
          ],
        ),
      ],
    );
  }
}

// ─── Welcome banner ──────────────────────────────────────────────────────────
class _WelcomeBanner extends StatelessWidget {
  final dynamic user;
  const _WelcomeBanner({required this.user});

  @override
  Widget build(BuildContext context) {
    final name = (user?.fullName as String? ?? 'there').split(' ').first;
    final role = user?.role as String? ?? '';
    final subtitle = role == 'founder'
        ? 'Ready to grow your startup today?'
        : role == 'investor'
        ? 'Discover your next great investment.'
        : role == 'mentor'
        ? 'Your mentees are counting on you.'
        : 'Ready to start your entrepreneurial journey?';
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome, $name! 👋',
            style: TextStyle(
              color: context.colors.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
class _QuickActions extends StatelessWidget {
  final dynamic user;
  final int unreadMessages;
  const _QuickActions({required this.user, required this.unreadMessages});

  @override
  Widget build(BuildContext context) {
    final actions = [
      {
        'icon': Icons.lightbulb_outline,
        'label': 'Capture New Idea',
        'sublabel': 'Log a startup concept',
        'route': '/profile',
      },
      {
        'icon': Icons.mic_none,
        'label': 'Start Pitch Coach',
        'sublabel': 'Practice your pitch with AI',
        'route': '/coach',
      },
      {
        'icon': Icons.people_outline,
        'label': 'Build a Connection',
        'sublabel': 'Grow your network',
        'route': '/connections',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(context, 'Quick Actions'),
        const SizedBox(height: 12),
        ...actions.map(
          (a) => _ActionTile(
            icon: a['icon'] as IconData,
            label: a['label'] as String,
            sublabel: a['sublabel'] as String,
            onTap: () => context.go(a['route'] as String),
          ),
        ),
      ],
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;
  final VoidCallback onTap;
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.25),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.primary, size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sublabel,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              color: context.colors.textSecondary,
              size: 14,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Recent Activity ──────────────────────────────────────────────────────────
class _RecentActivity extends StatelessWidget {
  final bool loading;
  final List<dynamic> notifications;

  const _RecentActivity({required this.loading, required this.notifications});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(context, 'Recent Activity'),
        const SizedBox(height: 12),
        if (loading)
          ...List.generate(
            3,
            (_) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              child: _Shimmer(width: double.infinity, height: 58),
            ),
          )
        else if (notifications.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Text(
                'No recent activity yet',
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 14,
                ),
              ),
            ),
          )
        else
          ...notifications.take(5).map((n) {
            final type = n['type'] as String? ?? 'info';
            final IconData icon;
            final Color color;
            switch (type) {
              case 'connection_request':
                icon = Icons.person_add_outlined;
                color = const Color(0xFF3B82F6);
                break;
              case 'connection_accepted':
                icon = Icons.people;
                color = AppColors.primary;
                break;
              case 'message':
                icon = Icons.chat_bubble_outline;
                color = const Color(0xFF8B5CF6);
                break;
              case 'pitch':
                icon = Icons.mic;
                color = AppColors.primary;
                break;
              default:
                icon = Icons.notifications_outlined;
                color = const Color(0xFFFFB800);
            }
            final createdAt = n['created_at'] as String?;
            final timeAgo = _timeAgo(createdAt);
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: n['is_read'] == true
                      ? context.colors.divider
                      : AppColors.primary.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, color: color, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      n['message'] as String? ??
                          n['title'] as String? ??
                          'Notification',
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontSize: 13,
                        fontWeight: n['is_read'] == true
                            ? FontWeight.normal
                            : FontWeight.w600,
                      ),
                    ),
                  ),
                  Text(
                    timeAgo,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  String _timeAgo(String? iso) {
    if (iso == null) return '';
    try {
      final dt = DateTime.parse(iso).toLocal();
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${dt.day}/${dt.month}';
    } catch (_) {
      return '';
    }
  }
}

// ─── Shimmer placeholder ──────────────────────────────────────────────────────
class _Shimmer extends StatelessWidget {
  final double width, height;
  const _Shimmer({required this.width, required this.height});

  @override
  Widget build(BuildContext context) => Container(
    width: width,
    height: height,
    decoration: BoxDecoration(
      color: context.colors.divider.withValues(alpha: 0.5),
      borderRadius: BorderRadius.circular(8),
    ),
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
Widget _sectionTitle(BuildContext context, String title) => Text(
  title,
  style: TextStyle(
    color: context.colors.textPrimary,
    fontWeight: FontWeight.w700,
    fontSize: 16,
  ),
);

class _StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatCard(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w800,
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 11),
          ),
        ],
      ),
    ),
  );
}

class _ActionCard extends StatelessWidget {
  final String title, subtitle;
  final IconData icon;
  final VoidCallback onTap;
  const _ActionCard(
    this.title,
    this.subtitle,
    this.icon, {
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 14),
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
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: AppColors.primary, size: 20),
        ],
      ),
    ),
  );
}

// ─── FounderSnapshot widgets (embedded in home for founders) ─────────────────

class _FsStatCard extends StatelessWidget {
  final IconData icon;
  final String label, value, sub;
  const _FsStatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.sub,
  });

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Icon(icon, color: AppColors.primary, size: 14),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w800,
              fontSize: 22,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            sub,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 9),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    ),
  );
}

class _FsScoreCard extends StatelessWidget {
  final int score;
  final bool loading;
  const _FsScoreCard({required this.score, required this.loading});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF1A3A0A), Color(0xFF0D2010)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'AI Readiness Score',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 4),
              loading
                  ? const SizedBox(
                      height: 48,
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: CircularProgressIndicator(
                          color: AppColors.primary,
                          strokeWidth: 2,
                        ),
                      ),
                    )
                  : Text(
                      '$score',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 48,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
              Text(
                score >= 80
                    ? 'Top 15% of Founders'
                    : score >= 60
                    ? 'Above Average'
                    : 'Keep growing!',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.6),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          ),
          child: Column(
            children: [
              Icon(
                Icons.psychology_outlined,
                color: AppColors.primary,
                size: 32,
              ),
              const SizedBox(height: 4),
              Text(
                'Uruti AI',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.8),
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _FsQuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _FsQuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 26),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: context.colors.textPrimary,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _FsChartCard extends StatelessWidget {
  final String title, subtitle;
  final Widget child;
  const _FsChartCard({
    required this.title,
    required this.subtitle,
    required this.child,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: context.colors.card,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: context.colors.divider),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          subtitle,
          style: TextStyle(color: context.colors.textSecondary, fontSize: 10),
        ),
        const SizedBox(height: 12),
        child,
      ],
    ),
  );
}

class _FsEmptyChart extends StatelessWidget {
  final IconData icon;
  final String message;
  final double height;
  const _FsEmptyChart({
    required this.icon,
    required this.message,
    this.height = 130,
  });

  @override
  Widget build(BuildContext context) => SizedBox(
    height: height,
    child: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            color: context.colors.textSecondary.withValues(alpha: 0.4),
            size: 32,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 11),
          ),
        ],
      ),
    ),
  );
}

class _FsInvestmentPie extends StatelessWidget {
  final List<dynamic> ventures;
  const _FsInvestmentPie({required this.ventures});

  @override
  Widget build(BuildContext context) {
    int ready = 0, developing = 0, early = 0;
    for (final v in ventures) {
      final score =
          (v['investment_readiness_score'] as num?)?.toDouble() ?? 0.0;
      if (score >= 70)
        ready++;
      else if (score >= 40)
        developing++;
      else
        early++;
    }
    final total = ready + developing + early;
    if (total == 0)
      return const _FsEmptyChart(
        icon: Icons.pie_chart_outline,
        message: 'No data',
        height: 130,
      );

    return SizedBox(
      height: 130,
      child: Column(
        children: [
          Expanded(
            child: PieChart(
              PieChartData(
                sections: [
                  if (ready > 0)
                    PieChartSectionData(
                      value: ready.toDouble(),
                      color: AppColors.primary,
                      title: '$ready',
                      radius: 44,
                      titleStyle: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  if (developing > 0)
                    PieChartSectionData(
                      value: developing.toDouble(),
                      color: const Color(0xFF3B82F6),
                      title: '$developing',
                      radius: 44,
                      titleStyle: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  if (early > 0)
                    PieChartSectionData(
                      value: early.toDouble(),
                      color: const Color(0xFFFFB800),
                      title: '$early',
                      radius: 44,
                      titleStyle: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                ],
                centerSpaceRadius: 20,
                sectionsSpace: 2,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _FsLegend(color: AppColors.primary, label: 'Ready'),
              const SizedBox(width: 8),
              _FsLegend(color: const Color(0xFF3B82F6), label: 'Dev'),
              const SizedBox(width: 8),
              _FsLegend(color: const Color(0xFFFFB800), label: 'Early'),
            ],
          ),
        ],
      ),
    );
  }
}

class _FsLegend extends StatelessWidget {
  final Color color;
  final String label;
  const _FsLegend({required this.color, required this.label});

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
      const SizedBox(width: 4),
      Text(
        label,
        style: TextStyle(color: context.colors.textSecondary, fontSize: 9),
      ),
    ],
  );
}

class _FsReadinessBar extends StatelessWidget {
  final List<dynamic> ventures;
  const _FsReadinessBar({required this.ventures});

  @override
  Widget build(BuildContext context) {
    final top = ventures.take(5).toList();
    return SizedBox(
      height: 160,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: 100,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 25,
            getDrawingHorizontalLine: (_) =>
                FlLine(color: context.colors.divider, strokeWidth: 1),
          ),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 28,
                getTitlesWidget: (v, _) => Text(
                  '${v.toInt()}',
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 9,
                  ),
                ),
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 22,
                getTitlesWidget: (v, _) {
                  final idx = v.toInt();
                  if (idx < 0 || idx >= top.length)
                    return const SizedBox.shrink();
                  final name = (top[idx]['name'] as String? ?? 'V${idx + 1}');
                  final short = name.length > 6 ? name.substring(0, 6) : name;
                  return Text(
                    short,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 9,
                    ),
                  );
                },
              ),
            ),
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
          ),
          barGroups: List.generate(top.length, (i) {
            final score =
                (top[i]['investment_readiness_score'] as num?)?.toDouble() ??
                0.0;
            return BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: score,
                  color: AppColors.primary,
                  width: 16,
                  borderRadius: BorderRadius.circular(4),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }
}

class _FsListCard extends StatelessWidget {
  final String title, subtitle, emptyMsg;
  final IconData emptyIcon;
  final List<dynamic> items;
  final Widget Function(dynamic) itemBuilder;
  const _FsListCard({
    required this.title,
    required this.subtitle,
    required this.emptyIcon,
    required this.emptyMsg,
    required this.items,
    required this.itemBuilder,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: context.colors.card,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: context.colors.divider),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          subtitle,
          style: TextStyle(color: context.colors.textSecondary, fontSize: 10),
        ),
        const SizedBox(height: 10),
        if (items.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                Icon(
                  emptyIcon,
                  color: context.colors.textSecondary.withValues(alpha: 0.4),
                  size: 28,
                ),
                const SizedBox(height: 6),
                Text(
                  emptyMsg,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          )
        else
          ...items.map(itemBuilder),
      ],
    ),
  );
}

class _FsNotifTile extends StatelessWidget {
  final dynamic n;
  const _FsNotifTile({required this.n});

  @override
  Widget build(BuildContext context) {
    final type = n['type'] as String? ?? 'info';
    final Color dot = switch (type) {
      'connection_request' => const Color(0xFF3B82F6),
      'connection_accepted' => AppColors.primary,
      'message' => const Color(0xFF8B5CF6),
      _ => const Color(0xFFFFB800),
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(color: dot, shape: BoxShape.circle),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  n['message'] as String? ??
                      n['title'] as String? ??
                      'Notification',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontSize: 11,
                    fontWeight: n['is_read'] == true
                        ? FontWeight.normal
                        : FontWeight.w600,
                  ),
                ),
                Text(
                  _fsTimeAgo(n['created_at'] as String?),
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 9,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FsMilestoneTile extends StatelessWidget {
  final dynamic m;
  const _FsMilestoneTile({required this.m});

  @override
  Widget build(BuildContext context) {
    final title = m['title'] as String? ?? 'Meeting';
    final date = m['scheduled_at'] as String? ?? m['date'] as String?;
    String formatted = '';
    if (date != null) {
      try {
        final dt = DateTime.parse(date).toLocal();
        formatted =
            '${dt.day}/${dt.month} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      } catch (_) {}
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.calendar_today_outlined,
            color: AppColors.primary,
            size: 14,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (formatted.isNotEmpty)
                  Text(
                    formatted,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 9,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

String _fsTimeAgo(String? iso) {
  if (iso == null) return '';
  try {
    final dt = DateTime.parse(iso).toLocal();
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  } catch (_) {
    return '';
  }
}

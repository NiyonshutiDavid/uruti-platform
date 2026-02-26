import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../screens/main_scaffold.dart';

class FounderSnapshotScreen extends StatefulWidget {
  const FounderSnapshotScreen({super.key});
  @override
  State<FounderSnapshotScreen> createState() => _FounderSnapshotScreenState();
}

class _FounderSnapshotScreenState extends State<FounderSnapshotScreen> {
  int _venturesCount = 0;
  int _sessionsCount = 0;
  int _connectionsCount = 0;
  List<dynamic> _ventures = [];
  List<dynamic> _notifications = [];
  List<dynamic> _upcomingMeetings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        ApiService.instance.getMyVentures(),
        ApiService.instance.getPitchSessions(),
        ApiService.instance.getConnections(),
        ApiService.instance.getNotifications(),
        ApiService.instance.getMeetings(upcoming: true),
      ]);
      if (!mounted) return;
      setState(() {
        _ventures = results[0];
        _venturesCount = _ventures.length;
        _sessionsCount = results[1].length;
        _connectionsCount = results[2].length;
        _notifications = results[3].take(5).toList();
        _upcomingMeetings = results[4].take(5).toList();
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final score = user?.uritiScore.round() ?? 0;
    final displayName = user?.firstName ?? user?.displayNameOrFull ?? 'Founder';

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Founder Snapshot',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _load,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Welcome ────────────────────────────────────────────────
              _WelcomeCard(name: displayName),
              const SizedBox(height: 16),

              // ── Key Stats ──────────────────────────────────────────────
              Row(
                children: [
                  _StatCard(
                    icon: Icons.lightbulb_outline,
                    label: 'Startup Ideas',
                    value: _loading ? '...' : '$_venturesCount',
                    sub: _venturesCount == 0
                        ? 'Start capturing ideas'
                        : '$_venturesCount idea${_venturesCount > 1 ? 's' : ''} captured',
                  ),
                  const SizedBox(width: 12),
                  _StatCard(
                    icon: Icons.trending_up,
                    label: 'Pitch Sessions',
                    value: _loading ? '...' : '$_sessionsCount',
                    sub: _sessionsCount == 0
                        ? 'No active sessions yet'
                        : '$_sessionsCount session${_sessionsCount > 1 ? 's' : ''}',
                  ),
                  const SizedBox(width: 12),
                  _StatCard(
                    icon: Icons.people_outline,
                    label: 'Connections',
                    value: _loading ? '...' : '$_connectionsCount',
                    sub: _connectionsCount == 0
                        ? 'No connections yet'
                        : '$_connectionsCount built',
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ── AI Readiness Score ─────────────────────────────────────
              _ScoreCard(score: score, loading: _loading),
              const SizedBox(height: 16),

              // ── Quick Actions ──────────────────────────────────────────
              _sectionTitle(
                context,
                'Quick Actions',
                subtitle: 'Fast track your startup development',
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _QuickAction(
                    icon: Icons.lightbulb_outline,
                    label: 'Capture\nNew Idea',
                    onTap: () => context.go('/venture-hub'),
                  ),
                  const SizedBox(width: 10),
                  _QuickAction(
                    icon: Icons.mic_outlined,
                    label: 'Start Pitch\nCoach',
                    onTap: () => context.go('/pitch-sessions'),
                  ),
                  const SizedBox(width: 10),
                  _QuickAction(
                    icon: Icons.person_add_alt_1_outlined,
                    label: 'Build a\nConnection',
                    onTap: () => context.go('/connections'),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // ── Charts row ────────────────────────────────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _ChartCard(
                      title: 'Pitch Performance Trend',
                      subtitle: 'Your improvement over the last month',
                      child: const _EmptyChart(
                        icon: Icons.trending_up,
                        message:
                            'No pitch performance data yet. Start your first pitch session!',
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ChartCard(
                      title: 'Investment Readiness',
                      subtitle: 'Current status of your startup portfolio',
                      child: _ventures.isEmpty
                          ? const _EmptyChart(
                              icon: Icons.track_changes_outlined,
                              message:
                                  'No startup data yet. Capture your first idea!',
                            )
                          : _InvestmentReadinessPie(ventures: _ventures),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // ── Startup Readiness Bar Chart ───────────────────────────
              _ChartCard(
                title: 'Startup Readiness Score',
                subtitle: 'Readiness scores for your top startups',
                child: _ventures.isEmpty
                    ? const _EmptyChart(
                        icon: Icons.lightbulb_outline,
                        message:
                            'No startup readiness scores yet. Start by capturing your ideas!',
                        height: 160,
                      )
                    : _ReadinessBarChart(ventures: _ventures),
              ),
              const SizedBox(height: 20),

              // ── Notifications + Milestones ────────────────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _ListCard(
                      title: 'Recent Notifications',
                      subtitle: 'Stay updated with your latest activities',
                      emptyIcon: Icons.notifications_none,
                      emptyMsg:
                          'No recent notifications. Start using the platform!',
                      items: _notifications,
                      itemBuilder: (n) => _NotificationTile(n: n),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ListCard(
                      title: 'Upcoming Milestones',
                      subtitle: 'Track your important dates',
                      emptyIcon: Icons.calendar_today_outlined,
                      emptyMsg: 'No upcoming milestones yet.',
                      items: _upcomingMeetings,
                      itemBuilder: (m) => _MilestoneTile(m: m),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // ── CTA ───────────────────────────────────────────────────
              ElevatedButton.icon(
                onPressed: () => context.go('/advisory-tracks'),
                icon: const Icon(Icons.smart_toy_outlined),
                label: const Text('Get AI Recommendations'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

Widget _sectionTitle(BuildContext context, String title, {String? subtitle}) =>
    Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 16,
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 12),
          ),
        ],
      ],
    );

String _timeAgo(String? iso) {
  if (iso == null) return '';
  try {
    final dt = DateTime.parse(iso);
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  } catch (_) {
    return '';
  }
}

// ─── Widgets ──────────────────────────────────────────────────────────────────

class _WelcomeCard extends StatelessWidget {
  final String name;
  const _WelcomeCard({required this.name});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: context.colors.card,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: context.colors.divider),
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome, $name! 👋',
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Ready to start your entrepreneurial journey?',
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(Icons.auto_awesome, color: AppColors.primary, size: 28),
        ),
      ],
    ),
  );
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label, value, sub;
  const _StatCard({
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

class _ScoreCard extends StatelessWidget {
  final int score;
  final bool loading;
  const _ScoreCard({required this.score, required this.loading});

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

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickAction({
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

class _ChartCard extends StatelessWidget {
  final String title, subtitle;
  final Widget child;
  const _ChartCard({
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

class _EmptyChart extends StatelessWidget {
  final IconData icon;
  final String message;
  final double height;
  const _EmptyChart({
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
          Icon(icon, size: 36, color: context.colors.textSecondary),
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

class _InvestmentReadinessPie extends StatelessWidget {
  final List<dynamic> ventures;
  const _InvestmentReadinessPie({required this.ventures});

  @override
  Widget build(BuildContext context) {
    int ready = 0, developing = 0, early = 0;
    for (final v in ventures) {
      final score = (v['investment_readiness_score'] as num?)?.toDouble() ?? 0;
      if (score >= 70) {
        ready++;
      } else if (score >= 40) {
        developing++;
      } else {
        early++;
      }
    }
    final sections = <PieChartSectionData>[
      if (ready > 0)
        PieChartSectionData(
          value: ready.toDouble(),
          color: AppColors.primary,
          title: '$ready',
          radius: 38,
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
          radius: 38,
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
          radius: 38,
          titleStyle: const TextStyle(
            color: Colors.white,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
    ];
    if (sections.isEmpty) {
      return const _EmptyChart(
        icon: Icons.track_changes_outlined,
        message: 'No readiness data available.',
      );
    }
    return SizedBox(
      height: 130,
      child: Column(
        children: [
          SizedBox(
            height: 90,
            child: PieChart(PieChartData(sections: sections)),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            children: [
              if (ready > 0) _Legend(color: AppColors.primary, label: 'Ready'),
              if (developing > 0)
                _Legend(color: const Color(0xFF3B82F6), label: 'Developing'),
              if (early > 0)
                _Legend(color: const Color(0xFFFFB800), label: 'Early'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  const _Legend({required this.color, required this.label});

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

class _ReadinessBarChart extends StatelessWidget {
  final List<dynamic> ventures;
  const _ReadinessBarChart({required this.ventures});

  @override
  Widget build(BuildContext context) {
    final top = ventures.take(5).toList();
    final groups = top.asMap().entries.map((e) {
      final score =
          (e.value['investment_readiness_score'] as num?)?.toDouble() ?? 0;
      return BarChartGroupData(
        x: e.key,
        barRods: [
          BarChartRodData(
            toY: score,
            color: AppColors.primary,
            width: 14,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
          ),
        ],
      );
    }).toList();

    return SizedBox(
      height: 160,
      child: BarChart(
        BarChartData(
          maxY: 100,
          barGroups: groups,
          borderData: FlBorderData(show: false),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 25,
            getDrawingHorizontalLine: (v) =>
                FlLine(color: context.colors.divider, strokeWidth: 1),
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: 25,
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
                getTitlesWidget: (v, _) {
                  final idx = v.toInt();
                  if (idx >= top.length) return const SizedBox();
                  final name =
                      (top[idx]['startup_name'] ??
                              top[idx]['name'] ??
                              'S${idx + 1}')
                          as String;
                  return Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      name.length > 6 ? '${name.substring(0, 6)}…' : name,
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 9,
                      ),
                    ),
                  );
                },
              ),
            ),
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
          ),
        ),
      ),
    );
  }
}

class _ListCard extends StatelessWidget {
  final String title, subtitle, emptyMsg;
  final IconData emptyIcon;
  final List<dynamic> items;
  final Widget Function(dynamic) itemBuilder;
  const _ListCard({
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
            child: Center(
              child: Column(
                children: [
                  Icon(
                    emptyIcon,
                    size: 28,
                    color: context.colors.textSecondary,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    emptyMsg,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ...items.map(itemBuilder),
      ],
    ),
  );
}

class _NotificationTile extends StatelessWidget {
  final dynamic n;
  const _NotificationTile({required this.n});

  @override
  Widget build(BuildContext context) {
    final type = n['type'] as String? ?? 'info';
    final dotColor = type == 'success'
        ? AppColors.primary
        : type == 'warning'
        ? const Color(0xFFFFB800)
        : const Color(0xFF3B82F6);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  n['message'] as String? ?? '',
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontSize: 11,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  _timeAgo(n['created_at'] as String?),
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

class _MilestoneTile extends StatelessWidget {
  final dynamic m;
  const _MilestoneTile({required this.m});

  String _monthShort(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month - 1];
  }

  @override
  Widget build(BuildContext context) {
    final title = m['title'] as String? ?? m['subject'] as String? ?? 'Meeting';
    final date = m['scheduled_at'] as String? ?? m['date'] as String?;
    final formatted = date != null
        ? (() {
            try {
              final dt = DateTime.parse(date);
              return '${_monthShort(dt.month)} ${dt.day}, ${dt.year}';
            } catch (_) {
              return date;
            }
          })()
        : '';
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.calendar_today_outlined,
              color: AppColors.primary,
              size: 14,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
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
          Icon(
            Icons.chevron_right,
            color: context.colors.textSecondary,
            size: 14,
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';
import '../../services/api_service.dart';

class StartupLeaderboardScreen extends StatefulWidget {
  const StartupLeaderboardScreen({super.key});
  @override
  State<StartupLeaderboardScreen> createState() =>
      _StartupLeaderboardScreenState();
}

class _StartupLeaderboardScreenState extends State<StartupLeaderboardScreen> {
  List<Map<String, dynamic>> _startups = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiService.instance.getVentures(limit: 300);
      final ventures = data
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();

      if (mounted) {
        ventures.sort(
          (a, b) => ((b['uruti_score'] as num?)?.toDouble() ?? 0.0).compareTo(
            (a['uruti_score'] as num?)?.toDouble() ?? 0.0,
          ),
        );
        setState(() {
          _startups = ventures;
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
        backgroundColor: context.colors.appBarBg,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: Text(
          'Leaderboard',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.explore_outlined,
              color: Colors.white,
            ),
            onPressed: () => context.go('/discovery'),
          ),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: context.colors.accent))
          : Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 40,
                        child: Text(
                          'Rank',
                          style: TextStyle(
                            color: context.colors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Startup',
                          style: TextStyle(
                            color: context.colors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                      ),
                      Text(
                        'Score',
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _startups.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) =>
                        _LeaderboardRow(data: _startups[i], rank: i + 1),
                  ),
                ),
              ],
            ),
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  final Map<String, dynamic> data;
  final int rank;
  const _LeaderboardRow({required this.data, required this.rank});

  Color _rankColor(BuildContext context) => rank == 1
      ? const Color(0xFFFFD700)
      : rank == 2
      ? const Color(0xFFC0C0C0)
      : rank == 3
      ? const Color(0xFFCD7F32)
      : context.colors.textSecondary;

  @override
  Widget build(BuildContext context) {
    final name =
        data['name'] as String? ?? data['company'] as String? ?? 'Startup';
    final score = ((data['uruti_score'] as num?)?.toDouble() ?? 0).round();
    final sector = data['industry'] as String? ?? '';
    final stage = data['stage'] as String? ?? '';
    final risk = score > 80
        ? 'Low'
        : score > 60
        ? 'Medium'
        : 'High';
    final riskColor = score > 80
        ? context.colors.accent
        : score > 60
        ? const Color(0xFFFFB800)
        : AppColors.error;
    final logo = data['logo_url'] as String?;
    final initials = name
        .split(' ')
        .map((e) => e[0])
        .take(2)
        .join()
        .toUpperCase();
    final founderId = (data['founder_id'] as num?)?.toInt();

    return GestureDetector(
      onTap: founderId == null
          ? null
          : () => context.go('/profile/view/$founderId'),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: rank <= 3
                ? _rankColor(context).withValues(alpha: 0.3)
                : context.colors.divider,
          ),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 28,
              child: Text(
                '#$rank',
                style: TextStyle(
                  color: _rankColor(context),
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: context.colors.darkGreenMid,
                borderRadius: BorderRadius.circular(10),
                image: logo != null
                    ? DecorationImage(
                        image: NetworkImage(logo),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: logo == null
                  ? Center(
                      child: Text(
                        initials,
                        style: TextStyle(
                          color: context.colors.accent,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: TextStyle(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$sector · $stage',
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: riskColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: riskColor.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Text(
                          'Risk: $risk',
                          style: TextStyle(
                            color: riskColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '$score',
                  style: TextStyle(
                    color: context.colors.accent,
                    fontWeight: FontWeight.w900,
                    fontSize: 22,
                  ),
                ),
                Row(
                  children: [
                    Icon(
                      Icons.arrow_upward,
                      color: context.colors.accent,
                      size: 12,
                    ),
                    Text(
                      'Uruti',
                      style: TextStyle(color: context.colors.accent, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

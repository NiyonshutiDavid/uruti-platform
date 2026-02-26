import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class StartupLeaderboardScreen extends StatefulWidget {
  const StartupLeaderboardScreen({super.key});
  @override
  State<StartupLeaderboardScreen> createState() =>
      _StartupLeaderboardScreenState();
}

class _StartupLeaderboardScreenState extends State<StartupLeaderboardScreen> {
  List _startups = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final token = context.read<AuthProvider>().token ?? '';
      final data = await ApiService.instance.getDiscoverUsers(token);
      if (mounted) {
        data.sort(
          (a, b) =>
              ((b['readiness_score'] as int? ?? 0) -
              (a['readiness_score'] as int? ?? 0)),
        );
        setState(() {
          _startups = data;
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
          icon: Icon(Icons.arrow_back, color: context.colors.textPrimary),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: Text(
          'Leaderboard',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.explore_outlined,
              color: context.colors.textPrimary,
            ),
            onPressed: () => context.go('/discovery'),
          ),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: AppColors.primary))
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
                    itemBuilder: (_, i) => _LeaderboardRow(
                      data: _startups[i] as Map<String, dynamic>,
                      rank: i + 1,
                    ),
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
        data['full_name'] as String? ?? data['company'] as String? ?? 'Startup';
    final score = data['readiness_score'] as int? ?? 0;
    final sector = data['industry'] as String? ?? '';
    final stage = data['stage'] as String? ?? '';
    final risk = score > 80
        ? 'Low'
        : score > 60
        ? 'Medium'
        : 'High';
    final riskColor = score > 80
        ? AppColors.primary
        : score > 60
        ? const Color(0xFFFFB800)
        : AppColors.error;
    final logo = data['avatar_url'] as String?;
    final initials = name
        .split(' ')
        .map((e) => e[0])
        .take(2)
        .join()
        .toUpperCase();

    return GestureDetector(
      onTap: () => context.go('/profile/${data['id']}'),
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
                          color: AppColors.primary,
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
                    color: AppColors.primary,
                    fontWeight: FontWeight.w900,
                    fontSize: 22,
                  ),
                ),
                Row(
                  children: [
                    Icon(
                      Icons.arrow_upward,
                      color: AppColors.primary,
                      size: 12,
                    ),
                    Text(
                      '+5',
                      style: TextStyle(color: AppColors.primary, fontSize: 11),
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

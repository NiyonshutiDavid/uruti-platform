import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../screens/main_scaffold.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});
  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  int _totalSessions = 0;
  double _avgScore = 0;
  double _bestScore = 0;
  int _connectionsCount = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        ApiService.instance.getPitchSessions(),
        ApiService.instance.getConnections(),
      ]);
      if (!mounted) return;
      final sessions = List<Map<String, dynamic>>.from(results[0]);
      final scores = sessions
          .map((s) => (s['overall_score'] as num?)?.toDouble() ?? 0.0)
          .where((v) => v > 0)
          .toList();
      setState(() {
        _totalSessions = sessions.length;
        _avgScore = scores.isEmpty
            ? 0
            : scores.reduce((a, b) => a + b) / scores.length;
        _bestScore = scores.isEmpty
            ? 0
            : scores.reduce((a, b) => a > b ? a : b);
        _connectionsCount = results[1].length;
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

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Analytics',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionTitle(context, 'Score Over Time'),
            const SizedBox(height: 12),
            Container(
              height: 160,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.colors.divider),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        _loading ? '—' : '$score',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w900,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.arrow_upward,
                              color: AppColors.primary,
                              size: 12,
                            ),
                            Text(
                              'Current score',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children:
                          [72, 68, 74, 78, 75, 80, 82, score.clamp(1, 100)]
                              .asMap()
                              .entries
                              .map(
                                (e) => Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 2,
                                    ),
                                    child: FractionallySizedBox(
                                      heightFactor: e.value / 100,
                                      alignment: Alignment.bottomCenter,
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: e.key == 7
                                              ? AppColors.primary
                                              : AppColors.primary.withValues(
                                                  alpha: 0.3,
                                                ),
                                          borderRadius:
                                              const BorderRadius.vertical(
                                                top: Radius.circular(4),
                                              ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              )
                              .toList(),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children:
                        ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Now']
                            .map(
                              (m) => Expanded(
                                child: Text(
                                  m,
                                  style: TextStyle(
                                    color: context.colors.textSecondary,
                                    fontSize: 8,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            )
                            .toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            _sectionTitle(context, 'Pitch Sessions'),
            const SizedBox(height: 12),
            Row(
              children: [
                _NumCard('Total', _loading ? '—' : '$_totalSessions'),
                const SizedBox(width: 12),
                _NumCard(
                  'Avg Score',
                  _loading ? '—' : _avgScore.toStringAsFixed(0),
                ),
                const SizedBox(width: 12),
                _NumCard(
                  'Best',
                  _loading ? '—' : _bestScore.toStringAsFixed(0),
                ),
              ],
            ),
            const SizedBox(height: 24),

            _sectionTitle(context, 'Network'),
            const SizedBox(height: 12),
            Row(
              children: [
                _NumCard('Connections', _loading ? '—' : '$_connectionsCount'),
                const SizedBox(width: 12),
                _NumCard('Ventures', '—'),
                const SizedBox(width: 12),
                _NumCard('Score', _loading ? '—' : '$score'),
              ],
            ),
            const SizedBox(height: 24),

            _sectionTitle(context, 'Weekly Activity'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.colors.divider),
              ),
              child: Column(
                children: [
                  ...[
                    ('Mon', 3),
                    ('Tue', 5),
                    ('Wed', 2),
                    ('Thu', 7),
                    ('Fri', 4),
                    ('Sat', 1),
                    ('Sun', 6),
                  ].map(
                    (e) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 36,
                            child: Text(
                              e.$1,
                              style: TextStyle(
                                color: context.colors.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: e.$2 / 10,
                                backgroundColor: context.colors.divider,
                                color: AppColors.primary,
                                minHeight: 10,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${e.$2}',
                            style: TextStyle(
                              color: context.colors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

Widget _sectionTitle(BuildContext context, String t) => Text(
  t,
  style: TextStyle(
    color: context.colors.textPrimary,
    fontWeight: FontWeight.w700,
    fontSize: 16,
  ),
);

class _NumCard extends StatelessWidget {
  final String label, value;
  const _NumCard(this.label, this.value);
  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.divider),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w900,
              fontSize: 22,
            ),
          ),
          Text(
            label,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 11),
          ),
        ],
      ),
    ),
  );
}

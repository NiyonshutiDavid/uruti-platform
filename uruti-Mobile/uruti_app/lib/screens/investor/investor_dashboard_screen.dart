import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';
import '../../screens/main_scaffold.dart';

class InvestorDashboardScreen extends StatelessWidget {
  const InvestorDashboardScreen({super.key});

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
          'Investor Dashboard',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => context.go('/deal-flow'),
            child: Text(
              'Deal Flow',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Portfolio stats
            Row(
              children: [
                _CardStat(
                  'Portfolio',
                  '3',
                  Icons.business_center_outlined,
                  AppColors.primary,
                ),
                const SizedBox(width: 12),
                _CardStat(
                  'Total Invested',
                  'USD 2.1M',
                  Icons.attach_money,
                  const Color(0xFF3B82F6),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _CardStat(
                  'Deal Flow',
                  '20',
                  Icons.trending_up,
                  const Color(0xFFFFB800),
                ),
                const SizedBox(width: 12),
                _CardStat(
                  'Avg Score',
                  '81',
                  Icons.star_outline,
                  const Color(0xFF8B5CF6),
                ),
              ],
            ),
            const SizedBox(height: 24),

            _header(context, 'Portfolio Companies'),
            const SizedBox(height: 12),
            ...[
              {
                'name': 'AgriFlow',
                'sector': 'AgTech',
                'invested': 'USD 500K',
                'return': '+18%',
                'positive': true,
              },
              {
                'name': 'HealthBridge',
                'sector': 'HealthTech',
                'invested': 'USD 1.2M',
                'return': '+7%',
                'positive': true,
              },
              {
                'name': 'EduReach',
                'sector': 'EdTech',
                'invested': 'USD 400K',
                'return': '-3%',
                'positive': false,
              },
            ].map(
              (c) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: context.colors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.colors.divider),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: context.colors.darkGreenMid,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text(
                          (c['name'] as String)[0],
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            c['name'] as String,
                            style: TextStyle(
                              color: context.colors.textPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            '${c['sector']} · ${c['invested']}',
                            style: TextStyle(
                              color: context.colors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      c['return'] as String,
                      style: TextStyle(
                        color: (c['positive'] as bool)
                            ? AppColors.primary
                            : AppColors.error,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

Widget _header(BuildContext context, String t) => Text(
  t,
  style: TextStyle(
    color: context.colors.textPrimary,
    fontWeight: FontWeight.w700,
    fontSize: 16,
  ),
);

class _CardStat extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _CardStat(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w800,
              fontSize: 18,
            ),
          ),
          Text(
            label,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 12),
          ),
        ],
      ),
    ),
  );
}

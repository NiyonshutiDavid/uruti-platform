import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';

class PitchPerformanceScreen extends StatelessWidget {
  const PitchPerformanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        title: Text(
          'Session Results',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        leading: IconButton(
          icon: Icon(Icons.close, color: context.colors.textPrimary),
          onPressed: () => context.go('/coach'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Overall score
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1A3A0A), Color(0xFF0D2010)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Column(
                children: [
                  Text(
                    'Overall Score',
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '82',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 64,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    'out of 100',
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _ScoreChip('Duration', '8:24'),
                      _ScoreChip('Words/min', '142'),
                      _ScoreChip('Clarity', '91%'),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            _sectionTitle(context, 'Category Breakdown'),
            const SizedBox(height: 12),

            ...[
              ('Pacing', 0.78, AppColors.primary),
              ('Confidence', 0.72, const Color(0xFFFFB800)),
              ('Clarity', 0.91, const Color(0xFF3B82F6)),
              ('Content', 0.80, const Color(0xFFFF6B6B)),
              ('Engagement', 0.68, const Color(0xFF8B5CF6)),
            ].map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          e.$1,
                          style: TextStyle(
                            color: context.colors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '${(e.$2 * 100).toInt()}',
                          style: TextStyle(
                            color: e.$3,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: e.$2,
                        backgroundColor: context.colors.divider,
                        color: e.$3,
                        minHeight: 8,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 8),
            _sectionTitle(context, 'AI Feedback'),
            const SizedBox(height: 12),

            ...[
              (
                Icons.check_circle,
                AppColors.primary,
                'Strong opening hook captured attention effectively.',
              ),
              (
                Icons.check_circle,
                AppColors.primary,
                'Market size data was compelling and well-sourced.',
              ),
              (
                Icons.warning_amber_rounded,
                const Color(0xFFFFB800),
                'Revenue projections could use more detail.',
              ),
              (
                Icons.warning_amber_rounded,
                const Color(0xFFFFB800),
                'Consider slowing down in the technical section.',
              ),
            ].map(
              (e) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: context.colors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.colors.divider),
                ),
                child: Row(
                  children: [
                    Icon(e.$1, color: e.$2, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        e.$3,
                        style: TextStyle(
                          color: context.colors.textPrimary,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => context.go('/recording'),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => context.go('/coach'),
                    icon: const Icon(Icons.done),
                    label: const Text('Done'),
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
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(BuildContext context, String t) => Align(
    alignment: Alignment.centerLeft,
    child: Text(
      t,
      style: TextStyle(
        color: context.colors.textPrimary,
        fontWeight: FontWeight.w700,
        fontSize: 16,
      ),
    ),
  );
}

class _ScoreChip extends StatelessWidget {
  final String label, value;
  const _ScoreChip(this.label, this.value);
  @override
  Widget build(BuildContext context) => Column(
    children: [
      Text(
        value,
        style: TextStyle(
          color: context.colors.textPrimary,
          fontWeight: FontWeight.w800,
          fontSize: 16,
        ),
      ),
      Text(
        label,
        style: TextStyle(color: context.colors.textSecondary, fontSize: 11),
      ),
    ],
  );
}

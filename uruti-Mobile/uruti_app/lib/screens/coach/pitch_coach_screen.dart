import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';
import '../../services/api_service.dart';
import '../main_scaffold.dart';

class PitchCoachScreen extends StatelessWidget {
  const PitchCoachScreen({super.key});

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
          'Pitch Coach',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: Stack(
        children: [
          // Radial glow background
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(0, -0.1),
                  radius: 0.6,
                  colors: [Color(0xFF0D2A06), context.colors.background],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 20),

                    // Headline
                    Text(
                      'AI Pitch Coach',
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Real-time feedback powered by AI',
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 14,
                      ),
                    ),

                    const SizedBox(height: 40),

                    // Feature cards grid
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 14,
                      mainAxisSpacing: 14,
                      childAspectRatio: 1.1,
                      children: const [
                        _FeatureCard(
                          icon: Icons.analytics,
                          title: 'Real-time Analysis',
                          subtitle: 'Get instant feedback as you speak',
                          color: Color(0xFF76B947),
                        ),
                        _FeatureCard(
                          icon: Icons.slideshow,
                          title: 'Slide Sync',
                          subtitle: 'Auto-syncs with your presentation',
                          color: Color(0xFF3B82F6),
                        ),
                        _FeatureCard(
                          icon: Icons.record_voice_over,
                          title: 'Smart Transcription',
                          subtitle: 'Accurate live speech-to-text',
                          color: Color(0xFFFFB800),
                        ),
                        _FeatureCard(
                          icon: Icons.record_voice_over_outlined,
                          title: 'Barge-In Enabled',
                          subtitle: 'AI can speak over you in real time',
                          color: Color(0xFFFF6B6B),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Previous sessions
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Recent Sessions',
                        style: TextStyle(
                          color: context.colors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    FutureBuilder<List<dynamic>>(
                      future: ApiService.instance.getPitchSessions(),
                      builder: (context, snap) {
                        if (snap.connectionState == ConnectionState.waiting) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16),
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primary,
                              ),
                            ),
                          );
                        }
                        final sessions = snap.data ?? [];
                        if (sessions.isEmpty) {
                          return Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: context.colors.card,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: context.colors.divider),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.history_rounded,
                                  color: context.colors.textSecondary,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'No sessions yet',
                                  style: TextStyle(
                                    color: context.colors.textSecondary,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }
                        return Column(
                          children: sessions
                              .take(3)
                              .map((s) => _SessionTile(session: s))
                              .toList(),
                        );
                      },
                    ),

                    const SizedBox(height: 24),

                    // Go Live button
                    GestureDetector(
                      onTap: () => context.go('/recording'),
                      child: Container(
                        width: double.infinity,
                        height: 56,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF3D7A1A), Color(0xFF76B947)],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.35),
                              blurRadius: 20,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.mic, color: Colors.white, size: 22),
                            SizedBox(width: 10),
                            Text(
                              'Go Live',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final Color color;
  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 11),
            maxLines: 2,
          ),
        ],
      ),
    );
  }
}

// ─── Session tile ─────────────────────────────────────────────────────────────
class _SessionTile extends StatelessWidget {
  final dynamic session;
  const _SessionTile({required this.session});

  @override
  Widget build(BuildContext context) {
    final title =
        session['title'] as String? ??
        session['name'] as String? ??
        'Pitch Session';
    final score = session['score'];
    final duration = session['duration_seconds'] != null
        ? '${(session['duration_seconds'] as int) ~/ 60} min'
        : session['duration'] as String? ?? '';
    final createdAt = session['created_at'] as String? ?? '';

    String timeAgo = '';
    if (createdAt.isNotEmpty) {
      try {
        final dt = DateTime.parse(createdAt);
        final diff = DateTime.now().difference(dt);
        if (diff.inDays > 0) {
          timeAgo = '${diff.inDays}d ago';
        } else if (diff.inHours > 0) {
          timeAgo = '${diff.inHours}h ago';
        } else {
          timeAgo = '${diff.inMinutes}m ago';
        }
      } catch (_) {}
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.divider),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.mic, color: AppColors.primary, size: 18),
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
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  [
                    if (score != null) 'Score: $score/100',
                    if (duration.isNotEmpty) duration,
                  ].join(' · '),
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (timeAgo.isNotEmpty)
            Text(
              timeAgo,
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 12,
              ),
            ),
        ],
      ),
    );
  }
}

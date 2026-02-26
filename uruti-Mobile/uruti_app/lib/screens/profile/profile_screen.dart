import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../screens/main_scaffold.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  List<Map<String, dynamic>> _ventures = [];
  bool _loadingVentures = false;
  int _connectionsCount = 0;
  int _sessionsCount = 0;

  @override
  void initState() {
    super.initState();
    _loadVentures();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final results = await Future.wait([
        ApiService.instance.getConnections(),
        ApiService.instance.getPitchSessions(),
      ]);
      if (!mounted) return;
      setState(() {
        _connectionsCount = results[0].length;
        _sessionsCount = results[1].length;
      });
    } catch (_) {}
  }

  Future<void> _loadVentures() async {
    setState(() => _loadingVentures = true);
    try {
      final data = await ApiService.instance.getMyVentures();
      if (!mounted) return;
      setState(() {
        _ventures = List<Map<String, dynamic>>.from(data);
        _loadingVentures = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingVentures = false);
    }
  }

  Future<void> _goAddVenture() async {
    final added = await context.push<bool>('/ventures/new');
    if (added == true) _loadVentures();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    if (user == null) return const SizedBox();

    return Scaffold(
      backgroundColor: context.colors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: context.colors.surface,
            leading: IconButton(
              icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
              onPressed: () =>
                  MainScaffold.scaffoldKey.currentState?.openDrawer(),
            ),
            actions: [
              TextButton(
                onPressed: () => context.go('/profile/edit'),
                child: Text(
                  'Edit',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [const Color(0xFF1A3A0A), context.colors.card],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 20,
                    left: 20,
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 36,
                          backgroundColor: context.colors.darkGreenMid,
                          backgroundImage: user.resolvedAvatarUrl != null
                              ? NetworkImage(user.resolvedAvatarUrl!)
                              : null,
                          child: user.resolvedAvatarUrl == null
                              ? Image.asset(
                                  'assets/images/Uruti-icon-white.png',
                                  width: 40,
                                  height: 40,
                                  fit: BoxFit.contain,
                                )
                              : null,
                        ),
                        const SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.fullName,
                              style: TextStyle(
                                color: context.colors.textPrimary,
                                fontWeight: FontWeight.w800,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(
                                  alpha: 0.15,
                                ),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                (user.role[0].toUpperCase() +
                                    user.role.substring(1)),
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            if (user.title != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                '${user.title} ${user.company != null ? '@ ${user.company}' : ''}',
                                style: TextStyle(
                                  color: context.colors.textSecondary,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Stats row
                Row(
                  children: [
                    _StatBox('Score', user.uritiScore.round().toString()),
                    _StatBox('Sessions', _sessionsCount.toString()),
                    _StatBox('Connects', _connectionsCount.toString()),
                    _StatBox('Ventures', _ventures.length.toString()),
                  ],
                ),
                const SizedBox(height: 20),

                if (user.bio != null && user.bio!.isNotEmpty) ...[
                  _section(context, 'About'),
                  const SizedBox(height: 8),
                  Text(
                    user.bio!,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                if ((user.expertise ?? []).isNotEmpty) ...[
                  _section(context, 'Expertise'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: (user.expertise ?? [])
                        .map((e) => _Tag(e))
                        .toList(),
                  ),
                  const SizedBox(height: 20),
                ],

                // ── Ventures ──────────────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _section(context, 'My Ventures'),
                    TextButton.icon(
                      onPressed: _goAddVenture,
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                      ),
                      icon: const Icon(Icons.add_rounded, size: 18),
                      label: const Text(
                        'Add',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                if (_loadingVentures)
                  const Center(
                    child: SizedBox(
                      height: 32,
                      width: 32,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    ),
                  )
                else if (_ventures.isEmpty)
                  GestureDetector(
                    onTap: _goAddVenture,
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: context.colors.card,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.25),
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.rocket_launch_rounded,
                            color: context.colors.textSecondary,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            'Add your first venture',
                            style: TextStyle(
                              color: context.colors.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ..._ventures.map((v) => _VentureCard(venture: v)),
                const SizedBox(height: 20),

                _section(context, 'Contact'),
                const SizedBox(height: 8),
                if (user.location != null)
                  _InfoRow(Icons.location_on_outlined, user.location!),
                if (user.email.isNotEmpty)
                  _InfoRow(Icons.email_outlined, user.email),
                if (user.phone != null)
                  _InfoRow(Icons.phone_outlined, user.phone!),
                if (user.linkedinUrl != null)
                  _InfoRow(Icons.link, user.linkedinUrl!),

                const SizedBox(height: 80),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _section(BuildContext context, String t) => Text(
  t,
  style: TextStyle(
    color: context.colors.textPrimary,
    fontWeight: FontWeight.w700,
    fontSize: 16,
  ),
);

class _StatBox extends StatelessWidget {
  final String label, value;
  const _StatBox(this.label, this.value);
  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.colors.divider),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w800,
              fontSize: 18,
            ),
          ),
          Text(
            label,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 10),
          ),
        ],
      ),
    ),
  );
}

class _Tag extends StatelessWidget {
  final String label;
  const _Tag(this.label);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
    decoration: BoxDecoration(
      color: AppColors.primary.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
    ),
    child: Text(
      label,
      style: TextStyle(color: AppColors.primary, fontSize: 12),
    ),
  );
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow(this.icon, this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      children: [
        Icon(icon, color: context.colors.textSecondary, size: 18),
        const SizedBox(width: 10),
        Text(
          text,
          style: TextStyle(color: context.colors.textSecondary, fontSize: 14),
        ),
      ],
    ),
  );
}

class _VentureCard extends StatelessWidget {
  final Map<String, dynamic> venture;
  const _VentureCard({required this.venture});

  static const _stageColors = {
    'ideation': Color(0xFF6B7280),
    'validation': Color(0xFF3B82F6),
    'mvp': Color(0xFFF59E0B),
    'early_traction': Color(0xFF10B981),
    'growth': Color(0xFF8B5CF6),
    'scale': Color(0xFFEF4444),
  };

  static const _stageLabels = {
    'ideation': 'Ideation',
    'validation': 'Validation',
    'mvp': 'MVP',
    'early_traction': 'Early Traction',
    'growth': 'Growth',
    'scale': 'Scale',
  };

  @override
  Widget build(BuildContext context) {
    final name = venture['name'] as String? ?? 'Unnamed Venture';
    final tagline = venture['tagline'] as String?;
    final stage = venture['stage'] as String? ?? 'ideation';
    final industry = venture['industry'] as String? ?? '';
    final stageColor = _stageColors[stage] ?? const Color(0xFF6B7280);
    final stageLabel = _stageLabels[stage] ?? stage;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.divider),
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
            child: const Icon(
              Icons.rocket_launch_rounded,
              color: AppColors.primary,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
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
                if (tagline != null && tagline.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    tagline,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: stageColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        stageLabel,
                        style: TextStyle(
                          color: stageColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (industry.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Text(
                        '• ${industry[0].toUpperCase()}${industry.substring(1)}',
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right_rounded,
            color: context.colors.textSecondary,
            size: 20,
          ),
        ],
      ),
    );
  }
}

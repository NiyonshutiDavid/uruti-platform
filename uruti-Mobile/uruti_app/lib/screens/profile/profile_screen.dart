import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
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
  Color _headerIconColor = Colors.white;
  String? _lastCoverUrl;

  @override
  void initState() {
    super.initState();
    _refreshProfileData();
    _loadVentures();
    _loadStats();
  }

  Future<void> _refreshProfileData() async {
    try {
      await context.read<AuthProvider>().refreshUser();
    } catch (_) {}
  }

  Future<void> _loadStats() async {
    try {
      final connections = await ApiService.instance.getConnections();
      if (!mounted) return;
      setState(() {
        _connectionsCount = connections.length;
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

  Future<void> _updateHeaderIconColor(String? imageUrl) async {
    if (imageUrl == null || imageUrl.trim().isEmpty) {
      if (mounted) setState(() => _headerIconColor = Colors.white);
      return;
    }

    try {
      final uri = Uri.parse(imageUrl);
      final data = await NetworkAssetBundle(uri).load(uri.toString());
      final codec = await ui.instantiateImageCodec(
        data.buffer.asUint8List(),
        targetWidth: 16,
        targetHeight: 16,
      );
      final frame = await codec.getNextFrame();
      final byteData = await frame.image.toByteData(
        format: ui.ImageByteFormat.rawRgba,
      );
      if (byteData == null) return;

      final pixels = byteData.buffer.asUint8List();
      double luminanceTotal = 0;
      int count = 0;

      for (int i = 0; i + 3 < pixels.length; i += 4) {
        final r = pixels[i] / 255;
        final g = pixels[i + 1] / 255;
        final b = pixels[i + 2] / 255;
        luminanceTotal += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        count++;
      }

      final averageLuminance = count == 0 ? 0.0 : luminanceTotal / count;
      final nextColor = averageLuminance > 0.68 ? Colors.black : Colors.white;
      if (mounted) setState(() => _headerIconColor = nextColor);
    } catch (_) {
      if (mounted) setState(() => _headerIconColor = Colors.white);
    }
  }

  void _syncHeaderIconColor(String? coverUrl) {
    if (_lastCoverUrl == coverUrl) return;
    _lastCoverUrl = coverUrl;
    _updateHeaderIconColor(coverUrl);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    if (user == null) return const SizedBox();
    _syncHeaderIconColor(user.resolvedCoverImageUrl);

    return Scaffold(
      backgroundColor: context.colors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            backgroundColor: context.colors.surface,
            leading: IconButton(
              icon: Icon(
                context.canPop()
                    ? Icons.arrow_back_ios_new_rounded
                    : Icons.menu_rounded,
                color: _headerIconColor,
              ),
              onPressed: () {
                if (context.canPop()) {
                  context.pop();
                  return;
                }
                MainScaffold.scaffoldKey.currentState?.openDrawer();
              },
            ),
            actions: [
              TextButton(
                onPressed: () async {
                  await context.push('/profile/edit');
                  if (!mounted) return;
                  await _refreshProfileData();
                  await _loadVentures();
                  await _loadStats();
                },
                child: Text(
                  'Edit',
                  style: TextStyle(
                    color: context.colors.accent,
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
                  if (user.resolvedCoverImageUrl != null)
                    Image.network(
                      user.resolvedCoverImageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              const Color(0xFF1A3A0A),
                              context.colors.card,
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            const Color(0xFF1A3A0A),
                            context.colors.card,
                          ],
                        ),
                      ),
                    ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.15),
                          Colors.black.withValues(alpha: 0.35),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 20,
                    right: 20,
                    child: Row(
                      children: [
                        const SizedBox(width: 84),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user.fullName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.white,
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
                                  color: context.colors.accent.withValues(
                                    alpha: 0.2,
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  (user.role[0].toUpperCase() +
                                      user.role.substring(1)),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              if (user.title != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  '${user.title} ${user.company != null ? '@ ${user.company}' : ''}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    left: 20,
                    bottom: 8,
                    child: Row(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: context.colors.background,
                              width: 3,
                            ),
                          ),
                          child: CircleAvatar(
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
                const SizedBox(height: 24),
                // Stats row
                Row(
                  children: [
                    _StatBox('Connects', _connectionsCount.toString()),
                    _StatBox('Ventures', _ventures.length.toString()),
                    _StatBox(
                      'Role',
                      user.role[0].toUpperCase() + user.role.substring(1),
                    ),
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

                // ── Ventures (Founder only) ──────────────────────────
                if (user.role == 'founder') ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _section(context, 'My Ventures'),
                      TextButton.icon(
                        onPressed: _goAddVenture,
                        style: TextButton.styleFrom(
                          foregroundColor: context.colors.accent,
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
                    Center(
                      child: SizedBox(
                        height: 32,
                        width: 32,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: context.colors.accent,
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
                            color: context.colors.accent.withValues(
                              alpha: 0.25,
                            ),
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
                ],
                const SizedBox(height: 20),

                _section(context, 'Contact'),
                const SizedBox(height: 8),
                if (user.location != null)
                  _InfoRow(Icons.location_on_outlined, user.location!),
                if (user.email.isNotEmpty)
                  _InfoRow(Icons.email_outlined, user.email),
                if (user.phone != null)
                  _InfoRow(Icons.phone_outlined, user.phone!),
                if (user.linkedinUrl != null && user.linkedinUrl!.isNotEmpty)
                  _LinkRow(Icons.link, 'LinkedIn', user.linkedinUrl!),
                if (user.websiteUrl != null && user.websiteUrl!.isNotEmpty)
                  _LinkRow(Icons.language_rounded, 'Website', user.websiteUrl!),

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
              color: context.colors.accent,
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
      color: context.colors.accent.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: context.colors.accent.withValues(alpha: 0.3)),
    ),
    child: Text(
      label,
      style: TextStyle(color: context.colors.accent, fontSize: 12),
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
        Expanded(
          child: Text(
            text,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 14),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    ),
  );
}

class _LinkRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String url;
  const _LinkRow(this.icon, this.label, this.url);

  Future<void> _openUrl(BuildContext context) async {
    var target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://$target';
    }
    final uri = Uri.tryParse(target);
    if (uri == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Could not open link')));
      }
      return;
    }

    try {
      final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!opened && context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Could not open link')));
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Could not open link')));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: GestureDetector(
      onTap: () => _openUrl(context),
      child: Row(
        children: [
          Icon(icon, color: context.colors.accent, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              url,
              style: TextStyle(
                color: context.colors.accent,
                fontSize: 14,
                decoration: TextDecoration.underline,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 4),
          Icon(
            Icons.open_in_new_rounded,
            color: context.colors.accent,
            size: 14,
          ),
        ],
      ),
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
              color: context.colors.accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.rocket_launch_rounded,
              color: context.colors.accent,
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

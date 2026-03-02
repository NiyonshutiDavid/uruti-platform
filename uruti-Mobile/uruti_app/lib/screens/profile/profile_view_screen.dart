import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class ProfileViewScreen extends StatefulWidget {
  final String userId;
  const ProfileViewScreen({super.key, required this.userId});
  @override
  State<ProfileViewScreen> createState() => _ProfileViewScreenState();
}

class _ProfileViewScreenState extends State<ProfileViewScreen> {
  UserModel? _user;
  bool _loading = true;
  bool _connecting = false;
  String _relation = 'none';
  int _ventureCount = 0;
  List<Map<String, dynamic>> _founderVentures = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final targetId = int.tryParse(widget.userId) ?? 0;
      final token = context.read<AuthProvider>().token ?? '';
      final results = await Future.wait([
        ApiService.instance.getUserProfile(targetId, token),
        ApiService.instance.getConnections(),
        ApiService.instance.getPendingRequests(),
        ApiService.instance.getVentures(limit: 200),
      ]);

      final data = results[0] as UserModel;
      final connections = List<Map<String, dynamic>>.from(
        results[1] as List<dynamic>,
      );
      final pending = List<Map<String, dynamic>>.from(
        results[2] as List<dynamic>,
      );
      final ventures = List<Map<String, dynamic>>.from(
        results[3] as List<dynamic>,
      );

      var relation = 'none';
      final connected = connections.any(
        (c) => (c['id'] as num?)?.toInt() == targetId,
      );
      if (connected) {
        relation = 'connected';
      } else {
        for (final req in pending) {
          final counterpart = req['counterpart'];
          final counterpartId = counterpart is Map
              ? (counterpart['id'] as num?)?.toInt()
              : null;
          if (counterpartId == targetId) {
            final direction = (req['direction'] as String? ?? '').toLowerCase();
            relation = direction == 'received'
                ? 'pending_received'
                : 'pending_sent';
            break;
          }
        }
      }

      final ventureCount = ventures
          .where((v) => (v['founder_id'] as num?)?.toInt() == targetId)
          .length;
      final founderVentures =
          ventures
              .where((v) => (v['founder_id'] as num?)?.toInt() == targetId)
              .map((v) => Map<String, dynamic>.from(v))
              .toList()
            ..sort(
              (a, b) => ((b['uruti_score'] as num?)?.toDouble() ?? 0).compareTo(
                (a['uruti_score'] as num?)?.toDouble() ?? 0,
              ),
            );

      if (!mounted) return;
      setState(() {
        _user = data;
        _relation = relation;
        _ventureCount = ventureCount;
        _founderVentures = founderVentures;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  void _showVentureDetails(Map<String, dynamic> venture) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final name = (venture['name'] as String? ?? 'Unnamed venture').trim();
        final tagline = (venture['tagline'] as String? ?? '').trim();
        final stage = (venture['stage'] as String? ?? 'ideation').trim();
        final industry = (venture['industry'] as String? ?? '').trim();
        final description = (venture['description'] as String? ?? '').trim();
        final problem = (venture['problem_statement'] as String? ?? '').trim();
        final solution = (venture['solution'] as String? ?? '').trim();
        final market = (venture['target_market'] as String? ?? '').trim();
        final score = ((venture['uruti_score'] as num?)?.toDouble() ?? 0)
            .round();

        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          maxChildSize: 0.92,
          minChildSize: 0.45,
          expand: false,
          builder: (_, scrollCtrl) => ListView(
            controller: scrollCtrl,
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(
                    color: ctx.colors.divider,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: TextStyle(
                            color: ctx.colors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 18,
                          ),
                        ),
                        if (tagline.isNotEmpty)
                          Text(
                            tagline,
                            style: TextStyle(
                              color: ctx.colors.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      children: [
                        Text(
                          '$score',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                          ),
                        ),
                        Text(
                          'Uruti',
                          style: TextStyle(
                            color: ctx.colors.textSecondary,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (stage.isNotEmpty) _Tag(_labelize(stage)),
                  if (industry.isNotEmpty) _Tag(_labelize(industry)),
                ],
              ),
              if (description.isNotEmpty) ...[
                const SizedBox(height: 16),
                _section(ctx, 'Overview'),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: TextStyle(
                    color: ctx.colors.textSecondary,
                    fontSize: 14,
                    height: 1.6,
                  ),
                ),
              ],
              if (problem.isNotEmpty) ...[
                const SizedBox(height: 14),
                _section(ctx, 'Problem Statement'),
                const SizedBox(height: 6),
                Text(
                  problem,
                  style: TextStyle(
                    color: ctx.colors.textSecondary,
                    fontSize: 14,
                    height: 1.6,
                  ),
                ),
              ],
              if (solution.isNotEmpty) ...[
                const SizedBox(height: 14),
                _section(ctx, 'Solution'),
                const SizedBox(height: 6),
                Text(
                  solution,
                  style: TextStyle(
                    color: ctx.colors.textSecondary,
                    fontSize: 14,
                    height: 1.6,
                  ),
                ),
              ],
              if (market.isNotEmpty) ...[
                const SizedBox(height: 14),
                _section(ctx, 'Target Market'),
                const SizedBox(height: 6),
                Text(
                  market,
                  style: TextStyle(
                    color: ctx.colors.textSecondary,
                    fontSize: 14,
                    height: 1.6,
                  ),
                ),
              ],
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  String _labelize(String value) {
    return value
        .replaceAll('_', ' ')
        .split(' ')
        .where((p) => p.trim().isNotEmpty)
        .map((p) => '${p[0].toUpperCase()}${p.substring(1)}')
        .join(' ');
  }

  Future<void> _connect() async {
    setState(() => _connecting = true);
    try {
      final token = context.read<AuthProvider>().token ?? '';
      await ApiService.instance.sendConnectionRequest(
        int.tryParse(widget.userId) ?? 0,
        token,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Connection request sent!')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _connecting = false);
    }
  }

  Widget _buildPrimaryAction(UserModel u) {
    if (_relation == 'connected') {
      return ElevatedButton.icon(
        onPressed: () => context.push('/messages/${u.id}'),
        icon: const Icon(Icons.message_outlined),
        label: const Text('Message'),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF3B82F6),
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }

    if (_relation == 'pending_sent' || _relation == 'pending_received') {
      return ElevatedButton.icon(
        onPressed: null,
        icon: const Icon(Icons.hourglass_top_rounded),
        label: Text(
          _relation == 'pending_received' ? 'Request Received' : 'Pending',
        ),
        style: ElevatedButton.styleFrom(
          disabledBackgroundColor: context.colors.card,
          disabledForegroundColor: context.colors.textSecondary,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }

    return ElevatedButton.icon(
      onPressed: _connecting ? null : _connect,
      icon: _connecting
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : const Icon(Icons.person_add_outlined),
      label: const Text('Connect'),
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }
    if (_user == null) {
      return Scaffold(
        backgroundColor: context.colors.background,
        appBar: AppBar(
          backgroundColor: context.colors.background,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () =>
                context.canPop() ? context.pop() : context.go('/home'),
          ),
        ),
        body: Center(
          child: Text(
            'User not found',
            style: TextStyle(color: context.colors.textSecondary),
          ),
        ),
      );
    }
    final u = _user!;
    return Scaffold(
      backgroundColor: context.colors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 200,
            backgroundColor: context.colors.surface,
            leading: IconButton(
              icon: Icon(Icons.arrow_back, color: context.colors.textPrimary),
              onPressed: () =>
                  context.canPop() ? context.pop() : context.go('/home'),
            ),
            actions: [
              IconButton(
                icon: Icon(
                  Icons.message_outlined,
                  color: context.colors.textPrimary,
                ),
                onPressed: () => context.push('/messages/${u.id}'),
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
                    right: 20,
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 36,
                          backgroundColor: context.colors.darkGreenMid,
                          backgroundImage: u.resolvedAvatarUrl != null
                              ? NetworkImage(u.resolvedAvatarUrl!)
                              : null,
                          child: u.resolvedAvatarUrl == null
                              ? Image.asset(
                                  'assets/images/Uruti-icon-white.png',
                                  width: 40,
                                  height: 40,
                                  fit: BoxFit.contain,
                                )
                              : null,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                u.fullName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
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
                                  u.role[0].toUpperCase() + u.role.substring(1),
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              if (u.title != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  '${u.title}${u.company != null ? ' @ ${u.company}' : ''}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: context.colors.textSecondary,
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
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Row(
                  children: [
                    _StatBox('Score', u.uritiScore.round().toString()),
                    _StatBox('Sessions', '—'),
                    _StatBox('Connects', _relation == 'connected' ? '1' : '0'),
                    _StatBox('Ventures', _ventureCount.toString()),
                  ],
                ),
                const SizedBox(height: 20),

                _buildPrimaryAction(u),
                const SizedBox(height: 20),

                if (u.bio != null && u.bio!.isNotEmpty) ...[
                  _section(context, 'About'),
                  const SizedBox(height: 8),
                  Text(
                    u.bio!,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
                if ((u.expertise ?? []).isNotEmpty) ...[
                  _section(context, 'Expertise'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: (u.expertise ?? []).map((e) => _Tag(e)).toList(),
                  ),
                  const SizedBox(height: 20),
                ],
                if (u.role == 'founder') ...[
                  _section(context, 'Ventures'),
                  const SizedBox(height: 10),
                  if (_founderVentures.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: context.colors.card,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: context.colors.divider),
                      ),
                      child: Text(
                        'No ventures added yet.',
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    )
                  else
                    ..._founderVentures.map(
                      (venture) => _PublicVentureCard(
                        venture: venture,
                        onTap: () => _showVentureDetails(venture),
                      ),
                    ),
                  const SizedBox(height: 20),
                ],
                _section(context, 'Contact'),
                const SizedBox(height: 8),
                if (u.location != null && u.location!.isNotEmpty)
                  _InfoRow(Icons.location_on_outlined, u.location!),
                if (u.email.isNotEmpty) _InfoRow(Icons.email_outlined, u.email),
                if (u.phone != null && u.phone!.isNotEmpty)
                  _InfoRow(Icons.phone_outlined, u.phone!),
                if (u.linkedinUrl != null && u.linkedinUrl!.isNotEmpty)
                  _InfoRow(Icons.link, u.linkedinUrl!),
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
  final String label;
  final String value;
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
        Expanded(
          child: Text(
            text,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 14),
          ),
        ),
      ],
    ),
  );
}

class _PublicVentureCard extends StatelessWidget {
  final Map<String, dynamic> venture;
  final VoidCallback onTap;
  const _PublicVentureCard({required this.venture, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final name = (venture['name'] as String? ?? 'Unnamed Venture').trim();
    final tagline = (venture['tagline'] as String? ?? '').trim();
    final stage = (venture['stage'] as String? ?? '').trim();
    final industry = (venture['industry'] as String? ?? '').trim();
    final score = ((venture['uruti_score'] as num?)?.toDouble() ?? 0).round();

    return GestureDetector(
      onTap: onTap,
      child: Container(
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
                color: AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.rocket_launch_rounded,
                color: AppColors.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  if (tagline.isNotEmpty) ...[
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
                  if (stage.isNotEmpty || industry.isNotEmpty) ...[
                    const SizedBox(height: 5),
                    Text(
                      [stage, industry]
                          .where((e) => e.trim().isNotEmpty)
                          .map(
                            (e) => e
                                .replaceAll('_', ' ')
                                .split(' ')
                                .where((p) => p.trim().isNotEmpty)
                                .map(
                                  (p) =>
                                      '${p[0].toUpperCase()}${p.substring(1)}',
                                )
                                .join(' '),
                          )
                          .join(' • '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              children: [
                Text(
                  '$score',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                    fontSize: 20,
                  ),
                ),
                Text(
                  'Uruti',
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 6),
            Icon(
              Icons.chevron_right_rounded,
              color: context.colors.textSecondary,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

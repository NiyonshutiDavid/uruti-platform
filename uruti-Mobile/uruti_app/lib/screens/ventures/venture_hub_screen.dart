import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../bloc/founder/founder_cubit.dart';
import '../../bloc/founder/founder_state.dart';
import '../../core/app_constants.dart';
import '../../core/app_colors.dart';
import '../../services/api_service.dart';
import '../../screens/main_scaffold.dart';
import '../../widgets/top_notification.dart';

String? _ventureMediaUrl(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  if (raw.startsWith('http')) return raw;
  return '${AppConstants.apiBaseUrl}$raw';
}

// ─── Stage / Industry labels (mirrors add_venture_screen constants) ───────────

const _stageLabels = {
  'ideation': 'Ideation',
  'validation': 'Validation',
  'mvp': 'MVP',
  'early_traction': 'Early Traction',
  'growth': 'Growth',
  'scale': 'Scale',
};

const _stageColors = {
  'ideation': Color(0xFF9E9E9E),
  'validation': Color(0xFF2196F3),
  'mvp': Color(0xFF9C27B0),
  'early_traction': Color(0xFFFF9800),
  'growth': Color(0xFF4CAF50),
  'scale': Color(0xFF00BCD4),
};

const _industryLabels = {
  'technology': 'Technology',
  'agriculture': 'Agriculture',
  'healthcare': 'Healthcare',
  'education': 'Education',
  'fintech': 'Fintech',
  'manufacturing': 'Manufacturing',
  'services': 'Services',
  'retail': 'Retail',
  'other': 'Other',
};

const _industryIcons = {
  'technology': Icons.computer_rounded,
  'agriculture': Icons.grass_rounded,
  'healthcare': Icons.local_hospital_rounded,
  'education': Icons.school_rounded,
  'fintech': Icons.account_balance_rounded,
  'manufacturing': Icons.factory_rounded,
  'services': Icons.handshake_rounded,
  'retail': Icons.storefront_rounded,
  'other': Icons.category_rounded,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

class VentureHubScreen extends StatefulWidget {
  const VentureHubScreen({super.key});
  @override
  State<VentureHubScreen> createState() => _VentureHubScreenState();
}

class _VentureHubScreenState extends State<VentureHubScreen> {
  final _searchCtrl = TextEditingController();
  int? _analyzingVentureId;
  final Map<int, double> _scoreOverrides = {};
  final Map<int, int> _leaderboardRanks = {};

  @override
  void initState() {
    super.initState();
    final founderCubit = context.read<FounderCubit>();
    _searchCtrl.text = founderCubit.state.ventureSearchTerm;
    founderCubit.initializeVentureHub();
    _searchCtrl.addListener(() {
      context.read<FounderCubit>().setVentureSearchTerm(_searchCtrl.text);
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  Future<void> _confirmDelete(Map<String, dynamic> venture) async {
    final id = venture['id'] as int?;
    if (id == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ctx.colors.surface,
        title: Text(
          'Delete Venture?',
          style: TextStyle(color: ctx.colors.textPrimary),
        ),
        content: Text(
          '"${venture['name']}" will be permanently deleted.',
          style: TextStyle(color: ctx.colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Cancel',
              style: TextStyle(color: ctx.colors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Delete',
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    final deleted = await context.read<FounderCubit>().deleteVenture(id);
    if (!mounted) return;
    if (deleted) {
      TopNotification.show(context, message: 'Venture deleted');
    } else {
      TopNotification.show(
        context,
        message: 'Error deleting venture',
        isError: true,
      );
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  Future<void> _showEdit(Map<String, dynamic> venture) async {
    final id = venture['id'] as int?;
    if (id == null) return;
    final saved = await context.push<bool>('/ventures/new', extra: venture);
    if (saved == true && mounted) {
      context.read<FounderCubit>().refreshVentureHub();
    }
  }

  int _ventureId(Map<String, dynamic> venture) {
    final raw = venture['id'];
    if (raw is int) return raw;
    return int.tryParse('$raw') ?? -1;
  }

  double _displayScore(Map<String, dynamic> venture) {
    final id = _ventureId(venture);
    if (_scoreOverrides.containsKey(id)) {
      return _scoreOverrides[id] ?? 0;
    }
    return (venture['uruti_score'] as num?)?.toDouble() ?? 0.0;
  }

  int _computeRank(double score, List<dynamic> publicVentures, int ventureId) {
    final scoreBoard = <double>[];

    for (final item in publicVentures) {
      if (item is! Map) continue;
      final venture = Map<String, dynamic>.from(item);
      final id = _ventureId(venture);
      if (id == ventureId) continue;
      scoreBoard.add((venture['uruti_score'] as num?)?.toDouble() ?? 0.0);
    }

    if (scoreBoard.isEmpty) {
      for (final venture in context.read<FounderCubit>().state.ventures) {
        final id = _ventureId(venture);
        if (id == ventureId) continue;
        scoreBoard.add(_displayScore(venture));
      }
    }

    final higher = scoreBoard.where((value) => value > score).length;
    return higher + 1;
  }

  Future<void> _analyzeVenture(Map<String, dynamic> venture) async {
    final id = _ventureId(venture);
    if (id < 0 || _analyzingVentureId != null) return;

    setState(() => _analyzingVentureId = id);

    try {
      final analyzed = await ApiService.instance.analyzeVenture(id);
      final newScore =
          (analyzed['uruti_score'] as num?)?.toDouble() ??
          (venture['uruti_score'] as num?)?.toDouble() ??
          0.0;
      final publicVentures = await ApiService.instance.getVentures(limit: 200);
      final rank = _computeRank(newScore, publicVentures, id);

      if (!mounted) return;
      setState(() {
        _scoreOverrides[id] = newScore;
        _leaderboardRanks[id] = rank;
      });

      final name = (venture['name'] as String? ?? 'Venture').trim();
      TopNotification.show(
        context,
        title: name,
        message: 'Uruti Score ${newScore.round()}/100 • Public rank #$rank',
      );

      await context.read<FounderCubit>().refreshVentureHub();
    } catch (_) {
      if (!mounted) return;
      TopNotification.show(
        context,
        message: 'Unable to analyze now. Please retry.',
        isError: true,
      );
    } finally {
      if (mounted) setState(() => _analyzingVentureId = null);
    }
  }

  // ── Stage → status ────────────────────────────────────────────────────────────

  static ({String label, Color color}) _stageToStatus(String stage) {
    return switch (stage) {
      'validation' => (label: 'Validation', color: const Color(0xFF2196F3)),
      'mvp' ||
      'early_traction' ||
      'growth' => (label: 'Development', color: const Color(0xFFFF9800)),
      'scale' => (label: 'Investment Ready', color: AppColors.primary),
      _ => (label: 'Idea', color: const Color(0xFF9E9E9E)),
    };
  }

  // ── Stats row ─────────────────────────────────────────────────────────────────

  Widget _buildStatsRow(List<Map<String, dynamic>> ventures) {
    final total = ventures.length;
    final ready = ventures
        .where((v) => (v['stage'] as String?) == 'scale')
        .length;
    final scores = ventures
        .map((v) => (v['uruti_score'] as num?)?.toDouble() ?? 0.0)
        .toList();
    final avgScore = scores.isEmpty
        ? 0.0
        : scores.reduce((a, b) => a + b) / scores.length;
    final tracks = <String>{};
    for (final v in ventures) {
      final s = v['stage'] as String?;
      if (s != null) tracks.add(s);
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Row(
        children: [
          _StatChip(label: 'Ventures', value: '$total'),
          const SizedBox(width: 8),
          _StatChip(label: 'Avg Score', value: avgScore.round().toString()),
          const SizedBox(width: 8),
          _StatChip(label: 'Ready', value: '$ready'),
          const SizedBox(width: 8),
          _StatChip(label: 'Stages', value: '${tracks.length}'),
        ],
      ),
    );
  }

  // ── View Details ──────────────────────────────────────────────────────────────

  void _showDetails(Map<String, dynamic> venture) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final name = venture['name'] as String? ?? 'Unnamed';
        final tagline = venture['tagline'] as String? ?? '';
        final stage = venture['stage'] as String? ?? 'ideation';
        final industry = venture['industry'] as String? ?? 'other';
        final problem = venture['problem_statement'] as String? ?? '';
        final solution = venture['solution'] as String? ?? '';
        final market = venture['target_market'] as String? ?? '';
        final score = (venture['uruti_score'] as num?)?.toDouble() ?? 0.0;
        final iconLogoUrl = _ventureMediaUrl(venture['logo_url'] as String?);
        final bannerUrl = _ventureMediaUrl(venture['banner_url'] as String?);
        final status = _stageToStatus(stage);
        final stageColor = _stageColors[stage] ?? const Color(0xFF9E9E9E);
        final industryIcon = _industryIcons[industry] ?? Icons.category_rounded;

        return DraggableScrollableSheet(
          initialChildSize: 0.65,
          maxChildSize: 0.92,
          minChildSize: 0.4,
          expand: false,
          builder: (_, scrollCtrl) => ListView(
            controller: scrollCtrl,
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: ctx.colors.divider,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              if (bannerUrl != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    bannerUrl,
                    height: 120,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: stageColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: iconLogoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              iconLogoUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) =>
                                  Icon(industryIcon, color: stageColor),
                            ),
                          )
                        : Icon(industryIcon, color: stageColor),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: TextStyle(
                            color: ctx.colors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 17,
                          ),
                        ),
                        if (tagline.isNotEmpty)
                          Text(
                            tagline,
                            style: TextStyle(
                              color: ctx.colors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (score > 0)
                    Column(
                      children: [
                        Text(
                          score.round().toString(),
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 22,
                          ),
                        ),
                        Text(
                          'Uruti Score',
                          style: TextStyle(
                            color: ctx.colors.textSecondary,
                            fontSize: 9,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: [
                  _Badge(
                    label: _stageLabels[stage] ?? stage,
                    color: stageColor,
                  ),
                  _Badge(label: status.label, color: status.color),
                  _Badge(
                    label: _industryLabels[industry] ?? industry,
                    color: AppColors.primary.withValues(alpha: 0.7),
                  ),
                ],
              ),
              if (problem.isNotEmpty) ...[
                const SizedBox(height: 16),
                _DetailSection(
                  title: 'Problem Statement',
                  body: problem,
                  ctx: ctx,
                ),
              ],
              if (solution.isNotEmpty) ...[
                const SizedBox(height: 12),
                _DetailSection(title: 'Solution', body: solution, ctx: ctx),
              ],
              if (market.isNotEmpty) ...[
                const SizedBox(height: 12),
                _DetailSection(title: 'Target Market', body: market, ctx: ctx),
              ],
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _showEdit(venture);
                      },
                      icon: const Icon(Icons.edit_outlined, size: 16),
                      label: const Text('Edit'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: BorderSide(
                          color: AppColors.primary.withValues(alpha: 0.4),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(
                        Icons.close,
                        size: 16,
                        color: Colors.white,
                      ),
                      label: const Text(
                        'Close',
                        style: TextStyle(color: Colors.white),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FounderCubit, FounderState>(
      builder: (context, state) {
        return Scaffold(
          backgroundColor: context.colors.background,
          appBar: AppBar(
            backgroundColor: context.colors.background,
            elevation: 0,
            leading: IconButton(
              icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
              onPressed: () =>
                  MainScaffold.scaffoldKey.currentState?.openDrawer(),
            ),
            title: Text(
              'My Ventures',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            actions: [
              IconButton(
                icon: Icon(Icons.refresh, color: context.colors.textSecondary),
                onPressed: () =>
                    context.read<FounderCubit>().refreshVentureHub(),
              ),
            ],
          ),
          floatingActionButton: FloatingActionButton.extended(
            backgroundColor: AppColors.primary,
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text(
              'Add Venture',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
            onPressed: () async {
              final added = await context.push('/ventures/new');
              if (!context.mounted) return;
              if (added == true) {
                await context.read<FounderCubit>().refreshVentureHub();
              }
            },
          ),
          body: Column(
            children: [
              if (state.status != FounderStatus.loading &&
                  state.ventures.isNotEmpty)
                _buildStatsRow(state.ventures),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: TextField(
                  controller: _searchCtrl,
                  style: TextStyle(color: context.colors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Search ventures…',
                    hintStyle: TextStyle(color: context.colors.textSecondary),
                    prefixIcon: Icon(
                      Icons.search,
                      color: context.colors.textSecondary,
                      size: 20,
                    ),
                    filled: true,
                    fillColor: context.colors.surface,
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  children: [
                    _FilterChip(
                      label: 'All',
                      selected: state.ventureStageFilter == 'all',
                      onTap: () => context
                          .read<FounderCubit>()
                          .setVentureStageFilter('all'),
                    ),
                    ..._stageLabels.entries.map(
                      (e) => _FilterChip(
                        label: e.value,
                        selected: state.ventureStageFilter == e.key,
                        color: _stageColors[e.key],
                        onTap: () => context
                            .read<FounderCubit>()
                            .setVentureStageFilter(e.key),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(child: _buildBody(state)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBody(FounderState state) {
    if (state.status == FounderStatus.loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.status == FounderStatus.error) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
            const SizedBox(height: 12),
            Text(
              'Failed to load ventures',
              style: TextStyle(color: context.colors.textSecondary),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => context.read<FounderCubit>().refreshVentureHub(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
              ),
              child: const Text('Retry', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }
    if (state.ventures.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.rocket_launch_outlined,
              color: context.colors.textSecondary,
              size: 56,
            ),
            const SizedBox(height: 16),
            Text(
              'No ventures yet',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap "Add Venture" to register your startup.',
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
        ),
      );
    }
    if (state.filteredVentures.isEmpty) {
      return Center(
        child: Text(
          'No ventures match your search.',
          style: TextStyle(color: context.colors.textSecondary),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => context.read<FounderCubit>().refreshVentureHub(),
      color: AppColors.primary,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        itemCount: state.filteredVentures.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) => _VentureCard(
          venture: state.filteredVentures[i],
          score: _displayScore(state.filteredVentures[i]),
          leaderboardRank:
              _leaderboardRanks[_ventureId(state.filteredVentures[i])],
          analyzingScore:
              _analyzingVentureId == _ventureId(state.filteredVentures[i]),
          onView: () => _showDetails(state.filteredVentures[i]),
          onEdit: () => _showEdit(state.filteredVentures[i]),
          onDelete: () => _confirmDelete(state.filteredVentures[i]),
          onRefine: () => context.go('/chat'),
          onAnalyze: () => _analyzeVenture(state.filteredVentures[i]),
        ),
      ),
    );
  }
}

// ─── Card ─────────────────────────────────────────────────────────────────────

class _VentureCard extends StatelessWidget {
  final Map<String, dynamic> venture;
  final double score;
  final int? leaderboardRank;
  final bool analyzingScore;
  final VoidCallback onView;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onRefine;
  final VoidCallback onAnalyze;

  const _VentureCard({
    required this.venture,
    required this.score,
    required this.leaderboardRank,
    required this.analyzingScore,
    required this.onView,
    required this.onEdit,
    required this.onDelete,
    required this.onRefine,
    required this.onAnalyze,
  });

  @override
  Widget build(BuildContext context) {
    final name = venture['name'] as String? ?? 'Unnamed';
    final tagline = venture['tagline'] as String? ?? '';
    final stage = venture['stage'] as String? ?? 'ideation';
    final industry = venture['industry'] as String? ?? 'other';
    final stageColor = _stageColors[stage] ?? const Color(0xFF9E9E9E);
    final industryIcon = _industryIcons[industry] ?? Icons.category_rounded;
    final logoUrl = _ventureMediaUrl(venture['logo_url'] as String?);
    final status = _VentureHubScreenState._stageToStatus(stage);

    return GestureDetector(
      onTap: onView,
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: stageColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: logoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(
                              logoUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Icon(
                                industryIcon,
                                color: stageColor,
                                size: 22,
                              ),
                            ),
                          )
                        : Icon(industryIcon, color: stageColor, size: 22),
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
                            fontSize: 15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (tagline.trim().isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            tagline,
                            style: TextStyle(
                              color: context.colors.textSecondary,
                              fontSize: 12,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    color: context.colors.surface,
                    icon: Icon(
                      Icons.more_vert,
                      color: context.colors.textSecondary,
                      size: 20,
                    ),
                    itemBuilder: (_) => [
                      PopupMenuItem(
                        value: 'view',
                        child: Row(
                          children: [
                            Icon(
                              Icons.visibility_outlined,
                              size: 18,
                              color: context.colors.textSecondary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'View Details',
                              style: TextStyle(
                                color: context.colors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(
                              Icons.edit_outlined,
                              size: 18,
                              color: context.colors.textSecondary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Edit',
                              style: TextStyle(
                                color: context.colors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(
                              Icons.delete_outline,
                              size: 18,
                              color: Colors.redAccent,
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Delete',
                              style: TextStyle(color: Colors.redAccent),
                            ),
                          ],
                        ),
                      ),
                    ],
                    onSelected: (v) {
                      if (v == 'view') onView();
                      if (v == 'edit') onEdit();
                      if (v == 'delete') onDelete();
                    },
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _Badge(
                    label: _stageLabels[stage] ?? stage,
                    color: stageColor,
                  ),
                  _Badge(
                    label: _industryLabels[industry] ?? industry,
                    color: AppColors.primary.withValues(alpha: 0.8),
                  ),
                  _Badge(label: status.label, color: status.color),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onRefine,
                      icon: const Icon(Icons.auto_awesome, size: 15),
                      label: const Text('Refine with AI'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF7C3AED),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: analyzingScore ? null : onAnalyze,
                      icon: analyzingScore
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.auto_graph_rounded, size: 15),
                      label: Text(analyzingScore ? 'Analyzing...' : 'Analyze'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      'Uruti Score: ${score.round()}/100',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  if (leaderboardRank != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        'Leaderboard #$leaderboardRank',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color? color;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.primary;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration: BoxDecoration(
            color: selected ? c : context.colors.surface,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : context.colors.textSecondary,
              fontSize: 12,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ),
      ),
    );
  }
}
// ─── Stat Chip ────────────────────────────────────────────────────────────────

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  const _StatChip({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(10),
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
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 10,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Detail Section ───────────────────────────────────────────────────────────

class _DetailSection extends StatelessWidget {
  final String title;
  final String body;
  final BuildContext ctx;
  const _DetailSection({
    required this.title,
    required this.body,
    required this.ctx,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: ctx.colors.textSecondary,
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          body,
          style: TextStyle(
            color: ctx.colors.textPrimary,
            fontSize: 13,
            height: 1.5,
          ),
        ),
      ],
    );
  }
}

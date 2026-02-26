import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';
import '../../services/api_service.dart';
import '../../screens/main_scaffold.dart';

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
  List<Map<String, dynamic>> _ventures = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _loading = true;
  String? _error;

  final _searchCtrl = TextEditingController();
  String _stageFilter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
    _searchCtrl.addListener(_applyFilter);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiService.instance.getMyVentures();
      if (!mounted) return;
      final list = List<Map<String, dynamic>>.from(
        data.map((e) => Map<String, dynamic>.from(e as Map)),
      );
      setState(() {
        _ventures = list;
        _loading = false;
      });
      _applyFilter();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _applyFilter() {
    final q = _searchCtrl.text.trim().toLowerCase();
    setState(() {
      _filtered = _ventures.where((v) {
        final matchQuery =
            q.isEmpty ||
            (v['name'] as String? ?? '').toLowerCase().contains(q) ||
            (v['industry'] as String? ?? '').toLowerCase().contains(q) ||
            (v['tagline'] as String? ?? '').toLowerCase().contains(q);
        final matchStage = _stageFilter == 'all' || v['stage'] == _stageFilter;
        return matchQuery && matchStage;
      }).toList();
    });
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
    try {
      await ApiService.instance.deleteVenture(id);
      _load();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Venture deleted')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  Future<void> _showEdit(Map<String, dynamic> venture) async {
    final id = venture['id'] as int?;
    if (id == null) return;

    final nameCtrl = TextEditingController(
      text: venture['name'] as String? ?? '',
    );
    final taglineCtrl = TextEditingController(
      text: venture['tagline'] as String? ?? '',
    );
    final problemCtrl = TextEditingController(
      text: venture['problem_statement'] as String? ?? '',
    );
    final solutionCtrl = TextEditingController(
      text: venture['solution'] as String? ?? '',
    );
    final marketCtrl = TextEditingController(
      text: venture['target_market'] as String? ?? '',
    );
    String stage = (venture['stage'] as String? ?? 'ideation');
    String? industry = venture['industry'] as String?;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: EdgeInsets.only(
            top: 20,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'Edit Venture',
                    style: TextStyle(
                      color: ctx.colors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: Icon(Icons.close, color: ctx.colors.textSecondary),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _modalField(ctx, 'Name', nameCtrl),
              const SizedBox(height: 12),
              _modalField(ctx, 'Tagline', taglineCtrl),
              const SizedBox(height: 12),
              _modalField(ctx, 'Problem Statement', problemCtrl, maxLines: 3),
              const SizedBox(height: 12),
              _modalField(ctx, 'Solution', solutionCtrl, maxLines: 3),
              const SizedBox(height: 12),
              _modalField(ctx, 'Target Market', marketCtrl, maxLines: 2),
              const SizedBox(height: 12),
              // Stage picker
              Text(
                'Stage',
                style: TextStyle(color: ctx.colors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: _stageLabels.entries.map((e) {
                  final selected = stage == e.key;
                  return ChoiceChip(
                    label: Text(
                      e.value,
                      style: TextStyle(
                        fontSize: 12,
                        color: selected
                            ? Colors.white
                            : ctx.colors.textSecondary,
                      ),
                    ),
                    selected: selected,
                    selectedColor: _stageColors[e.key] ?? AppColors.primary,
                    backgroundColor: ctx.colors.background,
                    onSelected: (_) => setModal(() => stage = e.key),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              // Industry picker
              Text(
                'Industry',
                style: TextStyle(color: ctx.colors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: _industryLabels.entries.map((e) {
                  final selected = industry == e.key;
                  return ChoiceChip(
                    label: Text(
                      e.value,
                      style: TextStyle(
                        fontSize: 12,
                        color: selected
                            ? Colors.white
                            : ctx.colors.textSecondary,
                      ),
                    ),
                    selected: selected,
                    selectedColor: AppColors.primary,
                    backgroundColor: ctx.colors.background,
                    onSelected: (_) => setModal(() => industry = e.key),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () async {
                    try {
                      await ApiService.instance.updateVenture(id, {
                        'name': nameCtrl.text.trim(),
                        'tagline': taglineCtrl.text.trim(),
                        'problem_statement': problemCtrl.text.trim(),
                        'solution': solutionCtrl.text.trim(),
                        'target_market': marketCtrl.text.trim(),
                        'stage': stage,
                        'industry': industry,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      _load();
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(
                          ctx,
                        ).showSnackBar(SnackBar(content: Text('Error: $e')));
                      }
                    }
                  },
                  child: const Text(
                    'Save Changes',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _modalField(
    BuildContext ctx,
    String label,
    TextEditingController ctrl, {
    int maxLines = 1,
  }) {
    return TextField(
      controller: ctrl,
      maxLines: maxLines,
      style: TextStyle(color: ctx.colors.textPrimary),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: ctx.colors.textSecondary),
        filled: true,
        fillColor: ctx.colors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
      ),
    );
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

  Widget _buildStatsRow() {
    final total = _ventures.length;
    final ready = _ventures
        .where((v) => (v['stage'] as String?) == 'scale')
        .length;
    final scores = _ventures
        .map((v) => (v['uruti_score'] as num?)?.toDouble() ?? 0.0)
        .toList();
    final avgScore = scores.isEmpty
        ? 0.0
        : scores.reduce((a, b) => a + b) / scores.length;
    final tracks = <String>{};
    for (final v in _ventures) {
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
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: stageColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(industryIcon, color: stageColor),
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
                    color: AppColors.primary.withOpacity(0.7),
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
                          color: AppColors.primary.withOpacity(0.4),
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
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
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
            onPressed: _load,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'Add Venture',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
        onPressed: () async {
          final added = await context.push('/ventures/new');
          if (added == true) _load();
        },
      ),
      body: Column(
        children: [
          // Stats row (visible when ventures are loaded)
          if (!_loading && _ventures.isNotEmpty) _buildStatsRow(),
          // Search bar
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
          // Stage filter chips
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              children: [
                _FilterChip(
                  label: 'All',
                  selected: _stageFilter == 'all',
                  onTap: () {
                    setState(() => _stageFilter = 'all');
                    _applyFilter();
                  },
                ),
                ..._stageLabels.entries.map(
                  (e) => _FilterChip(
                    label: e.value,
                    selected: _stageFilter == e.key,
                    color: _stageColors[e.key],
                    onTap: () {
                      setState(() => _stageFilter = e.key);
                      _applyFilter();
                    },
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
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
              onPressed: _load,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
              ),
              child: const Text('Retry', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }
    if (_ventures.isEmpty) {
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
    if (_filtered.isEmpty) {
      return Center(
        child: Text(
          'No ventures match your search.',
          style: TextStyle(color: context.colors.textSecondary),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.primary,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        itemCount: _filtered.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) => _VentureCard(
          venture: _filtered[i],
          onView: () => _showDetails(_filtered[i]),
          onEdit: () => _showEdit(_filtered[i]),
          onDelete: () => _confirmDelete(_filtered[i]),
        ),
      ),
    );
  }
}

// ─── Card ─────────────────────────────────────────────────────────────────────

class _VentureCard extends StatelessWidget {
  final Map<String, dynamic> venture;
  final VoidCallback onView;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _VentureCard({
    required this.venture,
    required this.onView,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final name = venture['name'] as String? ?? 'Unnamed';
    final tagline = venture['tagline'] as String? ?? '';
    final stage = venture['stage'] as String? ?? 'ideation';
    final industry = venture['industry'] as String? ?? 'other';
    final stageColor = _stageColors[stage] ?? const Color(0xFF9E9E9E);
    final industryIcon = _industryIcons[industry] ?? Icons.category_rounded;
    final score = (venture['uruti_score'] as num?)?.toDouble() ?? 0.0;
    final status = _VentureHubScreenState._stageToStatus(stage);

    return Container(
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
                    color: stageColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(industryIcon, color: stageColor, size: 22),
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
                      if (tagline.isNotEmpty) ...[
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
                            style: TextStyle(color: context.colors.textPrimary),
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
                            style: TextStyle(color: context.colors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          const Icon(
                            Icons.delete_outline,
                            size: 18,
                            color: Colors.redAccent,
                          ),
                          const SizedBox(width: 8),
                          const Text(
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
            Row(
              children: [
                _Badge(label: _stageLabels[stage] ?? stage, color: stageColor),
                const SizedBox(width: 8),
                _Badge(
                  label: _industryLabels[industry] ?? industry,
                  color: AppColors.primary.withOpacity(0.8),
                ),
                const SizedBox(width: 8),
                _Badge(label: status.label, color: status.color),
                const Spacer(),
                if (score > 0)
                  Row(
                    children: [
                      Icon(Icons.star_rounded, color: Colors.amber, size: 14),
                      const SizedBox(width: 3),
                      Text(
                        '${score.round()}',
                        style: TextStyle(
                          color: context.colors.textPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
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
        color: color.withOpacity(0.15),
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

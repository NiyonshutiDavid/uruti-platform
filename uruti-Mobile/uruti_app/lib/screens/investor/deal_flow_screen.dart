import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_colors.dart';
import '../../services/api_service.dart';
import '../main_scaffold.dart';

class DealFlowScreen extends StatefulWidget {
  const DealFlowScreen({super.key});

  @override
  State<DealFlowScreen> createState() => _DealFlowScreenState();
}

class _DealFlowScreenState extends State<DealFlowScreen> {
  bool _loading = true;
  String? _error;
  final TextEditingController _searchCtrl = TextEditingController();
  String _stage = 'All';

  List<Map<String, dynamic>> _bookmarks = [];

  @override
  void initState() {
    super.initState();
    _searchCtrl.addListener(() => setState(() {}));
    _load();
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
      final data = await ApiService.instance.getBookmarks();
      if (!mounted) return;
      setState(() {
        _bookmarks = List<Map<String, dynamic>>.from(data);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  String _s(dynamic value, [String fallback = '']) {
    if (value == null) return fallback;
    final text = value.toString().trim();
    return text.isEmpty ? fallback : text;
  }

  num _n(dynamic value, [num fallback = 0]) {
    if (value is num) return value;
    return num.tryParse(value?.toString() ?? '') ?? fallback;
  }

  List<Map<String, dynamic>> get _ventures {
    return _bookmarks
        .map((b) {
          final venture = (b['venture'] is Map<String, dynamic>)
              ? Map<String, dynamic>.from(b['venture'] as Map<String, dynamic>)
              : (b['venture'] is Map)
              ? Map<String, dynamic>.from(
                  (b['venture'] as Map).cast<String, dynamic>(),
                )
              : <String, dynamic>{};

          venture['bookmark_id'] = b['id'];
          venture['venture_id'] = b['venture_id'] ?? venture['id'];
          venture['bookmark_notes'] = b['notes'];
          venture['bookmark_tags'] = b['tags'];
          return venture;
        })
        .where((v) => v.isNotEmpty)
        .toList();
  }

  List<Map<String, dynamic>> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    return _ventures.where((v) {
      final stage = _s(v['stage'], 'Unknown');
      if (_stage != 'All' && stage.toLowerCase() != _stage.toLowerCase()) {
        return false;
      }

      if (q.isEmpty) return true;
      final name = _s(v['name']).toLowerCase();
      final tagline = _s(v['tagline']).toLowerCase();
      final industry = _s(v['industry']).toLowerCase();
      return name.contains(q) || tagline.contains(q) || industry.contains(q);
    }).toList();
  }

  List<String> get _stages {
    final values =
        _ventures
            .map((v) => _s(v['stage'], 'Unknown'))
            .where((s) => s.isNotEmpty)
            .toSet()
            .toList()
          ..sort();
    return ['All', ...values];
  }

  Future<void> _removeBookmark(Map<String, dynamic> venture) async {
    final bookmarkId = (venture['bookmark_id'] as num?)?.toInt();
    if (bookmarkId == null) return;

    await ApiService.instance.deleteBookmark(bookmarkId);
    if (!mounted) return;
    setState(() {
      _bookmarks.removeWhere((b) => b['id'] == bookmarkId);
    });
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Removed from deal flow')));
  }

  @override
  Widget build(BuildContext context) {
    final ventures = _filtered;

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Deal Flow',
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
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            _overviewCard(context),
            const SizedBox(height: 12),
            TextField(
              controller: _searchCtrl,
              style: TextStyle(color: context.colors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Search bookmarked startups...',
                hintStyle: TextStyle(color: context.colors.textMuted),
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: context.colors.textSecondary,
                ),
                filled: true,
                fillColor: context.colors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: context.colors.cardBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: context.colors.cardBorder),
                ),
                focusedBorder: const OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                  borderSide: BorderSide(color: AppColors.primary),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _stages.map((s) {
                  final selected = s == _stage;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(s),
                      selected: selected,
                      onSelected: (_) => setState(() => _stage = s),
                      selectedColor: AppColors.primary.withValues(alpha: 0.16),
                      backgroundColor: context.colors.surface,
                      side: BorderSide(
                        color: selected
                            ? AppColors.primary
                            : context.colors.cardBorder,
                      ),
                      labelStyle: TextStyle(
                        color: selected
                            ? AppColors.primary
                            : context.colors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 12),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (_error != null)
              _errorCard(context)
            else if (ventures.isEmpty)
              _emptyCard(context)
            else
              ...ventures.map((v) => _ventureCard(context, v)),
          ],
        ),
      ),
    );
  }

  Widget _overviewCard(BuildContext context) {
    final ventures = _ventures;
    final avgScore = ventures.isEmpty
        ? 0
        : ventures.map((v) => _n(v['uruti_score'])).reduce((a, b) => a + b) /
              ventures.length;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.cardBorder),
      ),
      child: Row(
        children: [
          Expanded(
            child: _stat(context, 'Bookmarked Startups', '${ventures.length}'),
          ),
          Expanded(
            child: _stat(
              context,
              'Avg Uruti Score',
              avgScore.toStringAsFixed(0),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stat(BuildContext context, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(color: context.colors.textSecondary, fontSize: 12),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w900,
            fontSize: 22,
          ),
        ),
      ],
    );
  }

  Widget _ventureCard(BuildContext context, Map<String, dynamic> venture) {
    final name = _s(venture['name'], 'Startup');
    final industry = _s(venture['industry'], 'General');
    final stage = _s(venture['stage'], 'Unknown');
    final tagline = _s(venture['tagline']);
    final score = _n(venture['uruti_score']).toStringAsFixed(0);
    final ask = _n(venture['funding_goal']);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  name,
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
              ),
              Text(
                score,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900,
                  fontSize: 18,
                ),
              ),
            ],
          ),
          if (tagline.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              tagline,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _chip(industry, const Color(0xFF3B82F6)),
              _chip(stage, const Color(0xFFFFB800)),
              if (ask > 0)
                _chip('Goal: ${ask.toStringAsFixed(0)}', AppColors.primary),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              TextButton.icon(
                onPressed: () => context.go('/discovery'),
                icon: const Icon(Icons.remove_red_eye_outlined, size: 18),
                label: const Text('View in Discovery'),
              ),
              const Spacer(),
              IconButton(
                tooltip: 'Remove bookmark',
                onPressed: () => _removeBookmark(venture),
                icon: const Icon(
                  Icons.bookmark_remove_outlined,
                  color: Colors.redAccent,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _chip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _emptyCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.cardBorder),
      ),
      child: Column(
        children: [
          Icon(
            Icons.bookmark_outline,
            color: context.colors.textMuted,
            size: 28,
          ),
          const SizedBox(height: 10),
          Text(
            'No bookmarked startups yet.\nBookmark ventures from Startup Discovery to see them here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: context.colors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _errorCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Failed to load bookmarks',
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _error ?? '',
            style: TextStyle(color: context.colors.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

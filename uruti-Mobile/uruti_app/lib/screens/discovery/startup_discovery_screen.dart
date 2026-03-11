import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/app_constants.dart';
import '../../core/app_colors.dart';
import '../../services/api_service.dart';
import '../../screens/main_scaffold.dart';
import '../../widgets/in_app_video_player_screen.dart';

String? _mediaUrl(String? raw) {
  return AppConstants.normalizeMediaUrl(raw);
}

Uri? _externalUri(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  final trimmed = raw.trim();
  Uri? uri = Uri.tryParse(trimmed);
  if (uri == null || uri.scheme.isEmpty) {
    uri = Uri.tryParse('https://$trimmed');
  }
  return uri;
}

class StartupDiscoveryScreen extends StatefulWidget {
  const StartupDiscoveryScreen({super.key});

  @override
  State<StartupDiscoveryScreen> createState() => _StartupDiscoveryScreenState();
}

class _StartupDiscoveryScreenState extends State<StartupDiscoveryScreen> {
  List<Map<String, dynamic>> _ventures = [];
  bool _loading = true;
  String? _error;

  String _selectedStage = 'All';
  String _selectedSector = 'All';
  final _searchCtrl = TextEditingController();

  final Set<int> _bookmarkedVentureIds = <int>{};
  final Map<int, int> _bookmarkIdByVenture = <int, int>{};

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

  String _s(dynamic v, [String fallback = '']) {
    if (v == null) return fallback;
    final t = v.toString().trim();
    return t.isEmpty ? fallback : t;
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        ApiService.instance.getVentures(),
        ApiService.instance.getBookmarks(),
      ]);

      final ventures = List<Map<String, dynamic>>.from(results[0]);
      final bookmarks = List<Map<String, dynamic>>.from(results[1]);

      final bookmarkedVentureIds = <int>{};
      final bookmarkIdByVenture = <int, int>{};

      for (final b in bookmarks) {
        final ventureId =
            (b['venture_id'] as num?)?.toInt() ??
            ((b['venture'] is Map)
                ? ((b['venture'] as Map)['id'] as num?)?.toInt()
                : null);
        final bookmarkId = (b['id'] as num?)?.toInt();
        if (ventureId != null) bookmarkedVentureIds.add(ventureId);
        if (ventureId != null && bookmarkId != null) {
          bookmarkIdByVenture[ventureId] = bookmarkId;
        }
      }

      if (!mounted) return;
      setState(() {
        _ventures = ventures;
        _bookmarkedVentureIds
          ..clear()
          ..addAll(bookmarkedVentureIds);
        _bookmarkIdByVenture
          ..clear()
          ..addAll(bookmarkIdByVenture);
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

  List<String> get _stages {
    final values =
        _ventures
            .map((v) => _s(v['stage']))
            .where((s) => s.isNotEmpty)
            .toSet()
            .toList()
          ..sort();
    return ['All', ...values];
  }

  List<String> get _sectors {
    final values =
        _ventures
            .map((v) => _s(v['industry']))
            .where((s) => s.isNotEmpty)
            .toSet()
            .toList()
          ..sort();
    return ['All', ...values];
  }

  List<Map<String, dynamic>> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    return _ventures.where((venture) {
      final stage = _s(venture['stage']);
      final sector = _s(venture['industry']);

      if (_selectedStage != 'All' &&
          stage.toLowerCase() != _selectedStage.toLowerCase()) {
        return false;
      }
      if (_selectedSector != 'All' &&
          sector.toLowerCase() != _selectedSector.toLowerCase()) {
        return false;
      }

      if (q.isEmpty) return true;
      final name = _s(venture['name']).toLowerCase();
      final tagline = _s(venture['tagline']).toLowerCase();
      final description = _s(venture['description']).toLowerCase();
      return name.contains(q) || tagline.contains(q) || description.contains(q);
    }).toList();
  }

  Future<void> _toggleBookmark(Map<String, dynamic> venture) async {
    final ventureId = (venture['id'] as num?)?.toInt();
    if (ventureId == null) return;

    try {
      if (_bookmarkedVentureIds.contains(ventureId)) {
        final confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Remove Bookmark?'),
            content: const Text('Remove this startup from your bookmarks?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Remove'),
              ),
            ],
          ),
        );
        if (confirmed != true) return;

        final bookmarkId = _bookmarkIdByVenture[ventureId];
        if (bookmarkId == null) return;
        await ApiService.instance.deleteBookmark(bookmarkId);
        if (!mounted) return;
        setState(() {
          _bookmarkedVentureIds.remove(ventureId);
          _bookmarkIdByVenture.remove(ventureId);
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Removed from bookmarks')));
      } else {
        final created = await ApiService.instance.createBookmark(ventureId);
        if (!mounted) return;
        final bookmarkId = (created['id'] as num?)?.toInt();
        setState(() {
          _bookmarkedVentureIds.add(ventureId);
          if (bookmarkId != null) _bookmarkIdByVenture[ventureId] = bookmarkId;
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Added to bookmarks')));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  String _formatCurrency(double amount) {
    if (amount >= 1000000) {
      return '\$${(amount / 1000000).toStringAsFixed(1)}M';
    }
    if (amount >= 1000) {
      return '\$${(amount / 1000).toStringAsFixed(1)}K';
    }
    return '\$${amount.toStringAsFixed(0)}';
  }

  Future<void> _openExternalUrl(
    BuildContext ctx,
    String rawUrl, {
    String errorMessage = 'Unable to open link',
  }) async {
    final uri = _externalUri(rawUrl);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      return;
    }
    if (!ctx.mounted) return;
    ScaffoldMessenger.of(
      ctx,
    ).showSnackBar(SnackBar(content: Text(errorMessage)));
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
        final name = _s(venture['name'], 'Startup');
        final tagline = _s(venture['tagline']);
        final description = _s(venture['description']);
        final problem = _s(venture['problem_statement']);
        final solution = _s(venture['solution']);
        final market = _s(venture['target_market']);
        final businessModel = _s(venture['business_model']);
        final fundingGoal = (venture['funding_goal'] as num?)?.toDouble();
        final fundingRaised = (venture['funding_raised'] as num?)?.toDouble();
        final revenue = (venture['revenue'] as num?)?.toDouble();
        final burnRate = (venture['monthly_burn_rate'] as num?)?.toDouble();
        final mrr = (venture['mrr'] as num?)?.toDouble();
        final teamSize = (venture['team_size'] as num?)?.toInt();
        final customers = (venture['customers'] as num?)?.toInt();
        final stage = _s(venture['stage']);
        final industry = _s(venture['industry']);
        final score = (venture['uruti_score'] as num?)?.toInt() ?? 0;
        final pitchDeckUrl = _s(venture['pitch_deck_url']);
        final demoVideoUrl = _s(venture['demo_video_url']);
        final demoVideoMediaUrl = _mediaUrl(demoVideoUrl);
        final founderId = (venture['founder_id'] as num?)?.toInt();
        final logoUrl = _mediaUrl(venture['logo_url'] as String?);
        final bannerUrl = _mediaUrl(venture['banner_url'] as String?);

        return DraggableScrollableSheet(
          initialChildSize: 0.72,
          maxChildSize: 0.94,
          minChildSize: 0.45,
          expand: false,
          builder: (_, scrollCtrl) => ListView(
            controller: scrollCtrl,
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 30),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: ctx.colors.darkGreenMid,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: logoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(
                              logoUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Icon(
                                Icons.rocket_launch_rounded,
                                color: context.colors.accent,
                              ),
                            ),
                          )
                        : Icon(
                            Icons.rocket_launch_rounded,
                            color: context.colors.accent,
                          ),
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
                            fontSize: 18,
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
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: context.colors.accent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      'Uruti: $score',
                      style: TextStyle(
                        color: context.colors.accent,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (stage.isNotEmpty) _Tag(stage),
                  if (industry.isNotEmpty) _Tag(industry),
                ],
              ),
              if (description.isNotEmpty) ...[
                const SizedBox(height: 14),
                Text(
                  'Overview',
                  style: TextStyle(
                    color: ctx.colors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
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
                const SizedBox(height: 12),
                Text(
                  'Problem',
                  style: TextStyle(
                    color: ctx.colors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
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
                const SizedBox(height: 12),
                Text(
                  'Solution',
                  style: TextStyle(
                    color: ctx.colors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
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
                const SizedBox(height: 12),
                Text(
                  'Target Market',
                  style: TextStyle(
                    color: ctx.colors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
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
              if (businessModel.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  'Business Model',
                  style: TextStyle(
                    color: ctx.colors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  businessModel,
                  style: TextStyle(
                    color: ctx.colors.textSecondary,
                    fontSize: 14,
                    height: 1.6,
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Text(
                'Business Snapshot',
                style: TextStyle(
                  color: ctx.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (fundingGoal != null)
                    _Tag('Funding Goal: ${_formatCurrency(fundingGoal)}'),
                  if (fundingRaised != null)
                    _Tag('Funding Raised: ${_formatCurrency(fundingRaised)}'),
                  if (revenue != null)
                    _Tag('Revenue: ${_formatCurrency(revenue)}'),
                  if (burnRate != null)
                    _Tag('Burn Rate: ${_formatCurrency(burnRate)} / mo'),
                  if (mrr != null) _Tag('MRR: ${_formatCurrency(mrr)}'),
                  if (teamSize != null) _Tag('Team Size: $teamSize'),
                  if (customers != null) _Tag('Customers: $customers'),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Pitch Deck',
                style: TextStyle(
                  color: ctx.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 6),
              if (pitchDeckUrl.isNotEmpty)
                OutlinedButton.icon(
                  onPressed: () => _openExternalUrl(
                    ctx,
                    pitchDeckUrl,
                    errorMessage: 'Unable to open pitch deck link',
                  ),
                  icon: const Icon(Icons.slideshow_rounded),
                  label: const Text('View Pitch Deck'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: context.colors.accent,
                    side: BorderSide(
                      color: context.colors.accent.withValues(alpha: 0.35),
                    ),
                  ),
                )
              else
                Text(
                  'Pitch deck not available',
                  style: TextStyle(
                    color: ctx.colors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              if ((demoVideoMediaUrl ?? '').isNotEmpty) ...[
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () async {
                    await Navigator.of(ctx).push(
                      MaterialPageRoute(
                        builder: (_) => InAppVideoPlayerScreen(
                          videoUrl: demoVideoMediaUrl!,
                          title: '$name Demo Video',
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.play_circle_fill_rounded),
                  label: const Text('Play Demo Video'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: context.colors.accent,
                    side: BorderSide(
                      color: context.colors.accent.withValues(alpha: 0.35),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 18),
              if (founderId != null)
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      context.go('/profile/view/$founderId');
                    },
                    icon: const Icon(Icons.person_outline_rounded),
                    label: const Text('View Founder Profile'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: context.colors.accent,
                      side: BorderSide(
                        color: context.colors.accent.withValues(alpha: 0.35),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: Colors.white),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Startup Discovery',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.emoji_events_outlined, color: Colors.white),
            onPressed: () => context.go('/leaderboard'),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: context.colors.accent,
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
          children: [
            TextField(
              controller: _searchCtrl,
              style: TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search startups...',
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
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                  borderSide: BorderSide(color: context.colors.accent),
                ),
              ),
            ),
            const SizedBox(height: 10),
            _FilterRow(
              label: 'Stage:',
              items: _stages,
              selected: _selectedStage,
              onSelect: (v) => setState(() => _selectedStage = v),
            ),
            _FilterRow(
              label: 'Sector:',
              items: _sectors,
              selected: _selectedSector,
              onSelect: (v) => setState(() => _selectedSector = v),
            ),
            const SizedBox(height: 6),
            if (_loading)
              Padding(
                padding: EdgeInsets.only(top: 42),
                child: Center(
                  child: CircularProgressIndicator(
                    color: context.colors.accent,
                  ),
                ),
              )
            else if (_error != null)
              _errorCard(context)
            else if (_filtered.isEmpty)
              _emptyCard(context)
            else
              ..._filtered.map((venture) {
                final ventureId = (venture['id'] as num?)?.toInt() ?? -1;
                final bookmarked = _bookmarkedVentureIds.contains(ventureId);
                return _StartupCard(
                  data: venture,
                  isBookmarked: bookmarked,
                  onToggleBookmark: () => _toggleBookmark(venture),
                  onViewDetails: () => _showVentureDetails(venture),
                );
              }),
          ],
        ),
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
            'Failed to load startups',
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _error ?? '',
            style: TextStyle(color: context.colors.textSecondary),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _emptyCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.cardBorder),
      ),
      child: Text(
        'No startups found for current filters.',
        textAlign: TextAlign.center,
        style: TextStyle(color: context.colors.textSecondary),
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  final String label;
  final List<String> items;
  final String selected;
  final void Function(String) onSelect;

  const _FilterRow({
    required this.label,
    required this.items,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Text(
            label,
            style: TextStyle(
              color: context.colors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: items.map((s) {
                  final selectedNow = selected == s;
                  return GestureDetector(
                    onTap: () => onSelect(s),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: selectedNow
                            ? context.colors.accent.withValues(alpha: 0.15)
                            : context.colors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: selectedNow
                              ? context.colors.accent
                              : context.colors.divider,
                        ),
                      ),
                      child: Text(
                        s,
                        style: TextStyle(
                          color: selectedNow
                              ? context.colors.accent
                              : context.colors.textSecondary,
                          fontSize: 12,
                          fontWeight: selectedNow
                              ? FontWeight.w700
                              : FontWeight.normal,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StartupCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final bool isBookmarked;
  final VoidCallback onToggleBookmark;
  final VoidCallback onViewDetails;

  const _StartupCard({
    required this.data,
    required this.isBookmarked,
    required this.onToggleBookmark,
    required this.onViewDetails,
  });

  String _s(dynamic value, [String fallback = '']) {
    if (value == null) return fallback;
    final text = value.toString().trim();
    return text.isEmpty ? fallback : text;
  }

  @override
  Widget build(BuildContext context) {
    final name = _s(data['name'], 'Startup');
    final score = (data['uruti_score'] as num?)?.toInt() ?? 0;
    final stage = _s(data['stage']);
    final industry = _s(data['industry']);
    final tagline = _s(data['tagline']);
    final logoUrl = _mediaUrl(data['logo_url'] as String?);

    final initials = name
        .split(' ')
        .where((e) => e.isNotEmpty)
        .map((e) => e[0])
        .take(2)
        .join()
        .toUpperCase();

    return GestureDetector(
      onTap: onViewDetails,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.colors.divider),
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: context.colors.darkGreenMid,
                borderRadius: BorderRadius.circular(12),
              ),
              child: logoUrl != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        logoUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Center(
                          child: Text(
                            initials,
                            style: TextStyle(
                              color: context.colors.accent,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                    )
                  : Center(
                      child: Text(
                        initials,
                        style: TextStyle(
                          color: context.colors.accent,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                    ),
            ),
            const SizedBox(width: 14),
            Expanded(
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
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: context.colors.accent.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '$score',
                          style: TextStyle(
                            color: context.colors.accent,
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (tagline.isNotEmpty) ...[
                    const SizedBox(height: 5),
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
                      if (stage.isNotEmpty) _Tag(stage),
                      if (industry.isNotEmpty) ...[
                        const SizedBox(width: 6),
                        _Tag(industry),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: onToggleBookmark,
              icon: Icon(
                isBookmarked
                    ? Icons.bookmark_rounded
                    : Icons.bookmark_border_rounded,
                color: isBookmarked
                    ? context.colors.accent
                    : context.colors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String label;
  const _Tag(this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: context.colors.divider),
      ),
      child: Text(
        label,
        style: TextStyle(color: context.colors.textSecondary, fontSize: 10),
      ),
    );
  }
}

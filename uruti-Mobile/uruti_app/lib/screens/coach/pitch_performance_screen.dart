import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:video_player/video_player.dart';
import '../../core/app_colors.dart';
import '../../core/app_constants.dart';
import '../../services/api_service.dart';
import '../main_scaffold.dart';

class PitchPerformanceScreen extends StatefulWidget {
  const PitchPerformanceScreen({super.key});
  @override
  State<PitchPerformanceScreen> createState() => _PitchPerformanceScreenState();
}

class _PitchPerformanceScreenState extends State<PitchPerformanceScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _sessions = [];
  String _searchQuery = '';
  String? _ventureFilter; // null = All
  int? _selectedIndex; // null = no session selected (list view)
  VideoPlayerController? _videoController;
  bool _playingVideo = false;
  final Set<int> _deletingSessionIds = <int>{};

  @override
  void initState() {
    super.initState();
    _fetchSessions();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _fetchSessions() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.instance.getPitchSessions();
      if (!mounted) return;
      setState(() {
        _sessions = List<Map<String, dynamic>>.from(data);
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  // ── helpers ──
  int _score(Map<String, dynamic> s) =>
      ((s['overall_score'] ?? s['overallScore'] ?? 0) as num).toInt();
  int _metric(Map<String, dynamic> s, String key) =>
      ((s[key] ?? 0) as num).toInt();
  String _ventureName(Map<String, dynamic> s) =>
      (s['venture_name'] ?? s['venture'] ?? 'Venture').toString();
  String _duration(Map<String, dynamic> s) =>
      (s['duration'] ?? '0:00').toString();
  String _pitchType(Map<String, dynamic> s) =>
      (s['pitch_type'] ?? s['title'] ?? '').toString();
  String _videoUrl(Map<String, dynamic> s) => (s['video_url'] ?? '').toString();
  String _date(Map<String, dynamic> s) {
    final d = s['created_at'] ?? s['date'] ?? '';
    if (d.toString().length >= 10) {
      try {
        final dt = DateTime.parse(d.toString()).toLocal();
        return '${dt.day}/${dt.month}/${dt.year}';
      } catch (_) {}
    }
    return d.toString();
  }

  List<String> _feedback(Map<String, dynamic> s) {
    final fb = s['feedback'];
    if (fb is List) return fb.map((e) => e.toString()).toList();

    if (fb is String && fb.trim().isNotEmpty) {
      return [fb.trim()];
    }

    if (fb is Map<String, dynamic>) {
      final tips = fb['tips'];
      if (tips is List) return tips.map((e) => e.toString()).toList();
      final summary = fb['summary'];
      if (summary is String && summary.trim().isNotEmpty) {
        return [summary.trim()];
      }
    }

    final aiFeedback = s['ai_feedback'];
    if (aiFeedback is Map<String, dynamic>) {
      final tips = aiFeedback['tips'];
      if (tips is List) return tips.map((e) => e.toString()).toList();
    }

    return [];
  }

  Color _scoreColor(int score) {
    if (score >= 85) return const Color(0xFF76B947);
    if (score >= 70) return const Color(0xFFFFB800);
    return const Color(0xFFFF6B6B);
  }

  List<String> get _ventureNames {
    final names = _sessions.map(_ventureName).toSet().toList();
    names.sort();
    return names;
  }

  List<Map<String, dynamic>> get _filteredSessions {
    var list = _sessions;
    if (_ventureFilter != null) {
      list = list.where((s) => _ventureName(s) == _ventureFilter).toList();
    }
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list
          .where(
            (s) =>
                _ventureName(s).toLowerCase().contains(q) ||
                _pitchType(s).toLowerCase().contains(q) ||
                _date(s).toLowerCase().contains(q),
          )
          .toList();
    }
    return list;
  }

  int? _sessionId(Map<String, dynamic> s) {
    final raw = s['id'];
    if (raw is int) return raw;
    return int.tryParse('${raw ?? ''}');
  }

  Future<bool> _confirmAndDeleteSession(Map<String, dynamic> s) async {
    final sessionId = _sessionId(s);
    if (sessionId == null) {
      if (!mounted) return false;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to delete this session')),
      );
      return false;
    }

    if (_deletingSessionIds.contains(sessionId)) return false;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete session?'),
        content: Text(
          'This will permanently remove ${_ventureName(s)} (${_date(s)}).',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return false;

    setState(() => _deletingSessionIds.add(sessionId));
    try {
      await ApiService.instance.deletePitchSession(sessionId);
      return true;
    } catch (_) {
      if (!mounted) return false;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Failed to delete session')));
      return false;
    } finally {
      if (mounted) {
        setState(() => _deletingSessionIds.remove(sessionId));
      }
    }
  }

  void _openVideo(Map<String, dynamic> session) {
    final url = _videoUrl(session);
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No video available for this session')),
      );
      return;
    }
    final fullUrl = url.startsWith('http')
        ? url
        : '${AppConstants.apiBaseUrl}$url';

    _videoController?.dispose();
    final controller = VideoPlayerController.networkUrl(Uri.parse(fullUrl));
    controller
        .initialize()
        .then((_) {
          if (!mounted) return;
          setState(() {
            _videoController = controller;
            _playingVideo = true;
          });
          controller.play();
        })
        .catchError((e) {
          if (!mounted) return;
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Failed to load video: $e')));
        });
  }

  void _closeVideo() {
    _videoController?.pause();
    _videoController?.dispose();
    _videoController = null;
    setState(() => _playingVideo = false);
  }

  @override
  Widget build(BuildContext context) {
    // Full-screen video player
    if (_playingVideo && _videoController != null) {
      return _buildVideoPlayer(context);
    }

    // Session detail view
    if (_selectedIndex != null) {
      final filtered = _filteredSessions;
      if (_selectedIndex! < filtered.length) {
        return _buildSessionDetail(context, filtered[_selectedIndex!]);
      }
    }

    // Main list view
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        title: const Text(
          'Pitch Performance',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: Colors.white),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _sessions.isEmpty
          ? _buildEmptyState(context)
          : _buildListView(context),
    );
  }

  // ══════════════════════════════════════════════════════════
  //  VIDEO  PLAYER
  // ══════════════════════════════════════════════════════════
  Widget _buildVideoPlayer(BuildContext context) {
    final ctrl = _videoController!;
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Video
            Center(
              child: ctrl.value.isInitialized
                  ? AspectRatio(
                      aspectRatio: ctrl.value.aspectRatio,
                      child: VideoPlayer(ctrl),
                    )
                  : const CircularProgressIndicator(color: Colors.white),
            ),
            // Top bar
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.7),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: _closeVideo,
                    ),
                    const Expanded(
                      child: Text(
                        'Pitch Recording',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
            ),
            // Bottom controls
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.7),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Progress bar
                    ValueListenableBuilder<VideoPlayerValue>(
                      valueListenable: ctrl,
                      builder: (_, v, __) {
                        final pos = v.position.inMilliseconds;
                        final dur = v.duration.inMilliseconds;
                        return Column(
                          children: [
                            SliderTheme(
                              data: SliderThemeData(
                                thumbShape: const RoundSliderThumbShape(
                                  enabledThumbRadius: 6,
                                ),
                                trackHeight: 3,
                                activeTrackColor: context.colors.accent,
                                inactiveTrackColor: Colors.white.withValues(
                                  alpha: 0.3,
                                ),
                                thumbColor: context.colors.accent,
                              ),
                              child: Slider(
                                value: dur > 0
                                    ? pos.toDouble() / dur.toDouble()
                                    : 0,
                                onChanged: (val) {
                                  ctrl.seekTo(
                                    Duration(milliseconds: (val * dur).toInt()),
                                  );
                                },
                              ),
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  _formatDuration(v.position),
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                  ),
                                ),
                                Text(
                                  _formatDuration(v.duration),
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 4),
                    // Play / pause
                    ValueListenableBuilder<VideoPlayerValue>(
                      valueListenable: ctrl,
                      builder: (_, v, __) => IconButton(
                        iconSize: 48,
                        icon: Icon(
                          v.isPlaying
                              ? Icons.pause_circle_filled
                              : Icons.play_circle_filled,
                          color: Colors.white,
                        ),
                        onPressed: () {
                          v.isPlaying ? ctrl.pause() : ctrl.play();
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  // ══════════════════════════════════════════════════════════
  //  EMPTY STATE
  // ══════════════════════════════════════════════════════════
  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.play_circle_outline,
              size: 72,
              color: context.colors.textSecondary.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No Pitch Sessions Yet',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Start your first practice session to get AI-powered feedback on your pitch delivery.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => context.go('/recording'),
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start First Session'),
              style: ElevatedButton.styleFrom(
                backgroundColor: context.colors.accent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════
  //  LIST VIEW  (stats + search + filter + session list)
  // ══════════════════════════════════════════════════════════
  Widget _buildListView(BuildContext context) {
    final filtered = _filteredSessions;
    final totalSessions = _sessions.length;
    final avgScore = _sessions.isEmpty
        ? 0
        : (_sessions.map(_score).reduce((a, b) => a + b) / totalSessions)
              .round();
    final bestScore = _sessions.isEmpty
        ? 0
        : _sessions.map(_score).reduce((a, b) => a > b ? a : b);
    final firstScore = _sessions.length > 1 ? _score(_sessions.last) : avgScore;
    final lastScore = _sessions.isNotEmpty ? _score(_sessions.first) : avgScore;
    final improvement = lastScore - firstScore;

    return RefreshIndicator(
      onRefresh: _fetchSessions,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Performance Hub',
                        style: TextStyle(
                          color: context.colors.textPrimary,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Track and analyze your pitch progress',
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                FilledButton.icon(
                  onPressed: () => context.go('/recording'),
                  icon: const Icon(Icons.play_arrow, size: 18),
                  label: const Text('Practice'),
                  style: FilledButton.styleFrom(
                    backgroundColor: context.colors.accent,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Stat cards
            Row(
              children: [
                _StatCard(
                  'Sessions',
                  '$totalSessions',
                  Icons.trending_up,
                  context.colors.accent,
                ),
                const SizedBox(width: 10),
                _StatCard(
                  'Avg Score',
                  '$avgScore%',
                  Icons.bar_chart,
                  _scoreColor(avgScore),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _StatCard(
                  'Best Score',
                  '$bestScore%',
                  Icons.emoji_events,
                  context.colors.accent,
                ),
                const SizedBox(width: 10),
                _StatCard(
                  'Improvement',
                  '${improvement >= 0 ? '+' : ''}$improvement%',
                  Icons.north_east,
                  improvement >= 0
                      ? context.colors.accent
                      : const Color(0xFFFF6B6B),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Search bar
            TextField(
              onChanged: (v) => setState(() => _searchQuery = v),
              style: TextStyle(color: context.colors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Search sessions...',
                hintStyle: TextStyle(color: context.colors.textSecondary),
                prefixIcon: Icon(
                  Icons.search,
                  color: context.colors.textSecondary,
                ),
                filled: true,
                fillColor: context.colors.card,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: context.colors.divider),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: context.colors.divider),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: context.colors.accent),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Venture filter chips
            if (_ventureNames.length > 1)
              SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _filterChip(context, 'All', _ventureFilter == null, () {
                      setState(() => _ventureFilter = null);
                    }),
                    ..._ventureNames.map(
                      (name) => Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: _filterChip(
                          context,
                          name,
                          _ventureFilter == name,
                          () => setState(() => _ventureFilter = name),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 16),

            // Session Archive title
            Text(
              'Session Archive',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${filtered.length} recording${filtered.length == 1 ? '' : 's'}',
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 12),

            if (filtered.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Center(
                  child: Text(
                    'No sessions match your search.',
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                ),
              )
            else
              ...List.generate(filtered.length, (i) {
                final s = filtered[i];
                final sessionId = _sessionId(s) ?? i;
                return Dismissible(
                  key: ValueKey('pitch-session-$sessionId'),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF4D4F),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    child: const Icon(
                      Icons.delete_outline,
                      color: Colors.white,
                    ),
                  ),
                  confirmDismiss: (_) => _confirmAndDeleteSession(s),
                  onDismissed: (_) {
                    if (!mounted) return;
                    setState(() {
                      _sessions.removeWhere(
                        (item) => _sessionId(item) == _sessionId(s),
                      );
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Pitch session deleted')),
                    );
                  },
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedIndex = i),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: context.colors.card,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: context.colors.divider),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _scoreColor(
                                _score(s),
                              ).withValues(alpha: 0.15),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '${_score(s)}',
                              style: TextStyle(
                                color: _scoreColor(_score(s)),
                                fontWeight: FontWeight.w800,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _ventureName(s),
                                  style: TextStyle(
                                    color: context.colors.textPrimary,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${_pitchType(s).isNotEmpty ? '${_pitchType(s)} • ' : ''}${_date(s)} • ${_duration(s)}',
                                  style: TextStyle(
                                    color: context.colors.textSecondary,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            Icons.chevron_right,
                            color: context.colors.textSecondary,
                            size: 22,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(
    BuildContext context,
    String label,
    bool selected,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? context.colors.accent : context.colors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? context.colors.accent : context.colors.divider,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : context.colors.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════
  //  SESSION DETAIL VIEW
  // ══════════════════════════════════════════════════════════
  Widget _buildSessionDetail(BuildContext context, Map<String, dynamic> s) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        title: Text(
          _ventureName(s),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => setState(() => _selectedIndex = null),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Session info card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.colors.divider),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _scoreColor(_score(s)).withValues(alpha: 0.15),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${_score(s)}',
                          style: TextStyle(
                            color: _scoreColor(_score(s)),
                            fontWeight: FontWeight.w900,
                            fontSize: 22,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _ventureName(s),
                              style: TextStyle(
                                color: context.colors.textPrimary,
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              '${_pitchType(s).isNotEmpty ? '${_pitchType(s)} • ' : ''}${_date(s)}',
                              style: TextStyle(
                                color: context.colors.textSecondary,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      _InfoChip(Icons.timer_outlined, _duration(s), context),
                      const SizedBox(width: 10),
                      _InfoChip(Icons.score, '${_score(s)}%', context),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Watch Recording button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _openVideo(s),
                icon: const Icon(Icons.play_circle_outline),
                label: const Text('View Pitch Recording'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.colors.accent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Performance Breakdown
            Text(
              'Performance Breakdown',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            ...[
              ('Overall', _score(s), context.colors.accent),
              ('Pacing', _metric(s, 'pacing'), context.colors.accent),
              ('Clarity', _metric(s, 'clarity'), const Color(0xFF3B82F6)),
              ('Confidence', _metric(s, 'confidence'), const Color(0xFFFFB800)),
              ('Structure', _metric(s, 'structure'), const Color(0xFF8B5CF6)),
              ('Engagement', _metric(s, 'engagement'), const Color(0xFFFF6B6B)),
            ].map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Row(
                  children: [
                    SizedBox(
                      width: 90,
                      child: Text(
                        e.$1,
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: e.$2 / 100,
                          backgroundColor: context.colors.divider,
                          color: e.$3,
                          minHeight: 8,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 42,
                      child: Text(
                        '${e.$2}%',
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          color: e.$3,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Strengths & Improve
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: context.colors.card,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: context.colors.divider),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Strengths',
                          style: TextStyle(
                            color: context.colors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 10),
                        _strengthItem(
                          context,
                          _metric(s, 'structure') >= 85
                              ? 'Excellent structure'
                              : _metric(s, 'clarity') >= 85
                              ? 'Clear communication'
                              : 'Good delivery',
                        ),
                        const SizedBox(height: 6),
                        _strengthItem(
                          context,
                          _metric(s, 'confidence') >= 80
                              ? 'Strong confidence'
                              : 'Steady presence',
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: context.colors.card,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: context.colors.divider),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Improve',
                          style: TextStyle(
                            color: context.colors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 10),
                        if (_metric(s, 'pacing') < 80)
                          _improvementItem(context, 'Work on pacing'),
                        if (_metric(s, 'engagement') < 80)
                          _improvementItem(context, 'Enhance engagement'),
                        if (_metric(s, 'confidence') < 80)
                          _improvementItem(context, 'Build confidence'),
                        if (_metric(s, 'pacing') >= 80 &&
                            _metric(s, 'engagement') >= 80 &&
                            _metric(s, 'confidence') >= 80)
                          Text(
                            'Great work! Keep it up.',
                            style: TextStyle(
                              color: context.colors.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // AI Feedback
            if (_feedback(s).isNotEmpty) ...[
              const SizedBox(height: 20),
              Text(
                'AI Feedback',
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 12),
              ..._feedback(s).map(
                (fb) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: context.colors.accent.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: context.colors.accent.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 5),
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: context.colors.accent,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          fb,
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
            ],

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _strengthItem(BuildContext context, String text) => Row(
    children: [
      Icon(Icons.emoji_events, color: context.colors.accent, size: 16),
      const SizedBox(width: 6),
      Expanded(
        child: Text(
          text,
          style: TextStyle(color: context.colors.accent, fontSize: 13),
        ),
      ),
    ],
  );

  Widget _improvementItem(BuildContext context, String text) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(
      children: [
        const Icon(Icons.flag, color: Color(0xFFFF6B6B), size: 16),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: Color(0xFFFF6B6B), fontSize: 13),
          ),
        ),
      ],
    ),
  );
}

// ══════════════════════════════════════════════════════════
//  PRIVATE WIDGETS
// ══════════════════════════════════════════════════════════

class _StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatCard(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.divider),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w800,
                    fontSize: 22,
                  ),
                ),
              ],
            ),
          ),
          Icon(icon, color: color, size: 28),
        ],
      ),
    ),
  );
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String value;
  final BuildContext ctx;
  const _InfoChip(this.icon, this.value, this.ctx);

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.colors.divider),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: context.colors.accent),
          const SizedBox(width: 8),
          Text(
            value,
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ],
      ),
    ),
  );
}

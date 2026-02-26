import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_colors.dart';
import '../../services/api_service.dart';
import '../main_scaffold.dart';

class AdvisoryTracksScreen extends StatefulWidget {
  const AdvisoryTracksScreen({super.key});

  @override
  State<AdvisoryTracksScreen> createState() => _AdvisoryTracksScreenState();
}

class _AdvisoryTracksScreenState extends State<AdvisoryTracksScreen> {
  final TextEditingController _searchCtrl = TextEditingController();

  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _tracks = [];
  String _category = 'all';

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
      final raw = await ApiService.instance.getAdvisoryTracks();
      final tracks = List<Map<String, dynamic>>.from(raw);

      for (final t in tracks) {
        final id = (t['id'] as num?)?.toInt();
        if (id == null) continue;
        try {
          final p = await ApiService.instance.getUserTrackProgress(id);
          t['progress'] = p['progress_percentage'] ?? 0;
          t['status'] = p['status'] ?? 'not-started';
        } catch (_) {
          t['progress'] ??= 0;
          t['status'] ??= 'not-started';
        }
      }

      if (!mounted) return;
      setState(() {
        _tracks = tracks;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  String _asText(dynamic value, [String fallback = '']) {
    if (value == null) return fallback;
    return value.toString();
  }

  List<Map<String, dynamic>> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();

    return _tracks.where((t) {
      final category = _asText(t['category']).toLowerCase();
      if (_category != 'all' && category != _category) return false;

      if (q.isEmpty) return true;
      final title = _asText(t['title']).toLowerCase();
      final description = _asText(t['description']).toLowerCase();
      final objectives = (t['objectives'] is List)
          ? (t['objectives'] as List)
                .map((e) => e.toString().toLowerCase())
                .join(' ')
          : '';
      return title.contains(q) ||
          description.contains(q) ||
          objectives.contains(q);
    }).toList();
  }

  Future<void> _openTrack(Map<String, dynamic> track) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _TrackDetailSheet(
        track: track,
        onUpdated: (updated) {
          final id = updated['id'];
          final idx = _tracks.indexWhere((e) => e['id'] == id);
          if (idx >= 0) {
            setState(() => _tracks[idx] = updated);
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        leading: context.canPop()
            ? IconButton(
                icon: Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: context.colors.textPrimary,
                  size: 20,
                ),
                onPressed: () => context.pop(),
              )
            : IconButton(
                icon: Icon(
                  Icons.menu_rounded,
                  color: context.colors.textPrimary,
                ),
                onPressed: () =>
                    MainScaffold.scaffoldKey.currentState?.openDrawer(),
              ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.menu_book_outlined,
                color: AppColors.primary,
                size: 18,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'AI Advisory Tracks',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            TextField(
              controller: _searchCtrl,
              style: TextStyle(color: context.colors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Search advisory tracks...',
                hintStyle: TextStyle(color: context.colors.textMuted),
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: context.colors.textSecondary,
                ),
                filled: true,
                fillColor: context.colors.surface,
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: context.colors.cardBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  const [
                        ('all', 'All'),
                        ('financial', 'Financial'),
                        ('legal', 'Legal'),
                        ('market', 'Market'),
                        ('pitch', 'Pitch'),
                      ]
                      .map((entry) {
                        return _CategoryChipData(entry.$1, entry.$2);
                      })
                      .map((chip) {
                        final selected = chip.value == _category;
                        return ChoiceChip(
                          label: Text(chip.label),
                          selected: selected,
                          onSelected: (_) =>
                              setState(() => _category = chip.value),
                          labelStyle: TextStyle(
                            color: selected
                                ? AppColors.primary
                                : context.colors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          selectedColor: AppColors.primary.withValues(
                            alpha: 0.16,
                          ),
                          backgroundColor: context.colors.surface,
                          side: BorderSide(
                            color: selected
                                ? AppColors.primary
                                : context.colors.cardBorder,
                          ),
                        );
                      })
                      .toList(),
            ),
            const SizedBox(height: 12),
            if (_loading)
              const Padding(
                padding: EdgeInsets.only(top: 48),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (_error != null)
              _ErrorCard(error: _error!, onRetry: _load)
            else if (_filtered.isEmpty)
              _EmptyCard(
                message:
                    'No advisory tracks found for your current search/filter.',
              )
            else
              ..._filtered.map(
                (track) =>
                    _TrackCard(track: track, onTap: () => _openTrack(track)),
              ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChipData {
  final String value;
  final String label;
  const _CategoryChipData(this.value, this.label);
}

class _TrackCard extends StatelessWidget {
  final Map<String, dynamic> track;
  final VoidCallback onTap;
  const _TrackCard({required this.track, required this.onTap});

  String _category(dynamic category) {
    final raw = (category ?? '').toString();
    if (raw.isEmpty) return 'General';
    return raw[0].toUpperCase() + raw.substring(1);
  }

  @override
  Widget build(BuildContext context) {
    final progress = (track['progress'] as num?)?.toDouble() ?? 0;
    final status = (track['status'] ?? 'not-started').toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.cardBorder),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      (track['title'] ?? 'Untitled Track').toString(),
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      _category(track['category']),
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                (track['description'] ?? '').toString(),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Icon(
                    Icons.view_module_outlined,
                    size: 16,
                    color: context.colors.textMuted,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${track['modules'] ?? 0} modules',
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Icon(
                    Icons.schedule_rounded,
                    size: 16,
                    color: context.colors.textMuted,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    (track['duration'] ?? '—').toString(),
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: (progress.clamp(0, 100)) / 100,
                  minHeight: 7,
                  backgroundColor: context.colors.cardBorder,
                  valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${progress.toStringAsFixed(0)}% • ${status.replaceAll('-', ' ')}',
                style: TextStyle(color: context.colors.textMuted, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TrackDetailSheet extends StatefulWidget {
  final Map<String, dynamic> track;
  final ValueChanged<Map<String, dynamic>> onUpdated;

  const _TrackDetailSheet({required this.track, required this.onUpdated});

  @override
  State<_TrackDetailSheet> createState() => _TrackDetailSheetState();
}

class _TrackDetailSheetState extends State<_TrackDetailSheet> {
  late Map<String, dynamic> _track;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _track = Map<String, dynamic>.from(widget.track);
    _track['completed_materials'] = List<int>.from(
      (_track['completed_materials'] as List?)?.map(
            (e) => (e as num).toInt(),
          ) ??
          const [],
    );
  }

  List<dynamic> get _materials =>
      List<dynamic>.from(_track['materials'] as List? ?? const []);
  List<dynamic> get _objectives =>
      List<dynamic>.from(_track['objectives'] as List? ?? const []);

  bool _isDone(int idx) {
    final done = List<int>.from(
      _track['completed_materials'] as List? ?? const [],
    );
    return done.contains(idx);
  }

  Future<void> _toggleDone(int trackId, int materialIndex, bool toDone) async {
    if (_saving) return;
    setState(() => _saving = true);

    final done = List<int>.from(
      _track['completed_materials'] as List? ?? const [],
    );
    if (toDone && !done.contains(materialIndex)) done.add(materialIndex);
    if (!toDone) done.remove(materialIndex);

    setState(() {
      _track['completed_materials'] = done;
      final total = _materials.isEmpty ? 1 : _materials.length;
      _track['progress'] = ((done.length / total) * 100).round();
      _track['status'] = done.isEmpty
          ? 'not-started'
          : (done.length == _materials.length ? 'completed' : 'in-progress');
    });

    try {
      if (toDone) {
        await ApiService.instance.markMaterialComplete(trackId, materialIndex);
      } else {
        await ApiService.instance.unmarkMaterialComplete(
          trackId,
          materialIndex,
        );
      }
      widget.onUpdated(_track);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to update progress. Please retry.'),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final trackId = (_track['id'] as num?)?.toInt();

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: context.colors.divider,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              (_track['title'] ?? '').toString(),
              style: TextStyle(
                color: context.colors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              (_track['description'] ?? '').toString(),
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 14),
            if (_objectives.isNotEmpty) ...[
              Text(
                'Objectives',
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              ..._objectives.map(
                (o) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(top: 5),
                        child: Icon(
                          Icons.circle,
                          size: 6,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          o.toString(),
                          style: TextStyle(color: context.colors.textSecondary),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
            Text(
              'Materials',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: _materials.length,
                separatorBuilder: (_, __) =>
                    Divider(color: context.colors.divider),
                itemBuilder: (_, i) {
                  final m = _materials[i];
                  final done = _isDone(i);
                  final name =
                      (m is Map ? m['name'] : null)?.toString() ??
                      'Material ${i + 1}';
                  final type =
                      (m is Map ? m['type'] : null)?.toString() ?? 'Resource';
                  final description =
                      (m is Map ? m['description'] : null)?.toString() ?? '';

                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      done
                          ? Icons.check_circle_rounded
                          : Icons.menu_book_outlined,
                      color: done
                          ? AppColors.primary
                          : context.colors.textSecondary,
                    ),
                    title: Text(
                      name,
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    subtitle: Text(
                      description.isEmpty ? type : '$type • $description',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    trailing: trackId == null
                        ? null
                        : Switch.adaptive(
                            value: done,
                            activeColor: AppColors.primary,
                            onChanged: (v) => _toggleDone(trackId, i, v),
                          ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorCard({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Failed to load advisory tracks',
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            error,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  final String message;
  const _EmptyCard({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.cardBorder),
      ),
      child: Column(
        children: [
          Icon(
            Icons.menu_book_outlined,
            color: context.colors.textMuted,
            size: 28,
          ),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(color: context.colors.textSecondary),
          ),
        ],
      ),
    );
  }
}

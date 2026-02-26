import 'package:flutter/material.dart';
import '../../core/app_colors.dart';
import '../../services/api_service.dart';
import '../../screens/main_scaffold.dart';

// ─── Day helpers ──────────────────────────────────────────────────────────────

const _dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const _dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Screen ───────────────────────────────────────────────────────────────────

class AvailabilityScreen extends StatefulWidget {
  const AvailabilityScreen({super.key});
  @override
  State<AvailabilityScreen> createState() => _AvailabilityScreenState();
}

class _AvailabilityScreenState extends State<AvailabilityScreen> {
  List<Map<String, dynamic>> _slots = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiService.instance.getMyAvailability();
      if (!mounted) return;
      setState(() {
        _slots = List<Map<String, dynamic>>.from(
          data.map((e) => Map<String, dynamic>.from(e as Map)),
        );
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

  // ── Delete slot ──────────────────────────────────────────────────────────────

  Future<void> _deleteSlot(int slotId, String label) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ctx.colors.surface,
        title: Text(
          'Remove Slot?',
          style: TextStyle(color: ctx.colors.textPrimary),
        ),
        content: Text(
          'Remove availability: $label?',
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
              'Remove',
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await ApiService.instance.deleteAvailabilitySlot(slotId);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  // ── Add slot ─────────────────────────────────────────────────────────────────

  Future<void> _showAddSlot() async {
    int dayOfWeek = 0; // 0 = Monday
    TimeOfDay startTime = const TimeOfDay(hour: 9, minute: 0);
    TimeOfDay endTime = const TimeOfDay(hour: 10, minute: 0);

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
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 28,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'Add Availability Slot',
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
              const SizedBox(height: 16),

              // Day picker
              Text(
                'Day',
                style: TextStyle(color: ctx.colors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: List.generate(7, (i) {
                  final selected = dayOfWeek == i;
                  return GestureDetector(
                    onTap: () => setModal(() => dayOfWeek = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: selected
                            ? AppColors.primary
                            : ctx.colors.background,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _dayShort[i],
                        style: TextStyle(
                          color: selected
                              ? Colors.white
                              : ctx.colors.textSecondary,
                          fontSize: 13,
                          fontWeight: selected
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 16),

              // Start time
              _TimePicker(
                label: 'Start Time',
                time: startTime,
                onTap: () async {
                  final picked = await showTimePicker(
                    context: ctx,
                    initialTime: startTime,
                  );
                  if (picked != null) setModal(() => startTime = picked);
                },
              ),
              const SizedBox(height: 12),

              // End time
              _TimePicker(
                label: 'End Time',
                time: endTime,
                onTap: () async {
                  final picked = await showTimePicker(
                    context: ctx,
                    initialTime: endTime,
                  );
                  if (picked != null) setModal(() => endTime = picked);
                },
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
                    String fmt(TimeOfDay t) =>
                        '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
                    try {
                      await ApiService.instance.createAvailabilitySlot({
                        'day_of_week': dayOfWeek,
                        'start_time': fmt(startTime),
                        'end_time': fmt(endTime),
                        'is_active': true,
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
                    'Add Slot',
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

  // ── Group slots by day ───────────────────────────────────────────────────────

  Map<int, List<Map<String, dynamic>>> get _byDay {
    final map = <int, List<Map<String, dynamic>>>{};
    for (final slot in _slots) {
      final day = (slot['day_of_week'] as int?) ?? 0;
      map.putIfAbsent(day, () => []).add(slot);
    }
    return map;
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
          'My Availability',
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
          'Add Slot',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
        onPressed: _showAddSlot,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: Colors.redAccent,
                    size: 48,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Could not load availability',
                    style: TextStyle(color: context.colors.textSecondary),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _load,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                    ),
                    child: const Text(
                      'Retry',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
            )
          : _slots.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.calendar_today_outlined,
                    color: context.colors.textSecondary,
                    size: 52,
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'No availability set',
                    style: TextStyle(
                      color: context.colors.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Add time slots so others can book meetings with you.',
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 13,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _load,
              color: AppColors.primary,
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                itemCount: _byDay.length,
                itemBuilder: (_, i) {
                  final sortedDays = _byDay.keys.toList()..sort();
                  final day = sortedDays[i];
                  final slots = _byDay[day]!;
                  return _DaySection(
                    dayName: _dayNames[day],
                    slots: slots,
                    onDelete: _deleteSlot,
                  );
                },
              ),
            ),
    );
  }
}

// ─── Day section ─────────────────────────────────────────────────────────────

class _DaySection extends StatelessWidget {
  final String dayName;
  final List<Map<String, dynamic>> slots;
  final Future<void> Function(int id, String label) onDelete;

  const _DaySection({
    required this.dayName,
    required this.slots,
    required this.onDelete,
  });

  String _formatTime(String? t) {
    if (t == null || t.isEmpty) return '';
    final parts = t.split(':');
    if (parts.length < 2) return t;
    final h = int.tryParse(parts[0]) ?? 0;
    final m = int.tryParse(parts[1]) ?? 0;
    // Format manually without needing BuildContext
    final period = h < 12 ? 'AM' : 'PM';
    final hour = h == 0
        ? 12
        : h > 12
        ? h - 12
        : h;
    return '$hour:${m.toString().padLeft(2, '0')} $period';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 6),
          child: Text(
            dayName,
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),
        ...slots.map((slot) {
          final id = slot['id'] as int? ?? 0;
          final start = _formatTime(slot['start_time'] as String?);
          final end = _formatTime(slot['end_time'] as String?);
          final label = '$start – $end';
          final isActive = slot['is_active'] as bool? ?? true;

          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: context.colors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 4,
              ),
              leading: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isActive
                      ? AppColors.primary.withOpacity(0.12)
                      : context.colors.background,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.access_time_rounded,
                  color: isActive
                      ? AppColors.primary
                      : context.colors.textSecondary,
                  size: 18,
                ),
              ),
              title: Text(
                label,
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              subtitle: Text(
                isActive ? 'Active' : 'Inactive',
                style: TextStyle(
                  color: isActive
                      ? Colors.green[400]
                      : context.colors.textSecondary,
                  fontSize: 12,
                ),
              ),
              trailing: IconButton(
                icon: const Icon(
                  Icons.delete_outline,
                  color: Colors.redAccent,
                  size: 20,
                ),
                onPressed: () => onDelete(id, label),
              ),
            ),
          );
        }),
      ],
    );
  }
}

// ─── Time picker row ──────────────────────────────────────────────────────────

class _TimePicker extends StatelessWidget {
  final String label;
  final TimeOfDay time;
  final VoidCallback onTap;

  const _TimePicker({
    required this.label,
    required this.time,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final period = time.hour < 12 ? 'AM' : 'PM';
    final hour = time.hour == 0
        ? 12
        : time.hour > 12
        ? time.hour - 12
        : time.hour;
    final display = '$hour:${time.minute.toString().padLeft(2, '0')} $period';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: context.colors.background,
          borderRadius: BorderRadius.circular(10),
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
                  const SizedBox(height: 2),
                  Text(
                    display,
                    style: TextStyle(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.access_time_outlined,
              color: context.colors.textSecondary,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

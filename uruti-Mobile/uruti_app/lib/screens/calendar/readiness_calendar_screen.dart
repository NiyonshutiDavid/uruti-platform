import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../screens/main_scaffold.dart';

class ReadinessCalendarScreen extends StatefulWidget {
  const ReadinessCalendarScreen({super.key});
  @override
  State<ReadinessCalendarScreen> createState() =>
      _ReadinessCalendarScreenState();
}

class _ReadinessCalendarScreenState extends State<ReadinessCalendarScreen> {
  DateTime _selected = DateTime.now();
  final _events = <DateTime, List<Map<String, dynamic>>>{};
  bool _loadingEvents = false;

  @override
  void initState() {
    super.initState();
    _loadMeetings();
  }

  Future<void> _loadMeetings() async {
    setState(() => _loadingEvents = true);
    try {
      final meetings = await ApiService.instance.getUpcomingMeetings();
      if (!mounted) return;
      final map = <DateTime, List<Map<String, dynamic>>>{};
      for (final m in meetings) {
        final raw = m['start_time'] as String? ?? '';
        if (raw.isEmpty) continue;
        final dt = DateTime.tryParse(raw);
        if (dt == null) continue;
        final local = dt.toLocal();
        final key = DateTime(local.year, local.month, local.day);
        final type = m['meeting_type'] as String? ?? 'meeting';
        final period = local.hour < 12 ? 'AM' : 'PM';
        final hour = local.hour == 0
            ? 12
            : local.hour > 12
            ? local.hour - 12
            : local.hour;
        final timeStr =
            '$hour:${local.minute.toString().padLeft(2, '0')} $period';
        map.putIfAbsent(key, () => []).add({
          'title': m['title'] ?? 'Meeting',
          'time': timeStr,
          'type': type,
          'platform': (m['meeting_url'] as String? ?? '').isNotEmpty
              ? 'Video Call'
              : 'In Person',
          'id': m['id'],
          'status': m['status'],
        });
      }
      if (!mounted) return;
      setState(() {
        _events
          ..clear()
          ..addAll(map);
        _loadingEvents = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingEvents = false);
    }
  }

  List<Map<String, dynamic>> get _dayEvents {
    final key = DateTime(_selected.year, _selected.month, _selected.day);
    return _events[key] ?? [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Readiness Calendar',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: context.colors.textSecondary),
            onPressed: _loadMeetings,
          ),
          IconButton(
            icon: Icon(Icons.add, color: AppColors.primary),
            onPressed: () => _showAddEvent(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Simple calendar header
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: Icon(
                        Icons.chevron_left,
                        color: context.colors.textSecondary,
                      ),
                      onPressed: () => setState(
                        () => _selected = DateTime(
                          _selected.year,
                          _selected.month - 1,
                          1,
                        ),
                      ),
                    ),
                    Text(
                      '${_monthName(_selected.month)} ${_selected.year}',
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        Icons.chevron_right,
                        color: context.colors.textSecondary,
                      ),
                      onPressed: () => setState(
                        () => _selected = DateTime(
                          _selected.year,
                          _selected.month + 1,
                          1,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
                      .map(
                        (d) => Expanded(
                          child: Center(
                            child: Text(
                              d,
                              style: TextStyle(
                                color: context.colors.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
                const SizedBox(height: 8),
                _CalendarGrid(
                  year: _selected.year,
                  month: _selected.month,
                  selected: _selected,
                  eventDays: _events.keys
                      .where(
                        (d) =>
                            d.year == _selected.year &&
                            d.month == _selected.month,
                      )
                      .map((d) => d.day)
                      .toSet(),
                  onSelect: (d) => setState(() => _selected = d),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Events for selected day
          Expanded(
            child: _loadingEvents
                ? const Center(child: CircularProgressIndicator())
                : _dayEvents.isEmpty
                ? Center(
                    child: Text(
                      'No meetings on this day',
                      style: TextStyle(color: context.colors.textSecondary),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _dayEvents.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _EventTile(event: _dayEvents[i]),
                  ),
          ),
        ],
      ),
    );
  }

  Future<void> _showAddEvent(BuildContext outerContext) async {
    final titleCtrl = TextEditingController();
    final meetingLinkCtrl = TextEditingController();
    final locationCtrl = TextEditingController();
    final descCtrl = TextEditingController();

    String selectedType = 'general_meeting';
    DateTime selectedDate = _selected;
    TimeOfDay selectedTime = TimeOfDay.now();
    int durationMinutes = 60;
    bool isVirtual = true;
    bool submitting = false;

    const types = [
      ('general_meeting', 'General Meeting'),
      ('pitch', 'Pitch'),
      ('workshop', 'Workshop'),
      ('mentor_session', 'Mentor Session'),
      ('deadline', 'Deadline'),
    ];
    const durations = [30, 60, 90, 120];

    await showModalBottomSheet(
      context: outerContext,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              child: Container(
                decoration: BoxDecoration(
                  color: outerContext.colors.card,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(24),
                  ),
                ),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Handle
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: outerContext.colors.textSecondary.withValues(
                              alpha: 0.3,
                            ),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Add Event',
                        style: TextStyle(
                          color: outerContext.colors.textPrimary,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Title
                      _SheetLabel('Event Title', outerContext),
                      const SizedBox(height: 6),
                      TextField(
                        controller: titleCtrl,
                        style: TextStyle(
                          color: outerContext.colors.textPrimary,
                        ),
                        decoration: _inputDecoration(
                          'e.g. Investor Pitch',
                          outerContext,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Type
                      _SheetLabel('Event Type', outerContext),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: selectedType,
                        dropdownColor: outerContext.colors.card,
                        style: TextStyle(
                          color: outerContext.colors.textPrimary,
                        ),
                        decoration: _inputDecoration(null, outerContext),
                        items: types
                            .map(
                              (t) => DropdownMenuItem(
                                value: t.$1,
                                child: Text(t.$2),
                              ),
                            )
                            .toList(),
                        onChanged: (v) =>
                            setSheetState(() => selectedType = v!),
                      ),
                      const SizedBox(height: 16),

                      // Date & Time row
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _SheetLabel('Date', outerContext),
                                const SizedBox(height: 6),
                                GestureDetector(
                                  onTap: () async {
                                    final d = await showDatePicker(
                                      context: ctx,
                                      initialDate: selectedDate,
                                      firstDate: DateTime.now(),
                                      lastDate: DateTime.now().add(
                                        const Duration(days: 365),
                                      ),
                                    );
                                    if (d != null) {
                                      setSheetState(() => selectedDate = d);
                                    }
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 14,
                                    ),
                                    decoration: BoxDecoration(
                                      border: Border.all(
                                        color: outerContext.colors.textSecondary
                                            .withValues(alpha: 0.3),
                                      ),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.calendar_today,
                                          size: 14,
                                          color:
                                              outerContext.colors.textSecondary,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          '${selectedDate.day}/${selectedDate.month}/${selectedDate.year}',
                                          style: TextStyle(
                                            color:
                                                outerContext.colors.textPrimary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _SheetLabel('Time', outerContext),
                                const SizedBox(height: 6),
                                GestureDetector(
                                  onTap: () async {
                                    final t = await showTimePicker(
                                      context: ctx,
                                      initialTime: selectedTime,
                                    );
                                    if (t != null) {
                                      setSheetState(() => selectedTime = t);
                                    }
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 14,
                                    ),
                                    decoration: BoxDecoration(
                                      border: Border.all(
                                        color: outerContext.colors.textSecondary
                                            .withValues(alpha: 0.3),
                                      ),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.access_time,
                                          size: 14,
                                          color:
                                              outerContext.colors.textSecondary,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          selectedTime.format(ctx),
                                          style: TextStyle(
                                            color:
                                                outerContext.colors.textPrimary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Duration
                      _SheetLabel('Duration', outerContext),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<int>(
                        value: durationMinutes,
                        dropdownColor: outerContext.colors.card,
                        style: TextStyle(
                          color: outerContext.colors.textPrimary,
                        ),
                        decoration: _inputDecoration(null, outerContext),
                        items: durations
                            .map(
                              (d) => DropdownMenuItem(
                                value: d,
                                child: Text(
                                  d < 60
                                      ? '$d min'
                                      : '${d ~/ 60}h${d % 60 > 0 ? " ${d % 60}min" : ""}',
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (v) =>
                            setSheetState(() => durationMinutes = v!),
                      ),
                      const SizedBox(height: 16),

                      // Virtual / In-Person toggle
                      _SheetLabel('Location Type', outerContext),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          _ToggleChip(
                            label: 'Virtual',
                            selected: isVirtual,
                            onTap: () => setSheetState(() => isVirtual = true),
                          ),
                          const SizedBox(width: 10),
                          _ToggleChip(
                            label: 'In-Person',
                            selected: !isVirtual,
                            onTap: () => setSheetState(() => isVirtual = false),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Meeting link (virtual) or Location (in-person)
                      if (isVirtual) ...[
                        _SheetLabel('Meeting Link (optional)', outerContext),
                        const SizedBox(height: 6),
                        TextField(
                          controller: meetingLinkCtrl,
                          style: TextStyle(
                            color: outerContext.colors.textPrimary,
                          ),
                          decoration: _inputDecoration(
                            'https://meet.google.com/...',
                            outerContext,
                          ),
                        ),
                      ] else ...[
                        _SheetLabel('Location', outerContext),
                        const SizedBox(height: 6),
                        TextField(
                          controller: locationCtrl,
                          style: TextStyle(
                            color: outerContext.colors.textPrimary,
                          ),
                          decoration: _inputDecoration(
                            'e.g. Kigali Innovation City',
                            outerContext,
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),

                      // Description
                      _SheetLabel('Description (optional)', outerContext),
                      const SizedBox(height: 6),
                      TextField(
                        controller: descCtrl,
                        maxLines: 3,
                        style: TextStyle(
                          color: outerContext.colors.textPrimary,
                        ),
                        decoration: _inputDecoration(
                          'Add notes or agenda...',
                          outerContext,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Submit button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: submitting
                              ? null
                              : () async {
                                  final title = titleCtrl.text.trim();
                                  if (title.isEmpty) {
                                    ScaffoldMessenger.of(
                                      outerContext,
                                    ).showSnackBar(
                                      const SnackBar(
                                        content: Text('Title is required'),
                                      ),
                                    );
                                    return;
                                  }
                                  setSheetState(() => submitting = true);
                                  try {
                                    final auth = outerContext
                                        .read<AuthProvider>();
                                    final userId = auth.user?.id;
                                    final startDt = DateTime(
                                      selectedDate.year,
                                      selectedDate.month,
                                      selectedDate.day,
                                      selectedTime.hour,
                                      selectedTime.minute,
                                    );
                                    final endDt = startDt.add(
                                      Duration(minutes: durationMinutes),
                                    );
                                    await ApiService.instance.createMeeting({
                                      if (userId != null)
                                        'participant_id': userId,
                                      'title': title,
                                      'meeting_type': selectedType,
                                      'start_time': startDt
                                          .toUtc()
                                          .toIso8601String(),
                                      'end_time': endDt
                                          .toUtc()
                                          .toIso8601String(),
                                      'timezone': 'Africa/Kigali',
                                      if (descCtrl.text.trim().isNotEmpty)
                                        'description': descCtrl.text.trim(),
                                      if (isVirtual &&
                                          meetingLinkCtrl.text
                                              .trim()
                                              .isNotEmpty)
                                        'meeting_url': meetingLinkCtrl.text
                                            .trim(),
                                      if (!isVirtual &&
                                          locationCtrl.text.trim().isNotEmpty)
                                        'location': locationCtrl.text.trim(),
                                    });
                                    if (ctx.mounted) Navigator.pop(ctx);
                                    await _loadMeetings();
                                    if (outerContext.mounted) {
                                      ScaffoldMessenger.of(
                                        outerContext,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'Event added successfully',
                                          ),
                                          backgroundColor: AppColors.primary,
                                        ),
                                      );
                                    }
                                  } catch (e) {
                                    setSheetState(() => submitting = false);
                                    if (outerContext.mounted) {
                                      ScaffoldMessenger.of(
                                        outerContext,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            'Failed to add event: $e',
                                          ),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                    }
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: submitting
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text(
                                  'Add Event',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  InputDecoration _inputDecoration(String? hint, BuildContext ctx) =>
      InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: ctx.colors.textSecondary),
        filled: true,
        fillColor: ctx.colors.background,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: ctx.colors.textSecondary.withValues(alpha: 0.3),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: ctx.colors.textSecondary.withValues(alpha: 0.3),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
      );

  String _monthName(int m) => [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][m - 1];
}

class _CalendarGrid extends StatelessWidget {
  final int year, month;
  final DateTime selected;
  final Set<int> eventDays;
  final void Function(DateTime) onSelect;
  const _CalendarGrid({
    required this.year,
    required this.month,
    required this.selected,
    required this.eventDays,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final firstDay = DateTime(year, month, 1);
    final daysInMonth = DateTime(year, month + 1, 0).day;
    final startWeekday = firstDay.weekday % 7;
    final cells =
        List<int?>.filled(startWeekday, null) +
        List.generate(daysInMonth, (i) => i + 1);
    while (cells.length % 7 != 0) cells.add(null);

    return GridView.count(
      crossAxisCount: 7,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: cells.map((day) {
        if (day == null) return const SizedBox();
        final date = DateTime(year, month, day);
        final isSelected =
            selected.day == day &&
            selected.month == month &&
            selected.year == year;
        final isToday =
            DateTime.now().day == day &&
            DateTime.now().month == month &&
            DateTime.now().year == year;
        final hasEvent = eventDays.contains(day);
        return GestureDetector(
          onTap: () => onSelect(date),
          child: Container(
            margin: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary
                  : isToday
                  ? AppColors.primary.withValues(alpha: 0.15)
                  : Colors.transparent,
              shape: BoxShape.circle,
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Text(
                  '$day',
                  style: TextStyle(
                    color: isSelected
                        ? Colors.white
                        : context.colors.textPrimary,
                    fontSize: 13,
                    fontWeight: isToday || isSelected
                        ? FontWeight.w700
                        : FontWeight.normal,
                  ),
                ),
                if (hasEvent && !isSelected)
                  Positioned(
                    bottom: 2,
                    child: Container(
                      width: 4,
                      height: 4,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _EventTile extends StatelessWidget {
  final Map<String, dynamic> event;
  const _EventTile({required this.event});

  Color get _color {
    final t = event['type'] as String;
    return t == 'investor'
        ? const Color(0xFF3B82F6)
        : t == 'coach'
        ? AppColors.primary
        : t == 'mentor'
        ? const Color(0xFFFFB800)
        : const Color(0xFF8B5CF6);
  }

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: context.colors.card,
      borderRadius: BorderRadius.circular(14),
      border: Border(
        left: BorderSide(color: _color, width: 4),
        top: BorderSide(color: _color.withValues(alpha: 0.3)),
        right: BorderSide(color: _color.withValues(alpha: 0.3)),
        bottom: BorderSide(color: _color.withValues(alpha: 0.3)),
      ),
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                event['title'] as String,
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    color: context.colors.textSecondary,
                    size: 13,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    event['time'] as String,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Icon(Icons.video_call_outlined, color: _color, size: 13),
                  const SizedBox(width: 4),
                  Text(
                    event['platform'] as String,
                    style: TextStyle(color: _color, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: _color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            'Join',
            style: TextStyle(
              color: _color,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ),
      ],
    ),
  );
}

class _SheetLabel extends StatelessWidget {
  final String text;
  final BuildContext ctx;
  const _SheetLabel(this.text, this.ctx);

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: TextStyle(
      color: ctx.colors.textSecondary,
      fontSize: 12,
      fontWeight: FontWeight.w600,
    ),
  );
}

class _ToggleChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _ToggleChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
      decoration: BoxDecoration(
        color: selected
            ? AppColors.primary
            : AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: selected
              ? AppColors.primary
              : AppColors.primary.withValues(alpha: 0.3),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: selected ? Colors.white : AppColors.primary,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
    ),
  );
}

import 'package:flutter/material.dart';
import '../core/app_colors.dart';
import '../services/api_service.dart';

/// Reusable bottom-sheet widget for booking a meeting / sending a meeting
/// request to another user.  Used from both the Connections screen and the
/// Chat Info & Settings panel.
class BookSessionSheet extends StatefulWidget {
  final int userId;
  final String userName;
  const BookSessionSheet({
    super.key,
    required this.userId,
    required this.userName,
  });
  @override
  State<BookSessionSheet> createState() => _BookSessionSheetState();
}

class _BookSessionSheetState extends State<BookSessionSheet> {
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _linkCtrl = TextEditingController();
  String _type = 'general_meeting';
  DateTime _date = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _time = const TimeOfDay(hour: 10, minute: 0);
  int _duration = 60;
  bool _submitting = false;
  bool _loadingAvailability = true;
  int _weekOffset = 0;
  List<Map<String, dynamic>> _availability = [];
  DateTime? _selectedDay;
  Map<String, dynamic>? _selectedSlot;

  static const _types = [
    ('general_meeting', 'General Meeting'),
    ('pitch', 'Pitch Session'),
    ('mentor_session', 'Mentor Session'),
    ('workshop', 'Workshop'),
  ];

  @override
  void initState() {
    super.initState();
    _titleCtrl.text = 'Session with ${widget.userName}';
    _loadAvailability();
  }

  Future<void> _loadAvailability() async {
    setState(() => _loadingAvailability = true);
    try {
      final slots = await ApiService.instance.getUserAvailability(
        widget.userId,
      );
      if (!mounted) return;
      setState(() {
        _availability = List<Map<String, dynamic>>.from(
          slots,
        ).where((slot) => slot['is_available'] == true).toList();
        _loadingAvailability = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _availability = [];
        _loadingAvailability = false;
      });
    }
  }

  DateTime _startOfWeek(DateTime date) {
    final normalized = DateTime(date.year, date.month, date.day);
    final mondayOffset = (normalized.weekday + 6) % 7;
    return normalized.subtract(Duration(days: mondayOffset));
  }

  List<DateTime> get _visibleWeekDays {
    final base = _startOfWeek(
      DateTime.now(),
    ).add(Duration(days: _weekOffset * 7));
    return List.generate(7, (index) => base.add(Duration(days: index)));
  }

  int _dayOfWeekIndex(DateTime day) => day.weekday - 1;

  List<Map<String, dynamic>> _slotsForDay(DateTime day) {
    final expected = _dayOfWeekIndex(day);
    final slots = _availability
        .where((slot) => (slot['day_of_week'] as int?) == expected)
        .toList();
    slots.sort(
      (a, b) => (a['start_time'] as String? ?? '').compareTo(
        b['start_time'] as String? ?? '',
      ),
    );
    return slots;
  }

  String _formatShortDate(DateTime d) => '${d.day}/${d.month}';

  String _formatDayName(DateTime d) {
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return names[d.weekday - 1];
  }

  String _timeRangeLabel(Map<String, dynamic> slot) {
    final start = (slot['start_time'] as String? ?? '00:00').split(':');
    final end = (slot['end_time'] as String? ?? '00:00').split(':');
    return '${start[0]}:${start[1]} - ${end[0]}:${end[1]}';
  }

  TimeOfDay _timeFromSlotValue(String value) {
    final pieces = value.split(':');
    final hour = int.tryParse(pieces.isNotEmpty ? pieces[0] : '0') ?? 0;
    final minute = int.tryParse(pieces.length > 1 ? pieces[1] : '0') ?? 0;
    return TimeOfDay(hour: hour, minute: minute);
  }

  int _durationFromSlot(Map<String, dynamic> slot) {
    final start = _timeFromSlotValue(slot['start_time'] as String? ?? '00:00');
    final end = _timeFromSlotValue(slot['end_time'] as String? ?? '00:00');
    final startMinutes = start.hour * 60 + start.minute;
    final endMinutes = end.hour * 60 + end.minute;
    final delta = endMinutes - startMinutes;
    return delta > 0 ? delta : 60;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: context.colors.textSecondary.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Book Session with ${widget.userName}',
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: Icon(
                      Icons.close_rounded,
                      color: context.colors.textSecondary,
                    ),
                    tooltip: 'Close',
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _label('Available Slots (Week View)', context),
              const SizedBox(height: 8),
              Row(
                children: [
                  IconButton(
                    onPressed: _weekOffset > 0
                        ? () => setState(() => _weekOffset -= 1)
                        : null,
                    icon: const Icon(Icons.chevron_left),
                    color: context.colors.textPrimary,
                  ),
                  Expanded(
                    child: Text(
                      '${_formatShortDate(_visibleWeekDays.first)} - ${_formatShortDate(_visibleWeekDays.last)}',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => setState(() => _weekOffset += 1),
                    icon: const Icon(Icons.chevron_right),
                    color: context.colors.textPrimary,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 70,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _visibleWeekDays.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, index) {
                    final day = _visibleWeekDays[index];
                    final selected =
                        _selectedDay != null &&
                        _selectedDay!.year == day.year &&
                        _selectedDay!.month == day.month &&
                        _selectedDay!.day == day.day;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedDay = day;
                          _selectedSlot = null;
                        });
                      },
                      child: Container(
                        width: 74,
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.primary.withValues(alpha: 0.16)
                              : context.colors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: selected
                                ? AppColors.primary
                                : context.colors.textSecondary.withValues(
                                    alpha: 0.25,
                                  ),
                          ),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 8,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _formatDayName(day),
                              style: TextStyle(
                                color: context.colors.textSecondary,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatShortDate(day),
                              style: TextStyle(
                                color: context.colors.textPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),
              if (_loadingAvailability)
                Row(
                  children: [
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Loading available slots...',
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                )
              else if (_availability.isEmpty)
                Text(
                  'No availability has been set yet for this user.',
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 12,
                  ),
                )
              else if (_selectedDay != null)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _slotsForDay(_selectedDay!).map((slot) {
                    final selected =
                        identical(_selectedSlot, slot) ||
                        (_selectedSlot != null &&
                            _selectedSlot!['id'] == slot['id']);
                    return ChoiceChip(
                      selected: selected,
                      onSelected: (_) {
                        setState(() {
                          _selectedSlot = slot;
                          _date = _selectedDay!;
                          _time = _timeFromSlotValue(
                            slot['start_time'] as String? ?? '09:00',
                          );
                          _duration = _durationFromSlot(slot);
                        });
                      },
                      label: Text(_timeRangeLabel(slot)),
                      selectedColor: AppColors.primary.withValues(alpha: 0.18),
                      labelStyle: TextStyle(
                        color: selected
                            ? AppColors.primary
                            : context.colors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                      side: BorderSide(
                        color: selected
                            ? AppColors.primary
                            : context.colors.textSecondary.withValues(
                                alpha: 0.25,
                              ),
                      ),
                      backgroundColor: context.colors.background,
                    );
                  }).toList(),
                )
              else
                Text(
                  'Select a day to view slots.',
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              const SizedBox(height: 14),
              _label('Title', context),
              const SizedBox(height: 6),
              _field(
                controller: _titleCtrl,
                hint: 'e.g. Strategy discussion',
                context: context,
              ),
              const SizedBox(height: 14),
              _label('Session Type', context),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _type,
                dropdownColor: context.colors.card,
                style: TextStyle(color: context.colors.textPrimary),
                decoration: _inputDecoration(null, context),
                items: _types
                    .map(
                      (t) => DropdownMenuItem(value: t.$1, child: Text(t.$2)),
                    )
                    .toList(),
                onChanged: (v) => setState(() => _type = v!),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Date', context),
                        const SizedBox(height: 6),
                        _datePicker(context),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Time', context),
                        const SizedBox(height: 6),
                        _timePicker(context),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _label('Duration', context),
              const SizedBox(height: 6),
              DropdownButtonFormField<int>(
                value: _duration,
                dropdownColor: context.colors.card,
                style: TextStyle(color: context.colors.textPrimary),
                decoration: _inputDecoration(null, context),
                items: [30, 60, 90, 120]
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
                onChanged: (v) => setState(() => _duration = v!),
              ),
              const SizedBox(height: 14),
              _label('Meeting Link (optional)', context),
              const SizedBox(height: 6),
              _field(
                controller: _linkCtrl,
                hint: 'https://meet.google.com/...',
                context: context,
              ),
              const SizedBox(height: 14),
              _label('Notes (optional)', context),
              const SizedBox(height: 6),
              _field(
                controller: _descCtrl,
                hint: 'Agenda or notes...',
                context: context,
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Book Session',
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
  }

  Future<void> _submit() async {
    final title = _titleCtrl.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please enter a title')));
      return;
    }

    final hasAvailability = _availability.isNotEmpty;
    if (hasAvailability && (_selectedDay == null || _selectedSlot == null)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select one available slot from the week view'),
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      DateTime startDt;
      DateTime endDt;

      if (hasAvailability && _selectedDay != null && _selectedSlot != null) {
        final start = _timeFromSlotValue(
          _selectedSlot!['start_time'] as String? ?? '09:00',
        );
        final end = _timeFromSlotValue(
          _selectedSlot!['end_time'] as String? ?? '10:00',
        );
        startDt = DateTime(
          _selectedDay!.year,
          _selectedDay!.month,
          _selectedDay!.day,
          start.hour,
          start.minute,
        );
        endDt = DateTime(
          _selectedDay!.year,
          _selectedDay!.month,
          _selectedDay!.day,
          end.hour,
          end.minute,
        );
      } else {
        startDt = DateTime(
          _date.year,
          _date.month,
          _date.day,
          _time.hour,
          _time.minute,
        );
        endDt = startDt.add(Duration(minutes: _duration));
      }

      if (startDt.isBefore(DateTime.now())) {
        throw Exception('Please choose a future slot');
      }

      await ApiService.instance.createMeeting({
        'participant_id': widget.userId,
        'title': title,
        'meeting_type': _type,
        'start_time': startDt.toUtc().toIso8601String(),
        'end_time': endDt.toUtc().toIso8601String(),
        'timezone': 'Africa/Kigali',
        if (_linkCtrl.text.trim().isNotEmpty)
          'meeting_url': _linkCtrl.text.trim(),
        if (_descCtrl.text.trim().isNotEmpty)
          'description': _descCtrl.text.trim(),
      });
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Session booked successfully!'),
          backgroundColor: AppColors.primary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Widget _datePicker(BuildContext ctx) {
    return GestureDetector(
      onTap: () async {
        final d = await showDatePicker(
          context: ctx,
          initialDate: _date,
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        if (d != null) setState(() => _date = d);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        decoration: BoxDecoration(
          border: Border.all(
            color: ctx.colors.textSecondary.withValues(alpha: 0.3),
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              Icons.calendar_today,
              size: 14,
              color: ctx.colors.textSecondary,
            ),
            const SizedBox(width: 6),
            Text(
              '${_date.day}/${_date.month}/${_date.year}',
              style: TextStyle(color: ctx.colors.textPrimary, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  Widget _timePicker(BuildContext ctx) {
    return GestureDetector(
      onTap: () async {
        final t = await showTimePicker(context: ctx, initialTime: _time);
        if (t != null) setState(() => _time = t);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        decoration: BoxDecoration(
          border: Border.all(
            color: ctx.colors.textSecondary.withValues(alpha: 0.3),
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(Icons.access_time, size: 14, color: ctx.colors.textSecondary),
            const SizedBox(width: 6),
            Text(
              _time.format(ctx),
              style: TextStyle(color: ctx.colors.textPrimary, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text, BuildContext ctx) => Text(
    text,
    style: TextStyle(
      color: ctx.colors.textSecondary,
      fontSize: 12,
      fontWeight: FontWeight.w600,
    ),
  );

  Widget _field({
    required TextEditingController controller,
    required String hint,
    required BuildContext context,
    int maxLines = 1,
  }) => TextField(
    controller: controller,
    maxLines: maxLines,
    style: TextStyle(color: context.colors.textPrimary),
    decoration: _inputDecoration(hint, context),
  );

  InputDecoration _inputDecoration(String? hint, BuildContext ctx) =>
      InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: ctx.colors.textSecondary),
        filled: true,
        fillColor: ctx.colors.background,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 13,
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
}

import 'package:equatable/equatable.dart';

enum FounderStatus { initial, loading, success, error }

class FounderState extends Equatable {
  final FounderStatus status;
  final List<Map<String, dynamic>> ventures;
  final List<Map<String, dynamic>> pitchSessions;
  final List<Map<String, dynamic>> connections;
  final List<Map<String, dynamic>> notifications;
  final List<Map<String, dynamic>> meetings;
  final String ventureSearchTerm;
  final String ventureStageFilter;
  final String? errorMessage;

  const FounderState({
    this.status = FounderStatus.initial,
    this.ventures = const [],
    this.pitchSessions = const [],
    this.connections = const [],
    this.notifications = const [],
    this.meetings = const [],
    this.ventureSearchTerm = '',
    this.ventureStageFilter = 'all',
    this.errorMessage,
  });

  FounderState copyWith({
    FounderStatus? status,
    List<Map<String, dynamic>>? ventures,
    List<Map<String, dynamic>>? pitchSessions,
    List<Map<String, dynamic>>? connections,
    List<Map<String, dynamic>>? notifications,
    List<Map<String, dynamic>>? meetings,
    String? ventureSearchTerm,
    String? ventureStageFilter,
    String? errorMessage,
    bool clearErrorMessage = false,
  }) {
    return FounderState(
      status: status ?? this.status,
      ventures: ventures ?? this.ventures,
      pitchSessions: pitchSessions ?? this.pitchSessions,
      connections: connections ?? this.connections,
      notifications: notifications ?? this.notifications,
      meetings: meetings ?? this.meetings,
      ventureSearchTerm: ventureSearchTerm ?? this.ventureSearchTerm,
      ventureStageFilter: ventureStageFilter ?? this.ventureStageFilter,
      errorMessage: clearErrorMessage
          ? null
          : (errorMessage ?? this.errorMessage),
    );
  }

  List<Map<String, dynamic>> get filteredVentures {
    final term = ventureSearchTerm.trim().toLowerCase();
    return ventures.where((venture) {
      final stage = (venture['stage'] ?? '').toString();
      if (ventureStageFilter != 'all' && stage != ventureStageFilter) {
        return false;
      }

      if (term.isEmpty) return true;

      final name = (venture['name'] ?? '').toString().toLowerCase();
      final tagline = (venture['tagline'] ?? '').toString().toLowerCase();
      final industry = (venture['industry'] ?? '').toString().toLowerCase();

      return name.contains(term) ||
          tagline.contains(term) ||
          industry.contains(term);
    }).toList();
  }

  List<Map<String, dynamic>> get previewNotifications =>
      notifications.take(5).toList();

  List<Map<String, dynamic>> get previewMeetings => meetings.take(5).toList();

  @override
  List<Object?> get props => [
    status,
    ventures,
    pitchSessions,
    connections,
    notifications,
    meetings,
    ventureSearchTerm,
    ventureStageFilter,
    errorMessage,
  ];
}

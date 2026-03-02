import 'package:flutter_bloc/flutter_bloc.dart';
import '../../services/api_service.dart';
import 'founder_state.dart';

class FounderCubit extends Cubit<FounderState> {
  FounderCubit() : super(const FounderState());

  Future<void> initializeVentureHub() async {
    if (state.status == FounderStatus.loading && state.ventures.isNotEmpty) {
      return;
    }
    await refreshVentureHub();
  }

  Future<void> refreshVentureHub() async {
    emit(
      state.copyWith(status: FounderStatus.loading, clearErrorMessage: true),
    );
    try {
      final venturesRaw = await ApiService.instance.getMyVentures();
      final ventures = _toMapList(venturesRaw);
      emit(
        state.copyWith(
          status: FounderStatus.success,
          ventures: ventures,
          clearErrorMessage: true,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(status: FounderStatus.error, errorMessage: e.toString()),
      );
    }
  }

  Future<void> initializeSnapshot() async {
    if (state.status == FounderStatus.loading) return;
    await refreshSnapshot();
  }

  Future<void> refreshSnapshot() async {
    emit(
      state.copyWith(status: FounderStatus.loading, clearErrorMessage: true),
    );
    try {
      final results = await Future.wait<dynamic>([
        ApiService.instance.getMyVentures(),
        ApiService.instance.getPitchSessions(),
        ApiService.instance.getConnections(),
        ApiService.instance.getNotifications(),
        ApiService.instance.getUpcomingMeetings(),
      ]);

      emit(
        state.copyWith(
          status: FounderStatus.success,
          ventures: _toMapList(results[0] as List<dynamic>),
          pitchSessions: _toMapList(results[1] as List<dynamic>),
          connections: _toMapList(results[2] as List<dynamic>),
          notifications: _toMapList(results[3] as List<dynamic>),
          meetings: _toMapList(results[4] as List<dynamic>),
          clearErrorMessage: true,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(status: FounderStatus.error, errorMessage: e.toString()),
      );
    }
  }

  void setVentureSearchTerm(String value) {
    emit(state.copyWith(ventureSearchTerm: value));
  }

  void setVentureStageFilter(String value) {
    emit(state.copyWith(ventureStageFilter: value));
  }

  Future<bool> updateVenture(int id, Map<String, dynamic> payload) async {
    try {
      final updated = await ApiService.instance.updateVenture(id, payload);
      final ventures = state.ventures.map((venture) {
        final ventureId = _toInt(venture['id']);
        if (ventureId == id) {
          return Map<String, dynamic>.from({...venture, ...updated});
        }
        return venture;
      }).toList();

      emit(
        state.copyWith(
          ventures: ventures,
          status: FounderStatus.success,
          clearErrorMessage: true,
        ),
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteVenture(int id) async {
    try {
      await ApiService.instance.deleteVenture(id);
      final ventures = state.ventures
          .where((venture) => _toInt(venture['id']) != id)
          .toList();

      emit(
        state.copyWith(
          ventures: ventures,
          status: FounderStatus.success,
          clearErrorMessage: true,
        ),
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  static List<Map<String, dynamic>> _toMapList(List<dynamic> items) {
    return items.map((item) => Map<String, dynamic>.from(item as Map)).toList();
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse('$value') ?? -1;
  }
}

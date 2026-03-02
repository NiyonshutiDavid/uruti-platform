import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';

import '../models/call_session.dart';
import '../services/call_service.dart';

enum CallPhase { idle, incoming, outgoing, active }

class CallProvider extends ChangeNotifier {
  CallProvider() {
    CallService.instance.bindNativeEvents(_handleNativeEvent);
  }

  CallSession? _session;
  CallPhase _phase = CallPhase.idle;
  bool _fullScreen = false;
  bool _muted = false;
  bool _speakerOn = false;
  DateTime? _activeStartedAt;
  Timer? _timer;
  Duration _activeDuration = Duration.zero;
  bool _shouldEndSystemCall = false;

  CallSession? get session => _session;
  CallPhase get phase => _phase;
  bool get hasCall => _phase != CallPhase.idle && _session != null;
  bool get isIncoming => _phase == CallPhase.incoming;
  bool get isOutgoing => _phase == CallPhase.outgoing;
  bool get isActive => _phase == CallPhase.active;
  bool get isFullScreen => _fullScreen;
  bool get muted => _muted;
  bool get speakerOn => _speakerOn;
  Duration get activeDuration => _activeDuration;

  Future<void> onIncomingCall(
    CallSession session, {
    bool showSystemIncomingUi = true,
  }) async {
    _session = session;
    _phase = CallPhase.incoming;
    _fullScreen = false;
    _muted = false;
    _speakerOn = false;
    _activeStartedAt = null;
    _activeDuration = Duration.zero;
    _shouldEndSystemCall = true;
    notifyListeners();

    if (showSystemIncomingUi) {
      await CallService.instance.showSystemIncomingCall(session);
    }
  }

  Future<void> startOutgoingCall({
    required String calleeId,
    required String calleeName,
    String? calleeAvatarUrl,
    String? handle,
    bool isVideo = false,
  }) async {
    _session = CallSession(
      id: _newCallId(),
      callerId: calleeId,
      callerName: calleeName,
      callerAvatarUrl: calleeAvatarUrl,
      handle: handle,
      isVideo: isVideo,
      createdAt: DateTime.now(),
    );
    _phase = CallPhase.outgoing;
    _fullScreen = true;
    _muted = false;
    _speakerOn = false;
    _activeStartedAt = null;
    _activeDuration = Duration.zero;
    _shouldEndSystemCall = false;
    notifyListeners();
  }

  Future<void> acceptCall() async {
    if (_session == null) return;
    _phase = CallPhase.active;
    _fullScreen = true;
    _activeStartedAt = DateTime.now();
    _startTimer();
    if (_shouldEndSystemCall) {
      await CallService.instance.endSystemCall(_session!.id);
    }
    notifyListeners();
  }

  Future<void> declineCall() async {
    final callId = _session?.id;
    final shouldEndSystemCall = _shouldEndSystemCall;
    _resetState();
    if (shouldEndSystemCall && callId != null) {
      await CallService.instance.endSystemCall(callId);
    }
    notifyListeners();
  }

  Future<void> endCall() async {
    final callId = _session?.id;
    final shouldEndSystemCall = _shouldEndSystemCall;
    _resetState();
    if (shouldEndSystemCall && callId != null) {
      await CallService.instance.endSystemCall(callId);
    }
    notifyListeners();
  }

  void openFullScreen() {
    if (!hasCall) return;
    _fullScreen = true;
    notifyListeners();
  }

  void minimizeToBanner() {
    if (!hasCall) return;
    _fullScreen = false;
    notifyListeners();
  }

  void toggleMute() {
    if (!isActive) return;
    _muted = !_muted;
    notifyListeners();
  }

  void toggleSpeaker() {
    if (!isActive) return;
    _speakerOn = !_speakerOn;
    notifyListeners();
  }

  Future<void> simulateIncomingCall({
    String callerName = 'Ben Mark',
    String handle = '+250 700 000 000',
    String? avatarUrl,
    bool isVideo = false,
  }) async {
    final mock = CallSession(
      id: _newCallId(),
      callerId: 'debug-caller',
      callerName: callerName,
      callerAvatarUrl: avatarUrl,
      handle: handle,
      isVideo: isVideo,
      createdAt: DateTime.now(),
    );
    await onIncomingCall(mock, showSystemIncomingUi: true);
  }

  void _handleNativeEvent(String event, Map<String, dynamic> body) {
    final normalized = event.toLowerCase();
    if (_session == null) {
      if (normalized.contains('incoming')) {
        final extra = Map<String, dynamic>.from(body['extra'] ?? const {});
        final payload = <String, dynamic>{
          'call_id': body['id']?.toString(),
          'caller_id': extra['caller_id']?.toString(),
          'caller_name':
              extra['caller_name']?.toString() ??
              body['nameCaller']?.toString(),
          'caller_avatar_url':
              extra['caller_avatar_url']?.toString() ??
              body['avatar']?.toString(),
          'handle': extra['handle']?.toString() ?? body['handle']?.toString(),
          'is_video': (body['type'] == 1),
        };
        onIncomingCall(
          CallSession.fromPayload(payload),
          showSystemIncomingUi: false,
        );
      }
      return;
    }

    if (normalized.contains('accept')) {
      acceptCall();
      return;
    }
    if (normalized.contains('decline') || normalized.contains('end')) {
      endCall();
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_activeStartedAt == null) return;
      _activeDuration = DateTime.now().difference(_activeStartedAt!);
      notifyListeners();
    });
  }

  void _resetState() {
    _timer?.cancel();
    _timer = null;
    _session = null;
    _phase = CallPhase.idle;
    _fullScreen = false;
    _muted = false;
    _speakerOn = false;
    _activeStartedAt = null;
    _activeDuration = Duration.zero;
    _shouldEndSystemCall = false;
  }

  String _newCallId() {
    final random = Random.secure();
    String hex(int length) => List.generate(
      length,
      (_) => random.nextInt(16).toRadixString(16),
    ).join();
    return '${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + random.nextInt(4)).toRadixString(16)}${hex(3)}-${hex(12)}';
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

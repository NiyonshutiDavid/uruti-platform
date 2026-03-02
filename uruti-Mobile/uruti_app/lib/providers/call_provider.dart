import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';

import '../models/call_session.dart';
import '../services/api_service.dart';
import '../services/call_service.dart';
import '../services/realtime_service.dart';

enum CallPhase { idle, incoming, outgoing, active }

class CallProvider extends ChangeNotifier {
  CallProvider() {
    CallService.instance.bindNativeEvents(_handleNativeEvent);
    _realtimeSub = RealtimeService.instance.events.listen(_handleRealtimeEvent);
  }

  CallSession? _session;
  CallPhase _phase = CallPhase.idle;
  CallSession? _secondarySession;
  CallPhase _secondaryPhase = CallPhase.idle;
  bool _fullScreen = false;
  bool _muted = false;
  bool _speakerOn = false;
  bool _videoEnabled = true;
  DateTime? _activeStartedAt;
  Timer? _timer;
  Duration _activeDuration = Duration.zero;
  bool _shouldEndSystemCall = false;
  String? _peerUserId;
  bool _secondaryShouldEndSystemCall = false;
  String? _secondaryPeerUserId;
  Duration _secondaryActiveDuration = Duration.zero;
  StreamSubscription<Map<String, dynamic>>? _realtimeSub;

  CallSession? get session => _session;
  CallPhase get phase => _phase;
  bool get hasCall => _phase != CallPhase.idle && _session != null;
  bool get isIncoming => _phase == CallPhase.incoming;
  bool get isOutgoing => _phase == CallPhase.outgoing;
  bool get isActive => _phase == CallPhase.active;
  bool get isFullScreen => _fullScreen;
  bool get muted => _muted;
  bool get speakerOn => _speakerOn;
  bool get videoEnabled => _videoEnabled;
  Duration get activeDuration => _activeDuration;
  bool get hasWaitingCall => _secondarySession != null;

  Future<void> onIncomingCall(
    CallSession session, {
    bool showSystemIncomingUi = true,
  }) async {
    if (_session != null && _session!.id != session.id) {
      if (_secondarySession != null && _secondarySession!.id != session.id) {
        await _sendSignalToPeer(
          action: 'decline',
          callIdOverride: session.id,
          peerUserIdOverride: session.callerId,
          sessionOverride: session,
        );
        return;
      }
      _parkPrimaryCallToSecondary();
    }

    _session = session;
    _phase = CallPhase.incoming;
    _fullScreen = false;
    _muted = false;
    _speakerOn = false;
    _videoEnabled = session.isVideo;
    _activeStartedAt = null;
    _activeDuration = Duration.zero;
    _shouldEndSystemCall = true;
    _peerUserId = session.callerId;
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
    if (_session != null && _secondarySession == null) {
      _parkPrimaryCallToSecondary();
    } else if (_session != null && _secondarySession != null) {
      return;
    }

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
    _videoEnabled = isVideo;
    _activeStartedAt = null;
    _activeDuration = Duration.zero;
    _shouldEndSystemCall = false;
    _peerUserId = calleeId;
    notifyListeners();

    final receiverId = int.tryParse(calleeId);
    if (receiverId != null && receiverId > 0) {
      try {
        await ApiService.instance.sendCallSignal(
          receiverId: receiverId,
          action: 'invite',
          callId: _session!.id,
          isVideo: isVideo,
          handle: handle,
        );
      } catch (_) {}
    }
  }

  Future<void> acceptCall({bool notifyPeer = true}) async {
    if (_session == null) return;
    _phase = CallPhase.active;
    _fullScreen = true;
    _activeStartedAt = DateTime.now();
    _startTimer();
    if (_shouldEndSystemCall) {
      await CallService.instance.endSystemCall(_session!.id);
    }

    if (notifyPeer) {
      await _sendSignalToPeer(action: 'accept');
    }
    notifyListeners();
  }

  Future<void> declineCall({bool notifyPeer = true}) async {
    final current = _session;
    final callId = current?.id;
    final shouldEndSystemCall = _shouldEndSystemCall;
    final peerToNotify = notifyPeer;
    if (_secondarySession != null) {
      _clearPrimaryState(keepSecondary: true);
      _promoteSecondaryToPrimary();
    } else {
      _resetState();
    }
    if (shouldEndSystemCall && callId != null) {
      await CallService.instance.endSystemCall(callId);
    }
    if (peerToNotify) {
      await _sendSignalToPeer(
        action: 'decline',
        callIdOverride: callId,
        peerUserIdOverride: current?.callerId,
        sessionOverride: current,
      );
    }
    notifyListeners();
  }

  Future<void> endCall({bool notifyPeer = true}) async {
    final current = _session;
    final callId = current?.id;
    final shouldEndSystemCall = _shouldEndSystemCall;
    final peerToNotify = notifyPeer;
    if (_secondarySession != null) {
      _clearPrimaryState(keepSecondary: true);
      _promoteSecondaryToPrimary();
    } else {
      _resetState();
    }
    if (shouldEndSystemCall && callId != null) {
      await CallService.instance.endSystemCall(callId);
    }
    if (peerToNotify) {
      await _sendSignalToPeer(
        action: 'end',
        callIdOverride: callId,
        peerUserIdOverride: current?.callerId,
        sessionOverride: current,
      );
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
    if (!isActive && !isOutgoing) return;
    _muted = !_muted;
    notifyListeners();
  }

  void toggleSpeaker() {
    if (!isActive && !isOutgoing) return;
    _speakerOn = !_speakerOn;
    notifyListeners();
  }

  void toggleVideo() {
    if (_session == null || !_session!.isVideo) return;
    if (!isActive && !isOutgoing) return;
    _videoEnabled = !_videoEnabled;
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
      unawaited(acceptCall());
      return;
    }
    if (normalized.contains('decline')) {
      unawaited(declineCall());
      return;
    }
    if (normalized.contains('end')) {
      if (_phase == CallPhase.incoming) {
        return;
      }
      unawaited(endCall());
    }
  }

  void _handleRealtimeEvent(Map<String, dynamic> event) {
    if (event['event'] != 'call_event') return;
    final raw = event['data'];
    if (raw is! Map) return;
    final payload = Map<String, dynamic>.from(raw.cast<dynamic, dynamic>());
    _handleCallSignal(payload);
  }

  void _handleCallSignal(Map<String, dynamic> payload) {
    final action = (payload['action'] ?? '').toString().toLowerCase();
    final callId = (payload['call_id'] ?? '').toString();
    final callerId = (payload['caller_id'] ?? '').toString();

    if (action == 'invite') {
      if (_session != null && _session!.id == callId) {
        return;
      }
      if (_secondarySession != null && _secondarySession!.id == callId) {
        return;
      }

      unawaited(
        onIncomingCall(
          CallSession.fromPayload({
            'call_id': callId,
            'caller_id': callerId,
            'caller_name': payload['caller_name'],
            'caller_avatar_url': payload['caller_avatar_url'],
            'handle': payload['handle'],
            'is_video': payload['is_video'] == true,
          }),
          showSystemIncomingUi: true,
        ),
      );
      return;
    }

    if (_session == null) return;

    final isPrimary = callId.isEmpty || _session!.id == callId;
    final isSecondary =
        callId.isNotEmpty &&
        _secondarySession != null &&
        _secondarySession!.id == callId;

    if (!isPrimary && !isSecondary) return;

    if (action == 'accept') {
      if (!isPrimary) return;
      if (_phase == CallPhase.active) return;
      _phase = CallPhase.active;
      _fullScreen = true;
      _activeStartedAt = DateTime.now();
      _startTimer();
      notifyListeners();
      return;
    }

    if (action == 'decline' || action == 'end') {
      if (isSecondary) {
        _secondarySession = null;
        _secondaryPhase = CallPhase.idle;
        _secondaryShouldEndSystemCall = false;
        _secondaryPeerUserId = null;
        _secondaryActiveDuration = Duration.zero;
        notifyListeners();
        return;
      }
      unawaited(endCall(notifyPeer: false));
    }
  }

  Future<void> _sendSignalToPeer({
    required String action,
    String? callIdOverride,
    String? peerUserIdOverride,
    CallSession? sessionOverride,
  }) async {
    final targetSession = sessionOverride ?? _session;
    final callId = callIdOverride ?? targetSession?.id;
    final rawPeerId =
        peerUserIdOverride ?? _peerUserId ?? targetSession?.callerId;
    final peerId = int.tryParse(rawPeerId ?? '');
    if (callId == null || callId.isEmpty || peerId == null || peerId <= 0) {
      return;
    }

    try {
      await ApiService.instance.sendCallSignal(
        receiverId: peerId,
        action: action,
        callId: callId,
        isVideo: targetSession?.isVideo ?? false,
        handle: targetSession?.handle,
      );
    } catch (_) {}
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
    _secondarySession = null;
    _secondaryPhase = CallPhase.idle;
    _fullScreen = false;
    _muted = false;
    _speakerOn = false;
    _videoEnabled = true;
    _activeStartedAt = null;
    _activeDuration = Duration.zero;
    _shouldEndSystemCall = false;
    _peerUserId = null;
    _secondaryShouldEndSystemCall = false;
    _secondaryPeerUserId = null;
    _secondaryActiveDuration = Duration.zero;
  }

  void _clearPrimaryState({required bool keepSecondary}) {
    _timer?.cancel();
    _timer = null;
    _session = null;
    _phase = CallPhase.idle;
    _fullScreen = false;
    _muted = false;
    _speakerOn = false;
    _videoEnabled = true;
    _activeStartedAt = null;
    _activeDuration = Duration.zero;
    _shouldEndSystemCall = false;
    _peerUserId = null;

    if (!keepSecondary) {
      _secondarySession = null;
      _secondaryPhase = CallPhase.idle;
      _secondaryShouldEndSystemCall = false;
      _secondaryPeerUserId = null;
      _secondaryActiveDuration = Duration.zero;
    }
  }

  void _parkPrimaryCallToSecondary() {
    if (_session == null || _secondarySession != null) return;

    if (_phase == CallPhase.active && _activeStartedAt != null) {
      _secondaryActiveDuration = DateTime.now().difference(_activeStartedAt!);
    } else {
      _secondaryActiveDuration = _activeDuration;
    }

    _secondarySession = _session;
    _secondaryPhase = _phase;
    _secondaryShouldEndSystemCall = _shouldEndSystemCall;
    _secondaryPeerUserId = _peerUserId;

    _timer?.cancel();
    _timer = null;
    _session = null;
    _phase = CallPhase.idle;
    _activeStartedAt = null;
    _activeDuration = Duration.zero;
    _shouldEndSystemCall = false;
    _peerUserId = null;
  }

  void _promoteSecondaryToPrimary() {
    final promotedSession = _secondarySession;
    if (promotedSession == null) return;

    _session = promotedSession;
    _phase = _secondaryPhase;
    _shouldEndSystemCall = _secondaryShouldEndSystemCall;
    _peerUserId = _secondaryPeerUserId;
    _videoEnabled = promotedSession.isVideo;
    _fullScreen = false;

    _secondarySession = null;
    _secondaryPhase = CallPhase.idle;
    _secondaryShouldEndSystemCall = false;
    _secondaryPeerUserId = null;

    if (_phase == CallPhase.active) {
      _activeStartedAt = DateTime.now().subtract(_secondaryActiveDuration);
      _activeDuration = _secondaryActiveDuration;
      _startTimer();
    } else {
      _activeStartedAt = null;
      _activeDuration = _secondaryActiveDuration;
    }

    _secondaryActiveDuration = Duration.zero;
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
    _realtimeSub?.cancel();
    super.dispose();
  }
}

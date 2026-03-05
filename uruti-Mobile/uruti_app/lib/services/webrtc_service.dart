import 'dart:async';

import 'package:flutter_webrtc/flutter_webrtc.dart';

import 'api_service.dart';
import 'realtime_service.dart';

/// Manages a single WebRTC peer connection for 1-to-1 voice/video calls.
///
/// Signaling (SDP offers/answers, ICE candidates) is carried over the existing
/// backend POST `/call/signal` endpoint (action = 'webrtc_offer', etc.) and
/// received through the RealtimeService WebSocket.
class WebRtcService {
  WebRtcService._();
  static final WebRtcService instance = WebRtcService._();

  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  MediaStream? _remoteStream;
  StreamSubscription<Map<String, dynamic>>? _sigSub;

  String? _currentCallId;
  int? _currentPeerId;
  bool _isVideo = false;

  // ── Public state ──────────────────────────────────────────────────────────

  MediaStream? get localStream => _localStream;
  MediaStream? get remoteStream => _remoteStream;
  RTCVideoRenderer? _localRenderer;
  RTCVideoRenderer? _remoteRenderer;

  RTCVideoRenderer? get localRenderer => _localRenderer;
  RTCVideoRenderer? get remoteRenderer => _remoteRenderer;

  bool get hasConnection => _peerConnection != null;

  /// Called whenever a remote stream is attached / removed so the UI can
  /// rebuild.
  void Function()? onRemoteStreamChanged;
  void Function()? onLocalStreamChanged;

  // ── ICE servers ───────────────────────────────────────────────────────────

  static const Map<String, dynamic> _iceConfig = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
      {'urls': 'stun:stun2.l.google.com:19302'},
    ],
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /// Initialise renderers. Call once early (e.g. on call screen mount).
  Future<void> initRenderers() async {
    _localRenderer ??= RTCVideoRenderer();
    _remoteRenderer ??= RTCVideoRenderer();
    await _localRenderer!.initialize();
    await _remoteRenderer!.initialize();
  }

  /// Start a WebRTC session (caller side).  Creates local media, builds an
  /// offer and sends it via the signaling channel.
  Future<void> startCall({
    required String callId,
    required int peerId,
    required bool isVideo,
  }) async {
    _currentCallId = callId;
    _currentPeerId = peerId;
    _isVideo = isVideo;

    _listenForSignaling();

    await _createLocalStream(isVideo);
    await _createPeerConnection();

    // Create an SDP offer
    final offer = await _peerConnection!.createOffer(
      isVideo
          ? {'offerToReceiveAudio': true, 'offerToReceiveVideo': true}
          : {'offerToReceiveAudio': true, 'offerToReceiveVideo': false},
    );
    await _peerConnection!.setLocalDescription(offer);

    // Send the offer over the signaling channel
    await _sendSignal('webrtc_offer', {'sdp': offer.sdp, 'type': offer.type});
  }

  /// Answer an incoming WebRTC session (callee side).
  Future<void> answerCall({
    required String callId,
    required int peerId,
    required bool isVideo,
    required Map<String, dynamic> offerSdp,
  }) async {
    _currentCallId = callId;
    _currentPeerId = peerId;
    _isVideo = isVideo;

    _listenForSignaling();

    await _createLocalStream(isVideo);
    await _createPeerConnection();

    // Set remote description from the offer
    await _peerConnection!.setRemoteDescription(
      RTCSessionDescription(offerSdp['sdp'], offerSdp['type']),
    );

    // Create and set local answer
    final answer = await _peerConnection!.createAnswer(
      isVideo
          ? {'offerToReceiveAudio': true, 'offerToReceiveVideo': true}
          : {'offerToReceiveAudio': true, 'offerToReceiveVideo': false},
    );
    await _peerConnection!.setLocalDescription(answer);

    await _sendSignal('webrtc_answer', {
      'sdp': answer.sdp,
      'type': answer.type,
    });
  }

  /// Cleanly tear down the peer connection and streams.
  Future<void> hangUp() async {
    _sigSub?.cancel();
    _sigSub = null;

    _localStream?.getTracks().forEach((t) => t.stop());
    await _localStream?.dispose();
    _localStream = null;

    _remoteStream?.getTracks().forEach((t) => t.stop());
    await _remoteStream?.dispose();
    _remoteStream = null;

    await _peerConnection?.close();
    _peerConnection = null;

    _localRenderer?.srcObject = null;
    _remoteRenderer?.srcObject = null;

    _currentCallId = null;
    _currentPeerId = null;

    onRemoteStreamChanged?.call();
    onLocalStreamChanged?.call();
  }

  /// Dispose renderers when the call UI is torn down.
  Future<void> disposeRenderers() async {
    await _localRenderer?.dispose();
    await _remoteRenderer?.dispose();
    _localRenderer = null;
    _remoteRenderer = null;
  }

  // ── Audio / Video controls ────────────────────────────────────────────────

  void setMicEnabled(bool enabled) {
    _localStream?.getAudioTracks().forEach((t) => t.enabled = enabled);
  }

  void setSpeakerOn(bool on) {
    _localStream?.getAudioTracks().forEach((t) {
      t.enableSpeakerphone(on);
    });
  }

  void setVideoEnabled(bool enabled) {
    _localStream?.getVideoTracks().forEach((t) => t.enabled = enabled);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  Future<void> _createLocalStream(bool isVideo) async {
    final constraints = <String, dynamic>{
      'audio': true,
      'video': isVideo
          ? {'facingMode': 'user', 'width': 640, 'height': 480}
          : false,
    };

    _localStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (_localRenderer != null) {
      _localRenderer!.srcObject = _localStream;
    }
    onLocalStreamChanged?.call();
  }

  Future<void> _createPeerConnection() async {
    _peerConnection = await createPeerConnection(_iceConfig);

    // Add local tracks to peer connection
    _localStream?.getTracks().forEach((track) {
      _peerConnection!.addTrack(track, _localStream!);
    });

    // Listen for remote tracks
    _peerConnection!.onTrack = (RTCTrackEvent event) {
      if (event.streams.isNotEmpty) {
        _remoteStream = event.streams.first;
        if (_remoteRenderer != null) {
          _remoteRenderer!.srcObject = _remoteStream;
        }
        onRemoteStreamChanged?.call();
      }
    };

    // Send ICE candidates to the peer
    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      _sendSignal('webrtc_ice', {
        'candidate': candidate.candidate,
        'sdpMid': candidate.sdpMid,
        'sdpMLineIndex': candidate.sdpMLineIndex,
      });
    };

    _peerConnection!.onIceConnectionState = (state) {
      // Could log or react to state changes here
    };
  }

  void _listenForSignaling() {
    _sigSub?.cancel();
    _sigSub = RealtimeService.instance.events.listen(_handleSignalingEvent);
  }

  void _handleSignalingEvent(Map<String, dynamic> event) {
    if (event['event'] != 'call_event') return;
    final data = event['data'];
    if (data is! Map) return;
    final payload = Map<String, dynamic>.from(data.cast<dynamic, dynamic>());

    final callId = payload['call_id']?.toString();
    if (callId != _currentCallId) return;

    final action = (payload['action'] ?? '').toString();

    switch (action) {
      case 'webrtc_offer':
        // We received an offer while already set up — should not happen in
        // normal flow.  Handled by answerCall() path instead.
        break;
      case 'webrtc_answer':
        _handleRemoteAnswer(payload['webrtc_data'] ?? payload);
        break;
      case 'webrtc_ice':
        _handleRemoteIce(payload['webrtc_data'] ?? payload);
        break;
    }
  }

  Future<void> _handleRemoteAnswer(Map<String, dynamic> data) async {
    if (_peerConnection == null) return;
    final sdp = data['sdp']?.toString();
    final type = data['type']?.toString();
    if (sdp == null || type == null) return;
    await _peerConnection!.setRemoteDescription(
      RTCSessionDescription(sdp, type),
    );
  }

  Future<void> _handleRemoteIce(Map<String, dynamic> data) async {
    if (_peerConnection == null) return;
    final candidate = data['candidate']?.toString();
    final sdpMid = data['sdpMid']?.toString();
    final sdpMLineIndex = data['sdpMLineIndex'] as int?;
    if (candidate == null) return;
    await _peerConnection!.addCandidate(
      RTCIceCandidate(candidate, sdpMid, sdpMLineIndex),
    );
  }

  Future<void> _sendSignal(
    String action,
    Map<String, dynamic> webrtcData,
  ) async {
    if (_currentPeerId == null || _currentCallId == null) return;
    try {
      await ApiService.instance.sendCallSignal(
        receiverId: _currentPeerId!,
        action: action,
        callId: _currentCallId!,
        isVideo: _isVideo,
        webrtcData: webrtcData,
      );
    } catch (_) {}
  }
}

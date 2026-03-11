import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import '../../core/app_colors.dart';
import '../../models/call_session.dart';
import '../../services/webrtc_service.dart';

class CallFullscreenScreen extends StatefulWidget {
  final CallSession session;
  final bool incoming;
  final bool outgoing;
  final bool isActive;
  final bool muted;
  final bool speakerOn;
  final bool videoEnabled;
  final Duration activeDuration;
  final VoidCallback onMinimize;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final VoidCallback onEnd;
  final VoidCallback onToggleMute;
  final VoidCallback onToggleSpeaker;
  final VoidCallback onToggleVideo;

  const CallFullscreenScreen({
    super.key,
    required this.session,
    required this.incoming,
    required this.outgoing,
    required this.isActive,
    required this.muted,
    required this.speakerOn,
    required this.videoEnabled,
    required this.activeDuration,
    required this.onMinimize,
    required this.onAccept,
    required this.onDecline,
    required this.onEnd,
    required this.onToggleMute,
    required this.onToggleSpeaker,
    required this.onToggleVideo,
  });

  @override
  State<CallFullscreenScreen> createState() => _CallFullscreenScreenState();
}

class _CallFullscreenScreenState extends State<CallFullscreenScreen> {
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();
  bool _renderersReady = false;

  @override
  void initState() {
    super.initState();
    _initRenderers();
  }

  Future<void> _initRenderers() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();

    // Bind WebRTC service streams
    WebRtcService.instance.onLocalStreamChanged = () {
      if (!mounted) return;
      final svc = WebRtcService.instance;
      _localRenderer.srcObject =
          svc.localRenderer?.srcObject ?? svc.localStream;
      setState(() {});
    };
    WebRtcService.instance.onRemoteStreamChanged = () {
      if (!mounted) return;
      final svc = WebRtcService.instance;
      _remoteRenderer.srcObject =
          svc.remoteRenderer?.srcObject ?? svc.remoteStream;
      setState(() {});
    };

    // Attach existing streams (if already connected)
    final svc = WebRtcService.instance;
    _localRenderer.srcObject = svc.localRenderer?.srcObject ?? svc.localStream;
    _remoteRenderer.srcObject =
        svc.remoteRenderer?.srcObject ?? svc.remoteStream;

    if (mounted) setState(() => _renderersReady = true);
  }

  @override
  void dispose() {
    WebRtcService.instance.onLocalStreamChanged = null;
    WebRtcService.instance.onRemoteStreamChanged = null;
    _localRenderer.dispose();
    _remoteRenderer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showFullOwnPreview =
        widget.session.isVideo &&
        widget.outgoing &&
        !widget.incoming &&
        widget.videoEnabled;
    final showRemoteVideo = widget.session.isVideo && widget.isActive;
    final showSmallOwnPreview =
        widget.session.isVideo && widget.isActive && widget.videoEnabled;
    final hasLocalStream = _renderersReady && _localRenderer.srcObject != null;
    final hasRemoteStream =
        _renderersReady && _remoteRenderer.srcObject != null;

    return Material(
      type: MaterialType.transparency,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: (showFullOwnPreview || showRemoteVideo)
                ? const [Color(0xFF0A1A2A), Color(0xFF081324)]
                : const [Color(0xFF081120), Color(0xFF040A12)],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // ── Remote peer video (full-screen background) ────────
              if (showRemoteVideo && hasRemoteStream)
                Positioned.fill(
                  child: RTCVideoView(
                    _remoteRenderer,
                    objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                  ),
                ),
              // ── Own camera preview (full-screen while ringing) ────
              if (showFullOwnPreview && !showRemoteVideo)
                Positioned.fill(
                  child: hasLocalStream
                      ? RTCVideoView(
                          _localRenderer,
                          mirror: true,
                          objectFit:
                              RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                        )
                      : Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [Color(0xFF1B3550), Color(0xFF0E1C30)],
                            ),
                          ),
                          child: Center(
                            child: Icon(
                              Icons.videocam_rounded,
                              size: 110,
                              color: Colors.white.withValues(alpha: 0.22),
                            ),
                          ),
                        ),
                ),
              if (showFullOwnPreview || (showRemoteVideo && hasRemoteStream))
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.25),
                          Colors.black.withValues(alpha: 0.5),
                        ],
                      ),
                    ),
                  ),
                ),
              Positioned(
                top: 12,
                left: 12,
                child: _TopCircleButton(
                  icon: Icons.call_received_rounded,
                  onTap: widget.onMinimize,
                ),
              ),
              Align(
                alignment: Alignment.topCenter,
                child: Padding(
                  padding: const EdgeInsets.only(top: 24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        widget.session.callerName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 30,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        widget.incoming
                            ? (widget.session.handle ?? 'Incoming call')
                            : widget.isActive
                            ? _format(widget.activeDuration)
                            : 'Ringing…',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 17,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (!showFullOwnPreview && !(showRemoteVideo && hasRemoteStream))
                Align(
                  alignment: widget.incoming
                      ? Alignment.center
                      : Alignment(0, 0.05),
                  child: CircleAvatar(
                    radius: widget.incoming ? 108 : 118,
                    backgroundColor: const Color(0xFF1E1E1E),
                    backgroundImage:
                        (widget.session.callerAvatarUrl?.isNotEmpty ?? false)
                        ? NetworkImage(widget.session.callerAvatarUrl!)
                        : null,
                    child: (widget.session.callerAvatarUrl?.isEmpty ?? true)
                        ? Text(
                            _initials(widget.session.callerName),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 52,
                              fontWeight: FontWeight.w700,
                            ),
                          )
                        : null,
                  ),
                ),

              if (showSmallOwnPreview && widget.videoEnabled)
                Positioned(
                  right: 16,
                  bottom: 190,
                  child: Container(
                    width: 116,
                    height: 162,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: context.colors.accent.withValues(alpha: 0.9),
                        width: 2,
                      ),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF30485F), Color(0xFF1B2A39)],
                      ),
                    ),
                    child: Stack(
                      children: [
                        if (hasLocalStream)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: RTCVideoView(
                              _localRenderer,
                              mirror: true,
                              objectFit: RTCVideoViewObjectFit
                                  .RTCVideoViewObjectFitCover,
                            ),
                          )
                        else
                          Center(
                            child: Icon(
                              Icons.videocam_rounded,
                              size: 34,
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                          ),
                        Positioned(
                          left: 8,
                          bottom: 8,
                          child: Text(
                            'You',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.92),
                              fontWeight: FontWeight.w700,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (!widget.incoming)
                Positioned(
                  left: 12,
                  right: 12,
                  bottom: 112,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _CallControl(
                          icon: widget.speakerOn
                              ? Icons.volume_up_rounded
                              : Icons.volume_off_rounded,
                          active: widget.speakerOn,
                          onTap: widget.onToggleSpeaker,
                        ),
                        _CallControl(
                          icon: widget.muted
                              ? Icons.mic_off_rounded
                              : Icons.mic_rounded,
                          active: widget.muted,
                          onTap: widget.onToggleMute,
                        ),
                        if (widget.session.isVideo)
                          _CallControl(
                            icon: widget.videoEnabled
                                ? Icons.videocam_rounded
                                : Icons.videocam_off_rounded,
                            active: widget.videoEnabled,
                            onTap: widget.onToggleVideo,
                          ),
                      ],
                    ),
                  ),
                ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 18,
                child: widget.incoming
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _CallRoundAction(
                            color: AppColors.error,
                            icon: Icons.call_end_rounded,
                            label: 'Decline',
                            onTap: widget.onDecline,
                          ),
                          _CallRoundAction(
                            color: AppColors.success,
                            icon: Icons.call_rounded,
                            label: 'Accept',
                            onTap: widget.onAccept,
                          ),
                        ],
                      )
                    : Center(
                        child: _CallRoundAction(
                          color: AppColors.error,
                          icon: Icons.call_end_rounded,
                          label: 'End',
                          onTap: widget.onEnd,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((e) => e.isNotEmpty);
    final chars = parts.take(2).map((e) => e[0].toUpperCase()).join();
    return chars.isEmpty ? 'U' : chars;
  }

  String _format(Duration d) {
    final mm = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final ss = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    final hh = d.inHours;
    if (hh > 0) {
      return '$hh:$mm:$ss';
    }
    return '$mm:$ss';
  }
}

class _CallRoundAction extends StatelessWidget {
  final Color color;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _CallRoundAction({
    required this.color,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            child: Icon(icon, color: Colors.white, size: 32),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 14),
        ),
      ],
    );
  }
}

class _CallControl extends StatelessWidget {
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  const _CallControl({
    required this.icon,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          color: active ? context.colors.accent : Colors.white12,
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: active ? Colors.black : Colors.white,
          size: 24,
        ),
      ),
    );
  }
}

class _TopCircleButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _TopCircleButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.45),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 26),
      ),
    );
  }
}

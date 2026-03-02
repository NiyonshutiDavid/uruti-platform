import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../core/app_colors.dart';
import '../../models/call_session.dart';

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
  CameraController? _cameraController;
  CameraDescription? _selectedCamera;
  bool _cameraPermissionGranted = false;
  bool _cameraInitializing = false;

  bool get _needsLocalPreview {
    if (!widget.session.isVideo) return false;
    if (!widget.videoEnabled) return false;
    return widget.outgoing || widget.isActive;
  }

  @override
  void initState() {
    super.initState();
    _syncCameraState();
  }

  @override
  void didUpdateWidget(covariant CallFullscreenScreen oldWidget) {
    super.didUpdateWidget(oldWidget);

    final previewStateChanged =
        oldWidget.session.isVideo != widget.session.isVideo ||
        oldWidget.videoEnabled != widget.videoEnabled ||
        oldWidget.outgoing != widget.outgoing ||
        oldWidget.isActive != widget.isActive;

    if (previewStateChanged) {
      _syncCameraState();
    }
  }

  Future<void> _syncCameraState() async {
    if (!_needsLocalPreview) {
      await _disposeCamera(notifyUi: true);
      return;
    }
    await _ensureCameraReady();
  }

  Future<void> _ensureCameraReady() async {
    if (_cameraController?.value.isInitialized == true || _cameraInitializing) {
      return;
    }

    _cameraInitializing = true;
    try {
      if (!_cameraPermissionGranted) {
        final status = await Permission.camera.request();
        _cameraPermissionGranted = status.isGranted;
      }

      if (!_cameraPermissionGranted) {
        return;
      }

      final cams = await availableCameras();
      if (cams.isEmpty) return;

      _selectedCamera = cams.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
        orElse: () => cams.first,
      );

      final controller = CameraController(
        _selectedCamera!,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }

      setState(() => _cameraController = controller);
    } catch (_) {
      // Keep the call UI functional even if camera preview fails.
    } finally {
      _cameraInitializing = false;
    }
  }

  Future<void> _disposeCamera({required bool notifyUi}) async {
    final controller = _cameraController;
    _cameraController = null;
    if (notifyUi && mounted) {
      setState(() {});
    }
    await controller?.dispose();
  }

  @override
  void dispose() {
    _disposeCamera(notifyUi: false);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showFullOwnPreview =
        widget.session.isVideo &&
        widget.outgoing &&
        !widget.incoming &&
        widget.videoEnabled;
    final showSmallOwnPreview =
        widget.session.isVideo && widget.isActive && widget.videoEnabled;
    final camReady = _cameraController?.value.isInitialized == true;

    return Material(
      type: MaterialType.transparency,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: showFullOwnPreview
                ? const [Color(0xFF0A1A2A), Color(0xFF081324)]
                : const [Color(0xFF081120), Color(0xFF040A12)],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              if (showFullOwnPreview)
                Positioned.fill(
                  child: camReady
                      ? ClipRect(
                          child: OverflowBox(
                            maxWidth: double.infinity,
                            maxHeight: double.infinity,
                            child: FittedBox(
                              fit: BoxFit.cover,
                              child: SizedBox(
                                width: 100,
                                height:
                                    100 /
                                    (_cameraController!.value.aspectRatio),
                                child: CameraPreview(_cameraController!),
                              ),
                            ),
                          ),
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
              if (showFullOwnPreview)
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
              Positioned(
                top: 12,
                right: 12,
                child: _TopCircleButton(
                  icon: Icons.person_add_alt_1_rounded,
                  onTap: () {},
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
              if (!showFullOwnPreview)
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
                        color: AppColors.primary.withValues(alpha: 0.9),
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
                        if (camReady)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CameraPreview(_cameraController!),
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
                        _CallControl(
                          icon: widget.videoEnabled
                              ? Icons.videocam_rounded
                              : Icons.videocam_off_rounded,
                          active: widget.videoEnabled,
                          onTap: widget.onToggleVideo,
                        ),
                        _CallControl(
                          icon: Icons.more_horiz_rounded,
                          active: false,
                          onTap: () {},
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
          color: active ? AppColors.primary : Colors.white12,
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

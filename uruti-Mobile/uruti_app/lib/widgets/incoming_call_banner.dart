import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

import '../core/app_colors.dart';
import '../models/call_session.dart';

class IncomingCallBanner extends StatefulWidget {
  final CallSession session;
  final bool isIncoming;
  final bool isOutgoing;
  final bool isActive;
  final bool videoEnabled;
  final Duration activeDuration;
  final VoidCallback onExpand;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final VoidCallback onEnd;

  const IncomingCallBanner({
    super.key,
    required this.session,
    required this.isIncoming,
    required this.isOutgoing,
    required this.isActive,
    required this.videoEnabled,
    required this.activeDuration,
    required this.onExpand,
    required this.onAccept,
    required this.onDecline,
    required this.onEnd,
  });

  @override
  State<IncomingCallBanner> createState() => _IncomingCallBannerState();
}

class _IncomingCallBannerState extends State<IncomingCallBanner> {
  CameraController? _cameraController;
  bool _cameraPermissionGranted = false;
  bool _cameraInitializing = false;

  bool get _needsLocalPreview {
    if (!widget.session.isVideo) return false;
    if (!widget.videoEnabled) return false;
    return widget.isOutgoing || widget.isActive;
  }

  @override
  void initState() {
    super.initState();
    _syncCameraState();
  }

  @override
  void didUpdateWidget(covariant IncomingCallBanner oldWidget) {
    super.didUpdateWidget(oldWidget);
    final previewStateChanged =
        oldWidget.session.isVideo != widget.session.isVideo ||
        oldWidget.videoEnabled != widget.videoEnabled ||
        oldWidget.isOutgoing != widget.isOutgoing ||
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
      if (!_cameraPermissionGranted) return;

      final cams = await availableCameras();
      if (cams.isEmpty) return;
      final selected = cams.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
        orElse: () => cams.first,
      );

      final controller = CameraController(
        selected,
        ResolutionPreset.low,
        enableAudio: false,
      );
      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() => _cameraController = controller);
    } catch (_) {
      // Keep banner functional even if preview can't initialize.
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
    final camReady = _cameraController?.value.isInitialized == true;
    final statusText = widget.isActive
        ? 'On call • ${_format(widget.activeDuration)}'
        : widget.isOutgoing
        ? 'Ringing…'
        : 'Incoming call';

    return Material(
      color: Colors.transparent,
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 10, 12, 0),
        padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
        decoration: BoxDecoration(
          color: context.colors.surface.withValues(alpha: 0.96),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: context.colors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.22),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 360;

            Widget leading;
            if (_needsLocalPreview) {
              leading = Container(
                width: compact ? 38 : 42,
                height: compact ? 38 : 42,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(11),
                  border: Border.all(
                    color: context.colors.accent.withValues(alpha: 0.85),
                    width: 1.6,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(9),
                  child: camReady
                      ? CameraPreview(_cameraController!)
                      : Container(
                          color: const Color(0xFF1E2B39),
                          child: const Icon(
                            Icons.videocam_rounded,
                            size: 18,
                            color: Colors.white70,
                          ),
                        ),
                ),
              );
            } else {
              leading = CircleAvatar(
                radius: compact ? 18 : 20,
                backgroundColor: context.colors.darkGreenMid,
                backgroundImage:
                    (widget.session.callerAvatarUrl?.isNotEmpty ?? false)
                    ? NetworkImage(widget.session.callerAvatarUrl!)
                    : null,
                child: (widget.session.callerAvatarUrl?.isEmpty ?? true)
                    ? Text(
                        _initials(widget.session.callerName),
                        style: TextStyle(
                          color: context.colors.textPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                      )
                    : null,
              );
            }

            final expandButton = IconButton(
              visualDensity: VisualDensity.compact,
              constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
              onPressed: widget.onExpand,
              icon: Icon(
                Icons.open_in_full_rounded,
                color: context.colors.textPrimary,
                size: compact ? 18 : 19,
              ),
            );

            final actionButtons = widget.isActive
                ? [
                    _CircleAction(
                      color: AppColors.error,
                      icon: Icons.call_end_rounded,
                      onTap: widget.onEnd,
                      compact: compact,
                    ),
                  ]
                : [
                    _CircleAction(
                      color: AppColors.error,
                      icon: Icons.call_end_rounded,
                      onTap: widget.onDecline,
                      compact: compact,
                    ),
                    SizedBox(width: compact ? 6 : 8),
                    _CircleAction(
                      color: AppColors.success,
                      icon: Icons.call_rounded,
                      onTap: widget.onAccept,
                      compact: compact,
                    ),
                  ];

            final info = Expanded(
              child: GestureDetector(
                onTap: widget.onExpand,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.session.callerName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: compact ? 13 : 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      statusText,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: compact ? 11 : 12,
                      ),
                    ),
                  ],
                ),
              ),
            );

            if (!compact) {
              return Row(
                children: [
                  leading,
                  const SizedBox(width: 10),
                  info,
                  expandButton,
                  ...actionButtons,
                ],
              );
            }

            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    leading,
                    const SizedBox(width: 8),
                    info,
                    expandButton,
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: actionButtons,
                ),
              ],
            );
          },
        ),
      ),
    );
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

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((e) => e.isNotEmpty);
    final chars = parts.take(2).map((e) => e[0].toUpperCase()).join();
    return chars.isEmpty ? 'U' : chars;
  }
}

class _CircleAction extends StatelessWidget {
  final Color color;
  final IconData icon;
  final VoidCallback onTap;
  final bool compact;

  const _CircleAction({
    required this.color,
    required this.icon,
    required this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final size = compact ? 34.0 : 36.0;
    final iconSize = compact ? 17.0 : 18.0;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        child: Icon(icon, color: Colors.white, size: iconSize),
      ),
    );
  }
}

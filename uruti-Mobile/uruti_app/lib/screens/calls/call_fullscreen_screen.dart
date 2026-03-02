import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../models/call_session.dart';

class CallFullscreenScreen extends StatelessWidget {
  final CallSession session;
  final bool incoming;
  final bool muted;
  final bool speakerOn;
  final Duration activeDuration;
  final VoidCallback onMinimize;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final VoidCallback onEnd;
  final VoidCallback onToggleMute;
  final VoidCallback onToggleSpeaker;

  const CallFullscreenScreen({
    super.key,
    required this.session,
    required this.incoming,
    required this.muted,
    required this.speakerOn,
    required this.activeDuration,
    required this.onMinimize,
    required this.onAccept,
    required this.onDecline,
    required this.onEnd,
    required this.onToggleMute,
    required this.onToggleSpeaker,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF081120), Color(0xFF040A12)],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              Positioned(
                top: 12,
                left: 12,
                child: _TopCircleButton(
                  icon: Icons.call_received_rounded,
                  onTap: onMinimize,
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
                        session.callerName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 30,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        incoming
                            ? (session.handle ?? 'Incoming call')
                            : _format(activeDuration),
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 17,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Align(
                alignment: incoming ? Alignment.center : Alignment(0, 0.05),
                child: CircleAvatar(
                  radius: incoming ? 108 : 118,
                  backgroundColor: const Color(0xFF1E1E1E),
                  backgroundImage:
                      (session.callerAvatarUrl?.isNotEmpty ?? false)
                      ? NetworkImage(session.callerAvatarUrl!)
                      : null,
                  child: (session.callerAvatarUrl?.isEmpty ?? true)
                      ? Text(
                          _initials(session.callerName),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 52,
                            fontWeight: FontWeight.w700,
                          ),
                        )
                      : null,
                ),
              ),
              if (!incoming)
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
                          icon: speakerOn
                              ? Icons.volume_up_rounded
                              : Icons.volume_off_rounded,
                          active: speakerOn,
                          onTap: onToggleSpeaker,
                        ),
                        _CallControl(
                          icon: muted
                              ? Icons.mic_off_rounded
                              : Icons.mic_rounded,
                          active: muted,
                          onTap: onToggleMute,
                        ),
                        _CallControl(
                          icon: Icons.videocam_off_rounded,
                          active: false,
                          onTap: () {},
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
                child: incoming
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _CallRoundAction(
                            color: AppColors.error,
                            icon: Icons.call_end_rounded,
                            label: 'Decline',
                            onTap: onDecline,
                          ),
                          _CallRoundAction(
                            color: AppColors.success,
                            icon: Icons.call_rounded,
                            label: 'Accept',
                            onTap: onAccept,
                          ),
                        ],
                      )
                    : Center(
                        child: _CallRoundAction(
                          color: AppColors.error,
                          icon: Icons.call_end_rounded,
                          label: 'End',
                          onTap: onEnd,
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

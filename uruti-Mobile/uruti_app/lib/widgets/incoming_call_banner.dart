import 'package:flutter/material.dart';

import '../core/app_colors.dart';
import '../models/call_session.dart';

class IncomingCallBanner extends StatelessWidget {
  final CallSession session;
  final bool isActive;
  final Duration activeDuration;
  final VoidCallback onExpand;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final VoidCallback onEnd;

  const IncomingCallBanner({
    super.key,
    required this.session,
    required this.isActive,
    required this.activeDuration,
    required this.onExpand,
    required this.onAccept,
    required this.onDecline,
    required this.onEnd,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 10, 12, 0),
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
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
        child: Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: context.colors.darkGreenMid,
              backgroundImage: (session.callerAvatarUrl?.isNotEmpty ?? false)
                  ? NetworkImage(session.callerAvatarUrl!)
                  : null,
              child: (session.callerAvatarUrl?.isEmpty ?? true)
                  ? Text(
                      _initials(session.callerName),
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: onExpand,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      session.callerName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isActive
                          ? 'On call • ${_format(activeDuration)}'
                          : 'Incoming call',
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: onExpand,
              icon: Icon(
                Icons.open_in_full_rounded,
                color: context.colors.textPrimary,
                size: 19,
              ),
            ),
            if (isActive) ...[
              _CircleAction(
                color: AppColors.error,
                icon: Icons.call_end_rounded,
                onTap: onEnd,
              ),
            ] else ...[
              _CircleAction(
                color: AppColors.error,
                icon: Icons.call_end_rounded,
                onTap: onDecline,
              ),
              const SizedBox(width: 6),
              _CircleAction(
                color: AppColors.success,
                icon: Icons.call_rounded,
                onTap: onAccept,
              ),
            ],
          ],
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

  const _CircleAction({
    required this.color,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
    );
  }
}

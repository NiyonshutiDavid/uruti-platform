import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/call_provider.dart';
import '../screens/calls/call_fullscreen_screen.dart';
import 'incoming_call_banner.dart';

class CallOverlayHost extends StatelessWidget {
  final Widget child;
  const CallOverlayHost({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Consumer<CallProvider>(
      builder: (context, calls, _) {
        final session = calls.session;
        if (session == null || !calls.hasCall) {
          return child;
        }

        return Stack(
          children: [
            child,
            if (!calls.isFullScreen)
              Positioned(
                top: MediaQuery.of(context).padding.top,
                left: 0,
                right: 0,
                child: IncomingCallBanner(
                  session: session,
                  isActive: calls.isActive,
                  activeDuration: calls.activeDuration,
                  onExpand: calls.openFullScreen,
                  onAccept: calls.acceptCall,
                  onDecline: calls.declineCall,
                  onEnd: calls.endCall,
                ),
              ),
            if (calls.isFullScreen)
              Positioned.fill(
                child: CallFullscreenScreen(
                  session: session,
                  incoming: calls.isIncoming,
                  muted: calls.muted,
                  speakerOn: calls.speakerOn,
                  activeDuration: calls.activeDuration,
                  onMinimize: calls.minimizeToBanner,
                  onAccept: calls.acceptCall,
                  onDecline: calls.declineCall,
                  onEnd: calls.endCall,
                  onToggleMute: calls.toggleMute,
                  onToggleSpeaker: calls.toggleSpeaker,
                ),
              ),
          ],
        );
      },
    );
  }
}

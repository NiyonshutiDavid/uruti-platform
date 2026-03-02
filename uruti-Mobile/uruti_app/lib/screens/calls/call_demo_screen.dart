import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../providers/call_provider.dart';

/// Demo screen to test incoming call experiences.
/// Add this screen to your router and navigate to /call-demo to test.
class CallDemoScreen extends StatelessWidget {
  const CallDemoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        title: const Text('Call System Demo'),
        backgroundColor: context.colors.surface,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Test Incoming Call UX',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                'Simulate incoming calls to test both OS-level and in-app experiences.',
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 32),
              _DemoButton(
                label: 'Voice Call (Ben Mark)',
                icon: Icons.phone,
                color: AppColors.primary,
                onTap: () {
                  context.read<CallProvider>().simulateIncomingCall(
                    callerName: 'Ben Mark',
                    handle: '+250 722 358 345',
                    isVideo: false,
                  );
                },
              ),
              const SizedBox(height: 12),
              _DemoButton(
                label: 'Video Call (Johny)',
                icon: Icons.videocam,
                color: AppColors.info,
                onTap: () {
                  context.read<CallProvider>().simulateIncomingCall(
                    callerName: 'Johny',
                    handle: '+250 700 000 000',
                    isVideo: true,
                  );
                },
              ),
              const SizedBox(height: 12),
              _DemoButton(
                label: 'Call from Unknown',
                icon: Icons.person_off,
                color: Colors.amber,
                onTap: () {
                  context.read<CallProvider>().simulateIncomingCall(
                    callerName: 'Unknown Caller',
                    handle: 'Private Number',
                    isVideo: false,
                  );
                },
              ),
              const SizedBox(height: 32),
              const Divider(),
              const SizedBox(height: 16),
              const Text(
                'Call State Controls',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Consumer<CallProvider>(
                builder: (context, calls, _) {
                  if (!calls.hasCall) {
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: context.colors.card,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: context.colors.cardBorder),
                      ),
                      child: Text(
                        'No active call',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: context.colors.textSecondary),
                      ),
                    );
                  }

                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: context.colors.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: context.colors.cardBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Caller: ${calls.session?.callerName}',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Phase: ${calls.phase.toString().split('.').last}',
                          style: TextStyle(color: context.colors.textSecondary),
                        ),
                        if (calls.isActive) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Duration: ${_format(calls.activeDuration)}',
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                        ],
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            if (calls.isIncoming) ...[
                              _Chip(
                                label: 'Accept',
                                color: AppColors.success,
                                onTap: calls.acceptCall,
                              ),
                              _Chip(
                                label: 'Decline',
                                color: AppColors.error,
                                onTap: calls.declineCall,
                              ),
                            ],
                            if (calls.isActive) ...[
                              _Chip(
                                label: calls.isFullScreen
                                    ? 'Minimize'
                                    : 'Expand',
                                color: AppColors.info,
                                onTap: calls.isFullScreen
                                    ? calls.minimizeToBanner
                                    : calls.openFullScreen,
                              ),
                              _Chip(
                                label: calls.muted ? 'Unmute' : 'Mute',
                                color: calls.muted
                                    ? AppColors.warning
                                    : AppColors.primary,
                                onTap: calls.toggleMute,
                              ),
                              _Chip(
                                label: calls.speakerOn
                                    ? 'Speaker Off'
                                    : 'Speaker On',
                                color: calls.speakerOn
                                    ? AppColors.warning
                                    : AppColors.primary,
                                onTap: calls.toggleSpeaker,
                              ),
                              _Chip(
                                label: 'End Call',
                                color: AppColors.error,
                                onTap: calls.endCall,
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _format(Duration d) {
    final mm = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final ss = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    final hh = d.inHours;
    if (hh > 0) return '$hh:$mm:$ss';
    return '$mm:$ss';
  }
}

class _DemoButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _DemoButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      icon: Icon(icon),
      label: Text(label),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _Chip({required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../core/app_colors.dart';

class RecordingScreen extends StatefulWidget {
  const RecordingScreen({super.key});
  @override
  State<RecordingScreen> createState() => _RecordingScreenState();
}

class _RecordingScreenState extends State<RecordingScreen>
    with TickerProviderStateMixin {
  bool _recording = true;
  bool _muted = false;
  bool _cameraOn = true;
  bool _screenSharing = false;
  bool _camPermitted = false;
  bool _micPermitted = false;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulse;
  int _seconds = 0;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _pulse = Tween(
      begin: 0.9,
      end: 1.1,
    ).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _requestPermissions();
    _startTimer();
  }

  Future<void> _requestPermissions() async {
    final cam = await Permission.camera.request();
    final mic = await Permission.microphone.request();
    if (mounted) {
      setState(() {
        _camPermitted = cam.isGranted;
        _micPermitted = mic.isGranted;
      });
    }
  }

  Future<void> _toggleScreenShare() async {
    if (!_screenSharing) {
      setState(() => _screenSharing = true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Screen sharing started'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } else {
      setState(() => _screenSharing = false);
    }
  }

  void _startTimer() async {
    while (mounted && _recording) {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) setState(() => _seconds++);
    }
  }

  String get _time {
    final m = _seconds ~/ 60;
    final s = _seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header with recording indicator
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.close, color: context.colors.textPrimary),
                    onPressed: () =>
                        context.canPop() ? context.pop() : context.go('/coach'),
                  ),
                  const Spacer(),
                  AnimatedBuilder(
                    animation: _pulse,
                    builder: (_, __) => Row(
                      children: [
                        Transform.scale(
                          scale: _pulse.value,
                          child: Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(
                              color: Color(0xFFFF3B3B),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Listening...  $_time',
                          style: TextStyle(
                            color: context.colors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            // Analysis bars
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  _AnalysisBar('Pacing', 0.78, 'Optimal', AppColors.primary),
                  const SizedBox(height: 12),
                  _AnalysisBar(
                    'Slide Sync',
                    0.65,
                    'On Track',
                    AppColors.primary,
                  ),
                  const SizedBox(height: 12),
                  _AnalysisBar(
                    'Confidence',
                    0.55,
                    'Good',
                    const Color(0xFFFFB800),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Real-time tip
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.lightbulb_outline,
                        color: AppColors.primary,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Real-time Tip',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            "Great pacing! Try to slow down slightly when describing your revenue model.",
                            style: TextStyle(
                              color: context.colors.textPrimary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const Spacer(),

            // Waveform
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _Waveform(),
            ),

            const SizedBox(height: 20),

            // Controls
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
              decoration: BoxDecoration(
                color: context.colors.surface,
                border: Border(top: BorderSide(color: context.colors.divider)),
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _ctrl(
                      icon: _cameraOn ? Icons.videocam : Icons.videocam_off,
                      label: 'Camera',
                      active: _cameraOn && _camPermitted,
                      onTap: () {
                        if (!_camPermitted) {
                          openAppSettings();
                        } else {
                          setState(() => _cameraOn = !_cameraOn);
                        }
                      },
                    ),
                    _ctrl(
                      icon: _muted ? Icons.mic_off : Icons.mic,
                      label: 'Mic',
                      active: !_muted && _micPermitted,
                      onTap: () {
                        if (!_micPermitted) {
                          openAppSettings();
                        } else {
                          setState(() => _muted = !_muted);
                        }
                      },
                    ),
                    GestureDetector(
                      onTap: () => context.go('/pitch-performance'),
                      child: Column(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: const BoxDecoration(
                              color: Color(0xFFFF3B3B),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.stop,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Stop',
                            style: TextStyle(
                              color: const Color(0xFFFF3B3B),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _ctrl(
                      icon: Icons.skip_next,
                      label: 'Skip',
                      active: false,
                      onTap: () {},
                    ),
                    _ctrl(
                      icon: _screenSharing
                          ? Icons.stop_screen_share_rounded
                          : Icons.screen_share_rounded,
                      label: 'Screen',
                      active: _screenSharing,
                      onTap: _toggleScreenShare,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _ctrl({
    required IconData icon,
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: active
                  ? AppColors.primary.withValues(alpha: 0.15)
                  : context.colors.card,
              shape: BoxShape.circle,
              border: Border.all(
                color: active
                    ? AppColors.primary.withValues(alpha: 0.4)
                    : context.colors.divider,
              ),
            ),
            child: Icon(
              icon,
              color: active ? AppColors.primary : context.colors.textSecondary,
              size: 20,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _AnalysisBar extends StatelessWidget {
  final String label, status;
  final double value;
  final Color color;
  const _AnalysisBar(this.label, this.value, this.status, this.color);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
          ),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: value,
              backgroundColor: context.colors.divider,
              color: color,
              minHeight: 8,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            status,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

class _Waveform extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width - 40;
    return SizedBox(
      height: 60,
      width: width,
      child: CustomPaint(painter: _WavePainter()),
    );
  }
}

class _WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.7)
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    final heights = [
      0.3,
      0.7,
      0.5,
      0.9,
      0.4,
      0.8,
      0.6,
      0.4,
      1.0,
      0.5,
      0.7,
      0.3,
      0.8,
      0.6,
      0.9,
      0.4,
      0.7,
      0.5,
      0.3,
      0.8,
      0.6,
      0.4,
      0.9,
      0.5,
      0.7,
      0.3,
      0.8,
      0.6,
      0.4,
      0.7,
    ];
    final spacing = size.width / heights.length;
    for (int i = 0; i < heights.length; i++) {
      final x = i * spacing + spacing / 2;
      final h = heights[i] * size.height;
      canvas.drawLine(
        Offset(x, (size.height - h) / 2),
        Offset(x, (size.height + h) / 2),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/app_colors.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _textController;
  late AnimationController _ringController;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<double> _textOpacity;
  late Animation<double> _textSlide;
  late Animation<double> _ringScale;
  late Animation<double> _ringOpacity;
  bool _minimumDisplayElapsed = false;
  bool _navigated = false;
  AuthProvider? _authProvider;

  @override
  void initState() {
    super.initState();
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _ringController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _logoScale = CurvedAnimation(
      parent: _logoController,
      curve: Curves.elasticOut,
    ).drive(Tween(begin: 0.0, end: 1.0));
    _logoOpacity = CurvedAnimation(
      parent: _logoController,
      curve: Curves.easeIn,
    ).drive(Tween(begin: 0.0, end: 1.0));
    _textOpacity = CurvedAnimation(
      parent: _textController,
      curve: Curves.easeIn,
    ).drive(Tween(begin: 0.0, end: 1.0));
    _textSlide = CurvedAnimation(
      parent: _textController,
      curve: Curves.easeOut,
    ).drive(Tween(begin: 30.0, end: 0.0));
    _ringScale = CurvedAnimation(
      parent: _ringController,
      curve: Curves.easeOut,
    ).drive(Tween(begin: 0.5, end: 2.5));
    _ringOpacity = CurvedAnimation(
      parent: _ringController,
      curve: Curves.easeOut,
    ).drive(Tween(begin: 0.6, end: 0.0));

    _startAnimation();
  }

  void _startAnimation() async {
    await Future.delayed(const Duration(milliseconds: 200));
    if (!mounted) return;
    _ringController.forward();
    _logoController.forward();
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    _textController.forward();
    await Future.delayed(const Duration(milliseconds: 1800));
    if (!mounted) return;
    _minimumDisplayElapsed = true;
    _maybeNavigate();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final provider = context.read<AuthProvider>();
    if (!identical(_authProvider, provider)) {
      _authProvider?.removeListener(_maybeNavigate);
      _authProvider = provider;
      _authProvider?.addListener(_maybeNavigate);
    }
    _maybeNavigate();
  }

  void _maybeNavigate() {
    if (!mounted || _navigated || !_minimumDisplayElapsed) return;

    final auth = _authProvider ?? context.read<AuthProvider>();
    if (auth.status == AuthStatus.initial ||
        auth.status == AuthStatus.loading) {
      return;
    }

    _navigated = true;
    if (auth.isAuthenticated) {
      context.go('/home');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() {
    _authProvider?.removeListener(_maybeNavigate);
    _logoController.dispose();
    _textController.dispose();
    _ringController.dispose();
    super.dispose();
  }

  // ── Dark-only palette for splash ──
  static const _bg = Color(0xFF000000);
  static const _accent = AppColors.primary; // 0xFF76B947
  static const _darkGreenMid = Color(0xFF1A3A1A);
  static const _textPrimary = Color(0xFFFFFFFF);
  static const _textSecondary = Color(0xFFAAAAAA);

  @override
  Widget build(BuildContext context) {
    // Force light status-bar icons (white) regardless of system theme
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarBrightness: Brightness.dark,
        statusBarIconBrightness: Brightness.light,
      ),
    );

    return Scaffold(
      backgroundColor: _bg,
      body: Stack(
        children: [
          // Animated background gradient
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _logoController,
              builder: (_, __) => Container(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(0, -0.1),
                    radius: 0.7 * _logoScale.value,
                    colors: [const Color(0xFF0D2410), _bg],
                  ),
                ),
              ),
            ),
          ),

          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Ring pulse animation
                AnimatedBuilder(
                  animation: _ringController,
                  builder: (_, __) => Transform.scale(
                    scale: _ringScale.value,
                    child: Opacity(
                      opacity: _ringOpacity.value,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _accent.withValues(alpha: 0.4),
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 0),

                // Logo
                AnimatedBuilder(
                  animation: _logoController,
                  builder: (_, __) => Transform.scale(
                    scale: _logoScale.value,
                    child: Opacity(
                      opacity: _logoOpacity.value,
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _darkGreenMid,
                          border: Border.all(
                            color: _accent.withValues(alpha: 0.5),
                            width: 2,
                          ),
                        ),
                        child: Center(
                          child: Image.asset(
                            'assets/images/Uruti-icon-white.png',
                            width: 64,
                            height: 64,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // App name & tagline
                AnimatedBuilder(
                  animation: _textController,
                  builder: (_, __) => Transform.translate(
                    offset: Offset(0, _textSlide.value),
                    child: Opacity(
                      opacity: _textOpacity.value,
                      child: Column(
                        children: [
                          Text(
                            'Uruti',
                            style: TextStyle(
                              fontSize: 42,
                              fontWeight: FontWeight.w900,
                              color: _textPrimary,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "Digital Ecosystem for Founders & Investors",
                            style: TextStyle(
                              fontSize: 13,
                              color: _textSecondary,
                              letterSpacing: 0.3,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(width: 40, height: 2, color: _accent),
                              const SizedBox(width: 8),
                              Text(
                                'For investors and founders',
                                style: TextStyle(color: _accent, fontSize: 11),
                              ),
                              const SizedBox(width: 8),
                              Container(width: 40, height: 2, color: _accent),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Bottom loading indicator
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: AnimatedBuilder(
              animation: _textController,
              builder: (_, __) => Opacity(
                opacity: _textOpacity.value,
                child: Center(
                  child: SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: const AlwaysStoppedAnimation<Color>(_accent),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

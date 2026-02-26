import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/connectivity_provider.dart';

class NoInternetScreen extends StatefulWidget {
  const NoInternetScreen({super.key});

  @override
  State<NoInternetScreen> createState() => _NoInternetScreenState();
}

class _NoInternetScreenState extends State<NoInternetScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  Timer? _autoAdvanceTimer;
  int _currentPage = 0;
  bool _isRetrying = false;
  bool _tipsExpanded = false;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  static const _benefits = [
    _BenefitSlide(
      icon: Icons.hub_outlined,
      title: 'Connect with Founders & Investors',
      description:
          'Uruti bridges the gap between early-stage founders and the investors they need. '
          'Build meaningful relationships that drive real growth.',
      accent: Color(0xFF76B947),
    ),
    _BenefitSlide(
      icon: Icons.track_changes_outlined,
      title: 'Structured Advisory Tracks',
      description:
          'Follow curated learning paths designed for where you are in your journey — '
          'from idea validation to Series A fundraising.',
      accent: Color(0xFF4CAF8F),
    ),
    _BenefitSlide(
      icon: Icons.mic_none_outlined,
      title: 'AI Pitch Coach',
      description:
          'Practice your pitch and get instant AI-powered feedback on clarity, '
          'confidence, and content. Raise your game before the real meeting.',
      accent: Color(0xFF2196F3),
    ),
    _BenefitSlide(
      icon: Icons.analytics_outlined,
      title: 'Startup Analytics Dashboard',
      description:
          'Track key metrics, monitor growth, and understand your traction with '
          'simple visuals built for founders — not spreadsheet experts.',
      accent: Color(0xFFFF9800),
    ),
    _BenefitSlide(
      icon: Icons.folder_open_outlined,
      title: 'Secure Document Vault',
      description:
          'Store pitch decks, financials, and due-diligence documents securely. '
          'Share with investors in one click — no email chains needed.',
      accent: Color(0xFF9C27B0),
    ),
    _BenefitSlide(
      icon: Icons.language_outlined,
      title: 'Also Available on Web',
      description:
          'Access the full Uruti platform from any browser at uruti.io. '
          'Seamlessly switch between your phone and desktop without losing progress.',
      accent: Color(0xFF76B947),
      isWebSlide: true,
    ),
  ];

  static const _tips = [
    _Tip(
      icon: Icons.wifi,
      text:
          'Check that Wi-Fi is turned on and you are within range of your router.',
    ),
    _Tip(
      icon: Icons.airplanemode_active,
      text: 'Make sure Airplane Mode is switched off in your device settings.',
    ),
    _Tip(
      icon: Icons.signal_cellular_alt,
      text:
          'If using mobile data, confirm your data plan is active and has coverage.',
    ),
    _Tip(
      icon: Icons.router_outlined,
      text:
          'Try restarting your router or modem — unplug for 10 seconds then plug back in.',
    ),
    _Tip(
      icon: Icons.refresh,
      text:
          'Toggle Wi-Fi or mobile data off and back on to reset the connection.',
    ),
    _Tip(
      icon: Icons.settings_outlined,
      text:
          'Check Settings → General → VPN & Device Management — a VPN may be blocking access.',
    ),
  ];

  @override
  void initState() {
    super.initState();

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeIn,
    );
    _fadeController.forward();

    _startAutoAdvance();
  }

  void _startAutoAdvance() {
    _autoAdvanceTimer?.cancel();
    _autoAdvanceTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted) return;
      final next = (_currentPage + 1) % _benefits.length;
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  Future<void> _retry() async {
    setState(() => _isRetrying = true);
    await context.read<ConnectivityProvider>().recheck();
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) setState(() => _isRetrying = false);
  }

  @override
  void dispose() {
    _autoAdvanceTimer?.cancel();
    _pageController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dark = MediaQuery.of(context).platformBrightness == Brightness.dark;
    final bg = dark ? AppColors.background : const Color(0xFFF8FAF8);
    final cardBg = dark ? const Color(0xFF1C1C1C) : Colors.white;
    final textPrimary = dark ? Colors.white : const Color(0xFF111111);
    final textSecondary = dark
        ? const Color(0xFFAAAAAA)
        : const Color(0xFF666666);
    final divider = dark ? const Color(0xFF2A2A2A) : const Color(0xFFE8E8E8);

    return FadeTransition(
      opacity: _fadeAnimation,
      child: Scaffold(
        backgroundColor: bg,
        body: SafeArea(
          child: Column(
            children: [
              // ── Top bar ──────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 16,
                ),
                child: Row(
                  children: [
                    Image.asset(
                      'assets/images/Uruti-icon-white.png',
                      width: 32,
                      height: 32,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Uruti',
                      style: TextStyle(
                        fontFamily: 'InterTight',
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                        color: AppColors.primary,
                        letterSpacing: -0.4,
                      ),
                    ),
                  ],
                ),
              ),

              // ── No-connection status ──────────────────────────────────────
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 20),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3CD),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFFFCC00).withValues(alpha: 0.6),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.wifi_off_rounded,
                      color: Color(0xFFB8860B),
                      size: 22,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'No internet connection',
                        style: TextStyle(
                          fontFamily: 'InterTight',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF7D5A00),
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    _isRetrying
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Color(0xFFB8860B),
                            ),
                          )
                        : GestureDetector(
                            onTap: _retry,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFB8860B),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'Retry',
                                style: TextStyle(
                                  fontFamily: 'InterTight',
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // ── Looping benefits carousel ─────────────────────────────────
              Expanded(
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Text(
                        'While you reconnect, here\'s what awaits you',
                        style: TextStyle(
                          fontFamily: 'InterTight',
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: textSecondary,
                          letterSpacing: -0.2,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: PageView.builder(
                        controller: _pageController,
                        onPageChanged: (i) => setState(() => _currentPage = i),
                        itemCount: _benefits.length,
                        itemBuilder: (_, i) => _BenefitCard(
                          slide: _benefits[i],
                          cardBg: cardBg,
                          textPrimary: textPrimary,
                          textSecondary: textSecondary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Page dots
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _benefits.length,
                        (i) => AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: _currentPage == i ? 20 : 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: _currentPage == i
                                ? AppColors.primary
                                : divider,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),

              // ── Troubleshooting tips ──────────────────────────────────────
              GestureDetector(
                onTap: () => setState(() => _tipsExpanded = !_tipsExpanded),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: divider),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.build_circle_outlined,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Troubleshooting tips',
                          style: TextStyle(
                            fontFamily: 'InterTight',
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: textPrimary,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                      Icon(
                        _tipsExpanded ? Icons.expand_less : Icons.expand_more,
                        color: textSecondary,
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
              AnimatedSize(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                child: _tipsExpanded
                    ? Container(
                        margin: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: const BorderRadius.only(
                            bottomLeft: Radius.circular(12),
                            bottomRight: Radius.circular(12),
                          ),
                          border: Border(
                            left: BorderSide(color: divider),
                            right: BorderSide(color: divider),
                            bottom: BorderSide(color: divider),
                          ),
                        ),
                        child: Column(
                          children: _tips
                              .map(
                                (tip) => _TipRow(
                                  tip: tip,
                                  textSecondary: textSecondary,
                                  divider: divider,
                                ),
                              )
                              .toList(),
                        ),
                      )
                    : const SizedBox.shrink(),
              ),

              const SizedBox(height: 20),

              // ── Retry button ──────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isRetrying ? null : _retry,
                    icon: _isRetrying
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.refresh_rounded),
                    label: Text(
                      _isRetrying ? 'Checking connection…' : 'Try Again',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: AppColors.primary.withValues(
                        alpha: 0.6,
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      textStyle: const TextStyle(
                        fontFamily: 'InterTight',
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Benefit slide card ───────────────────────────────────────────────────────

class _BenefitSlide {
  final IconData icon;
  final String title;
  final String description;
  final Color accent;
  final bool isWebSlide;

  const _BenefitSlide({
    required this.icon,
    required this.title,
    required this.description,
    required this.accent,
    this.isWebSlide = false,
  });
}

class _BenefitCard extends StatelessWidget {
  final _BenefitSlide slide;
  final Color cardBg;
  final Color textPrimary;
  final Color textSecondary;

  const _BenefitCard({
    required this.slide,
    required this.cardBg,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: slide.accent.withValues(alpha: 0.25)),
          boxShadow: [
            BoxShadow(
              color: slide.accent.withValues(alpha: 0.08),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon circle
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: slide.accent.withValues(alpha: 0.12),
              ),
              child: Icon(slide.icon, color: slide.accent, size: 34),
            ),
            const SizedBox(height: 24),
            Text(
              slide.title,
              style: TextStyle(
                fontFamily: 'InterTight',
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: textPrimary,
                letterSpacing: -0.4,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              slide.description,
              style: TextStyle(
                fontFamily: 'InterTight',
                fontSize: 14,
                fontWeight: FontWeight.w400,
                color: textSecondary,
                height: 1.55,
                letterSpacing: -0.1,
              ),
              textAlign: TextAlign.center,
            ),
            if (slide.isWebSlide) ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.language, color: AppColors.primary, size: 16),
                    const SizedBox(width: 8),
                    Text(
                      'uruti.io',
                      style: TextStyle(
                        fontFamily: 'InterTight',
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Tip row ──────────────────────────────────────────────────────────────────

class _Tip {
  final IconData icon;
  final String text;
  const _Tip({required this.icon, required this.text});
}

class _TipRow extends StatelessWidget {
  final _Tip tip;
  final Color textSecondary;
  final Color divider;

  const _TipRow({
    required this.tip,
    required this.textSecondary,
    required this.divider,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: divider)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(tip.icon, color: AppColors.primary, size: 16),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              tip.text,
              style: TextStyle(
                fontFamily: 'InterTight',
                fontSize: 13,
                color: textSecondary,
                height: 1.5,
                letterSpacing: -0.1,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

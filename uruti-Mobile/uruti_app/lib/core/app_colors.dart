import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Immutable colour set — one instance for dark mode, one for light mode.
// ─────────────────────────────────────────────────────────────────────────────
class ThemeColors {
  final Color background;
  final Color surface;
  final Color surfaceVariant;
  final Color card;
  final Color cardBorder;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color divider;
  final Color navInactive;
  final Color darkGreenMid;
  final Color shimmerBase;
  final Color shimmerHighlight;
  final Color textOnPrimary;

  const ThemeColors({
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.card,
    required this.cardBorder,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.divider,
    required this.navInactive,
    required this.darkGreenMid,
    required this.shimmerBase,
    required this.shimmerHighlight,
    required this.textOnPrimary,
  });

  // Convenience aliases used by screens
  Color get cardBackground => card;
  Color get surfaceBackground => surface;

  static const ThemeColors dark = ThemeColors(
    background: Color(0xFF000000),
    surface: Color(0xFF111111),
    surfaceVariant: Color(0xFF1A1A1A),
    card: Color(0xFF1C1C1C),
    cardBorder: Color(0xFF2A2A2A),
    textPrimary: Color(0xFFFFFFFF),
    textSecondary: Color(0xFFAAAAAA),
    textMuted: Color(0xFF666666),
    divider: Color(0xFF2A2A2A),
    navInactive: Color(0xFF555555),
    darkGreenMid: Color(0xFF1A3A1A),
    shimmerBase: Color(0xFF1E1E1E),
    shimmerHighlight: Color(0xFF2A2A2A),
    textOnPrimary: Color(0xFF000000),
  );

  static const ThemeColors light = ThemeColors(
    background: Color(0xFFF4F6F3),
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFF0F2EF),
    card: Color(0xFFFFFFFF),
    cardBorder: Color(0xFFE0E4DF),
    textPrimary: Color(0xFF111511),
    textSecondary: Color(0xFF555F52),
    textMuted: Color(0xFF8A9487),
    divider: Color(0xFFE0E4DF),
    navInactive: Color(0xFF9BA89A),
    darkGreenMid: Color(0xFFD8EDCC),
    shimmerBase: Color(0xFFE8EBE7),
    shimmerHighlight: Color(0xFFF0F2EF),
    textOnPrimary: Color(0xFFFFFFFF),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Static brand / semantic colours (same in both themes)
// ─────────────────────────────────────────────────────────────────────────────
class AppColors {
  // Brand
  static const Color primary = Color(0xFF76B947);
  static const Color primaryDark = Color(0xFF5A9235);
  static const Color primaryLight = Color(0xFF9FD16E);
  static const Color darkGreen = Color(0xFF0D2410);

  // Semantic
  static const Color success = Color(0xFF76B947);
  static const Color warning = Color(0xFFFFB800);
  static const Color error = Color(0xFFFF4444);
  static const Color info = Color(0xFF4DA8FF);

  // ── Static dark-mode fallbacks (used in const contexts / theme definitions) ──
  static const Color background = Color(0xFF000000);
  static const Color surface = Color(0xFF111111);
  static const Color surfaceVariant = Color(0xFF1A1A1A);
  static const Color surfaceBackground = surface;
  static const Color card = Color(0xFF1C1C1C);
  static const Color cardBackground = card;
  static const Color cardBorder = Color(0xFF2A2A2A);
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFAAAAAA);
  static const Color textMuted = Color(0xFF666666);
  static const Color textOnPrimary = Color(0xFF000000);
  static const Color navInactive = Color(0xFF555555);
  static const Color divider = Color(0xFF2A2A2A);
  static const Color darkGreenMid = Color(0xFF1A3A1A);
  static const Color shimmerBase = Color(0xFF1E1E1E);
  static const Color shimmerHighlight = Color(0xFF2A2A2A);

  // ── Context-aware accessor ──
  static ThemeColors of(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? ThemeColors.dark
        : ThemeColors.light;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BuildContext shorthand: context.colors.background etc.
// ─────────────────────────────────────────────────────────────────────────────
extension AppColorsX on BuildContext {
  ThemeColors get colors => AppColors.of(this);
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_colors.dart';

// Shared text style defaults — Inter Tight, tighter letter spacing
TextTheme _buildTextTheme(Color primary, Color secondary, Color muted) {
  const String fontFamily = 'InterTight';
  const double ls = -0.4; // reduced letter spacing

  return TextTheme(
    displayLarge: TextStyle(
      fontFamily: fontFamily,
      color: primary,
      fontWeight: FontWeight.w800,
      letterSpacing: ls,
    ),
    displayMedium: TextStyle(
      fontFamily: fontFamily,
      color: primary,
      fontWeight: FontWeight.w700,
      letterSpacing: ls,
    ),
    displaySmall: TextStyle(
      fontFamily: fontFamily,
      color: primary,
      fontWeight: FontWeight.w700,
      letterSpacing: ls,
    ),
    headlineLarge: TextStyle(
      fontFamily: fontFamily,
      color: primary,
      fontWeight: FontWeight.w700,
      letterSpacing: ls,
    ),
    headlineMedium: TextStyle(
      fontFamily: fontFamily,
      color: primary,
      fontWeight: FontWeight.w600,
      letterSpacing: ls,
    ),
    headlineSmall: TextStyle(
      fontFamily: fontFamily,
      color: primary,
      fontWeight: FontWeight.w600,
      letterSpacing: ls,
    ),
    titleLarge: TextStyle(
      fontFamily: fontFamily,
      color: primary,
      fontWeight: FontWeight.w600,
      letterSpacing: ls,
    ),
    titleMedium: TextStyle(
      fontFamily: fontFamily,
      color: primary,
      fontWeight: FontWeight.w500,
      letterSpacing: ls,
    ),
    titleSmall: TextStyle(
      fontFamily: fontFamily,
      color: secondary,
      fontWeight: FontWeight.w500,
      letterSpacing: ls,
    ),
    bodyLarge: TextStyle(
      fontFamily: fontFamily,
      color: primary,
      letterSpacing: ls,
    ),
    bodyMedium: TextStyle(
      fontFamily: fontFamily,
      color: secondary,
      letterSpacing: ls,
    ),
    bodySmall: TextStyle(
      fontFamily: fontFamily,
      color: muted,
      letterSpacing: ls,
    ),
    labelLarge: TextStyle(
      fontFamily: fontFamily,
      color: primary,
      fontWeight: FontWeight.w600,
      letterSpacing: ls,
    ),
    labelMedium: TextStyle(
      fontFamily: fontFamily,
      color: secondary,
      letterSpacing: ls,
    ),
    labelSmall: TextStyle(
      fontFamily: fontFamily,
      color: muted,
      letterSpacing: ls,
    ),
  );
}

class AppTheme {
  static ThemeData get dark {
    final tc = ThemeColors.dark;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: tc.background,
      colorScheme: ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.primaryLight,
        surface: tc.surface,
        onPrimary: tc.textOnPrimary,
        onSurface: tc.textPrimary,
        error: AppColors.error,
      ),
      fontFamily: 'InterTight',
      textTheme: _buildTextTheme(
        tc.textPrimary,
        tc.textSecondary,
        tc.textMuted,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: tc.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: IconThemeData(color: tc.textPrimary),
        titleTextStyle: TextStyle(
          fontFamily: 'InterTight',
          color: tc.textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.4,
        ),
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarBrightness: Brightness.dark,
          statusBarIconBrightness: Brightness.light,
          statusBarColor: Colors.transparent,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: tc.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: tc.navInactive,
        selectedLabelStyle: const TextStyle(
          fontFamily: 'InterTight',
          fontSize: 11,
          fontWeight: FontWeight.w500,
          letterSpacing: -0.3,
        ),
        unselectedLabelStyle: const TextStyle(
          fontFamily: 'InterTight',
          fontSize: 11,
          letterSpacing: -0.3,
        ),
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: tc.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: tc.cardBorder, width: 0.5),
        ),
        margin: const EdgeInsets.symmetric(vertical: 4),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: tc.textOnPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
          textStyle: const TextStyle(
            fontFamily: 'InterTight',
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.3,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: tc.textPrimary,
          side: BorderSide(color: tc.cardBorder),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
          textStyle: const TextStyle(
            fontFamily: 'InterTight',
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.3,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: tc.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: tc.cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: tc.cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        hintStyle: TextStyle(
          fontFamily: 'InterTight',
          color: tc.textMuted,
          letterSpacing: -0.3,
        ),
        labelStyle: TextStyle(
          fontFamily: 'InterTight',
          color: tc.textSecondary,
          letterSpacing: -0.3,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      dividerTheme: DividerThemeData(
        color: tc.divider,
        thickness: 0.5,
        space: 0,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: tc.surfaceVariant,
        labelStyle: TextStyle(
          fontFamily: 'InterTight',
          color: tc.textSecondary,
          fontSize: 12,
          letterSpacing: -0.3,
        ),
        side: BorderSide(color: tc.cardBorder, width: 0.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      ),
    );
  }

  static ThemeData get light {
    final tc = ThemeColors.light;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: tc.background,
      colorScheme: ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.primaryDark,
        surface: tc.surface,
        onPrimary: tc.textOnPrimary,
        onSurface: tc.textPrimary,
        error: AppColors.error,
      ),
      fontFamily: 'InterTight',
      textTheme: _buildTextTheme(
        tc.textPrimary,
        tc.textSecondary,
        tc.textMuted,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: tc.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: IconThemeData(color: tc.textPrimary),
        titleTextStyle: TextStyle(
          fontFamily: 'InterTight',
          color: tc.textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.4,
        ),
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarBrightness: Brightness.light,
          statusBarIconBrightness: Brightness.dark,
          statusBarColor: Colors.transparent,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: tc.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: tc.navInactive,
        selectedLabelStyle: const TextStyle(
          fontFamily: 'InterTight',
          fontSize: 11,
          fontWeight: FontWeight.w500,
          letterSpacing: -0.3,
        ),
        unselectedLabelStyle: const TextStyle(
          fontFamily: 'InterTight',
          fontSize: 11,
          letterSpacing: -0.3,
        ),
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: tc.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: tc.cardBorder, width: 0.5),
        ),
        margin: const EdgeInsets.symmetric(vertical: 4),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: tc.textOnPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
          textStyle: const TextStyle(
            fontFamily: 'InterTight',
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.3,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: tc.textPrimary,
          side: BorderSide(color: tc.cardBorder),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
          textStyle: const TextStyle(
            fontFamily: 'InterTight',
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.3,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: tc.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: tc.cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: tc.cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        hintStyle: TextStyle(
          fontFamily: 'InterTight',
          color: tc.textMuted,
          letterSpacing: -0.3,
        ),
        labelStyle: TextStyle(
          fontFamily: 'InterTight',
          color: tc.textSecondary,
          letterSpacing: -0.3,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      dividerTheme: DividerThemeData(
        color: tc.divider,
        thickness: 0.5,
        space: 0,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: tc.surfaceVariant,
        labelStyle: TextStyle(
          fontFamily: 'InterTight',
          color: tc.textSecondary,
          fontSize: 12,
          letterSpacing: -0.3,
        ),
        side: BorderSide(color: tc.cardBorder, width: 0.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      ),
    );
  }
}

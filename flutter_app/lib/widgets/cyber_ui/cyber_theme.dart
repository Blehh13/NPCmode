import 'package:flutter/material.dart';

/// Neural Forge Cyberpunk Color Palette ported to Flutter
class CyberTheme {
  static const Color black800 = Color(0xFF0C0E0C);
  static const Color black900 = Color(0xFF060706);
  static const Color darkSlate = Color(0xFF0F172A);
  static const Color cardSurface = Color(0xFF1E293B);

  // Cyberpunk Tri-Color Accents (Ported directly from Neural Forge)
  static const Color cyberYellow = Color(0xFFFFBF00); // Rich Amber Gold
  static const Color cyberGreen = Color(0xFF00FF88);  // Neon Lime Green
  static const Color cyberBlue = Color(0xFF00D2FF);   // Tech Cyan Blue
  static const Color cyberMagenta = Color(0xFFEC4899); // Electric Pink

  static ThemeData get themeData => ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: black800,
        primaryColor: cyberBlue,
        colorScheme: const ColorScheme.dark(
          primary: cyberBlue,
          secondary: cyberGreen,
          tertiary: cyberYellow,
          surface: cardSurface,
        ),
        fontFamily: 'Roboto',
        useMaterial3: true,
      );
}

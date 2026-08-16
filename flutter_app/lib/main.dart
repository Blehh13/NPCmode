import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'widgets/cyber_ui/cyber_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ScavengerHuntApp());
}

class ScavengerHuntApp extends StatelessWidget {
  const ScavengerHuntApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NPC Mode',
      debugShowCheckedModeBanner: false,
      theme: CyberTheme.themeData,
      home: const HomeScreen(),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/app_constants.dart';
import 'core/app_theme.dart';
import 'core/app_router.dart';
import 'providers/auth_provider.dart';
import 'providers/connectivity_provider.dart';
import 'providers/theme_provider.dart';
import 'screens/no_internet_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 BACKEND URL — update this single line to switch environments.
//    Everything in the app reads from AppConstants.apiV1 which is set below.
// ─────────────────────────────────────────────────────────────────────────────
const String kBackendUrl = 'http://127.0.0.1:8000'; // iOS simulator / local dev
// const String kBackendUrl = 'http://10.0.2.2:8000';         // Android emulator
// const String kBackendUrl = 'http://192.168.1.100:8000';    // Physical device (use your machine's LAN IP)
// const String kBackendUrl = 'https://api.uruti.io';         // Production
// ─────────────────────────────────────────────────────────────────────────────

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AppConstants.configure(kBackendUrl); // ← single source of truth
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );

  final authProvider = AuthProvider();
  await authProvider.init();

  runApp(UrutiApp(authProvider: authProvider));
}

class UrutiApp extends StatelessWidget {
  final AuthProvider authProvider;
  const UrutiApp({super.key, required this.authProvider});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: Builder(
        builder: (context) {
          final router = createRouter(authProvider);
          return Consumer<ThemeProvider>(
            builder: (context, themeProvider, _) => MaterialApp.router(
              title: 'Uruti',
              debugShowCheckedModeBanner: false,
              theme: AppTheme.light,
              darkTheme: AppTheme.dark,
              themeMode: themeProvider.themeMode,
              routerConfig: router,
              builder: (context, child) {
                return Consumer<ConnectivityProvider>(
                  builder: (context, connectivity, _) {
                    if (!connectivity.isOnline) {
                      return const NoInternetScreen();
                    }
                    return child ?? const SizedBox.shrink();
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

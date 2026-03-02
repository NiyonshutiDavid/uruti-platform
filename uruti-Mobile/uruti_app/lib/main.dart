import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'core/app_constants.dart';
import 'core/app_theme.dart';
import 'core/app_router.dart';
import 'bloc/founder/founder_cubit.dart';
import 'providers/auth_provider.dart';
import 'providers/call_provider.dart';
import 'providers/connectivity_provider.dart';
import 'providers/theme_provider.dart';
import 'services/notification_service.dart';
import 'screens/no_internet_screen.dart';
import 'widgets/call_overlay_host.dart';

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 BACKEND URL — update this single line to switch environments.
//    Everything in the app reads from AppConstants.apiV1 which is set below.
// ─────────────────────────────────────────────────────────────────────────────
const String? kBackendUrlOverride =
    null; // e.g. 'http://192.168.1.100:8000' or 'https://api.uruti.rw'
// ─────────────────────────────────────────────────────────────────────────────

String _resolveBackendUrl() {
  if (kBackendUrlOverride != null && kBackendUrlOverride!.trim().isNotEmpty) {
    return kBackendUrlOverride!.trim();
  }

  if (kIsWeb) {
    return 'http://localhost:8000';
  }

  if (Platform.isAndroid) {
    return 'http://10.0.2.2:8000';
  }

  return 'http://127.0.0.1:8000';
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AppConstants.configure(_resolveBackendUrl()); // ← single source of truth
  await NotificationService.instance.initialize();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );

  final authProvider = AuthProvider();
  await authProvider.init();
  if (authProvider.isAuthenticated) {
    await NotificationService.instance.syncTokenWithBackend();
  }

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
        ChangeNotifierProvider(create: (_) => CallProvider()),
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: BlocProvider(
        create: (_) => FounderCubit(),
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
                      final app = !connectivity.isOnline
                          ? const NoInternetScreen()
                          : (child ?? const SizedBox.shrink());
                      return CallOverlayHost(child: app);
                    },
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

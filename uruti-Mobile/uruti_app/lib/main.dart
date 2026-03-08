import 'dart:io' show Platform, NetworkInterface, InternetAddressType;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode;
import 'core/app_constants.dart';
import 'core/app_theme.dart';
import 'core/app_router.dart';
import 'bloc/founder/founder_cubit.dart';
import 'providers/auth_provider.dart';
import 'providers/call_provider.dart';
import 'providers/connectivity_provider.dart';
import 'providers/theme_provider.dart';
import 'services/message_notification_handler.dart';
import 'services/notification_service.dart';
import 'screens/no_internet_screen.dart';
import 'widgets/call_overlay_host.dart';

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 BACKEND URL — set to null for local defaults or provide a full override.
//    Everything in the app reads from AppConstants.apiV1 which is set below.
// ─────────────────────────────────────────────────────────────────────────────
const String? kBackendUrlOverride =
    null; // e.g. 'http://192.168.1.100:8000' or 'https://api.uruti.rw'
// ─────────────────────────────────────────────────────────────────────────────

/// Gets the host machine's local network IP by querying network interfaces.
/// Returns null if we can't determine it.
Future<String?> _getHostMachineIp() async {
  try {
    final interfaces = await NetworkInterface.list(
      type: InternetAddressType.IPv4,
      includeLoopback: false,
    );
    for (final iface in interfaces) {
      for (final addr in iface.addresses) {
        final ip = addr.address;
        // Skip loopback and link-local
        if (!ip.startsWith('127.') && !ip.startsWith('169.254.')) {
          return ip;
        }
      }
    }
  } catch (_) {}
  return null;
}

Future<String> _resolveBackendUrl() async {
  if (kBackendUrlOverride != null && kBackendUrlOverride!.trim().isNotEmpty) {
    return kBackendUrlOverride!.trim();
  }

  if (kIsWeb) {
    return 'http://localhost:8010';
  }

  if (Platform.isAndroid) {
    // Android emulator maps host localhost to 10.0.2.2.
    return 'http://10.0.2.2:8010';
  }

  if (Platform.isIOS) {
    return 'http://localhost:8010';
  }

  final hostMachineIp = await _getHostMachineIp();
  if (hostMachineIp != null) {
    return 'http://$hostMachineIp:8010';
  }
  return 'http://localhost:8010';
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AppConstants.configure(await _resolveBackendUrl());

  if (kDebugMode) {
    debugPrint('🌐 Backend URL: ${AppConstants.apiBaseUrl}');
    debugPrint('🤖 AI Modules URL: ${AppConstants.aiBaseUrl}');
  }

  await NotificationService.instance.initialize();

  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );

  final authProvider = AuthProvider();
  await authProvider.init();

  if (authProvider.isAuthenticated) {
    await NotificationService.instance.syncTokenWithBackend();
    MessageNotificationHandler.instance.start(authProvider);
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

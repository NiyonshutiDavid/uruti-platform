import 'dart:io'
    show Platform, NetworkInterface, InternetAddressType, HttpClient;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:device_info_plus/device_info_plus.dart';
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
const String kBackendUrlOverride =
    'http://173.249.25.80:1199'; // e.g. 'http://192.168.1.100:8000' or 'https://api.uruti.rw'

// Optional fixed AI backend (chatbot) endpoint when core backend points elsewhere.
const String kAiBackendUrlOverride = 'http://173.249.25.80:1199';

// Default LAN host used only on physical devices in local development.
const String kPhysicalDeviceBackendUrl = 'http://10.110.13.242:8010';

// Runtime overrides via flutter --dart-define for real-device testing.
const String kBackendUrlFromEnv = String.fromEnvironment('BACKEND_URL');
const String kAiBackendUrlFromEnv = String.fromEnvironment('AI_BACKEND_URL');
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

Future<bool> _isBackendHealthy(String baseUrl) async {
  HttpClient? client;
  try {
    final uri = Uri.parse('$baseUrl/health');
    client = HttpClient()..connectionTimeout = const Duration(seconds: 2);
    final request = await client.getUrl(uri);
    final response = await request.close();
    return response.statusCode >= 200 && response.statusCode < 300;
  } catch (_) {
    return false;
  } finally {
    client?.close(force: true);
  }
}

String _sanitizeBackendUrl(String url) {
  final parsed = Uri.tryParse(url.trim());
  if (parsed == null) return url.trim();

  final isLocalHost =
      parsed.host == 'localhost' ||
      parsed.host == '127.0.0.1' ||
      parsed.host == '10.0.2.2';

  if (isLocalHost && parsed.scheme == 'https') {
    return parsed.replace(scheme: 'http').toString();
  }

  return parsed.toString();
}

Future<bool> _isAndroidEmulator() async {
  if (!Platform.isAndroid) return false;
  try {
    final info = await DeviceInfoPlugin().androidInfo;
    return !info.isPhysicalDevice;
  } catch (_) {
    return false;
  }
}

Future<bool> _isIosSimulator() async {
  if (!Platform.isIOS) return false;
  try {
    final info = await DeviceInfoPlugin().iosInfo;
    return !info.isPhysicalDevice;
  } catch (_) {
    return false;
  }
}

Future<String> _resolveReachableBackendUrl(String preferredUrl) async {
  final parsed = Uri.tryParse(preferredUrl);
  if (parsed == null || !parsed.hasAuthority) {
    return preferredUrl;
  }

  final candidates = <String>[];
  final hasPort = parsed.hasPort;
  if (hasPort) {
    final ports = [parsed.port, 8000];
    for (final port in ports) {
      final candidate = parsed.replace(port: port).toString();
      if (!candidates.contains(candidate)) {
        candidates.add(candidate);
      }
    }
  } else {
    candidates.add(preferredUrl);
  }

  for (final candidate in candidates) {
    if (await _isBackendHealthy(candidate)) {
      return candidate;
    }
  }

  return preferredUrl;
}

Future<String> _resolveBackendUrl() async {
  if (kBackendUrlFromEnv.trim().isNotEmpty) {
    return _sanitizeBackendUrl(kBackendUrlFromEnv.trim());
  }

  if (kBackendUrlOverride.trim().isNotEmpty) {
    return _sanitizeBackendUrl(kBackendUrlOverride.trim());
  }

  if (kIsWeb) {
    return 'http://localhost:8010';
  }

  if (Platform.isAndroid) {
    // Android emulator maps host localhost to 10.0.2.2.
    if (await _isAndroidEmulator()) {
      return 'http://10.0.2.2:8010';
    }

    return _sanitizeBackendUrl(kPhysicalDeviceBackendUrl);
  }

  if (Platform.isIOS) {
    if (await _isIosSimulator()) {
      return 'http://localhost:8010';
    }

    return _sanitizeBackendUrl(kPhysicalDeviceBackendUrl);
  }

  final hostMachineIp = await _getHostMachineIp();
  if (hostMachineIp != null) {
    return 'http://$hostMachineIp:8010';
  }
  return 'http://localhost:8010';
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final resolvedBackendUrl = await _resolveBackendUrl();
  final backendUrl = await _resolveReachableBackendUrl(resolvedBackendUrl);
  final aiBackendUrl = kAiBackendUrlFromEnv.trim().isNotEmpty
      ? kAiBackendUrlFromEnv.trim()
      : (kAiBackendUrlOverride.trim().isNotEmpty
            ? kAiBackendUrlOverride.trim()
            : null);
  AppConstants.configure(backendUrl, aiBackendUrl: aiBackendUrl);

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

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/signup_screen.dart';
import '../screens/auth/mobile_unsupported_screen.dart';
import '../screens/main_scaffold.dart';
import '../screens/home/home_screen.dart';
import '../screens/chat/chat_screen.dart';
import '../screens/chat/chat_detail_screen.dart';
import '../screens/chat/ai_chat_screen.dart';
import '../screens/coach/pitch_coach_screen.dart';
import '../screens/coach/recording_screen.dart';
import '../screens/coach/pitch_performance_screen.dart';
import '../screens/inbox/inbox_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/profile_view_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/ventures/add_venture_screen.dart';
import '../screens/ventures/venture_hub_screen.dart';
import '../screens/meetings/meetings_screen.dart';
import '../screens/profile/availability_screen.dart';
import '../screens/connections/connections_screen.dart';
import '../screens/discovery/startup_discovery_screen.dart';
import '../screens/discovery/startup_leaderboard_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/settings/linked_device_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/advisory/advisory_tracks_screen.dart';
import '../screens/founder/founder_snapshot_screen.dart';
import '../screens/investor/deal_flow_screen.dart';
import '../screens/documents/document_vault_screen.dart';
import '../screens/analytics/analytics_screen.dart';
import '../screens/support/help_support_screen.dart';
import '../screens/calendar/readiness_calendar_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/calls/call_demo_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createRouter(AuthProvider authProvider) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: authProvider,
    redirect: (context, state) {
      final isAuth = authProvider.isAuthenticated;
      final isInit = authProvider.status == AuthStatus.initial;
      final isLoading = authProvider.isLoading;
      final location = state.matchedLocation;
      final role = authProvider.user?.role.toLowerCase();
      const unsupportedRoute = '/mobile-unsupported';

      if (location == '/splash') return null;
      if (isInit || isLoading) return '/splash';

      final publicRoutes = ['/login', '/signup', '/forgot-password'];
      if (!isAuth && !publicRoutes.contains(location)) return '/login';
      if (isAuth && publicRoutes.contains(location)) return '/home';

      if (isAuth && role == 'admin' && location != unsupportedRoute) {
        return unsupportedRoute;
      }
      if (isAuth && role != 'admin' && location == unsupportedRoute) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, __) => const SignupScreen()),
      GoRoute(
        path: '/mobile-unsupported',
        builder: (_, __) => const MobileUnsupportedScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (_, __) =>
            const ForgotPasswordScreen(mode: ForgotPasswordMode.passwordReset),
      ),
      GoRoute(
        path: '/support-chat',
        builder: (_, __) =>
            const ForgotPasswordScreen(mode: ForgotPasswordMode.support),
      ),

      // ── True full-screen routes (no bottom nav) ─────────────────────────
      GoRoute(
        path: '/recording',
        redirect: (_, __) {
          final role = authProvider.user?.role.toLowerCase();
          if (role == 'founder') return null;
          return '/home';
        },
        builder: (_, __) => const RecordingScreen(),
      ),
      GoRoute(
        path: '/pitch-performance',
        redirect: (_, __) {
          final role = authProvider.user?.role.toLowerCase();
          if (role == 'founder') return null;
          return '/home';
        },
        builder: (_, __) => const PitchPerformanceScreen(),
      ),

      // ── Shell: all main app routes share the bottom nav ─────────────────
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) {
          final loc = state.matchedLocation;
          final role = authProvider.user?.role.toLowerCase() ?? '';
          final isFounder = role == 'founder';
          int idx;
          if (loc.startsWith('/messages') || loc.startsWith('/inbox')) {
            idx = 3;
          } else if (loc.startsWith('/chat')) {
            idx = 1;
          } else if (isFounder && loc.startsWith('/coach')) {
            idx = 2;
          } else if (!isFounder && loc.startsWith('/discovery')) {
            idx = 2;
          } else {
            idx = 0;
          }
          return MainScaffold(currentIndex: idx < 0 ? 0 : idx, child: child);
        },
        routes: [
          // Bottom-nav tabs
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/chat', builder: (_, __) => const AiChatScreen()),
          GoRoute(
            path: '/coach',
            redirect: (_, __) {
              final role = authProvider.user?.role.toLowerCase();
              if (role == 'founder') return null;
              return '/home';
            },
            builder: (_, __) => const PitchCoachScreen(),
          ),
          GoRoute(path: '/inbox', builder: (_, __) => const InboxScreen()),
          // Peer-to-peer messages (accessed from Inbox tab)
          GoRoute(path: '/messages', builder: (_, __) => const ChatScreen()),
          GoRoute(
            path: '/messages/:userId',
            builder: (_, state) =>
                ChatDetailScreen(userId: state.pathParameters['userId'] ?? '0'),
          ),
          // Profile screens
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(
            path: '/profile/edit',
            builder: (_, __) => const EditProfileScreen(),
          ),
          GoRoute(
            path: '/profile/view/:userId',
            builder: (_, state) => ProfileViewScreen(
              userId: state.pathParameters['userId'] ?? '0',
            ),
          ),
          GoRoute(
            path: '/profile/:userId',
            builder: (_, state) => ProfileViewScreen(
              userId: state.pathParameters['userId'] ?? '0',
            ),
          ),
          // Ventures
          GoRoute(
            path: '/ventures',
            redirect: (_, __) {
              final role = authProvider.user?.role.toLowerCase();
              if (role == 'founder') return null;
              return '/home';
            },
            builder: (_, __) => const VentureHubScreen(),
          ),
          GoRoute(
            path: '/ventures/new',
            redirect: (_, __) {
              final role = authProvider.user?.role.toLowerCase();
              if (role == 'founder') return null;
              return '/home';
            },
            builder: (_, state) {
              final extra = state.extra;
              if (extra is Map<String, dynamic>) {
                return AddVentureScreen(initialVenture: extra);
              }
              if (extra is Map) {
                return AddVentureScreen(
                  initialVenture: Map<String, dynamic>.from(extra),
                );
              }
              return const AddVentureScreen();
            },
          ),
          // Connections & discovery
          GoRoute(
            path: '/connections',
            builder: (_, __) => const ConnectionsScreen(),
          ),
          GoRoute(
            path: '/discovery',
            redirect: (_, __) {
              final role = authProvider.user?.role.toLowerCase();
              if (role == 'investor') return null;
              return '/home';
            },
            builder: (_, __) => const StartupDiscoveryScreen(),
          ),
          GoRoute(
            path: '/leaderboard',
            redirect: (_, __) {
              final role = authProvider.user?.role.toLowerCase();
              if (role == 'investor') return null;
              return '/home';
            },
            builder: (_, __) => const StartupLeaderboardScreen(),
          ),
          // Meetings
          GoRoute(
            path: '/meetings',
            builder: (_, __) => const MeetingsScreen(),
          ),
          GoRoute(
            path: '/availability',
            builder: (_, __) => const AvailabilityScreen(),
          ),
          // Analytics & documents
          GoRoute(
            path: '/analytics',
            builder: (_, __) => const AnalyticsScreen(),
          ),
          GoRoute(
            path: '/documents',
            builder: (_, __) => const DocumentVaultScreen(),
          ),
          GoRoute(
            path: '/calendar',
            builder: (_, __) => const ReadinessCalendarScreen(),
          ),
          // Investor
          GoRoute(
            path: '/deal-flow',
            redirect: (_, __) {
              final role = authProvider.user?.role.toLowerCase();
              if (role == 'investor') return null;
              return '/home';
            },
            builder: (_, __) => const DealFlowScreen(),
          ),
          // Misc
          GoRoute(
            path: '/settings',
            builder: (_, __) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/settings/linked-device',
            builder: (_, __) => const LinkedDeviceScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (_, __) => const NotificationsScreen(),
          ),
          GoRoute(path: '/help', builder: (_, __) => const HelpSupportScreen()),
          GoRoute(
            path: '/advisory-tracks',
            redirect: (_, __) {
              final role = authProvider.user?.role.toLowerCase();
              if (role == 'founder') return null;
              return '/home';
            },
            builder: (_, __) => const AdvisoryTracksScreen(),
          ),
          GoRoute(
            path: '/founder-snapshot',
            redirect: (_, __) {
              final role = authProvider.user?.role.toLowerCase();
              if (role == 'founder') return null;
              return '/home';
            },
            builder: (_, __) => const FounderSnapshotScreen(),
          ),
          GoRoute(
            path: '/call-demo',
            builder: (_, __) => const CallDemoScreen(),
          ),
        ],
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      backgroundColor: const Color(0xFF000000),
      body: Center(
        child: Text(
          'Page not found: ${state.matchedLocation}',
          style: const TextStyle(color: Colors.white),
        ),
      ),
    ),
  );
}

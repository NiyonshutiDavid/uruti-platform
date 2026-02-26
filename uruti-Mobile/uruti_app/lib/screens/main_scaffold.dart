import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/app_colors.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';

// ─── Nav item data ─────────────────────────────────────────────────────────
class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem(this.icon, this.activeIcon, this.label);
}

const _navItems = [
  _NavItem(Icons.home_outlined, Icons.home_rounded, 'Home'),
  _NavItem(Icons.auto_awesome_outlined, Icons.auto_awesome_rounded, 'Chat'),
  _NavItem(Icons.mic_none_rounded, Icons.mic_rounded, 'Coach'),
  _NavItem(Icons.inbox_outlined, Icons.inbox_rounded, 'Inbox'),
];

// ─── MainScaffold ──────────────────────────────────────────────────────────
class MainScaffold extends StatefulWidget {
  /// Expose a static key so any screen can open the drawer without needing
  /// a BuildContext inside the outer Scaffold.
  static final scaffoldKey = GlobalKey<ScaffoldState>();

  final Widget child;
  final int currentIndex;

  const MainScaffold({
    super.key,
    required this.child,
    required this.currentIndex,
  });

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold>
    with TickerProviderStateMixin {
  late AnimationController _indicatorCtrl;
  late Animation<double> _indicatorPos;
  late Animation<double> _indicatorStretch;

  @override
  void initState() {
    super.initState();
    _indicatorCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    );
    _resetAnimations(widget.currentIndex, widget.currentIndex);
  }

  @override
  void didUpdateWidget(MainScaffold old) {
    super.didUpdateWidget(old);
    if (old.currentIndex != widget.currentIndex) {
      _resetAnimations(old.currentIndex, widget.currentIndex);
      _indicatorCtrl.forward(from: 0);
    }
  }

  void _resetAnimations(int from, int to) {
    _indicatorPos = Tween<double>(begin: from.toDouble(), end: to.toDouble())
        .animate(
          CurvedAnimation(parent: _indicatorCtrl, curve: Curves.easeInOutCubic),
        );
    // Liquid: pill stretches while sliding then snaps back.
    _indicatorStretch = TweenSequence<double>(
      [
        TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.7), weight: 40),
        TweenSequenceItem(tween: Tween(begin: 1.7, end: 1.0), weight: 60),
      ],
    ).animate(CurvedAnimation(parent: _indicatorCtrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _indicatorCtrl.dispose();
    super.dispose();
  }

  void _onTabTap(int i) {
    const tabs = ['/home', '/chat', '/coach', '/inbox'];
    if (i != widget.currentIndex) context.go(tabs[i]);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      key: MainScaffold.scaffoldKey,
      backgroundColor: context.colors.background,
      body: widget.child,
      bottomNavigationBar: _buildBottomNav(context),
      drawer: _buildDrawer(context, user, auth),
    );
  }

  // ─── Animated bottom nav ─────────────────────────────────────────────────

  Widget _buildBottomNav(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
        child: Container(
          height: 64,
          decoration: BoxDecoration(
            color: context.colors.surface,
            borderRadius: BorderRadius.circular(5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 24,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(5),
            child: LayoutBuilder(
              builder: (ctx, constraints) {
                final totalW = constraints.maxWidth;
                final tabW = totalW / 4;
                return AnimatedBuilder(
                  animation: _indicatorCtrl,
                  builder: (_, __) {
                    final pos = _indicatorPos.value;
                    final stretch = _indicatorStretch.value;
                    final pillW = tabW * 0.44 * stretch;
                    final centerX = (pos + 0.5) * tabW;
                    return Stack(
                      children: [
                        // Liquid pill indicator
                        Positioned(
                          bottom: 7,
                          left: (centerX - pillW / 2).clamp(
                            0.0,
                            totalW - pillW,
                          ),
                          child: Container(
                            width: pillW,
                            height: 3,
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                        // Tab items
                        Row(
                          children: List.generate(4, (i) {
                            final active = i == widget.currentIndex;
                            final item = _navItems[i];
                            return Expanded(
                              child: GestureDetector(
                                onTap: () => _onTabTap(i),
                                behavior: HitTestBehavior.opaque,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    AnimatedSwitcher(
                                      duration: const Duration(
                                        milliseconds: 200,
                                      ),
                                      child: Icon(
                                        active ? item.activeIcon : item.icon,
                                        key: ValueKey(active),
                                        color: active
                                            ? AppColors.primary
                                            : context.colors.navInactive,
                                        size: 22,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      item.label,
                                      style: TextStyle(
                                        color: active
                                            ? AppColors.primary
                                            : context.colors.navInactive,
                                        fontSize: 11,
                                        fontWeight: active
                                            ? FontWeight.w600
                                            : FontWeight.normal,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }),
                        ),
                      ],
                    );
                  },
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  // ─── Drawer ───────────────────────────────────────────────────────────────

  Widget _buildDrawer(BuildContext context, user, AuthProvider auth) {
    final tabs = ['/home', '/chat', '/coach', '/inbox'];
    final currentRoute = tabs.length > widget.currentIndex
        ? tabs[widget.currentIndex]
        : '/home';
    final isFounder = user?.isFounder ?? false;
    final isInvestor = user?.isInvestor ?? false;

    return Drawer(
      backgroundColor: Colors.transparent,
      elevation: 0,
      width: MediaQuery.of(context).size.width * 0.78,
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          topRight: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 36, sigmaY: 36),
          child: DecoratedBox(
            decoration: BoxDecoration(
              // Solid dark base so content stays readable
              // ClipRRect above handles corner rounding — no borderRadius needed here
              color: context.colors.background.withValues(alpha: 0.88),
              border: Border(
                right: BorderSide(
                  color: AppColors.primary.withValues(alpha: 0.22),
                  width: 1,
                ),
                top: BorderSide(
                  color: Colors.white.withValues(alpha: 0.06),
                  width: 0.5,
                ),
              ),
            ),
            child: DecoratedBox(
              // Liquid glass shimmer overlay on top
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withValues(alpha: 0.05),
                    Colors.grey.shade600.withValues(alpha: 0.22),
                    Colors.grey.shade800.withValues(alpha: 0.14),
                  ],
                  stops: const [0.0, 0.4, 1.0],
                ),
              ),
              child: SafeArea(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Header ──────────────────────────────────────────────
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 8, 8),
                      child: Row(
                        children: [
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: context.colors.darkGreenMid,
                              border: Border.all(
                                color: AppColors.primary.withValues(alpha: 0.4),
                                width: 1.5,
                              ),
                            ),
                            child: Center(
                              child: Image.asset(
                                'assets/images/Uruti-icon-white.png',
                                width: 22,
                                height: 22,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            'Uruti',
                            style: TextStyle(
                              color: context.colors.textPrimary,
                              fontWeight: FontWeight.w800,
                              fontSize: 18,
                            ),
                          ),
                          const Spacer(),
                          IconButton(
                            icon: Icon(
                              Icons.close_rounded,
                              color: context.colors.textSecondary,
                              size: 20,
                            ),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ],
                      ),
                    ),

                    // ── User card ───────────────────────────────────────────
                    Container(
                      margin: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: context.colors.card,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: context.colors.cardBorder),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: context.colors.darkGreenMid,
                            backgroundImage: user?.resolvedAvatarUrl != null
                                ? NetworkImage(user!.resolvedAvatarUrl!)
                                : null,
                            child: user?.resolvedAvatarUrl == null
                                ? Text(
                                    user?.initials ?? 'U',
                                    style: TextStyle(
                                      color: context.colors.textPrimary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  )
                                : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user?.fullName ?? 'User',
                                  style: TextStyle(
                                    color: context.colors.textPrimary,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(
                                      alpha: 0.15,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    _capitalize(user?.role ?? 'user'),
                                    style: TextStyle(
                                      color: AppColors.primary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ── Nav items ───────────────────────────────────────────
                    Expanded(
                      child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        children: [
                          if (isFounder) ...[
                            _item(
                              context,
                              Icons.person_outline_rounded,
                              'My Profile',
                              '/profile',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.rocket_launch_outlined,
                              'My Ventures',
                              '/ventures',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.bar_chart_rounded,
                              'Pitch Performance',
                              '/pitch-performance',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.auto_awesome_outlined,
                              'Uruti AI Chat',
                              '/chat',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.menu_book_outlined,
                              'AI Advisory Tracks',
                              '/advisory-tracks',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.people_outline_rounded,
                              'Build Connections',
                              '/connections',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.calendar_month_outlined,
                              'Readiness Calendar',
                              '/calendar',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.event_note_outlined,
                              'Meetings',
                              '/meetings',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.access_time_outlined,
                              'My Availability',
                              '/availability',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.mic_none_rounded,
                              'Pitch Coach',
                              '/coach',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.chat_bubble_outline_rounded,
                              'Messages',
                              '/inbox',
                              currentRoute,
                            ),
                          ] else if (isInvestor) ...[
                            _item(
                              context,
                              Icons.dashboard_outlined,
                              'Investor Dashboard',
                              '/investor-dashboard',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.person_outline_rounded,
                              'My Profile',
                              '/profile',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.explore_outlined,
                              'Startup Discovery',
                              '/discovery',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.people_outline_rounded,
                              'Build Connections',
                              '/connections',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.auto_awesome_outlined,
                              'Uruti AI Chat',
                              '/chat',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.trending_up_rounded,
                              'Deal Flow',
                              '/deal-flow',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.calendar_month_outlined,
                              'Meeting Calendar',
                              '/calendar',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.event_note_outlined,
                              'Meetings',
                              '/meetings',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.access_time_outlined,
                              'Availability & Booking',
                              '/availability',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.chat_bubble_outline_rounded,
                              'Messages',
                              '/inbox',
                              currentRoute,
                            ),
                          ] else ...[
                            _item(
                              context,
                              Icons.person_outline_rounded,
                              'My Profile',
                              '/profile',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.auto_awesome_outlined,
                              'Uruti AI Chat',
                              '/chat',
                              currentRoute,
                            ),
                            _item(
                              context,
                              Icons.chat_bubble_outline_rounded,
                              'Messages',
                              '/inbox',
                              currentRoute,
                            ),
                          ],

                          const SizedBox(height: 8),
                          Divider(height: 1, color: context.colors.divider),
                          const SizedBox(height: 8),

                          _item(
                            context,
                            Icons.settings_outlined,
                            'Settings',
                            '/settings',
                            currentRoute,
                          ),
                          _item(
                            context,
                            Icons.help_outline_rounded,
                            'Help & Support',
                            '/help',
                            currentRoute,
                          ),

                          const SizedBox(height: 4),
                          // ── Dark / Light mode toggle ──────────────────────
                          Consumer<ThemeProvider>(
                            builder: (context, theme, _) => ListTile(
                              dense: true,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 1,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              leading: Icon(
                                theme.isDark
                                    ? Icons.light_mode_rounded
                                    : Icons.dark_mode_rounded,
                                color: context.colors.textSecondary,
                                size: 20,
                              ),
                              title: Text(
                                theme.isDark ? 'Light Mode' : 'Dark Mode',
                                style: TextStyle(
                                  color: context.colors.textPrimary,
                                  fontSize: 14,
                                ),
                              ),
                              trailing: Switch.adaptive(
                                value: theme.isDark,
                                onChanged: (_) => theme.toggle(),
                                activeColor: AppColors.primary,
                              ),
                              onTap: theme.toggle,
                            ),
                          ),
                          const SizedBox(height: 4),
                          ListTile(
                            dense: true,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 1,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            leading: Icon(
                              Icons.logout_rounded,
                              color: AppColors.error,
                              size: 20,
                            ),
                            title: Text(
                              'Sign Out',
                              style: TextStyle(
                                color: AppColors.error,
                                fontSize: 14,
                              ),
                            ),
                            onTap: () async {
                              Navigator.pop(context);
                              await auth.logout();
                              if (context.mounted) context.go('/login');
                            },
                          ),
                        ],
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        'Uruti For investors and founders\nPowered by AI for Rwanda\'s Valley of Death',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: context.colors.textMuted,
                          fontSize: 11,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ), // inner shimmer DecoratedBox
          ), // outer solid DecoratedBox
        ), // BackdropFilter
      ), // ClipRRect
    );
  }

  Widget _item(
    BuildContext context,
    IconData icon,
    String title,
    String route,
    String currentRoute,
  ) {
    final isActive = currentRoute == route;
    return Container(
      margin: const EdgeInsets.only(bottom: 2),
      decoration: BoxDecoration(
        color: isActive ? context.colors.textPrimary : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        leading: Icon(
          icon,
          color: isActive
              ? context.colors.background
              : context.colors.textSecondary,
          size: 20,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isActive
                ? context.colors.background
                : context.colors.textPrimary,
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
        onTap: () {
          Navigator.pop(context);
          context.go(route);
        },
      ),
    );
  }

  String _capitalize(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/notification_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notifications = true;
  bool _emailAlerts = true;

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _notifications = prefs.getBool('push_notifications') ?? true;
      _emailAlerts = prefs.getBool('email_alerts') ?? true;
    });
  }

  Future<void> _togglePush(bool value) async {
    setState(() => _notifications = value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('push_notifications', value);
    if (value) {
      await NotificationService.instance.syncTokenWithBackend();
    } else {
      await NotificationService.instance.unregisterCurrentToken();
    }
  }

  Future<void> _toggleEmail(bool value) async {
    setState(() => _emailAlerts = value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('email_alerts', value);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
          ),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
        title: const Text(
          'Settings',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.home_rounded, color: Colors.white),
            tooltip: 'Go home',
            onPressed: () => context.go('/home'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionHeader('Account'),
          _SettingsTile(
            icon: Icons.person_outline,
            title: 'Edit Profile',
            onTap: () => context.push('/profile/edit'),
          ),
          _SettingsTile(
            icon: Icons.lock_outline,
            title: 'Change Password',
            onTap: () => _showChangePassword(context, auth),
          ),
          const Divider(height: 24),
          _SectionHeader('Notifications'),
          _SwitchTile(
            icon: Icons.notifications_outlined,
            title: 'Push Notifications',
            value: _notifications,
            onChanged: _togglePush,
          ),
          _SwitchTile(
            icon: Icons.email_outlined,
            title: 'Email Alerts',
            value: _emailAlerts,
            onChanged: _toggleEmail,
          ),
          const Divider(height: 24),
          _SectionHeader('Security'),
          _SettingsTile(
            icon: Icons.qr_code_scanner_rounded,
            title: 'Linked Device Login',
            onTap: () => context.push('/settings/linked-device'),
          ),
          const Divider(height: 24),
          _SectionHeader('Support'),
          _SettingsTile(
            icon: Icons.help_outline,
            title: 'Help & Support',
            onTap: () => context.push('/help'),
          ),
          _SettingsTile(
            icon: Icons.chat_outlined,
            title: 'Live Chat',
            onTap: () => context.push('/support-chat'),
          ),
          _SettingsTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            onTap: () => _openExternalUrl('https://uruti.rw/privacy-policy'),
          ),
          _SettingsTile(
            icon: Icons.description_outlined,
            title: 'Terms of Service',
            onTap: () => _openExternalUrl('https://uruti.rw/terms-of-service'),
          ),
          const Divider(height: 24),
          ListTile(
            leading: Icon(Icons.logout, color: AppColors.error),
            title: Text(
              'Sign Out',
              style: TextStyle(
                color: AppColors.error,
                fontWeight: FontWeight.w600,
              ),
            ),
            onTap: () async {
              await auth.logout();
              if (context.mounted) context.go('/login');
            },
          ),
          const SizedBox(height: 20),
          Center(
            child: Text(
              'Uruti For investors and founders',
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Future<void> _openExternalUrl(String url) async {
    final messenger = ScaffoldMessenger.of(context);
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      return;
    }
    if (!mounted) return;
    messenger.showSnackBar(
      const SnackBar(content: Text('Could not open link right now')),
    );
  }

  void _showChangePassword(BuildContext context, AuthProvider auth) {
    final oldCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Change Password',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 20),
            _passField('Current Password', oldCtrl),
            const SizedBox(height: 12),
            _passField('New Password', newCtrl),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                final nav = Navigator.of(context);
                final messenger = ScaffoldMessenger.of(context);
                try {
                  await auth.changePassword(oldCtrl.text, newCtrl.text);
                  if (!mounted) return;
                  nav.pop();
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Password updated!')),
                  );
                } catch (e) {
                  if (!mounted) return;
                  messenger.showSnackBar(SnackBar(content: Text('Error: $e')));
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: context.colors.accent,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Update Password'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _passField(String label, TextEditingController ctrl) => TextField(
    controller: ctrl,
    obscureText: true,
    style: TextStyle(color: context.colors.textPrimary),
    decoration: InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: context.colors.textSecondary),
      filled: true,
      fillColor: context.colors.card,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
    ),
  );
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(
      title,
      style: TextStyle(
        color: context.colors.textSecondary,
        fontSize: 12,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.0,
      ),
    ),
  );
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: EdgeInsets.zero,
    leading: Icon(icon, color: context.colors.textSecondary, size: 22),
    title: Text(
      title,
      style: TextStyle(color: context.colors.textPrimary, fontSize: 14),
    ),
    trailing: Icon(
      Icons.chevron_right,
      color: context.colors.textSecondary,
      size: 18,
    ),
    onTap: onTap,
  );
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _SwitchTile({
    required this.icon,
    required this.title,
    required this.value,
    required this.onChanged,
  });
  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: EdgeInsets.zero,
    leading: Icon(icon, color: context.colors.textSecondary, size: 22),
    title: Text(
      title,
      style: TextStyle(color: context.colors.textPrimary, fontSize: 14),
    ),
    trailing: Switch(
      value: value,
      onChanged: onChanged,
      activeColor: context.colors.accent,
    ),
  );
}

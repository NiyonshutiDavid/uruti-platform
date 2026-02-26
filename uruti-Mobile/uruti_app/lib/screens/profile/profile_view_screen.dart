import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class ProfileViewScreen extends StatefulWidget {
  final String userId;
  const ProfileViewScreen({super.key, required this.userId});
  @override
  State<ProfileViewScreen> createState() => _ProfileViewScreenState();
}

class _ProfileViewScreenState extends State<ProfileViewScreen> {
  UserModel? _user;
  bool _loading = true;
  bool _connecting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final token = context.read<AuthProvider>().token ?? '';
      final data = await ApiService.instance.getUserProfile(
        int.tryParse(widget.userId) ?? 0,
        token,
      );
      setState(() {
        _user = data;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _connect() async {
    setState(() => _connecting = true);
    try {
      final token = context.read<AuthProvider>().token ?? '';
      await ApiService.instance.sendConnectionRequest(
        int.tryParse(widget.userId) ?? 0,
        token,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Connection request sent!')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _connecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }
    if (_user == null) {
      return Scaffold(
        backgroundColor: context.colors.background,
        appBar: AppBar(
          backgroundColor: context.colors.background,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () =>
                context.canPop() ? context.pop() : context.go('/home'),
          ),
        ),
        body: Center(
          child: Text(
            'User not found',
            style: TextStyle(color: context.colors.textSecondary),
          ),
        ),
      );
    }
    final u = _user!;
    return Scaffold(
      backgroundColor: context.colors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 200,
            backgroundColor: context.colors.surface,
            leading: IconButton(
              icon: Icon(Icons.arrow_back, color: context.colors.textPrimary),
              onPressed: () =>
                  context.canPop() ? context.pop() : context.go('/home'),
            ),
            actions: [
              IconButton(
                icon: Icon(
                  Icons.message_outlined,
                  color: context.colors.textPrimary,
                ),
                onPressed: () => context.go('/messages/${u.id}'),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [const Color(0xFF1A3A0A), context.colors.card],
                  ),
                ),
                child: Align(
                  alignment: const Alignment(-0.9, 0.7),
                  child: Row(
                    children: [
                      const SizedBox(width: 20),
                      CircleAvatar(
                        radius: 36,
                        backgroundColor: context.colors.darkGreenMid,
                        backgroundImage: u.resolvedAvatarUrl != null
                            ? NetworkImage(u.resolvedAvatarUrl!)
                            : null,
                        child: u.resolvedAvatarUrl == null
                            ? Image.asset(
                                'assets/images/Uruti-icon-white.png',
                                width: 40,
                                height: 40,
                                fit: BoxFit.contain,
                              )
                            : null,
                      ),
                      const SizedBox(width: 14),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            u.fullName,
                            style: TextStyle(
                              color: context.colors.textPrimary,
                              fontWeight: FontWeight.w800,
                              fontSize: 18,
                            ),
                          ),
                          if (u.title != null)
                            Text(
                              u.title!,
                              style: TextStyle(
                                color: context.colors.textSecondary,
                                fontSize: 13,
                              ),
                            ),
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              u.role[0].toUpperCase() + u.role.substring(1),
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Connect button
                ElevatedButton.icon(
                  onPressed: _connecting ? null : _connect,
                  icon: _connecting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.person_add_outlined),
                  label: const Text('Connect'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                if (u.bio != null && u.bio!.isNotEmpty) ...[
                  _section(context, 'About'),
                  const SizedBox(height: 8),
                  Text(
                    u.bio!,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
                if ((u.expertise ?? []).isNotEmpty) ...[
                  _section(context, 'Expertise'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: (u.expertise ?? []).map((e) => _Tag(e)).toList(),
                  ),
                  const SizedBox(height: 80),
                ],
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _section(BuildContext context, String t) => Text(
  t,
  style: TextStyle(
    color: context.colors.textPrimary,
    fontWeight: FontWeight.w700,
    fontSize: 16,
  ),
);

class _Tag extends StatelessWidget {
  final String label;
  const _Tag(this.label);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
    decoration: BoxDecoration(
      color: AppColors.primary.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
    ),
    child: Text(
      label,
      style: TextStyle(color: AppColors.primary, fontSize: 12),
    ),
  );
}

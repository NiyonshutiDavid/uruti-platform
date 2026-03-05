import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';

enum UnsupportedReason { admin, deactivated }

class MobileUnsupportedScreen extends StatelessWidget {
  const MobileUnsupportedScreen({
    super.key,
    this.reason = UnsupportedReason.admin,
  });

  final UnsupportedReason reason;

  @override
  Widget build(BuildContext context) {
    final isDeactivated = reason == UnsupportedReason.deactivated;

    final icon = isDeactivated ? Icons.person_off_rounded : Icons.block_rounded;
    final title = isDeactivated
        ? 'Account Deactivated'
        : 'Access Not Supported';
    final description = isDeactivated
        ? 'Your account has been deactivated. If you believe this is a mistake, please contact our support team for assistance.'
        : 'This mobile app currently supports Founder and Investor accounts only.';

    return Scaffold(
      backgroundColor: context.colors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 64, color: AppColors.error),
                const SizedBox(height: 16),
                Text(
                  title,
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                Text(
                  description,
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 14,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                // ── Contact Support (deactivated accounts only) ──
                if (isDeactivated) ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => context.push('/support-chat'),
                      icon: const Icon(
                        Icons.chat_bubble_outline_rounded,
                        size: 18,
                      ),
                      label: const Text('Contact Support'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.colors.accent,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // ── Back to Login ──
                SizedBox(
                  width: double.infinity,
                  child: isDeactivated
                      ? OutlinedButton(
                          onPressed: () async {
                            await context.read<AuthProvider>().logout();
                            if (context.mounted) context.go('/login');
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: context.colors.textPrimary,
                            side: BorderSide(color: context.colors.cardBorder),
                            minimumSize: const Size.fromHeight(48),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('Back to Login'),
                        )
                      : ElevatedButton(
                          onPressed: () async {
                            await context.read<AuthProvider>().logout();
                            if (context.mounted) context.go('/login');
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: context.colors.accent,
                            foregroundColor: Colors.white,
                            minimumSize: const Size.fromHeight(48),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('Back to Login'),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

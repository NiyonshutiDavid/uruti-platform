import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/app_colors.dart';
import '../../core/app_constants.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

/// Screen that generates a QR code so the user can scan it from an
/// already-authenticated device (e.g. a phone where they're logged in)
/// and approve the login on this device.
class QrLoginScreen extends StatefulWidget {
  const QrLoginScreen({super.key});

  @override
  State<QrLoginScreen> createState() => _QrLoginScreenState();
}

class _QrLoginScreenState extends State<QrLoginScreen> {
  String? _qrPayload;
  String? _requestId;
  String? _code;
  bool _loading = true;
  String? _error;
  Timer? _pollTimer;
  bool _approved = false;

  @override
  void initState() {
    super.initState();
    _requestQr();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  // ────────────── Request a QR challenge ──────────────

  Future<void> _requestQr() async {
    setState(() {
      _loading = true;
      _error = null;
      _approved = false;
    });

    try {
      final data = await ApiService.instance.requestQrLogin();
      if (!mounted) return;
      setState(() {
        _qrPayload = data['qr_payload']?.toString();
        _requestId = data['request_id']?.toString();
        _code = data['code']?.toString();
        _loading = false;
      });
      _startPolling();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to generate QR code. Check your connection.';
        _loading = false;
      });
    }
  }

  // ────────────── Poll for approval ──────────────

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _poll());
  }

  Future<void> _poll() async {
    if (_requestId == null || _code == null || _approved) return;

    try {
      final data = await ApiService.instance.pollQrLoginStatus(
        requestId: _requestId!,
        code: _code!,
      );

      final status = (data['status'] ?? '').toString();

      if (status == 'approved' && data['access_token'] != null) {
        _pollTimer?.cancel();
        if (!mounted) return;
        setState(() => _approved = true);

        // Store token and navigate to home
        final token = data['access_token'] as String;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.tokenKey, token);
        ApiService.instance.setToken(token);

        // Refresh auth state so the router picks it up
        if (!mounted) return;
        await context.read<AuthProvider>().init();
        if (mounted) context.go('/home');
        return;
      }

      if (status == 'expired') {
        _pollTimer?.cancel();
        if (!mounted) return;
        setState(() {
          _error = 'QR code expired. Tap to generate a new one.';
          _qrPayload = null;
        });
      }
    } on ApiException catch (e) {
      // 410 = expired, 404 = not found — stop polling
      if (e.statusCode == 410 || e.statusCode == 404) {
        _pollTimer?.cancel();
        if (!mounted) return;
        setState(() {
          _error = 'QR code expired. Tap to generate a new one.';
          _qrPayload = null;
        });
      }
      // Other transient errors — keep polling
    } catch (_) {}
  }

  // ────────────── UI ──────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        title: const Text(
          'Login via Another Device',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
          child: Column(
            children: [
              const SizedBox(height: 12),

              // ── Explanation ──
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: context.colors.accent.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: context.colors.accent.withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline_rounded,
                      color: context.colors.accent,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Open Uruti on a device where you are already '
                        'logged in, go to Settings → Linked Devices, '
                        'and scan this QR code.',
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontSize: 12.5,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // ── QR code area ──
              if (_loading)
                SizedBox(
                  height: 260,
                  child: Center(
                    child: CircularProgressIndicator(
                      color: context.colors.accent,
                    ),
                  ),
                )
              else if (_approved)
                SizedBox(
                  height: 260,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          color: context.colors.accent,
                          size: 64,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Login approved!',
                          style: TextStyle(
                            color: context.colors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Redirecting\u2026',
                          style: TextStyle(
                            color: context.colors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else if (_error != null && _qrPayload == null)
                GestureDetector(
                  onTap: _requestQr,
                  child: SizedBox(
                    height: 260,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.refresh_rounded,
                            color: context.colors.accent,
                            size: 48,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _error!,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: context.colors.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else if (_qrPayload != null)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: QrImageView(
                    data: _qrPayload!,
                    version: QrVersions.auto,
                    size: 220,
                    gapless: true,
                    errorStateBuilder: (context, err) => Center(
                      child: Text(
                        'Error generating QR',
                        style: TextStyle(color: AppColors.error),
                      ),
                    ),
                  ),
                ),

              const SizedBox(height: 24),

              if (!_loading && !_approved && _qrPayload != null) ...[
                Text(
                  'Waiting for approval\u2026',
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: context.colors.accent,
                  ),
                ),
              ],

              const SizedBox(height: 32),

              // ── Refresh button ──
              if (!_loading && !_approved)
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton.icon(
                    onPressed: _requestQr,
                    icon: const Icon(Icons.refresh_rounded, size: 20),
                    label: const Text(
                      'Generate New QR Code',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: context.colors.accent,
                      side: BorderSide(
                        color: context.colors.accent.withValues(alpha: 0.4),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

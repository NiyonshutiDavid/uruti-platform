import 'dart:convert';
import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/app_colors.dart';
import '../../services/api_service.dart';

class LinkedDeviceScreen extends StatefulWidget {
  const LinkedDeviceScreen({super.key});

  @override
  State<LinkedDeviceScreen> createState() => _LinkedDeviceScreenState();
}

class _LinkedDeviceScreenState extends State<LinkedDeviceScreen> {
  List<Map<String, dynamic>> _sessions = [];
  bool _loading = true;
  bool _revoking = false;
  String? _currentDeviceId;

  @override
  void initState() {
    super.initState();
    _detectCurrentDevice();
    _loadSessions();
  }

  Future<void> _detectCurrentDevice() async {
    try {
      final info = DeviceInfoPlugin();
      if (Platform.isAndroid) {
        final a = await info.androidInfo;
        _currentDeviceId = a.id;
      } else if (Platform.isIOS) {
        final i = await info.iosInfo;
        _currentDeviceId = i.identifierForVendor;
      }
    } catch (_) {}
  }

  Future<void> _loadSessions() async {
    setState(() => _loading = true);
    try {
      final raw = await ApiService.instance.getActiveSessions();
      if (!mounted) return;
      setState(() {
        _sessions = List<Map<String, dynamic>>.from(raw);
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _revokeSession(String sessionId) async {
    if (_revoking) return;
    if (sessionId.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot revoke this device session yet')),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: context.colors.surface,
        title: Text(
          'Log out device?',
          style: TextStyle(color: context.colors.textPrimary),
        ),
        content: Text(
          'This will sign out the selected device.',
          style: TextStyle(color: context.colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Cancel',
              style: TextStyle(color: context.colors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Log out',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      setState(() => _revoking = true);
      await ApiService.instance.revokeSession(sessionId);
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Device logged out')));
      await _loadSessions();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) {
        setState(() => _revoking = false);
      }
    }
  }

  void _openScanner() async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const _QrScanPage()));
    if (mounted) _loadSessions();
  }

  IconData _deviceIcon(String? platform, String? deviceType) {
    final p = (platform ?? '').toLowerCase();
    final d = (deviceType ?? '').toLowerCase();
    if (p.contains('web') || d.contains('web') || d.contains('browser')) {
      return Icons.computer_rounded;
    }
    if (p.contains('ios') || d.contains('iphone') || d.contains('ipad')) {
      return Icons.phone_iphone_rounded;
    }
    if (p.contains('android')) return Icons.phone_android_rounded;
    if (d.contains('tablet')) return Icons.tablet_rounded;
    return Icons.devices_other_rounded;
  }

  String _deviceLabel(Map<String, dynamic> s) {
    final platform = (s['platform'] ?? s['device_type'] ?? '').toString();
    final os = (s['os'] ?? '').toString();
    final device = (s['device_name'] ?? s['device_model'] ?? '').toString();
    final parts = <String>[];
    if (device.isNotEmpty) parts.add(device);
    if (os.isNotEmpty) {
      parts.add(os);
    } else if (platform.isNotEmpty) {
      parts.add(platform[0].toUpperCase() + platform.substring(1));
    }
    return parts.isNotEmpty ? parts.join(' \u2022 ') : 'Unknown device';
  }

  bool _isCurrent(Map<String, dynamic> s) {
    final sid = (s['device_id'] ?? '').toString();
    if (_currentDeviceId != null && sid == _currentDeviceId) return true;
    return s['is_current'] == true;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        title: const Text(
          'Linked Devices',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _loading
          ? Center(
              child: CircularProgressIndicator(color: context.colors.accent),
            )
          : RefreshIndicator(
              onRefresh: _loadSessions,
              color: context.colors.accent,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // ── Info card ──
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
                            'Manage devices where you are logged in. '
                            'Scan the QR code on a web browser to link a new device.',
                            style: TextStyle(
                              color: context.colors.textSecondary,
                              fontSize: 12,
                              height: 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ── Device list ──
                  if (_sessions.isEmpty)
                    _emptyState(context)
                  else
                    ..._sessions.map((s) {
                      final sessionId = (s['id'] ?? s['session_id'] ?? '')
                          .toString();
                      final current = _isCurrent(s);
                      final lastActive = s['last_active'] ?? s['created_at'];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: context.colors.card,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: current
                                ? context.colors.accent.withValues(alpha: 0.4)
                                : context.colors.divider,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: context.colors.accent.withValues(
                                  alpha: 0.1,
                                ),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                _deviceIcon(
                                  s['platform']?.toString(),
                                  s['device_type']?.toString(),
                                ),
                                color: context.colors.accent,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          _deviceLabel(s),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            color: context.colors.textPrimary,
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ),
                                      if (current) ...[
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: context.colors.accent
                                                .withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(
                                              6,
                                            ),
                                          ),
                                          child: Text(
                                            'This device',
                                            style: TextStyle(
                                              color: context.colors.accent,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    lastActive != null
                                        ? 'Active: ${_formatTime(lastActive.toString())}'
                                        : 'Active recently',
                                    style: TextStyle(
                                      color: context.colors.textSecondary,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (!current)
                              IconButton(
                                icon: const Icon(
                                  Icons.logout_rounded,
                                  color: AppColors.error,
                                  size: 20,
                                ),
                                tooltip: 'Log out this device',
                                onPressed: () => _revokeSession(sessionId),
                              ),
                          ],
                        ),
                      );
                    }),

                  const SizedBox(height: 24),

                  // ── Scan button ──
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: _openScanner,
                      icon: const Icon(Icons.qr_code_scanner_rounded),
                      label: const Text(
                        'Scan to Log In on Another Device',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.colors.accent,
                        foregroundColor: Colors.white,
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
    );
  }

  Widget _emptyState(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
    child: Column(
      children: [
        Icon(
          Icons.devices_rounded,
          color: context.colors.textSecondary.withValues(alpha: 0.4),
          size: 56,
        ),
        const SizedBox(height: 16),
        Text(
          'No other devices',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Scan a QR code to log in on the web or another device.',
          textAlign: TextAlign.center,
          style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
        ),
      ],
    ),
  );

  String _formatTime(String raw) {
    try {
      final dt = DateTime.parse(raw).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 2) return 'Just now';
      if (diff.inHours < 1) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return raw;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QR Scanner page (pushed on top when user taps "Scan")
// ═══════════════════════════════════════════════════════════════════════════════

class _QrScanPage extends StatefulWidget {
  const _QrScanPage();
  @override
  State<_QrScanPage> createState() => _QrScanPageState();
}

class _QrScanPageState extends State<_QrScanPage> {
  bool _processing = false;
  String _status = 'Point the camera at the QR code on the web login page.';

  Future<void> _handleScan(String raw) async {
    setState(() {
      _processing = true;
      _status = 'Approving login request\u2026';
    });

    final parsed = _parseQrPayload(raw);
    if (parsed == null) {
      if (!mounted) return;
      setState(() {
        _processing = false;
        _status = 'Invalid QR code. Please scan a valid web login QR.';
      });
      return;
    }

    try {
      await ApiService.instance.approveQrLogin(
        requestId: parsed.$1,
        code: parsed.$2,
      );

      if (!mounted) return;
      setState(() {
        _processing = false;
        _status = 'Device linked successfully!';
      });

      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogCtx) => AlertDialog(
          backgroundColor: context.colors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              Icon(
                Icons.check_circle_rounded,
                color: context.colors.accent,
                size: 24,
              ),
              const SizedBox(width: 10),
              Text(
                'Logged In',
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          content: Text(
            'Web login approved successfully. The browser is now linked to your account.',
            style: TextStyle(color: context.colors.textSecondary),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: Text(
                'OK',
                style: TextStyle(
                  color: context.colors.accent,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      );

      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _processing = false;
        _status = 'Approval failed. Try with a fresh QR code.';
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  (String, String)? _parseQrPayload(String raw) {
    final value = raw.trim();

    try {
      final decoded = jsonDecode(value);
      if (decoded is Map<String, dynamic>) {
        final requestId = decoded['request_id']?.toString();
        final code = decoded['code']?.toString();
        if ((requestId ?? '').isNotEmpty && (code ?? '').isNotEmpty) {
          return (requestId!, code!);
        }
      }
    } catch (_) {}

    try {
      final uri = Uri.parse(value);
      final requestId = uri.queryParameters['request_id'];
      final code = uri.queryParameters['code'];
      if ((requestId ?? '').isNotEmpty && (code ?? '').isNotEmpty) {
        return (requestId!, code!);
      }
    } catch (_) {}

    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        title: const Text(
          'Scan QR Code',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: MobileScanner(
                  onDetect: (capture) {
                    if (_processing) return;
                    final code = capture.barcodes.isNotEmpty
                        ? capture.barcodes.first.rawValue
                        : null;
                    if (code == null || code.trim().isEmpty) return;
                    _handleScan(code);
                  },
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: context.colors.surface,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _status,
                style: const TextStyle(color: Colors.white),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

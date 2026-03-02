import 'dart:convert';

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
  bool _processing = false;
  String _status = 'Scan the QR code shown on web login.';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        title: Text(
          'Linked Device',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        iconTheme: IconThemeData(color: context.colors.textPrimary),
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
                style: TextStyle(color: context.colors.textPrimary),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleScan(String raw) async {
    setState(() {
      _processing = true;
      _status = 'Approving login request...';
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
        _status = 'Device linked. Web login approved successfully.';
      });

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Web login approved')));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _processing = false;
        _status = 'Approval failed. Please retry with a fresh QR.';
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
}

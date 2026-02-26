import 'dart:async';
import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityProvider extends ChangeNotifier {
  final Connectivity _connectivity = Connectivity();
  bool _isOnline = true;
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  bool get isOnline => _isOnline;

  ConnectivityProvider() {
    _init();
  }

  Future<void> _init() async {
    try {
      final results = await _connectivity.checkConnectivity();
      _isOnline = _hasConnection(results);
      notifyListeners();

      _subscription = _connectivity.onConnectivityChanged.listen((results) {
        final online = _hasConnection(results);
        if (online != _isOnline) {
          _isOnline = online;
          notifyListeners();
        }
      });
    } catch (_) {
      // connectivity_plus not available (e.g. hot-restart, desktop) — assume online
      _isOnline = true;
      notifyListeners();
    }
  }

  bool _hasConnection(List<ConnectivityResult> results) {
    return results.any(
      (r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet,
    );
  }

  Future<void> recheck() async {
    final results = await _connectivity.checkConnectivity();
    _isOnline = _hasConnection(results);
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

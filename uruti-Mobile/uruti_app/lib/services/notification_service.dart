import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'api_service.dart';
import '../firebase_options.dart';

@pragma('vm:entry-point')
Future<void> firebaseBackgroundMessageHandler(RemoteMessage message) async {
  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }
}

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  FirebaseMessaging get _messaging => FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;
  StreamSubscription<String>? _tokenRefreshSub;

  Future<void> initialize() async {
    if (_initialized) return;

    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    }

    FirebaseMessaging.onBackgroundMessage(firebaseBackgroundMessageHandler);

    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
    );

    const channel = AndroidNotificationChannel(
      'uruti-important',
      'Important Notifications',
      description: 'Message and platform updates',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(channel);

    FirebaseMessaging.onMessage.listen((message) {
      final title =
          message.notification?.title ?? message.data['title']?.toString();
      final body =
          message.notification?.body ?? message.data['body']?.toString();
      if (title == null || title.trim().isEmpty) return;
      _showLocal(title, body ?? '');
    });

    _tokenRefreshSub = _messaging.onTokenRefresh.listen((token) {
      final platform = _platformName();
      ApiService.instance.registerDeviceToken(token, platform: platform);
    });

    _initialized = true;
  }

  Future<void> syncTokenWithBackend() async {
    await initialize();
    if (Platform.isIOS) {
      final apns = await _waitForApnsToken();
      if (apns == null || apns.isEmpty) return;
    }

    final token = await _getFcmTokenSafely();
    if (token == null || token.trim().isEmpty) return;
    await ApiService.instance.registerDeviceToken(
      token,
      platform: _platformName(),
    );
  }

  Future<void> unregisterCurrentToken() async {
    await initialize();
    final token = await _getFcmTokenSafely();
    if (token == null || token.trim().isEmpty) return;
    await ApiService.instance.unregisterDeviceToken(token);
  }

  Future<String?> _getFcmTokenSafely() async {
    try {
      return await _messaging.getToken();
    } on FirebaseException catch (e) {
      if (e.code == 'apns-token-not-set') {
        return null;
      }
      rethrow;
    }
  }

  Future<String?> _waitForApnsToken({
    Duration timeout = const Duration(seconds: 12),
  }) async {
    final until = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(until)) {
      final apns = await _messaging.getAPNSToken();
      if (apns != null && apns.isNotEmpty) return apns;
      await Future<void>.delayed(const Duration(milliseconds: 500));
    }
    return null;
  }

  Future<void> _showLocal(String title, String body) async {
    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'uruti-important',
          'Important Notifications',
          channelDescription: 'Message and platform updates',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }

  String _platformName() {
    if (Platform.isIOS) return 'ios';
    if (Platform.isAndroid) return 'android';
    return 'unknown';
  }

  Future<void> dispose() async {
    await _tokenRefreshSub?.cancel();
    _tokenRefreshSub = null;
  }
}

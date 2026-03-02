import 'dart:async';

import 'package:flutter_callkit_incoming/entities/android_params.dart';
import 'package:flutter_callkit_incoming/entities/call_kit_params.dart';
import 'package:flutter_callkit_incoming/entities/ios_params.dart';
import 'package:flutter_callkit_incoming/flutter_callkit_incoming.dart';

import '../models/call_session.dart';

typedef NativeCallEventHandler =
    void Function(String event, Map<String, dynamic> body);

class CallService {
  CallService._();
  static final CallService instance = CallService._();

  StreamSubscription? _eventsSub;

  void bindNativeEvents(NativeCallEventHandler onEvent) {
    _eventsSub ??= FlutterCallkitIncoming.onEvent.listen((event) {
      final name = event?.event.toString() ?? '';
      final rawBody = event?.body;
      final body = rawBody is Map
          ? Map<String, dynamic>.from(rawBody)
          : <String, dynamic>{};
      onEvent(name, body);
    });
  }

  Future<void> showSystemIncomingCall(CallSession call) async {
    final safeAvatar = (call.callerAvatarUrl?.trim().isNotEmpty ?? false)
        ? call.callerAvatarUrl!.trim()
        : null;

    final params = CallKitParams(
      id: call.id,
      nameCaller: call.callerName,
      appName: 'Uruti',
      avatar: safeAvatar,
      handle: call.handle ?? 'Uruti call',
      type: call.isVideo ? 1 : 0,
      duration: 30000,
      textAccept: 'Accept',
      textDecline: 'Decline',
      extra: call.toSystemExtra(),
      android: const AndroidParams(
        isCustomNotification: true,
        isShowLogo: false,
        ringtonePath: 'system_ringtone_default',
        backgroundColor: '#111111',
        actionColor: '#76B947',
        textColor: '#ffffff',
        incomingCallNotificationChannelName: 'Incoming Call',
        missedCallNotificationChannelName: 'Missed Call',
        isShowCallID: false,
      ),
      ios: const IOSParams(
        iconName: 'AppIcon',
        handleType: 'generic',
        supportsVideo: true,
        maximumCallGroups: 2,
        maximumCallsPerCallGroup: 2,
        audioSessionMode: 'default',
        audioSessionActive: true,
        audioSessionPreferredSampleRate: 44100.0,
        audioSessionPreferredIOBufferDuration: 0.005,
        supportsDTMF: false,
        supportsHolding: false,
        supportsGrouping: false,
        supportsUngrouping: false,
        ringtonePath: 'system_ringtone_default',
      ),
    );

    await FlutterCallkitIncoming.showCallkitIncoming(params);
  }

  Future<void> endSystemCall(String callId) async {
    await FlutterCallkitIncoming.endCall(callId);
  }

  Future<void> endAllSystemCalls() async {
    await FlutterCallkitIncoming.endAllCalls();
  }

  Future<void> dispose() async {
    await _eventsSub?.cancel();
    _eventsSub = null;
  }
}

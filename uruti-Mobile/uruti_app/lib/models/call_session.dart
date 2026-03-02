class CallSession {
  final String id;
  final String callerId;
  final String callerName;
  final String? callerAvatarUrl;
  final String? handle;
  final bool isVideo;
  final DateTime createdAt;

  const CallSession({
    required this.id,
    required this.callerId,
    required this.callerName,
    this.callerAvatarUrl,
    this.handle,
    this.isVideo = false,
    required this.createdAt,
  });

  factory CallSession.fromPayload(Map<String, dynamic> payload) {
    final callerName = (payload['caller_name'] as String?)?.trim();
    return CallSession(
      id: (payload['call_id'] as String?) ?? _fallbackCallId(),
      callerId: (payload['caller_id'] as String?) ?? 'unknown',
      callerName: (callerName != null && callerName.isNotEmpty)
          ? callerName
          : 'Unknown',
      callerAvatarUrl: payload['caller_avatar_url'] as String?,
      handle: payload['handle'] as String?,
      isVideo: payload['is_video'] as bool? ?? false,
      createdAt: DateTime.now(),
    );
  }

  static String _fallbackCallId() {
    final micros = DateTime.now().microsecondsSinceEpoch.toRadixString(16);
    final seed = (micros * 4).padRight(32, '0').substring(0, 32);
    return '${seed.substring(0, 8)}-${seed.substring(8, 12)}-4${seed.substring(13, 16)}-a${seed.substring(17, 20)}-${seed.substring(20, 32)}';
  }

  Map<String, dynamic> toSystemExtra() {
    return {
      'caller_id': callerId,
      'caller_name': callerName,
      'caller_avatar_url': callerAvatarUrl,
      'handle': handle,
      'is_video': isVideo,
    };
  }
}

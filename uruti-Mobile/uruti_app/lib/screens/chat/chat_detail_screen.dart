import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';
import 'package:provider/provider.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';
import '../../core/app_constants.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/call_provider.dart';
import '../../services/api_service.dart';
import '../../services/message_notification_handler.dart';
import '../../services/realtime_service.dart';
import '../../widgets/book_session_sheet.dart';
import '../../widgets/in_app_video_player_screen.dart';

class ChatDetailScreen extends StatefulWidget {
  final String userId;
  const ChatDetailScreen({super.key, required this.userId});
  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  Map<String, dynamic>? _otherUser;
  String? _activeCallType; // 'voice' | 'video'
  DateTime? _callStartedAt;
  List<Map<String, dynamic>> _myVentures = [];
  Map<String, dynamic>? _activeContext;
  String? _attachedFileName;
  String? _attachedFilePath;
  bool _sending = false;
  bool _isRecordingVoiceNote = false;
  StreamSubscription<Map<String, dynamic>>? _realtimeSub;
  Timer? _onlineRefreshTimer;
  final AudioRecorder _audioRecorder = AudioRecorder();

  static final RegExp _callSummaryRegex = RegExp(
    r'^(Voice|Video)\s+call\s+(ended|missed|declined)\s*[·•-]\s*(\d+)m\s*(\d{1,2})s$',
    caseSensitive: false,
  );

  static final RegExp _fileTagRegex = RegExp(
    r'^📎\s*File:\s*(.+)$',
    multiLine: true,
  );
  static final RegExp _startupTagRegex = RegExp(
    r'^🏷\s*Startup:\s*(.+)$',
    multiLine: true,
  );

  @override
  void initState() {
    super.initState();
    _load();
    _realtimeSub = RealtimeService.instance.events.listen(_handleRealtimeEvent);

    // Suppress OS notifications for this conversation while we're viewing it
    MessageNotificationHandler.instance.activeConversationUserId =
        widget.userId;

    final token = (context.read<AuthProvider>().token ?? '').trim();
    if (token.isNotEmpty) {
      RealtimeService.instance.connect(token);
    }

    // Periodically refresh online status every 20 seconds
    _onlineRefreshTimer = Timer.periodic(
      const Duration(seconds: 20),
      (_) => _refreshOnlineStatus(),
    );
  }

  @override
  void dispose() {
    // Resume OS notifications for all conversations
    MessageNotificationHandler.instance.activeConversationUserId = null;
    _realtimeSub?.cancel();
    _onlineRefreshTimer?.cancel();
    if (_isRecordingVoiceNote) {
      try {
        _audioRecorder.stop();
      } catch (_) {}
    }
    _ctrl.dispose();
    _scroll.dispose();
    _audioRecorder.dispose();
    super.dispose();
  }

  String _asText(dynamic value) {
    if (value == null) return '';
    return value.toString().trim();
  }

  String? _safeAvatarUrl(dynamic raw) {
    final normalized = AppConstants.normalizeMediaUrl(_asText(raw));
    if (normalized == null) return null;
    final uri = Uri.tryParse(normalized);
    if (uri == null) return null;
    if (uri.hasScheme && (uri.path.isEmpty || uri.path == '/')) return null;
    return normalized;
  }

  void _handleRealtimeEvent(Map<String, dynamic> event) {
    if (!mounted) return;

    final eventType = event['event'];

    // Handle presence events
    if (eventType == 'user_online' || eventType == 'user_offline') {
      final data = event['data'];
      if (data is Map) {
        final userId = int.tryParse('${data['user_id'] ?? 0}') ?? 0;
        final otherId = int.tryParse(widget.userId) ?? 0;
        if (userId == otherId && _otherUser != null) {
          setState(() {
            _otherUser = {
              ..._otherUser!,
              'is_online': eventType == 'user_online',
            };
          });
        }
      }
      return;
    }

    if (eventType != 'message_created') return;

    final rawData = event['data'];
    if (rawData is! Map) return;

    final message = Map<String, dynamic>.from(rawData.cast<dynamic, dynamic>());
    final meId = context.read<AuthProvider>().user?.id ?? 0;
    final otherId = int.tryParse(widget.userId) ?? 0;
    final senderId = int.tryParse('${message['sender_id'] ?? 0}') ?? 0;
    final receiverId = int.tryParse('${message['receiver_id'] ?? 0}') ?? 0;

    final inThread =
        (senderId == meId && receiverId == otherId) ||
        (senderId == otherId && receiverId == meId);
    if (!inThread) return;

    final messageId = '${message['id'] ?? ''}';
    if (messageId.isNotEmpty &&
        _messages.any((m) => '${m['id']}' == messageId)) {
      return;
    }

    if (senderId == otherId) {
      ApiService.instance.markThreadAsRead(otherId);
      message['is_read'] = true;
    }

    final normalized = _normalizeThreadMessages([message]).first;

    if (senderId == meId) {
      final tempIndex = _messages.indexWhere((m) {
        final id = '${m['id'] ?? ''}';
        return id.startsWith('temp_') &&
            '${m['sender_id'] ?? ''}' == '$meId' &&
            '${m['body'] ?? ''}' == '${normalized['body'] ?? ''}';
      });

      if (tempIndex >= 0) {
        setState(() {
          _messages[tempIndex] = normalized;
        });
        WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
        return;
      }
    }

    setState(() {
      _messages.add(normalized);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  Future<void> _load() async {
    try {
      final token = context.read<AuthProvider>().token ?? '';
      final parsedUserId = int.tryParse(widget.userId) ?? 0;
      final results = await Future.wait([
        ApiService.instance.getMessages(parsedUserId, token),
        ApiService.instance.getConnections(token),
        ApiService.instance.getUserProfile(parsedUserId, token),
      ]);

      final data = List<Map<String, dynamic>>.from(results[0] as List<dynamic>);
      final connections = List<Map<String, dynamic>>.from(
        results[1] as List<dynamic>,
      );
      final dynamic profile = results[2];

      Map<String, dynamic>? fromConnection;
      for (final conn in connections) {
        if ('${conn['id']}' == widget.userId) {
          fromConnection = conn;
          break;
        }
      }

      final connectionDisplay = _asText(fromConnection?['display_name']);
      final connectionFull = _asText(fromConnection?['full_name']);
      final connectionName = connectionDisplay.isNotEmpty
          ? connectionDisplay
          : (connectionFull.isNotEmpty ? connectionFull : null);

      final profileDisplayName = (profile.displayNameOrFull as String? ?? '')
          .trim();
      final profileName = profileDisplayName.isEmpty
          ? 'Connection'
          : profileDisplayName;

      // Compute online status: use the online-ids endpoint for reliability
      final parsedId = int.tryParse(widget.userId) ?? 0;
      Set<int> onlineIds = {};
      try {
        onlineIds = await ApiService.instance.getOnlineConnectionIds();
      } catch (_) {}
      final isUserOnline = onlineIds.contains(parsedId);

      final userMap = {
        'full_name': connectionName ?? profileName,
        'avatar_url':
            _safeAvatarUrl(fromConnection?['avatar_url']) ??
            _safeAvatarUrl(fromConnection?['avatar']) ??
            _safeAvatarUrl(profile.resolvedAvatarUrl),
        'phone': _asText(profile.phone),
        'role': _asText(fromConnection?['role']).isNotEmpty
            ? _asText(fromConnection?['role'])
            : (profile.role.isNotEmpty ? profile.role : ''),
        'is_online': isUserOnline,
      };

      await ApiService.instance.markThreadAsRead(parsedUserId);

      if (!mounted) return;
      setState(() {
        _messages = _normalizeThreadMessages(data).map((msg) {
          if (msg['sender_id'] == parsedUserId) {
            return {...msg, 'is_read': true};
          }
          return msg;
        }).toList();
        _otherUser = userMap;
        _loading = false;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } catch (_) {
      setState(() => _loading = false);
    }

    _loadVentures();
  }

  /// Refresh online status for the other user via the online-ids endpoint.
  Future<void> _refreshOnlineStatus() async {
    if (!mounted || _otherUser == null) return;
    try {
      final otherId = int.tryParse(widget.userId) ?? 0;
      if (otherId <= 0) return;
      final onlineIds = await ApiService.instance.getOnlineConnectionIds();
      if (!mounted) return;
      final isOnline = onlineIds.contains(otherId);
      if (_otherUser?['is_online'] != isOnline) {
        setState(() {
          _otherUser = {..._otherUser!, 'is_online': isOnline};
        });
      }
    } catch (_) {}
  }

  Future<void> _loadVentures() async {
    try {
      final data = await ApiService.instance.getMyVentures();
      if (!mounted) return;
      setState(() {
        _myVentures = List<Map<String, dynamic>>.from(data);
      });
    } catch (_) {}
  }

  List<Map<String, dynamic>> _normalizeThreadMessages(
    List<Map<String, dynamic>> messages,
  ) {
    return messages
        .map<Map<String, dynamic>>((msg) => _toCallEventIfSummary(msg))
        .toList();
  }

  Map<String, dynamic> _toCallEventIfSummary(Map<String, dynamic> original) {
    if (original['kind'] == 'call_event') {
      return Map<String, dynamic>.from(original);
    }

    final body =
        ((original['body'] as String?) ??
                (original['content'] as String?) ??
                '')
            .trim();
    if (body.isEmpty) {
      return Map<String, dynamic>.from(original);
    }

    final match = _callSummaryRegex.firstMatch(body);
    if (match == null) {
      return Map<String, dynamic>.from(original);
    }

    final callTypeRaw = (match.group(1) ?? 'voice').toLowerCase();
    final outcomeRaw = (match.group(2) ?? 'ended').toLowerCase();
    final minutes = int.tryParse(match.group(3) ?? '0') ?? 0;
    final seconds = int.tryParse(match.group(4) ?? '0') ?? 0;

    return {
      ...original,
      'kind': 'call_event',
      'call_type': callTypeRaw == 'video' ? 'video' : 'voice',
      'call_outcome': outcomeRaw == 'missed'
          ? 'missed'
          : outcomeRaw == 'declined'
          ? 'declined'
          : 'ended',
      'duration_seconds': minutes * 60 + seconds,
    };
  }

  Future<void> _startVoiceCall() async {
    await _startInChatCall('voice');
  }

  Future<void> _startVideoCall() async {
    await _startInChatCall('video');
  }

  Future<void> _startInChatCall(String type) async {
    if (_activeCallType != null) return;
    final name = _asText(_otherUser?['full_name']).isNotEmpty
        ? _asText(_otherUser?['full_name'])
        : 'Connection';
    final callProvider = context.read<CallProvider>();
    if (callProvider.hasCall) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Finish current call before starting another.'),
        ),
      );
      return;
    }

    if (mounted) {
      setState(() {
        _activeCallType = type;
        _callStartedAt = null;
      });
    }

    await callProvider.startOutgoingCall(
      calleeId: widget.userId,
      calleeName: name,
      calleeAvatarUrl: _safeAvatarUrl(_otherUser?['avatar_url']),
      handle: _asText(_otherUser?['phone']).isNotEmpty
          ? _asText(_otherUser?['phone'])
          : null,
      isVideo: type == 'video',
    );
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes}m ${seconds.toString().padLeft(2, '0')}s';
  }

  Future<void> _promptEndCall() async {
    if (_activeCallType == null) return;
    await _finishCurrentCall('ended');
  }

  Future<void> _finishCurrentCall(String outcome) async {
    if (_activeCallType == null) return;

    final endedType = _activeCallType!;
    final duration = _callStartedAt == null
        ? Duration.zero
        : DateTime.now().difference(_callStartedAt!);
    final me = context.read<AuthProvider>().user!;
    final callLabel = endedType == 'video' ? 'Video call' : 'Voice call';
    final outcomeLabel = outcome == 'missed'
        ? 'missed'
        : outcome == 'declined'
        ? 'declined'
        : 'ended';
    final summaryText =
        '$callLabel $outcomeLabel · ${_formatDuration(duration)}';

    final callSummary = {
      'id': 'call_${DateTime.now().millisecondsSinceEpoch}',
      'kind': 'call_event',
      'sender_id': me.id,
      'call_type': endedType,
      'call_outcome': outcomeLabel,
      'duration_seconds': duration.inSeconds,
      'body': summaryText,
      'created_at': DateTime.now().toIso8601String(),
    };

    if (mounted) {
      setState(() {
        _activeCallType = null;
        _callStartedAt = null;
        _messages.add(callSummary);
      });
    }

    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

    final callProvider = context.read<CallProvider>();
    final authProvider = context.read<AuthProvider>();
    try {
      await callProvider.endCall();
      final token = authProvider.token ?? '';
      await ApiService.instance.sendMessage(
        int.tryParse(widget.userId) ?? 0,
        summaryText,
        token: token,
      );
    } catch (_) {}
  }

  void _scrollToBottom() {
    if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.any,
        withData: true,
      );
      if (result == null || result.files.isEmpty) return;
      final file = result.files.first;

      if (!mounted) return;
      setState(() {
        _attachedFileName = file.name;
        _attachedFilePath = file.path;
      });
    } catch (_) {}
  }

  Future<void> _toggleVoiceNoteRecording() async {
    if (_sending) return;

    if (_isRecordingVoiceNote) {
      try {
        final path = await _audioRecorder.stop();
        if (!mounted) return;
        setState(() {
          _isRecordingVoiceNote = false;
          if (path != null && path.isNotEmpty) {
            final fileName = path.split('/').last;
            _attachedFilePath = path;
            _attachedFileName = fileName.isEmpty ? 'voice-note.m4a' : fileName;
          }
        });
      } catch (_) {
        if (!mounted) return;
        setState(() => _isRecordingVoiceNote = false);
      }
      return;
    }

    try {
      final micPermission = await Permission.microphone.request();
      final allowed =
          micPermission.isGranted || await _audioRecorder.hasPermission();
      if (!allowed) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Microphone permission is required.')),
        );
        return;
      }

      final tempDir = await getTemporaryDirectory();
      final outputPath =
          '${tempDir.path}/uruti_voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _audioRecorder.start(
        const RecordConfig(encoder: AudioEncoder.aacLc),
        path: outputPath,
      );

      if (!mounted) return;
      setState(() => _isRecordingVoiceNote = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Recording voice note... tap mic again to stop.'),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _isRecordingVoiceNote = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to start voice recording.')),
      );
    }
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _dayLabel(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(date.year, date.month, date.day);
    final diff = today.difference(target).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  List<Widget> _buildMessageListItems(int meId) {
    final widgets = <Widget>[];
    DateTime? lastDate;

    for (final msg in _messages) {
      final createdAtRaw = msg['created_at'] as String?;
      final createdAt = DateTime.tryParse(createdAtRaw ?? '')?.toLocal();
      if (createdAt != null &&
          (lastDate == null || !_isSameDay(lastDate, createdAt))) {
        widgets.add(
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 10),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: context.colors.cardBorder),
              ),
              child: Text(
                _dayLabel(createdAt),
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        );
        lastDate = createdAt;
      }

      final isMe = msg['sender_id'] == meId;
      if (msg['kind'] == 'call_event') {
        widgets.add(_CallSummaryBubble(msg: msg));
      } else {
        widgets.add(
          GestureDetector(
            onLongPress: () => _promptDeleteMessage(msg),
            child: _MessageBubble(msg: msg, isMe: isMe),
          ),
        );
      }
    }

    return widgets;
  }

  Future<void> _promptDeleteMessage(Map<String, dynamic> message) async {
    final messageId = int.tryParse('${message['id'] ?? ''}') ?? 0;
    if (messageId <= 0) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dlg) => AlertDialog(
        backgroundColor: context.colors.surface,
        title: Text(
          'Delete message?',
          style: TextStyle(color: context.colors.textPrimary),
        ),
        content: Text(
          'This will permanently delete this message for this conversation.',
          style: TextStyle(color: context.colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dlg, false),
            child: Text(
              'Cancel',
              style: TextStyle(color: context.colors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dlg, true),
            child: const Text(
              'Delete',
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ApiService.instance.deleteMessage(messageId);
      if (!mounted) return;
      setState(() {
        _messages.removeWhere((m) => '${m['id'] ?? ''}' == '$messageId');
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Message deleted')));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Failed to delete message')));
    }
  }

  void _openComposerActions() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: context.colors.divider,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: Icon(
                  Icons.attach_file_rounded,
                  color: context.colors.accent,
                ),
                title: Text(
                  'Upload file',
                  style: TextStyle(color: context.colors.textPrimary),
                ),
                subtitle: Text(
                  'Attach PDF, DOC, CSV, JSON, etc.',
                  style: TextStyle(color: context.colors.textSecondary),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _pickFile();
                },
              ),
              ListTile(
                leading: Icon(
                  Icons.business_center_outlined,
                  color: context.colors.accent,
                ),
                title: Text(
                  'Choose startup',
                  style: TextStyle(color: context.colors.textPrimary),
                ),
                subtitle: Text(
                  'Attach one of your ventures',
                  style: TextStyle(color: context.colors.textSecondary),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _openStartupPicker();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openStartupPicker() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.58,
        maxChildSize: 0.9,
        builder: (ctx, scrollCtrl) => Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: context.colors.divider,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Startup Context',
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Attach one of your ventures for chat context.',
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 10),
              if (_activeContext != null)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(
                    Icons.close_rounded,
                    color: Colors.redAccent,
                  ),
                  title: const Text(
                    'Remove attached startup',
                    style: TextStyle(color: Colors.redAccent),
                  ),
                  onTap: () {
                    setState(() => _activeContext = null);
                    Navigator.pop(context);
                  },
                ),
              Expanded(
                child: _myVentures.isEmpty
                    ? Center(
                        child: Text(
                          'No startups found.\nCreate a venture to attach context.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: context.colors.textSecondary),
                        ),
                      )
                    : ListView.separated(
                        controller: scrollCtrl,
                        itemCount: _myVentures.length,
                        separatorBuilder: (_, __) =>
                            Divider(color: context.colors.divider),
                        itemBuilder: (_, i) {
                          final venture = _myVentures[i];
                          final active =
                              _activeContext != null &&
                              _activeContext!['id'] == venture['id'];
                          final name = (venture['name'] as String? ?? 'Venture')
                              .trim();
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor: context.colors.accent.withValues(
                                alpha: 0.12,
                              ),
                              child: Text(
                                name.isEmpty ? 'V' : name[0].toUpperCase(),
                                style: TextStyle(
                                  color: context.colors.accent,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            title: Text(
                              name,
                              style: TextStyle(
                                color: context.colors.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            subtitle: Text(
                              (venture['stage'] as String? ??
                                  venture['industry'] as String? ??
                                  ''),
                              style: TextStyle(
                                color: context.colors.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                            trailing: active
                                ? Icon(
                                    Icons.check_circle_rounded,
                                    color: context.colors.accent,
                                  )
                                : null,
                            onTap: () {
                              setState(() => _activeContext = venture);
                              Navigator.pop(context);
                            },
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _composeMessageBody(String text) {
    final parts = <String>[];
    final trimmed = text.trim();
    if (trimmed.isNotEmpty) {
      parts.add(trimmed);
    }
    if (_attachedFileName != null) {
      parts.add('📎 File: $_attachedFileName');
    }
    if (_activeContext != null) {
      final ventureJson = jsonEncode({
        'id': _activeContext!['id'],
        'name': (_activeContext!['name'] as String? ?? 'Venture').trim(),
        'tagline': (_activeContext!['tagline'] as String? ?? '').trim(),
        'logo_url': (_activeContext!['logo_url'] as String? ?? '').trim(),
        'industry': (_activeContext!['industry'] as String? ?? '').trim(),
      });
      parts.add('🏷 Startup: $ventureJson');
    }
    return parts.join('\n');
  }

  bool _hasPendingAttachments() {
    return _attachedFileName != null || _activeContext != null;
  }

  void _showChatInfo() {
    final name = _asText(_otherUser?['full_name']).isNotEmpty
        ? _asText(_otherUser?['full_name'])
        : 'Chat';
    final avatar = _safeAvatarUrl(_otherUser?['avatar_url']);
    final initials = name.split(' ').map((p) => p[0]).take(2).join();
    final isOnline = _otherUser?['is_online'] == true;
    final rawRole = _asText(_otherUser?['role']);
    final role = rawRole.isNotEmpty
        ? '${rawRole[0].toUpperCase()}${rawRole.substring(1)}'
        : 'User';
    final phone = _asText(_otherUser?['phone']);

    // Gather shared files and media from messages
    final sharedFiles = <Map<String, dynamic>>[];
    final sharedMedia = <Map<String, dynamic>>[];
    for (final msg in _messages) {
      final attachments = msg['attachments'];
      final normalizedAttachments = _extractAttachmentItems(attachments);
      for (final att in normalizedAttachments) {
        if (att.url.isEmpty) continue;
        if (_isImageAttachment(att.url, contentType: att.contentType)) {
          sharedMedia.add({'url': att.url, 'date': msg['created_at'] ?? ''});
        } else {
          sharedFiles.add({
            'name': att.name,
            'url': att.url,
            'date': msg['created_at'] ?? '',
          });
        }
      }
      // Also pick up tagged file names
      final body = (msg['body'] as String?) ?? '';
      final fileMatch = _fileTagRegex.firstMatch(body);
      if (fileMatch != null) {
        final fName = fileMatch.group(1)?.trim() ?? 'File';
        if (!sharedFiles.any((f) => f['name'] == fName)) {
          sharedFiles.add({
            'name': fName,
            'url': '',
            'date': msg['created_at'] ?? '',
          });
        }
      }
    }

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ChatInfoSheet(
        name: name,
        avatarUrl: avatar,
        initials: initials,
        isOnline: isOnline,
        role: role,
        phone: phone,
        sharedFiles: sharedFiles,
        sharedMedia: sharedMedia,
        userId: widget.userId,
      ),
    );
  }

  bool _isImageAttachment(String url, {String? contentType}) {
    final lower = url.toLowerCase();
    final mime = (contentType ?? '').toLowerCase();
    return mime.startsWith('image/') ||
        lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.bmp') ||
        lower.endsWith('.svg');
  }

  List<_AttachmentItem> _extractAttachmentItems(dynamic raw) {
    final items = <_AttachmentItem>[];

    void addFromUrl(String url, {String? name, String? contentType}) {
      final normalized = AppConstants.normalizeMediaUrl(url);
      if (normalized == null || normalized.isEmpty) return;
      final fallbackName =
          Uri.tryParse(normalized)?.pathSegments.lastOrNull ?? 'Attachment';
      items.add(
        _AttachmentItem(
          url: normalized,
          name: (name ?? '').trim().isNotEmpty ? name!.trim() : fallbackName,
          contentType: contentType,
        ),
      );
    }

    if (raw is List) {
      for (final entry in raw) {
        if (entry is String) {
          addFromUrl(entry);
          continue;
        }
        if (entry is Map) {
          final url = (entry['url'] ?? entry['file_url'] ?? entry['path'] ?? '')
              .toString();
          final name = (entry['name'] ?? entry['filename'] ?? '').toString();
          final contentType =
              (entry['content_type'] ?? entry['contentType'] ?? '').toString();
          if (url.trim().isNotEmpty) {
            addFromUrl(url, name: name, contentType: contentType);
          }
        }
      }
      return items;
    }

    if (raw is Map) {
      final url = (raw['url'] ?? raw['file_url'] ?? raw['path'] ?? '')
          .toString();
      final name = (raw['name'] ?? raw['filename'] ?? '').toString();
      final contentType = (raw['content_type'] ?? raw['contentType'] ?? '')
          .toString();
      if (url.trim().isNotEmpty) {
        addFromUrl(url, name: name, contentType: contentType);
      }
      return items;
    }

    if (raw is String) {
      addFromUrl(raw);
    }

    return items;
  }

  Future<void> _send() async {
    final authProvider = context.read<AuthProvider>();
    final text = _ctrl.text.trim();
    if ((text.isEmpty && !_hasPendingAttachments()) || _sending) return;

    final body = _composeMessageBody(text);
    if (body.isEmpty) {
      setState(() => _sending = false);
      return;
    }

    final selectedFileName = _attachedFileName;
    final selectedFilePath = _attachedFilePath;
    final selectedStartup = _activeContext;
    final selectedBody = body;

    final attachmentUrls = <String>[];

    if (selectedFilePath != null && selectedFilePath.isNotEmpty) {
      setState(() => _sending = true);
      try {
        final uploaded = await ApiService.instance.uploadMessageAttachment(
          selectedFilePath,
        );
        final rawUrl = (uploaded['url'] as String?)?.trim() ?? '';
        if (rawUrl.isNotEmpty) {
          attachmentUrls.add(rawUrl);
        }
      } catch (_) {
        if (!mounted) return;
        setState(() => _sending = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Attachment upload failed. Try again.')),
        );
        return;
      }
    }

    _ctrl.clear();
    final me = authProvider.user!;
    final tempMsg = {
      'id': 'temp_${DateTime.now().millisecondsSinceEpoch}',
      'sender_id': me.id,
      'body': selectedBody,
      'attachments': attachmentUrls,
      'attached_file_name': selectedFileName,
      'startup_name': selectedStartup?['name'],
      'created_at': DateTime.now().toIso8601String(),
      'is_read': false,
    };
    setState(() {
      _messages.add(tempMsg);
      _sending = true;
      _attachedFileName = null;
      _attachedFilePath = null;
      _activeContext = null;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    try {
      final token = authProvider.token ?? '';
      await ApiService.instance.sendMessage(
        int.tryParse(widget.userId) ?? 0,
        selectedBody,
        attachments: attachmentUrls,
        token: token,
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to send message. Try again.')),
      );
    } finally {
      if (mounted) {
        setState(() => _sending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = context.read<AuthProvider>().user!;
    final calls = context.watch<CallProvider>();

    // Sync: if the call ended externally (overlay/banner), clear local state.
    if (_activeCallType != null && !calls.hasCall) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _activeCallType != null) {
          setState(() {
            _activeCallType = null;
            _callStartedAt = null;
          });
        }
      });
    }

    final name = _asText(_otherUser?['full_name']).isNotEmpty
        ? _asText(_otherUser?['full_name'])
        : 'Chat';
    final avatar = _safeAvatarUrl(_otherUser?['avatar_url']);
    final initials = name.split(' ').map((p) => p[0]).take(2).join();

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/inbox'),
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: Colors.white.withValues(alpha: 0.2),
              backgroundImage: avatar != null ? NetworkImage(avatar) : null,
              child: avatar == null
                  ? Text(
                      initials,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: _showChatInfo,
                behavior: HitTestBehavior.opaque,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Row(
                      children: [
                        if (_activeCallType == null) ...[
                          Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.only(right: 4),
                            decoration: BoxDecoration(
                              color: (_otherUser?['is_online'] == true)
                                  ? Colors.green
                                  : Colors.grey,
                              shape: BoxShape.circle,
                            ),
                          ),
                          Text(
                            (_otherUser?['is_online'] == true)
                                ? 'Online'
                                : 'Offline',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                            ),
                          ),
                        ] else
                          Text(
                            calls.isOutgoing
                                ? '${_activeCallType == 'video' ? 'Video' : 'Voice'} call • Waiting...'
                                : '${_activeCallType == 'video' ? 'Video' : 'Voice'} call • ${_formatDuration(calls.activeDuration)}',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        actions: [
          if (_activeCallType == null) ...[
            IconButton(
              icon: Icon(Icons.phone_outlined, color: Colors.white),
              onPressed: _startVoiceCall,
            ),
            IconButton(
              icon: Icon(Icons.videocam_outlined, color: Colors.white),
              onPressed: _startVideoCall,
            ),
          ] else
            IconButton(
              icon: const Icon(Icons.call_end_rounded, color: Colors.red),
              onPressed: _promptEndCall,
            ),
        ],
      ),
      body: Column(
        children: [
          if (_activeContext != null || _attachedFileName != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (_activeContext != null)
                    Chip(
                      label: Text(
                        'Startup: ${_activeContext!['name'] ?? 'Venture'}',
                      ),
                      labelStyle: const TextStyle(fontSize: 12),
                      backgroundColor: context.colors.accent.withValues(
                        alpha: 0.12,
                      ),
                      side: BorderSide(
                        color: context.colors.accent.withValues(alpha: 0.35),
                      ),
                      deleteIcon: const Icon(Icons.close_rounded, size: 16),
                      onDeleted: () => setState(() => _activeContext = null),
                    ),
                  if (_attachedFileName != null)
                    Chip(
                      label: Text('File: $_attachedFileName'),
                      labelStyle: const TextStyle(fontSize: 12),
                      backgroundColor: context.colors.surface,
                      side: BorderSide(color: context.colors.cardBorder),
                      deleteIcon: const Icon(Icons.close_rounded, size: 16),
                      onDeleted: () => setState(() {
                        _attachedFileName = null;
                        _attachedFilePath = null;
                      }),
                    ),
                ],
              ),
            ),
          Expanded(
            child: _loading
                ? Center(
                    child: CircularProgressIndicator(
                      color: context.colors.accent,
                    ),
                  )
                : ListView(
                    controller: _scroll,
                    padding: const EdgeInsets.all(16),
                    children: _buildMessageListItems(me.id),
                  ),
          ),
          _InputBar(
            ctrl: _ctrl,
            onSend: _send,
            onAttach: _openComposerActions,
            onRecordVoice: _toggleVoiceNoteRecording,
            hasAttachment: _hasPendingAttachments(),
            sending: _sending,
            recordingVoiceNote: _isRecordingVoiceNote,
          ),
        ],
      ),
    );
  }
}

class _CallSummaryBubble extends StatelessWidget {
  final Map<String, dynamic> msg;
  const _CallSummaryBubble({required this.msg});

  @override
  Widget build(BuildContext context) {
    final type = (msg['call_type'] as String?) ?? 'voice';
    final outcome = (msg['call_outcome'] as String?) ?? 'ended';
    final durationSeconds = (msg['duration_seconds'] as int?) ?? 0;
    final duration = Duration(seconds: durationSeconds);
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    final durationText = '${minutes}m ${seconds.toString().padLeft(2, '0')}s';

    IconData icon;
    Color color;
    if (outcome == 'missed') {
      icon = type == 'video'
          ? Icons.videocam_off_outlined
          : Icons.phone_missed_rounded;
      color = Colors.orange;
    } else if (outcome == 'declined') {
      icon = Icons.call_end_rounded;
      color = Colors.redAccent;
    } else {
      icon = type == 'video' ? Icons.videocam_outlined : Icons.phone_outlined;
      color = context.colors.accent;
    }

    return Align(
      alignment: Alignment.center,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: context.colors.divider),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(
              '${type == 'video' ? 'Video call' : 'Voice call'} $outcome · $durationText',
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final Map<String, dynamic> msg;
  final bool isMe;
  const _MessageBubble({required this.msg, required this.isMe});

  String _formatTime(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return '';
    final h = dt.hour == 0 ? 12 : (dt.hour > 12 ? dt.hour - 12 : dt.hour);
    final m = dt.minute.toString().padLeft(2, '0');
    final suffix = dt.hour >= 12 ? 'PM' : 'AM';
    return '$h:$m $suffix';
  }

  _ParsedBody _parseBody(String raw) {
    final fileMatch = _ChatDetailScreenState._fileTagRegex.firstMatch(raw);
    final startupMatch = _ChatDetailScreenState._startupTagRegex.firstMatch(
      raw,
    );

    final fileName = fileMatch?.group(1)?.trim();
    String? startupName;
    Map<String, dynamic>? ventureData;

    if (startupMatch != null) {
      final captured = startupMatch.group(1)?.trim() ?? '';
      // Try JSON first (new rich format), fallback to plain name
      if (captured.startsWith('{')) {
        try {
          ventureData = jsonDecode(captured) as Map<String, dynamic>;
          startupName = (ventureData['name'] as String?)?.trim();
        } catch (_) {
          startupName = captured;
        }
      } else {
        startupName = captured;
      }
    }

    final cleaned = raw
        .replaceAll(_ChatDetailScreenState._fileTagRegex, '')
        .replaceAll(_ChatDetailScreenState._startupTagRegex, '')
        .replaceAll(RegExp(r'\n{3,}'), '\n\n')
        .trim();

    return _ParsedBody(
      text: cleaned,
      fileName: fileName,
      startupName: startupName,
      ventureData: ventureData,
    );
  }

  List<_AttachmentItem> _attachments() {
    final items = <_AttachmentItem>[];
    final raw = msg['attachments'];

    void addFromUrl(String url, {String? name, String? contentType}) {
      final normalized = AppConstants.normalizeMediaUrl(url);
      if (normalized == null || normalized.isEmpty) return;
      final fallbackName =
          Uri.tryParse(normalized)?.pathSegments.lastOrNull ?? 'Attachment';
      items.add(
        _AttachmentItem(
          url: normalized,
          name: (name ?? '').trim().isNotEmpty ? name!.trim() : fallbackName,
          contentType: contentType,
        ),
      );
    }

    if (raw is List) {
      for (final entry in raw) {
        if (entry is String) {
          addFromUrl(entry);
          continue;
        }
        if (entry is Map) {
          final url = (entry['url'] ?? entry['file_url'] ?? entry['path'] ?? '')
              .toString();
          final name = (entry['name'] ?? entry['filename'] ?? '').toString();
          final contentType =
              (entry['content_type'] ?? entry['contentType'] ?? '').toString();
          if (url.trim().isNotEmpty) {
            addFromUrl(url, name: name, contentType: contentType);
          }
        }
      }
    } else if (raw is Map) {
      final url = (raw['url'] ?? raw['file_url'] ?? raw['path'] ?? '')
          .toString();
      final name = (raw['name'] ?? raw['filename'] ?? '').toString();
      final contentType = (raw['content_type'] ?? raw['contentType'] ?? '')
          .toString();
      if (url.trim().isNotEmpty) {
        addFromUrl(url, name: name, contentType: contentType);
      }
    } else {
      for (final key in const ['attachment_url', 'file_url', 'audio_url']) {
        final rawUrl = (msg[key] ?? '').toString().trim();
        if (rawUrl.isNotEmpty) {
          addFromUrl(rawUrl);
        }
      }
    }
    return items;
  }

  bool _isAudioAttachment(String url, {String? contentType}) {
    final lower = url.toLowerCase();
    final mime = (contentType ?? '').toLowerCase();
    return mime.startsWith('audio/') ||
        lower.endsWith('.m4a') ||
        lower.endsWith('.aac') ||
        lower.endsWith('.mp3') ||
        lower.endsWith('.wav') ||
        lower.endsWith('.ogg') ||
        lower.endsWith('.webm');
  }

  bool _isImageAttachment(String url, {String? contentType}) {
    final lower = url.toLowerCase();
    final mime = (contentType ?? '').toLowerCase();
    return mime.startsWith('image/') ||
        lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.bmp') ||
        lower.endsWith('.svg');
  }

  bool _isPdfAttachment(String url, {String? contentType}) {
    final lower = url.toLowerCase();
    final mime = (contentType ?? '').toLowerCase();
    return mime == 'application/pdf' || lower.endsWith('.pdf');
  }

  Future<void> _openAttachment(
    BuildContext context,
    _AttachmentItem item,
  ) async {
    final target = Uri.parse(item.url);
    final launchMode =
        _isAudioAttachment(item.url, contentType: item.contentType)
        ? LaunchMode.externalApplication
        : LaunchMode.externalApplication;
    final ok = await launchUrl(target, mode: launchMode);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open attachment.')),
      );
    }
  }

  void _previewImage(BuildContext context, String url, String title) {
    showDialog<void>(
      context: context,
      builder: (_) => Dialog(
        insetPadding: const EdgeInsets.all(12),
        child: Stack(
          children: [
            InteractiveViewer(
              child: Image.network(
                url,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const SizedBox(
                  height: 220,
                  child: Center(child: Text('Unable to load image preview.')),
                ),
              ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close_rounded),
                style: IconButton.styleFrom(backgroundColor: Colors.white70),
              ),
            ),
            Positioned(
              left: 12,
              bottom: 12,
              child: Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  shadows: [Shadow(blurRadius: 4, color: Colors.black87)],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _previewPdf(BuildContext context, String url, String title) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => SizedBox(
        height: MediaQuery.of(context).size.height * 0.88,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: Icon(
                      Icons.close_rounded,
                      color: context.colors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: SfPdfViewer.network(
                url,
                canShowScrollHead: true,
                canShowPaginationDialog: true,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleAttachmentTap(BuildContext context, _AttachmentItem item) {
    if (_isImageAttachment(item.url, contentType: item.contentType)) {
      _previewImage(context, item.url, item.name);
      return;
    }
    if (_isPdfAttachment(item.url, contentType: item.contentType)) {
      _previewPdf(context, item.url, item.name);
      return;
    }
    _openAttachment(context, item);
  }

  @override
  Widget build(BuildContext context) {
    final content =
        (msg['body'] as String?) ?? (msg['content'] as String?) ?? '';
    final parsed = _parseBody(content);
    final time = _formatTime(msg['created_at'] as String?);
    final isRead = (msg['is_read'] as bool?) ?? false;
    final attachments = _attachments();

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.72,
        ),
        decoration: BoxDecoration(
          color: isMe ? context.colors.accent : context.colors.card,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (parsed.fileName != null)
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: isMe
                      ? Colors.white.withValues(alpha: 0.15)
                      : context.colors.surface,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.description_outlined,
                      size: 14,
                      color: isMe ? Colors.white : context.colors.textSecondary,
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        parsed.fileName!,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: isMe
                              ? Colors.white
                              : context.colors.textPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            if (attachments.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ...attachments
                        .where(
                          (att) => _isAudioAttachment(
                            att.url,
                            contentType: att.contentType,
                          ),
                        )
                        .map(
                          (att) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: _AudioMessageTile(url: att.url, isMe: isMe),
                          ),
                        ),
                    ...attachments
                        .where(
                          (att) => !_isAudioAttachment(
                            att.url,
                            contentType: att.contentType,
                          ),
                        )
                        .map((att) {
                          final isImage = _isImageAttachment(
                            att.url,
                            contentType: att.contentType,
                          );
                          final isPdf = _isPdfAttachment(
                            att.url,
                            contentType: att.contentType,
                          );

                          if (isImage) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: GestureDetector(
                                onTap: () =>
                                    _previewImage(context, att.url, att.name),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: Image.network(
                                    att.url,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(
                                      width: 180,
                                      height: 120,
                                      color: isMe
                                          ? Colors.white.withValues(alpha: 0.15)
                                          : context.colors.surface,
                                      alignment: Alignment.center,
                                      child: Text(
                                        'Unable to preview image',
                                        style: TextStyle(
                                          color: isMe
                                              ? Colors.white
                                              : context.colors.textSecondary,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: GestureDetector(
                              onTap: () => _handleAttachmentTap(context, att),
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: isMe
                                      ? Colors.white.withValues(alpha: 0.15)
                                      : context.colors.surface,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      isPdf
                                          ? Icons.picture_as_pdf_outlined
                                          : Icons.insert_drive_file_outlined,
                                      size: 14,
                                      color: isMe
                                          ? Colors.white
                                          : context.colors.textSecondary,
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        isPdf
                                            ? 'Open PDF: ${att.name}'
                                            : 'Open file: ${att.name}',
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          color: isMe
                                              ? Colors.white
                                              : context.colors.textPrimary,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
                  ],
                ),
              ),
            if (parsed.startupName != null)
              _VentureCard(
                name: parsed.startupName!,
                ventureData: parsed.ventureData,
                isMe: isMe,
              ),
            if (parsed.text.isNotEmpty)
              Text(
                parsed.text,
                style: TextStyle(
                  color: isMe ? Colors.white : context.colors.textPrimary,
                  fontSize: 14,
                ),
              ),
            if (time.isNotEmpty)
              Align(
                alignment: Alignment.centerRight,
                child: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        time,
                        style: TextStyle(
                          color: isMe
                              ? Colors.white.withValues(alpha: 0.8)
                              : context.colors.textSecondary,
                          fontSize: 10,
                        ),
                      ),
                      if (isMe) ...[
                        const SizedBox(width: 4),
                        Icon(
                          Icons.done_all_rounded,
                          size: 12,
                          color: isRead
                              ? const Color(0xFF34B7F1)
                              : Colors.white.withValues(alpha: 0.8),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ParsedBody {
  final String text;
  final String? fileName;
  final String? startupName;
  final Map<String, dynamic>? ventureData;

  const _ParsedBody({
    required this.text,
    required this.fileName,
    required this.startupName,
    this.ventureData,
  });
}

class _AttachmentItem {
  final String url;
  final String name;
  final String? contentType;

  const _AttachmentItem({
    required this.url,
    required this.name,
    this.contentType,
  });
}

class _AudioMessageTile extends StatefulWidget {
  final String url;
  final bool isMe;

  const _AudioMessageTile({required this.url, required this.isMe});

  @override
  State<_AudioMessageTile> createState() => _AudioMessageTileState();
}

class _AudioMessageTileState extends State<_AudioMessageTile> {
  VideoPlayerController? _controller;
  bool _loading = true;
  bool _failed = false;
  static const int _waveBinCount = 24;
  List<double> _waveformBins = List<double>.generate(
    _waveBinCount,
    (index) => 0.35 + ((index % 5) * 0.1),
  );

  @override
  void initState() {
    super.initState();
    _initAudio();
  }

  Future<void> _buildWaveformBins() async {
    final uri = Uri.tryParse(widget.url);
    if (uri == null) return;

    HttpClient? client;
    try {
      client = HttpClient()..connectionTimeout = const Duration(seconds: 8);
      final request = await client.getUrl(uri);
      final response = await request.close();
      if (response.statusCode < 200 || response.statusCode >= 300) return;

      final bytes = <int>[];
      await for (final chunk in response) {
        bytes.addAll(chunk);
      }
      if (bytes.isEmpty) return;

      final chunkSize = (bytes.length / _waveBinCount).ceil();
      final bins = <double>[];

      for (var i = 0; i < _waveBinCount; i++) {
        final start = i * chunkSize;
        if (start >= bytes.length) {
          bins.add(0.15);
          continue;
        }
        final end = ((i + 1) * chunkSize).clamp(0, bytes.length);
        var total = 0.0;
        var count = 0;
        for (var j = start; j < end; j++) {
          total += (bytes[j] - 128).abs() / 127.0;
          count++;
        }
        final value = count > 0 ? (total / count) : 0.0;
        bins.add(value);
      }

      final peak = bins.reduce((a, b) => a > b ? a : b);
      final normalized = peak > 0
          ? bins.map((v) => (v / peak).clamp(0.15, 1.0)).toList()
          : List<double>.filled(_waveBinCount, 0.25);

      if (!mounted) return;
      setState(() {
        _waveformBins = normalized;
      });
    } catch (_) {
      // Keep default bars when waveform extraction fails.
    } finally {
      client?.close(force: true);
    }
  }

  Future<void> _initAudio() async {
    try {
      final controller = VideoPlayerController.networkUrl(
        Uri.parse(widget.url),
      );
      await controller.initialize();
      controller.addListener(() {
        if (mounted) setState(() {});
      });
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _controller = controller;
        _loading = false;
      });
      unawaited(_buildWaveformBins());
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _failed = true;
        _loading = false;
      });
    }
  }

  Future<void> _togglePlay() async {
    final controller = _controller;
    if (controller == null) return;
    if (controller.value.isPlaying) {
      await controller.pause();
    } else {
      await controller.play();
    }
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isMe = widget.isMe;
    final ctrl = _controller;
    final durationMs = (ctrl?.value.duration.inMilliseconds ?? 0);
    final positionMs = (ctrl?.value.position.inMilliseconds ?? 0);
    final progress = durationMs > 0
        ? (positionMs / durationMs).clamp(0.0, 1.0)
        : 0.0;

    final baseColor = isMe ? Colors.white : context.colors.accent;
    final mutedColor = isMe
        ? Colors.white.withValues(alpha: 0.35)
        : context.colors.textSecondary.withValues(alpha: 0.35);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isMe
            ? Colors.white.withValues(alpha: 0.15)
            : context.colors.surface,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: (_loading || _failed) ? null : _togglePlay,
            child: Icon(
              _loading
                  ? Icons.hourglass_empty_rounded
                  : _failed
                  ? Icons.error_outline_rounded
                  : (ctrl?.value.isPlaying == true
                        ? Icons.pause_circle_filled_rounded
                        : Icons.play_circle_fill_rounded),
              color: _failed ? Colors.redAccent : baseColor,
              size: 28,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SizedBox(
              height: 26,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: List.generate(_waveformBins.length, (index) {
                  final normalized = index / (_waveformBins.length - 1);
                  final barHeight = 4.0 + (_waveformBins[index] * 15.0);
                  final active = normalized <= progress;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 0.7),
                      child: Container(
                        height: barHeight.clamp(4.0, 20.0),
                        decoration: BoxDecoration(
                          color: active ? baseColor : mutedColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Venture sharing card inside message bubbles ─────────────────
class _VentureCard extends StatelessWidget {
  final String name;
  final Map<String, dynamic>? ventureData;
  final bool isMe;

  const _VentureCard({
    required this.name,
    required this.ventureData,
    required this.isMe,
  });

  String? _resolveLogoUrl(String? raw) {
    return AppConstants.normalizeMediaUrl(raw);
  }

  static Uri? _externalUri(String? raw) {
    if (raw == null || raw.trim().isEmpty) return null;
    final trimmed = raw.trim();
    Uri? uri = Uri.tryParse(trimmed);
    if (uri == null || uri.scheme.isEmpty) {
      uri = Uri.tryParse('https://$trimmed');
    }
    return uri;
  }

  void _openVentureDetails(BuildContext context) async {
    final id = ventureData?['id'];
    if (id == null) return;

    Map<String, dynamic>? fullVenture;
    try {
      fullVenture = await ApiService.instance.getVentureById(
        int.tryParse('$id') ?? 0,
      );
    } catch (_) {
      fullVenture = ventureData;
    }

    if (fullVenture == null || !context.mounted) return;

    _showVentureDetailSheet(context, fullVenture);
  }

  static void _showVentureDetailSheet(
    BuildContext context,
    Map<String, dynamic> venture,
  ) {
    final name = (venture['name'] as String? ?? 'Venture').trim();
    final tagline = (venture['tagline'] as String? ?? '').trim();
    final stage = (venture['stage'] as String? ?? '').trim();
    final industry = (venture['industry'] as String? ?? '').trim();
    final description = (venture['description'] as String? ?? '').trim();
    final problem = (venture['problem_statement'] as String? ?? '').trim();
    final solution = (venture['solution'] as String? ?? '').trim();
    final market = (venture['target_market'] as String? ?? '').trim();
    final pitchDeckUrl = (venture['pitch_deck_url'] as String? ?? '').trim();
    final demoVideoUrl = (venture['demo_video_url'] as String? ?? '').trim();
    final logoUrl = (venture['logo_url'] as String? ?? '').trim();
    final resolvedLogo = AppConstants.normalizeMediaUrl(logoUrl);
    final resolvedDemoVideoUrl = AppConstants.normalizeMediaUrl(demoVideoUrl);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.65,
        maxChildSize: 0.92,
        builder: (ctx, scrollCtrl) => ListView(
          controller: scrollCtrl,
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: context.colors.divider,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            // Logo + name
            Row(
              children: [
                if (resolvedLogo != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.network(
                      resolvedLogo,
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          _letterAvatar(context, name),
                    ),
                  )
                else
                  _letterAvatar(context, name),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: TextStyle(
                          color: context.colors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                        ),
                      ),
                      if (tagline.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          tagline,
                          style: TextStyle(
                            color: context.colors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Stage & Industry chips
            if (stage.isNotEmpty || industry.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  if (stage.isNotEmpty) _infoChip(context, stage),
                  if (industry.isNotEmpty) _infoChip(context, industry),
                ],
              ),
            if (description.isNotEmpty) ...[
              const SizedBox(height: 16),
              _sectionTitle(context, 'About'),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ],
            if (problem.isNotEmpty) ...[
              const SizedBox(height: 14),
              _sectionTitle(context, 'Problem'),
              const SizedBox(height: 4),
              Text(
                problem,
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontSize: 13,
                ),
              ),
            ],
            if (solution.isNotEmpty) ...[
              const SizedBox(height: 14),
              _sectionTitle(context, 'Solution'),
              const SizedBox(height: 4),
              Text(
                solution,
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontSize: 13,
                ),
              ),
            ],
            if (market.isNotEmpty) ...[
              const SizedBox(height: 14),
              _sectionTitle(context, 'Target Market'),
              const SizedBox(height: 4),
              Text(
                market,
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontSize: 13,
                ),
              ),
            ],
            if (pitchDeckUrl.isNotEmpty ||
                (resolvedDemoVideoUrl ?? '').isNotEmpty) ...[
              const SizedBox(height: 16),
              _sectionTitle(context, 'Pitch Assets'),
              const SizedBox(height: 8),
              if (pitchDeckUrl.isNotEmpty)
                OutlinedButton.icon(
                  onPressed: () async {
                    final uri = _externalUri(pitchDeckUrl);
                    if (uri == null || !await canLaunchUrl(uri)) {
                      if (!ctx.mounted) return;
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        const SnackBar(
                          content: Text('Unable to open pitch deck link'),
                        ),
                      );
                      return;
                    }
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  },
                  icon: const Icon(Icons.slideshow_rounded, size: 16),
                  label: const Text('View Pitch Deck'),
                ),
              if ((resolvedDemoVideoUrl ?? '').isNotEmpty)
                OutlinedButton.icon(
                  onPressed: () async {
                    await Navigator.of(ctx).push(
                      MaterialPageRoute(
                        builder: (_) => InAppVideoPlayerScreen(
                          videoUrl: resolvedDemoVideoUrl!,
                          title: '$name Demo Video',
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.play_circle_fill_rounded, size: 16),
                  label: const Text('Play Demo Video'),
                ),
            ],
          ],
        ),
      ),
    );
  }

  static Widget _letterAvatar(BuildContext context, String name) {
    return CircleAvatar(
      radius: 24,
      backgroundColor: context.colors.accent.withValues(alpha: 0.12),
      child: Text(
        name.isEmpty ? 'V' : name[0].toUpperCase(),
        style: TextStyle(
          color: context.colors.accent,
          fontWeight: FontWeight.w700,
          fontSize: 18,
        ),
      ),
    );
  }

  static Widget _infoChip(BuildContext context, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: context.colors.accent.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: context.colors.accent,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  static Widget _sectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: TextStyle(
        color: context.colors.textSecondary,
        fontWeight: FontWeight.w700,
        fontSize: 12,
        letterSpacing: 0.5,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tagline = (ventureData?['tagline'] as String? ?? '').trim();
    final logoRaw = ventureData?['logo_url'] as String?;
    final logoUrl = _resolveLogoUrl(logoRaw);
    final hasId = ventureData?['id'] != null;

    return GestureDetector(
      onTap: hasId ? () => _openVentureDetails(context) : null,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isMe
              ? Colors.white.withValues(alpha: 0.15)
              : context.colors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isMe
                ? Colors.white.withValues(alpha: 0.2)
                : context.colors.cardBorder,
          ),
        ),
        child: Row(
          children: [
            // Logo / letter avatar
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: logoUrl != null
                  ? Image.network(
                      logoUrl,
                      width: 40,
                      height: 40,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _smallLetterAvatar(context),
                    )
                  : _smallLetterAvatar(context),
            ),
            const SizedBox(width: 10),
            // Name + tagline
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: isMe ? Colors.white : context.colors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  if (tagline.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      tagline,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: isMe
                            ? Colors.white.withValues(alpha: 0.75)
                            : context.colors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            // Arrow icon — tap to view details
            if (hasId) ...[
              const SizedBox(width: 6),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 14,
                color: isMe
                    ? Colors.white.withValues(alpha: 0.7)
                    : context.colors.textSecondary,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _smallLetterAvatar(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: context.colors.accent.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      child: Text(
        name.isEmpty ? 'V' : name[0].toUpperCase(),
        style: TextStyle(
          color: context.colors.accent,
          fontWeight: FontWeight.w700,
          fontSize: 16,
        ),
      ),
    );
  }
}

// ─── Chat Info & Settings Bottom Sheet ───────────────────────────
class _ChatInfoSheet extends StatefulWidget {
  final String name;
  final String? avatarUrl;
  final String initials;
  final bool isOnline;
  final String role;
  final String phone;
  final List<Map<String, dynamic>> sharedFiles;
  final List<Map<String, dynamic>> sharedMedia;
  final String userId;

  const _ChatInfoSheet({
    required this.name,
    required this.avatarUrl,
    required this.initials,
    required this.isOnline,
    required this.role,
    required this.phone,
    required this.sharedFiles,
    required this.sharedMedia,
    required this.userId,
  });

  @override
  State<_ChatInfoSheet> createState() => _ChatInfoSheetState();
}

class _ChatInfoSheetState extends State<_ChatInfoSheet>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return '';
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[dt.month - 1]} ${dt.day}';
  }

  Future<void> _openUrl(String url) async {
    if (url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.45,
      maxChildSize: 0.95,
      builder: (ctx, scrollCtrl) => Container(
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Drag handle
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 8),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: context.colors.divider,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            // Header – Back to Chat
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Row(
                      children: [
                        Icon(
                          Icons.arrow_back_ios_rounded,
                          size: 18,
                          color: context.colors.accent,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Back to Chat',
                          style: TextStyle(
                            color: context.colors.accent,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  const SizedBox(height: 12),
                  // ── Contact Card ──
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: context.colors.card,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.colors.cardBorder),
                    ),
                    child: Column(
                      children: [
                        // Avatar with online dot
                        Stack(
                          children: [
                            CircleAvatar(
                              radius: 42,
                              backgroundColor: context.colors.accent.withValues(
                                alpha: 0.15,
                              ),
                              backgroundImage: widget.avatarUrl != null
                                  ? NetworkImage(widget.avatarUrl!)
                                  : null,
                              child: widget.avatarUrl == null
                                  ? Text(
                                      widget.initials,
                                      style: TextStyle(
                                        color: context.colors.accent,
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    )
                                  : null,
                            ),
                            if (widget.isOnline)
                              Positioned(
                                bottom: 2,
                                right: 2,
                                child: Container(
                                  width: 16,
                                  height: 16,
                                  decoration: BoxDecoration(
                                    color: Colors.green,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: context.colors.surface,
                                      width: 3,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Name
                        Text(
                          widget.name,
                          style: TextStyle(
                            color: context.colors.textPrimary,
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 4),
                        // Role
                        Text(
                          widget.role,
                          style: TextStyle(
                            color: context.colors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Online badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: widget.isOnline
                                ? Colors.green.withValues(alpha: 0.15)
                                : Colors.grey.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            widget.isOnline ? 'Online' : 'Offline',
                            style: TextStyle(
                              color: widget.isOnline
                                  ? Colors.green
                                  : Colors.grey,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        if (widget.phone.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.phone_outlined,
                                size: 14,
                                color: context.colors.textSecondary,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                widget.phone,
                                style: TextStyle(
                                  color: context.colors.textSecondary,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Shared Media & Documents Tabs ──
                  Container(
                    decoration: BoxDecoration(
                      color: context.colors.card,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.colors.cardBorder),
                    ),
                    child: Column(
                      children: [
                        TabBar(
                          controller: _tabCtrl,
                          indicatorColor: context.colors.accent,
                          labelColor: context.colors.accent,
                          unselectedLabelColor: context.colors.textSecondary,
                          indicatorSize: TabBarIndicatorSize.tab,
                          tabs: [
                            Tab(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.description_outlined, size: 16),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Documents',
                                    style: TextStyle(fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                            Tab(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.image_outlined, size: 16),
                                  const SizedBox(width: 6),
                                  Text('Media', style: TextStyle(fontSize: 13)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        SizedBox(
                          height: _tabContentHeight(),
                          child: TabBarView(
                            controller: _tabCtrl,
                            children: [
                              // Documents tab
                              _buildDocumentsTab(),
                              // Media tab
                              _buildMediaTab(),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Action Buttons ──
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.pop(context);
                            // Navigate to user profile
                            context.push('/profile/${widget.userId}');
                          },
                          icon: Icon(
                            Icons.person_outline,
                            size: 18,
                            color: context.colors.accent,
                          ),
                          label: Text(
                            'View Profile',
                            style: TextStyle(
                              color: context.colors.accent,
                              fontSize: 13,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: context.colors.accent.withValues(
                                alpha: 0.4,
                              ),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.pop(context);
                            final uid = int.tryParse(widget.userId) ?? 0;
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => BookSessionSheet(
                                userId: uid,
                                userName: widget.name,
                              ),
                            );
                          },
                          icon: Icon(
                            Icons.calendar_today_outlined,
                            size: 18,
                            color: context.colors.accent,
                          ),
                          label: Text(
                            'Schedule',
                            style: TextStyle(
                              color: context.colors.accent,
                              fontSize: 13,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: context.colors.accent.withValues(
                                alpha: 0.4,
                              ),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  double _tabContentHeight() {
    final docCount = widget.sharedFiles.length;
    final mediaCount = widget.sharedMedia.length;
    final maxItems = docCount > mediaCount ? docCount : mediaCount;
    if (maxItems == 0) return 100;
    // Documents: ~64px per item. Media grid: ~rows of 3, ~120px per row.
    final docH = docCount * 64.0 + 16;
    final mediaRows = ((mediaCount + 2) / 3).ceil();
    final mediaH = mediaRows * 120.0 + 16;
    final max = docH > mediaH ? docH : mediaH;
    return max.clamp(100.0, 320.0);
  }

  Widget _buildDocumentsTab() {
    if (widget.sharedFiles.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.folder_open_outlined,
                size: 22,
                color: context.colors.textSecondary,
              ),
              const SizedBox(width: 8),
              Text(
                'No shared documents yet',
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: widget.sharedFiles.length,
      separatorBuilder: (_, __) => const SizedBox(height: 6),
      itemBuilder: (_, i) {
        final doc = widget.sharedFiles[i];
        return GestureDetector(
          onTap: () => _openUrl(doc['url'] ?? ''),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: context.colors.surface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: context.colors.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.description_outlined,
                    size: 18,
                    color: context.colors.accent,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doc['name'] ?? 'File',
                        style: TextStyle(
                          color: context.colors.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (_formatDate(doc['date']).isNotEmpty)
                        Text(
                          _formatDate(doc['date']),
                          style: TextStyle(
                            color: context.colors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                    ],
                  ),
                ),
                if ((doc['url'] ?? '').toString().isNotEmpty)
                  Icon(
                    Icons.download_outlined,
                    size: 18,
                    color: context.colors.textSecondary,
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMediaTab() {
    if (widget.sharedMedia.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.image_outlined,
                size: 22,
                color: context.colors.textSecondary,
              ),
              const SizedBox(width: 8),
              Text(
                'No shared media yet',
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.all(8),
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
        ),
        itemCount: widget.sharedMedia.length,
        itemBuilder: (_, i) {
          final media = widget.sharedMedia[i];
          return GestureDetector(
            onTap: () => _openUrl(media['url'] ?? ''),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    media['url'],
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: context.colors.surface,
                      child: Icon(
                        Icons.broken_image_outlined,
                        color: context.colors.textSecondary,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 2,
                    right: 2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        _formatDate(media['date']),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _InputBar extends StatelessWidget {
  final TextEditingController ctrl;
  final VoidCallback onSend;
  final VoidCallback onAttach;
  final VoidCallback onRecordVoice;
  final bool hasAttachment;
  final bool sending;
  final bool recordingVoiceNote;
  const _InputBar({
    required this.ctrl,
    required this.onSend,
    required this.onAttach,
    required this.onRecordVoice,
    required this.hasAttachment,
    required this.sending,
    required this.recordingVoiceNote,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(0, 6, 0, 0),
      decoration: BoxDecoration(
        color: context.colors.card,
        border: Border(
          top: BorderSide(color: context.colors.cardBorder, width: 0.5),
        ),
      ),
      child: SafeArea(
        top: false,
        child: ValueListenableBuilder<TextEditingValue>(
          valueListenable: ctrl,
          builder: (_, value, __) {
            final hasText = value.text.trim().isNotEmpty;
            final canSend = hasText || hasAttachment;

            return Padding(
              padding: const EdgeInsets.fromLTRB(6, 0, 6, 6),
              child: Row(
                children: [
                  const SizedBox(width: 4),
                  Expanded(
                    child: TextField(
                      controller: ctrl,
                      onSubmitted: (_) {
                        if (canSend && !sending) {
                          onSend();
                        }
                      },
                      style: TextStyle(color: context.colors.textPrimary),
                      decoration: InputDecoration(
                        hintText: 'Message',
                        hintStyle: TextStyle(
                          color: context.colors.textSecondary.withValues(
                            alpha: 0.7,
                          ),
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      Icons.attach_file_rounded,
                      color: context.colors.textSecondary,
                    ),
                    onPressed: onAttach,
                    tooltip: 'Attach',
                    visualDensity: VisualDensity.compact,
                  ),
                  GestureDetector(
                    onTap: sending ? null : (canSend ? onSend : onRecordVoice),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: recordingVoiceNote
                            ? Colors.redAccent
                            : context.colors.accent,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        canSend
                            ? Icons.send_rounded
                            : (recordingVoiceNote
                                  ? Icons.stop_rounded
                                  : Icons.mic_rounded),
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 2),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

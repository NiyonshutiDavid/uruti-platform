import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_constants.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/call_provider.dart';
import '../../services/api_service.dart';
import '../../services/realtime_service.dart';

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
  StreamSubscription<Map<String, dynamic>>? _realtimeSub;

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

    final token = (context.read<AuthProvider>().token ?? '').trim();
    if (token.isNotEmpty) {
      RealtimeService.instance.connect(token);
    }
  }

  @override
  void dispose() {
    _realtimeSub?.cancel();
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  String _asText(dynamic value) {
    if (value == null) return '';
    return value.toString().trim();
  }

  String? _safeAvatarUrl(dynamic raw) {
    final text = _asText(raw);
    if (text.isEmpty) return null;
    final uri = Uri.tryParse(text);
    if (uri == null) return null;
    if (uri.hasScheme && (uri.path.isEmpty || uri.path == '/')) return null;
    return text;
  }

  void _handleRealtimeEvent(Map<String, dynamic> event) {
    if (!mounted || event['event'] != 'message_created') return;

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

      final userMap = {
        'full_name': connectionName ?? profileName,
        'avatar_url':
            _safeAvatarUrl(fromConnection?['avatar_url']) ??
            _safeAvatarUrl(fromConnection?['avatar']) ??
            _safeAvatarUrl(profile.resolvedAvatarUrl),
        'phone': _asText(profile.phone),
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
        type: FileType.custom,
        allowedExtensions: ['txt', 'pdf', 'md', 'json', 'csv', 'doc', 'docx'],
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
                leading: const Icon(
                  Icons.attach_file_rounded,
                  color: AppColors.primary,
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
                leading: const Icon(
                  Icons.business_center_outlined,
                  color: AppColors.primary,
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
                              backgroundColor: AppColors.primary.withValues(
                                alpha: 0.12,
                              ),
                              child: Text(
                                name.isEmpty ? 'V' : name[0].toUpperCase(),
                                style: const TextStyle(
                                  color: AppColors.primary,
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
                                ? const Icon(
                                    Icons.check_circle_rounded,
                                    color: AppColors.primary,
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
      final startupName = (_activeContext!['name'] as String? ?? 'Venture')
          .trim();
      parts.add('🏷 Startup: $startupName');
    }
    return parts.join('\n');
  }

  bool _hasPendingAttachments() {
    return _attachedFileName != null || _activeContext != null;
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
    final name = _asText(_otherUser?['full_name']).isNotEmpty
        ? _asText(_otherUser?['full_name'])
        : 'Chat';
    final avatar = _safeAvatarUrl(_otherUser?['avatar_url']);
    final initials = name.split(' ').map((p) => p[0]).take(2).join();

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.surface,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: context.colors.textPrimary),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/inbox'),
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: context.colors.darkGreenMid,
              backgroundImage: avatar != null ? NetworkImage(avatar) : null,
              child: avatar == null
                  ? Text(
                      initials,
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  _activeCallType == null
                      ? 'Online'
                      : calls.isOutgoing
                      ? '${_activeCallType == 'video' ? 'Video' : 'Voice'} call • Waiting...'
                      : '${_activeCallType == 'video' ? 'Video' : 'Voice'} call • ${_formatDuration(calls.activeDuration)}',
                  style: TextStyle(color: AppColors.primary, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.phone_outlined, color: context.colors.textPrimary),
            onPressed: _startVoiceCall,
          ),
          IconButton(
            icon: Icon(
              Icons.videocam_outlined,
              color: context.colors.textPrimary,
            ),
            onPressed: _startVideoCall,
          ),
          if (_activeCallType != null)
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
                      backgroundColor: AppColors.primary.withValues(
                        alpha: 0.12,
                      ),
                      side: BorderSide(
                        color: AppColors.primary.withValues(alpha: 0.35),
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
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (_, i) {
                      final msg = _messages[i];
                      final isMe = msg['sender_id'] == me.id;
                      if (msg['kind'] == 'call_event') {
                        return _CallSummaryBubble(msg: msg);
                      }
                      return _MessageBubble(msg: msg, isMe: isMe);
                    },
                  ),
          ),
          _InputBar(
            ctrl: _ctrl,
            onSend: _send,
            onAttach: _openComposerActions,
            hasAttachment: _hasPendingAttachments(),
            sending: _sending,
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
      color = AppColors.primary;
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
    final startup = startupMatch?.group(1)?.trim();

    final cleaned = raw
        .replaceAll(_ChatDetailScreenState._fileTagRegex, '')
        .replaceAll(_ChatDetailScreenState._startupTagRegex, '')
        .replaceAll(RegExp(r'\n{3,}'), '\n\n')
        .trim();

    return _ParsedBody(text: cleaned, fileName: fileName, startupName: startup);
  }

  List<String> _attachmentUrls() {
    final raw = msg['attachments'];
    if (raw is List) {
      return raw
          .map((e) => e.toString().trim())
          .where((e) => e.isNotEmpty)
          .toList();
    }
    return const [];
  }

  String _resolvedUrl(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return '${AppConstants.apiBaseUrl}$url';
  }

  Future<void> _openAttachment(BuildContext context, String url) async {
    final target = Uri.parse(_resolvedUrl(url));
    final ok = await launchUrl(target, mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open attachment.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final content =
        (msg['body'] as String?) ?? (msg['content'] as String?) ?? '';
    final parsed = _parseBody(content);
    final time = _formatTime(msg['created_at'] as String?);
    final isRead = (msg['is_read'] as bool?) ?? false;
    final attachments = _attachmentUrls();

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.72,
        ),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : context.colors.card,
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
                child: GestureDetector(
                  onTap: () => _openAttachment(context, attachments.first),
                  child: Container(
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
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.download_rounded,
                          size: 14,
                          color: isMe
                              ? Colors.white
                              : context.colors.textSecondary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Download file',
                          style: TextStyle(
                            color: isMe
                                ? Colors.white
                                : context.colors.textPrimary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            if (parsed.startupName != null)
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
                      Icons.business_center_outlined,
                      size: 14,
                      color: isMe ? Colors.white : context.colors.textSecondary,
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        parsed.startupName!,
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

  const _ParsedBody({
    required this.text,
    required this.fileName,
    required this.startupName,
  });
}

class _InputBar extends StatelessWidget {
  final TextEditingController ctrl;
  final VoidCallback onSend;
  final VoidCallback onAttach;
  final bool hasAttachment;
  final bool sending;
  const _InputBar({
    required this.ctrl,
    required this.onSend,
    required this.onAttach,
    required this.hasAttachment,
    required this.sending,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
      color: Colors.transparent,
      child: SafeArea(
        top: false,
        child: ValueListenableBuilder<TextEditingValue>(
          valueListenable: ctrl,
          builder: (_, value, __) {
            final hasText = value.text.trim().isNotEmpty;
            final canSend = hasText || hasAttachment;

            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: context.colors.cardBorder),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 8),
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
                  ),
                  GestureDetector(
                    onTap: canSend && !sending ? onSend : null,
                    child: Container(
                      margin: const EdgeInsets.only(right: 4),
                      width: 46,
                      height: 46,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        canSend ? Icons.send_rounded : Icons.mic_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

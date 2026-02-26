import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import '../../core/app_colors.dart';
import '../../services/api_service.dart';
import '../main_scaffold.dart';

const _kModels = [
  (id: 'uruti-ai', label: 'Uruti AI', icon: Icons.smart_toy_outlined),
  (id: 'gpt-4', label: 'GPT-4', icon: Icons.psychology_outlined),
  (id: 'gpt-3.5-turbo', label: 'GPT-3.5', icon: Icons.psychology_alt_outlined),
];

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final TextEditingController _msgCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  final stt.SpeechToText _speech = stt.SpeechToText();

  bool _loading = false;
  bool _speechReady = false;
  bool _isListening = false;
  String? _sessionId;
  String _selectedModel = 'uruti-ai';
  List<Map<String, dynamic>> _myVentures = [];
  Map<String, dynamic>? _activeContext;
  String? _attachedFileName;
  String? _attachedFileContent;
  final List<Map<String, dynamic>> _messages = [];

  static const _quickActions = [
    'Help me refine my startup idea',
    'Analyze the market for my startup',
    'Help me create a go-to-market strategy',
    'Who should be my target customers?',
    'What revenue model would work best?',
  ];

  @override
  void initState() {
    super.initState();
    _loadVentures();
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send([String? prompt]) async {
    final text = (prompt ?? _msgCtrl.text).trim();
    if (text.isEmpty || _loading) return;

    final fileName = _attachedFileName;
    final fileContent = _attachedFileContent;

    _msgCtrl.clear();
    setState(() {
      _messages.add({
        'role': 'user',
        'content': text,
        'file_name': fileName,
        'has_attachment': fileName != null,
      });
      _loading = true;
      _attachedFileName = null;
      _attachedFileContent = null;
    });
    _scrollToBottom();

    try {
      final contextPayload = _activeContext != null
          ? {
              'name': _activeContext!['name'] ?? '',
              'description': _activeContext!['description'] ?? '',
              'stage': _activeContext!['stage'] ?? '',
              'industry': _activeContext!['industry'] ?? '',
              'problem_statement': _activeContext!['problem_statement'] ?? '',
              'solution': _activeContext!['solution'] ?? '',
              'target_market': _activeContext!['target_market'] ?? '',
              'business_model': _activeContext!['business_model'] ?? '',
            }
          : null;

      final resp = await ApiService.instance.sendAiMessage(
        text,
        sessionId: _sessionId,
        model: _selectedModel,
        startupContext: contextPayload,
        fileName: fileName,
        fileContent: fileContent,
      );

      if (!mounted) return;
      setState(() {
        _sessionId ??= resp['session_id'] as String?;
        _messages.add({
          'role': 'assistant',
          'content': (resp['message'] ?? 'No response').toString(),
        });
        _loading = false;
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
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

  String get _modelLabel {
    try {
      return _kModels.firstWhere((m) => m.id == _selectedModel).label;
    } catch (_) {
      return 'Uruti AI';
    }
  }

  bool get _hasDraftText => _msgCtrl.text.trim().isNotEmpty;

  bool get _showRecordAction => !_hasDraftText && _attachedFileName == null;

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['txt', 'pdf', 'md', 'json', 'csv', 'doc', 'docx'],
        withData: true,
      );
      if (result == null || result.files.isEmpty) return;
      final file = result.files.first;

      String? content;
      if (file.bytes != null) {
        try {
          content = utf8.decode(file.bytes!);
        } catch (_) {
          content = '[Binary file — contents not readable as text]';
        }
      }

      if (!mounted) return;
      setState(() {
        _attachedFileName = file.name;
        _attachedFileContent = content;
      });

      if (_isListening) {
        await _speech.stop();
        if (mounted) setState(() => _isListening = false);
      }
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
                  'Choose venture context',
                  style: TextStyle(color: context.colors.textPrimary),
                ),
                subtitle: Text(
                  'Attach one of your ventures',
                  style: TextStyle(color: context.colors.textSecondary),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _openContextPicker();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openModelPicker() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
            const SizedBox(height: 18),
            Text(
              'Select AI Model',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 12),
            ..._kModels.map((m) {
              final selected = m.id == _selectedModel;
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  m.icon,
                  color: selected
                      ? AppColors.primary
                      : context.colors.textSecondary,
                ),
                title: Text(
                  m.label,
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
                trailing: selected
                    ? const Icon(
                        Icons.check_circle_rounded,
                        color: AppColors.primary,
                      )
                    : null,
                onTap: () {
                  setState(() => _selectedModel = m.id);
                  Navigator.pop(context);
                },
              );
            }),
          ],
        ),
      ),
    );
  }

  void _openContextPicker() {
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
                'Attach one of your ventures for tailored answers.',
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
                    'Remove attached context',
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
                          'No ventures found.\nCreate a venture to use startup context.',
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
                          final v = _myVentures[i];
                          final active =
                              _activeContext != null &&
                              _activeContext!['id'] == v['id'];
                          final name = (v['name'] as String? ?? 'Venture')
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
                              (v['stage'] as String? ??
                                  v['industry'] as String? ??
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
                              setState(() => _activeContext = v);
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

  void _openRecordingInput() {
    _toggleSpeechInput();
  }

  Future<void> _toggleSpeechInput() async {
    if (_isListening) {
      await _speech.stop();
      if (mounted) setState(() => _isListening = false);
      return;
    }

    final micStatus = await Permission.microphone.request();
    if (!micStatus.isGranted) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Microphone permission is required for voice input.'),
        ),
      );
      return;
    }

    if (!_speechReady) {
      final available = await _speech.initialize(
        onStatus: (status) {
          if (!mounted) return;
          if (status == 'done' || status == 'notListening') {
            setState(() => _isListening = false);
          }
        },
        onError: (_) {
          if (!mounted) return;
          setState(() => _isListening = false);
        },
      );
      _speechReady = available;
    }

    if (!_speechReady) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Speech recognition is not available on this device.'),
        ),
      );
      return;
    }

    setState(() => _isListening = true);
    await _speech.listen(
      partialResults: true,
      listenMode: stt.ListenMode.confirmation,
      onResult: (result) {
        if (!mounted) return;
        setState(() {
          _msgCtrl.text = result.recognizedWords;
          _msgCtrl.selection = TextSelection.fromPosition(
            TextPosition(offset: _msgCtrl.text.length),
          );
        });
      },
    );
  }

  Future<void> _openHistory() async {
    final sessions = await ApiService.instance.getAiChatSessions();
    if (!mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) {
        if (sessions.isEmpty) {
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Text(
                'No chat history yet',
                style: TextStyle(color: context.colors.textSecondary),
              ),
            ),
          );
        }
        return ListView.separated(
          shrinkWrap: true,
          itemCount: sessions.length,
          separatorBuilder: (_, __) => Divider(color: context.colors.divider),
          itemBuilder: (_, i) {
            final s = sessions[i] as Map<String, dynamic>;
            final sid = (s['session_id'] ?? '').toString();
            final first = (s['first_message'] ?? 'Conversation').toString();
            return ListTile(
              title: Text(
                first,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: context.colors.textPrimary),
              ),
              subtitle: Text(
                'Messages: ${s['message_count'] ?? 0}',
                style: TextStyle(color: context.colors.textSecondary),
              ),
              onTap: () async {
                Navigator.pop(context);
                final msgs = await ApiService.instance.getAiChatSession(sid);
                if (!mounted) return;
                setState(() {
                  _sessionId = sid;
                  _messages
                    ..clear()
                    ..addAll(List<Map<String, dynamic>>.from(msgs));
                });
                _scrollToBottom();
              },
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.smart_toy_outlined,
                color: AppColors.primary,
                size: 18,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: _openModelPicker,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Uruti AI Chat',
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _modelLabel,
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Icon(
                          Icons.arrow_drop_down_rounded,
                          color: AppColors.primary,
                          size: 16,
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
          IconButton(
            icon: Icon(
              Icons.history_rounded,
              color: context.colors.textSecondary,
            ),
            onPressed: _openHistory,
          ),
          IconButton(
            icon: Icon(Icons.add_rounded, color: context.colors.textSecondary),
            onPressed: () => setState(() {
              _sessionId = null;
              _messages.clear();
              _attachedFileName = null;
              _attachedFileContent = null;
            }),
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
                        'Context: ${_activeContext!['name'] ?? 'Venture'}',
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
                        _attachedFileContent = null;
                      }),
                    ),
                ],
              ),
            ),
          Expanded(
            child: _messages.isEmpty
                ? ListView(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                    children: [
                      Text(
                        'Try asking:',
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _quickActions
                            .map(
                              (p) => ActionChip(
                                label: Text(
                                  p,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                labelStyle: TextStyle(
                                  color: context.colors.textSecondary,
                                  fontSize: 12,
                                ),
                                backgroundColor: context.colors.surface,
                                shape: StadiumBorder(
                                  side: BorderSide(
                                    color: context.colors.cardBorder,
                                  ),
                                ),
                                onPressed: () => _send(p),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                  )
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                    itemCount: _messages.length + (_loading ? 1 : 0),
                    itemBuilder: (_, i) {
                      if (i >= _messages.length) {
                        return const Padding(
                          padding: EdgeInsets.all(8),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: AppColors.primary,
                            ),
                          ),
                        );
                      }
                      final m = _messages[i];
                      final isUser = (m['role'] ?? '') == 'user';
                      return Align(
                        alignment: isUser
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          constraints: const BoxConstraints(maxWidth: 320),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: isUser
                                ? AppColors.primary.withValues(alpha: 0.18)
                                : context.colors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: context.colors.cardBorder,
                            ),
                          ),
                          child: Text(
                            (m['content'] ?? '').toString(),
                            style: TextStyle(
                              color: context.colors.textPrimary,
                              height: 1.3,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Container(
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: context.colors.cardBorder),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                child: Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: context.colors.background,
                        border: Border.all(color: context.colors.cardBorder),
                      ),
                      child: IconButton(
                        tooltip: 'More actions',
                        padding: EdgeInsets.zero,
                        icon: Icon(
                          Icons.add_rounded,
                          color: context.colors.textSecondary,
                          size: 20,
                        ),
                        onPressed: _openComposerActions,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _msgCtrl,
                        style: TextStyle(color: context.colors.textPrimary),
                        decoration: InputDecoration(
                          hintText: 'Ask Uruti AI...',
                          hintStyle: TextStyle(color: context.colors.textMuted),
                          isDense: true,
                          border: InputBorder.none,
                        ),
                        onChanged: (value) async {
                          if (_isListening && value.trim().isNotEmpty) {
                            await _speech.stop();
                            if (!mounted) return;
                            setState(() => _isListening = false);
                            return;
                          }
                          if (mounted) setState(() {});
                        },
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                    const SizedBox(width: 4),
                    if (_showRecordAction)
                      IconButton(
                        tooltip: 'Record input',
                        icon: Icon(
                          _isListening
                              ? Icons.mic_rounded
                              : Icons.mic_none_rounded,
                          color: _isListening
                              ? AppColors.primary
                              : context.colors.textSecondary,
                        ),
                        onPressed: _openRecordingInput,
                      )
                    else
                      SizedBox(
                        width: 34,
                        height: 34,
                        child: IconButton(
                          tooltip: 'Send',
                          style: IconButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: const CircleBorder(),
                            padding: EdgeInsets.zero,
                          ),
                          onPressed: (_loading || !_hasDraftText)
                              ? null
                              : _send,
                          icon: const Icon(
                            Icons.send_rounded,
                            color: Colors.black,
                            size: 18,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

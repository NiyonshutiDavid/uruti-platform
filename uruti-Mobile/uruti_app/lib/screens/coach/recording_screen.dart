import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

import '../../core/app_colors.dart';
import '../../services/api_service.dart';

class RecordingScreen extends StatefulWidget {
  const RecordingScreen({super.key});
  @override
  State<RecordingScreen> createState() => _RecordingScreenState();
}

class _RecordingScreenState extends State<RecordingScreen>
    with TickerProviderStateMixin {
  bool _recording = false;
  bool _muted = false;
  bool _cameraOn = true;
  bool _presentationStarted = false;
  bool _camPermitted = false;
  bool _micPermitted = false;
  bool _uploading = false;
  bool _cameraReady = false;
  bool _fullscreen = false;
  bool _hasShownFullscreenHint = false;
  bool _sessionComplete = false;
  String? _recordedFilePath;
  int _recordedDurationSeconds = 0;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulse;
  int _seconds = 0;
  Timer? _timer;

  CameraController? _cameraController;
  CameraDescription? _selectedCamera;
  final PdfViewerController _pdfController = PdfViewerController();
  List<Map<String, dynamic>> _ventures = [];
  int? _selectedVentureId;
  String _pitchType = 'Investor Pitch';
  int _targetMinutes = 5;
  String? _deckFilePath;
  String? _deckFileName;
  int _deckCurrentPage = 1;
  int _deckTotalPages = 1;
  final List<Map<String, dynamic>> _slideTransitions = [];

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _pulse = Tween(
      begin: 0.9,
      end: 1.1,
    ).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _initialize();
  }

  Future<void> _initialize() async {
    await _requestPermissions();
    await _loadVentures();
    await _initializeCamera();
  }

  Future<void> _requestPermissions() async {
    final cam = await Permission.camera.request();
    final mic = await Permission.microphone.request();
    if (mounted) {
      setState(() {
        _camPermitted = cam.isGranted;
        _micPermitted = mic.isGranted;
      });
    }
  }

  Future<void> _loadVentures() async {
    final ventures = await ApiService.instance.getMyVentures();
    if (!mounted) return;
    setState(() {
      _ventures = List<Map<String, dynamic>>.from(ventures);
      _selectedVentureId = _ventures.isNotEmpty
          ? int.tryParse('${_ventures.first['id']}')
          : null;
    });
  }

  Future<void> _initializeCamera() async {
    if (!_camPermitted) return;
    try {
      final cams = await availableCameras();
      if (cams.isEmpty) return;
      _selectedCamera = cams.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
        orElse: () => cams.first,
      );
      final controller = CameraController(
        _selectedCamera!,
        ResolutionPreset.high,
        enableAudio: true,
      );
      await controller.initialize();
      if (!mounted) return;
      setState(() {
        _cameraController = controller;
        _cameraReady = true;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to initialize camera: $e')),
      );
    }
  }

  Future<void> _pickPitchDeck() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'ppt', 'pptx'],
      );
      if (result == null || result.files.isEmpty) return;
      final file = result.files.first;
      final path = file.path;
      if (path == null || path.isEmpty) return;

      if (!mounted) return;
      setState(() {
        _deckFilePath = path;
        _deckFileName = file.name;
        _presentationStarted = false;
        _deckCurrentPage = 1;
        _deckTotalPages = 1;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to pick pitch deck: $e')));
    }
  }

  Future<void> _toggleDeckPresentation() async {
    if (_deckFilePath == null) {
      await _pickPitchDeck();
      return;
    }

    if (!_isPdfDeck) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'PPT/PPTX selected. Convert to PDF to enable in-app slide navigation.',
          ),
        ),
      );
    }

    if (!mounted) return;
    setState(() => _presentationStarted = !_presentationStarted);
  }

  bool get _isPdfDeck {
    final path = _deckFilePath?.toLowerCase() ?? '';
    return path.endsWith('.pdf');
  }

  void _nextDeckPage() {
    if (_isPdfDeck && _deckCurrentPage < _deckTotalPages) {
      _trackSlideTransition(_deckCurrentPage + 1);
      _pdfController.nextPage();
    }
  }

  void _previousDeckPage() {
    if (_isPdfDeck && _deckCurrentPage > 1) {
      _trackSlideTransition(_deckCurrentPage - 1);
      _pdfController.previousPage();
    }
  }

  void _trackSlideTransition(int nextSlide) {
    if (!_recording) return;
    _slideTransitions.add({'slide': nextSlide, 'at_second': _seconds});
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _seconds++);
    });
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _toggleRecording() async {
    if (_recording) {
      await _stopRecording();
      return;
    }

    if (_selectedVentureId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a venture before recording.'),
        ),
      );
      return;
    }

    if (_cameraController == null || !_cameraReady || !_cameraOn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Camera must be on to start recording.')),
      );
      return;
    }

    try {
      _seconds = 0;
      _slideTransitions.clear();
      await _cameraController!.startVideoRecording();
      setState(() => _recording = true);
      _startTimer();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to start recording: $e')));
    }
  }

  Future<void> _stopRecording() async {
    if (_cameraController == null || !_recording) return;
    try {
      final file = await _cameraController!.stopVideoRecording();
      _stopTimer();
      if (!mounted) return;
      setState(() {
        _recording = false;
        _sessionComplete = true;
        _recordedFilePath = file.path;
        _recordedDurationSeconds = _seconds;
      });
    } catch (e) {
      _stopTimer();
      if (!mounted) return;
      setState(() => _recording = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to stop recording: $e')));
    }
  }

  Future<void> _uploadRecording(String filePath) async {
    if (_selectedVentureId == null) return;
    setState(() => _uploading = true);
    try {
      await ApiService.instance.uploadPitchVideo(
        _selectedVentureId!,
        filePath,
        pitchType: _pitchType,
        durationSeconds: _recordedDurationSeconds,
        targetDurationSeconds: _targetMinutes * 60,
        notes: _buildUploadNotes(),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pitch session saved successfully!')),
      );
      context.go('/pitch-performance');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to save pitch video: $e')));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _retryRecording() {
    setState(() {
      _sessionComplete = false;
      _recordedFilePath = null;
      _recordedDurationSeconds = 0;
      _seconds = 0;
      _slideTransitions.clear();
    });
  }

  String _buildUploadNotes() {
    final notes = <String>[
      'Recorded on mobile pitch coach.',
      if (_deckFileName != null) 'Deck: $_deckFileName',
      if (_slideTransitions.isNotEmpty)
        'Slide transitions: ${_slideTransitions.map((e) => '#${e['slide']}@${e['at_second']}s').join(', ')}',
    ];
    return notes.join('\n');
  }

  Future<void> _handleFullscreenTap() async {
    if (!_fullscreen && !_hasShownFullscreenHint) {
      final shouldEnter = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Best Fullscreen Experience'),
          content: const Text(
            'Fullscreen is recommended for better presenting. Your slides get more space while the portrait camera stays visible in a compact window.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Not now'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Go Fullscreen'),
            ),
          ],
        ),
      );

      if (shouldEnter != true) return;

      setState(() {
        _hasShownFullscreenHint = true;
        _fullscreen = true;
      });
      return;
    }

    setState(() => _fullscreen = !_fullscreen);
  }

  String get _time {
    final m = _seconds ~/ 60;
    final s = _seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _stopTimer();
    _cameraController?.dispose();
    _pdfController.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_sessionComplete) return _buildSessionResults(context);

    return Scaffold(
      backgroundColor: context.colors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header with recording indicator
            if (!_fullscreen)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: Icon(
                        Icons.close,
                        color: context.colors.textPrimary,
                      ),
                      onPressed: () => context.canPop()
                          ? context.pop()
                          : context.go('/coach'),
                    ),
                    Expanded(
                      child: Center(
                        child: AnimatedBuilder(
                          animation: _pulse,
                          builder: (_, __) => Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Transform.scale(
                                scale: _pulse.value,
                                child: Container(
                                  width: 10,
                                  height: 10,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFFF3B3B),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  _uploading
                                      ? 'Uploading...'
                                      : 'Listening...  $_time',
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: context.colors.textPrimary,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 48),
                  ],
                ),
              ),

            Expanded(
              child: _fullscreen
                  ? _buildFullscreenBody(context)
                  : SingleChildScrollView(
                      child: Column(
                        children: [
                          // Analysis bars
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Column(
                              children: [
                                _AnalysisBar(
                                  'Pacing',
                                  0.78,
                                  'Optimal',
                                  context.colors.accent,
                                ),
                                const SizedBox(height: 12),
                                _AnalysisBar(
                                  'Slide Sync',
                                  0.65,
                                  'On Track',
                                  context.colors.accent,
                                ),
                                const SizedBox(height: 12),
                                _AnalysisBar(
                                  'Confidence',
                                  0.55,
                                  'Good',
                                  const Color(0xFFFFB800),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 20),

                          // Real-time tip
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: context.colors.accent.withValues(
                                  alpha: 0.08,
                                ),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: context.colors.accent.withValues(
                                    alpha: 0.3,
                                  ),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: context.colors.accent.withValues(
                                        alpha: 0.15,
                                      ),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      Icons.lightbulb_outline,
                                      color: context.colors.accent,
                                      size: 18,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Real-time Tip',
                                          style: TextStyle(
                                            color: context.colors.accent,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          "Great pacing! Try to slow down slightly when describing your revenue model.",
                                          style: TextStyle(
                                            color: context.colors.textPrimary,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          const SizedBox(height: 14),

                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: context.colors.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: context.colors.divider,
                                ),
                              ),
                              child: Column(
                                children: [
                                  DropdownButtonFormField<int>(
                                    value: _selectedVentureId,
                                    items: _ventures
                                        .map(
                                          (v) => DropdownMenuItem<int>(
                                            value: int.tryParse('${v['id']}'),
                                            child: Text(
                                              (v['name'] as String?) ??
                                                  'Venture',
                                            ),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: _recording
                                        ? null
                                        : (value) => setState(
                                            () => _selectedVentureId = value,
                                          ),
                                    decoration: const InputDecoration(
                                      labelText: 'Current Venture',
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: DropdownButtonFormField<String>(
                                          value: _pitchType,
                                          items: const [
                                            DropdownMenuItem(
                                              value: 'Elevator Pitch',
                                              child: Text('Elevator Pitch'),
                                            ),
                                            DropdownMenuItem(
                                              value: 'Investor Pitch',
                                              child: Text('Investor Pitch'),
                                            ),
                                            DropdownMenuItem(
                                              value: 'Demo Day Pitch',
                                              child: Text('Demo Day Pitch'),
                                            ),
                                            DropdownMenuItem(
                                              value: 'Customer Pitch',
                                              child: Text('Customer Pitch'),
                                            ),
                                          ],
                                          onChanged: _recording
                                              ? null
                                              : (value) {
                                                  if (value != null) {
                                                    setState(
                                                      () => _pitchType = value,
                                                    );
                                                  }
                                                },
                                          decoration: const InputDecoration(
                                            labelText: 'Pitch Type',
                                            border: OutlineInputBorder(),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: DropdownButtonFormField<int>(
                                          value: _targetMinutes,
                                          items: const [1, 2, 3, 5, 7, 10]
                                              .map(
                                                (m) => DropdownMenuItem(
                                                  value: m,
                                                  child: Text('$m min'),
                                                ),
                                              )
                                              .toList(),
                                          onChanged: _recording
                                              ? null
                                              : (value) {
                                                  if (value != null) {
                                                    setState(
                                                      () => _targetMinutes =
                                                          value,
                                                    );
                                                  }
                                                },
                                          decoration: const InputDecoration(
                                            labelText: 'Target',
                                            border: OutlineInputBorder(),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),

                          const SizedBox(height: 14),

                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: _presentationStarted && _deckFilePath != null
                                ? _buildDeckPresentationView(context)
                                : _buildCameraView(context),
                          ),

                          const SizedBox(height: 20),
                        ],
                      ),
                    ),
            ),

            // Controls
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
              decoration: BoxDecoration(
                color: context.colors.surface,
                border: Border(top: BorderSide(color: context.colors.divider)),
              ),
              child: SafeArea(
                top: false,
                child: Wrap(
                  alignment: WrapAlignment.spaceAround,
                  spacing: 14,
                  runSpacing: 10,
                  children: [
                    _ctrl(
                      icon: _cameraOn ? Icons.videocam : Icons.videocam_off,
                      label: 'Camera',
                      active: _cameraOn && _camPermitted,
                      onTap: _recording
                          ? () {}
                          : () {
                              if (!_camPermitted) {
                                openAppSettings();
                              } else {
                                setState(() => _cameraOn = !_cameraOn);
                              }
                            },
                    ),
                    _ctrl(
                      icon: _muted ? Icons.mic_off : Icons.mic,
                      label: 'Mic',
                      active: !_muted && _micPermitted,
                      onTap: () {
                        if (!_micPermitted) {
                          openAppSettings();
                        } else {
                          setState(() => _muted = !_muted);
                        }
                      },
                    ),
                    GestureDetector(
                      onTap: _uploading ? null : _toggleRecording,
                      child: Column(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: _recording
                                  ? const Color(0xFFFF3B3B)
                                  : context.colors.accent,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              _recording
                                  ? Icons.stop
                                  : Icons.fiber_manual_record,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _recording ? 'Stop' : 'Record',
                            style: TextStyle(
                              color: _recording
                                  ? const Color(0xFFFF3B3B)
                                  : context.colors.accent,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _ctrl(
                      icon: _presentationStarted
                          ? Icons.slideshow_rounded
                          : Icons.picture_as_pdf_outlined,
                      label: _presentationStarted ? 'Presenting' : 'Pitch Deck',
                      active: _presentationStarted || _deckFilePath != null,
                      onTap: _toggleDeckPresentation,
                    ),
                    _ctrl(
                      icon: _fullscreen
                          ? Icons.fullscreen_exit_rounded
                          : Icons.fullscreen_rounded,
                      label: _fullscreen ? 'Exit Full' : 'Fullscreen',
                      active: _fullscreen,
                      onTap: _handleFullscreenTap,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionResults(BuildContext context) {
    final duration =
        '${(_recordedDurationSeconds ~/ 60).toString().padLeft(2, '0')}:${(_recordedDurationSeconds % 60).toString().padLeft(2, '0')}';
    final ventureName =
        _ventures
            .where((v) => int.tryParse('${v['id']}') == _selectedVentureId)
            .map((v) => v['name'] as String?)
            .firstOrNull ??
        'Venture';

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        title: const Text(
          'Session Results',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/coach'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Session summary card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.colors.divider),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: context.colors.accent.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.videocam,
                          color: context.colors.accent,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Session Complete',
                              style: TextStyle(
                                color: context.colors.textPrimary,
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$ventureName • $_pitchType',
                              style: TextStyle(
                                color: context.colors.textSecondary,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      _ResultChip(
                        Icons.timer_outlined,
                        'Duration',
                        duration,
                        context,
                      ),
                      const SizedBox(width: 10),
                      _ResultChip(
                        Icons.track_changes,
                        'Target',
                        '$_targetMinutes min',
                        context,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Overall Score
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1A3A0A), Color(0xFF0D2010)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: context.colors.accent.withValues(alpha: 0.3),
                ),
              ),
              child: Column(
                children: [
                  Text(
                    'Overall Score',
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '82',
                    style: TextStyle(
                      color: context.colors.accent,
                      fontSize: 64,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    'out of 100',
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _ScoreChip('Duration', duration),
                      const _ScoreChip('Words/min', '142'),
                      const _ScoreChip('Clarity', '91%'),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            _sectionTitle(context, 'Category Breakdown'),
            const SizedBox(height: 12),

            ...[
              ('Pacing', 0.78, context.colors.accent),
              ('Confidence', 0.72, const Color(0xFFFFB800)),
              ('Clarity', 0.91, const Color(0xFF3B82F6)),
              ('Content', 0.80, const Color(0xFFFF6B6B)),
              ('Engagement', 0.68, const Color(0xFF8B5CF6)),
            ].map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          e.$1,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '${(e.$2 * 100).toInt()}%',
                          style: TextStyle(
                            color: e.$3,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: e.$2,
                        backgroundColor: context.colors.divider,
                        color: e.$3,
                        minHeight: 8,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 8),
            _sectionTitle(context, 'AI Feedback'),
            const SizedBox(height: 12),

            ...[
              (
                Icons.check_circle,
                context.colors.accent,
                'Strong opening hook captured attention effectively.',
              ),
              (
                Icons.check_circle,
                context.colors.accent,
                'Market size data was compelling and well-sourced.',
              ),
              (
                Icons.warning_amber_rounded,
                const Color(0xFFFFB800),
                'Revenue projections could use more detail.',
              ),
              (
                Icons.warning_amber_rounded,
                const Color(0xFFFFB800),
                'Consider slowing down in the technical section.',
              ),
            ].map(
              (e) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: context.colors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.colors.divider),
                ),
                child: Row(
                  children: [
                    Icon(e.$1, color: e.$2, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        e.$3,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Retry and Save Video buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _uploading ? null : _retryRecording,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: context.colors.accent,
                      side: BorderSide(color: context.colors.accent),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _uploading || _recordedFilePath == null
                        ? null
                        : () => _uploadRecording(_recordedFilePath!),
                    icon: _uploading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.save),
                    label: Text(_uploading ? 'Saving...' : 'Save Video'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: context.colors.accent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => context.go('/pitch-performance'),
                icon: const Icon(Icons.play_circle_outline),
                label: const Text('View Pitch Recording'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: context.colors.accent,
                  side: BorderSide(color: context.colors.accent),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Align _sectionTitle(BuildContext context, String t) => Align(
    alignment: Alignment.centerLeft,
    child: Text(
      t,
      style: TextStyle(
        color: context.colors.textPrimary,
        fontWeight: FontWeight.w700,
        fontSize: 16,
      ),
    ),
  );

  Widget _ctrl({
    required IconData icon,
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: active
                  ? context.colors.accent.withValues(alpha: 0.15)
                  : context.colors.card,
              shape: BoxShape.circle,
              border: Border.all(
                color: active
                    ? context.colors.accent.withValues(alpha: 0.4)
                    : context.colors.divider,
              ),
            ),
            child: Icon(
              icon,
              color: active
                  ? context.colors.accent
                  : context.colors.textSecondary,
              size: 20,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildFullscreenBody(BuildContext context) {
    return Column(
      children: [
        // Fullscreen top bar — timer + exit
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Row(
            children: [
              IconButton(
                icon: Icon(Icons.close, color: context.colors.textPrimary),
                onPressed: () =>
                    context.canPop() ? context.pop() : context.go('/coach'),
              ),
              const Spacer(),
              AnimatedBuilder(
                animation: _pulse,
                builder: (_, __) => Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Transform.scale(
                      scale: _pulse.value,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Color(0xFFFF3B3B),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _time,
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              IconButton(
                icon: Icon(
                  Icons.fullscreen_exit_rounded,
                  color: context.colors.textPrimary,
                ),
                onPressed: () => setState(() => _fullscreen = false),
              ),
            ],
          ),
        ),
        // Main content fills remaining space
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Stack(
              children: [
                Positioned.fill(
                  child: _presentationStarted && _deckFilePath != null
                      ? _buildDeckPresentationView(context)
                      : _buildCameraView(context),
                ),
                if (_recording)
                  Positioned(
                    top: 10,
                    left: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: context.colors.accent.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Live AI Feedback',
                            style: TextStyle(
                              color: context.colors.accent,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Great energy. Keep eye contact with camera and slow down slightly during your financial explanation.',
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildCameraView(BuildContext context) {
    return Container(
      width: double.infinity,
      height: _fullscreen ? null : 220,
      constraints: _fullscreen ? const BoxConstraints(minHeight: 200) : null,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.divider),
      ),
      child: (!_cameraOn || !_cameraReady || _cameraController == null)
          ? SizedBox(
              height: _fullscreen ? 300 : 220,
              child: Center(
                child: Text(
                  'Camera Off',
                  style: TextStyle(color: context.colors.textSecondary),
                ),
              ),
            )
          : ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CameraPreview(_cameraController!),
            ),
    );
  }

  Widget _buildDeckPresentationView(BuildContext context) {
    return Container(
      width: double.infinity,
      height: _fullscreen ? null : 330,
      constraints: _fullscreen ? const BoxConstraints(minHeight: 300) : null,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.divider),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: _isPdfDeck
                  ? SfPdfViewer.file(
                      File(_deckFilePath!),
                      controller: _pdfController,
                      pageLayoutMode: PdfPageLayoutMode.single,
                      onDocumentLoaded: (details) {
                        if (!mounted) return;
                        setState(() {
                          _deckTotalPages = details.document.pages.count;
                          _deckCurrentPage = 1;
                        });
                      },
                      onPageChanged: (details) {
                        if (!mounted) return;
                        _trackSlideTransition(details.newPageNumber);
                        setState(
                          () => _deckCurrentPage = details.newPageNumber,
                        );
                      },
                    )
                  : Container(
                      color: context.colors.surface,
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.slideshow_rounded,
                            color: context.colors.textSecondary,
                            size: 48,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _deckFileName ?? 'Pitch deck selected',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: context.colors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'PPT/PPTX loaded. Convert to PDF for in-app next/previous slide navigation.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: context.colors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
          ),
          Positioned(
            top: 10,
            left: 10,
            child: FilledButton.tonal(
              onPressed: _pickPitchDeck,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.black.withValues(alpha: 0.45),
              ),
              child: const Text('Change Deck'),
            ),
          ),
          Positioned(
            top: 10,
            right: 10,
            child: Container(
              width: 96,
              height: 132,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
              ),
              child: (!_cameraOn || !_cameraReady || _cameraController == null)
                  ? Center(
                      child: Icon(
                        Icons.videocam_off,
                        color: context.colors.textSecondary,
                      ),
                    )
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: CameraPreview(_cameraController!),
                    ),
            ),
          ),
          Positioned(
            left: 12,
            right: 12,
            bottom: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: _isPdfDeck ? _previousDeckPage : null,
                    icon: const Icon(Icons.chevron_left_rounded),
                    color: Colors.white,
                  ),
                  Text(
                    _isPdfDeck
                        ? 'Slide $_deckCurrentPage / $_deckTotalPages'
                        : 'PPT/PPTX loaded',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                  IconButton(
                    onPressed: _isPdfDeck ? _nextDeckPage : null,
                    icon: const Icon(Icons.chevron_right_rounded),
                    color: Colors.white,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AnalysisBar extends StatelessWidget {
  final String label, status;
  final double value;
  final Color color;
  const _AnalysisBar(this.label, this.value, this.status, this.color);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
          ),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: value,
              backgroundColor: context.colors.divider,
              color: color,
              minHeight: 8,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            status,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

class _ScoreChip extends StatelessWidget {
  final String label, value;
  const _ScoreChip(this.label, this.value);
  @override
  Widget build(BuildContext context) => Column(
    children: [
      Text(
        value,
        style: TextStyle(
          color: context.colors.textPrimary,
          fontWeight: FontWeight.w800,
          fontSize: 16,
        ),
      ),
      Text(
        label,
        style: TextStyle(color: context.colors.textSecondary, fontSize: 11),
      ),
    ],
  );
}

class _ResultChip extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final BuildContext ctx;
  const _ResultChip(this.icon, this.label, this.value, this.ctx);
  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.colors.divider),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: context.colors.accent),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 11,
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

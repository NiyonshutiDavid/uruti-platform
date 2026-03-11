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
  static const Color _liveFeedbackGreen = Color(0xFF39FF14);

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
  bool _autoStopTriggered = false;
  String? _deckFilePath;
  String? _deckFileName;
  int _deckCurrentPage = 1;
  int _deckTotalPages = 1;
  final List<Map<String, dynamic>> _slideTransitions = [];

  Map<String, double> _liveMetrics = {
    'pacing': 0,
    'slide_sync': 0,
    'confidence': 0,
    'clarity': 0,
    'engagement': 0,
  };
  String _liveTip = 'Live coaching will appear once analysis starts.';
  String _liveBackend = 'loading';
  bool _liveModelLoaded = false;
  List<String> _sessionFindings = [];

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
    if (_presentationStarted) {
      setState(() => _presentationStarted = false);
      return;
    }

    setState(() => _presentationStarted = true);
    if (!_fullscreen) {
      await _promptFullscreenForDeckPresentation();
    }
  }

  Future<void> _promptFullscreenForDeckPresentation() async {
    if (!mounted) return;
    final shouldEnter = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Present In Fullscreen'),
        content: const Text(
          'For best presentation mode, switch to fullscreen. Your camera stays available while slides get more space.',
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

    if (shouldEnter == true && mounted) {
      setState(() {
        _fullscreen = true;
        _hasShownFullscreenHint = true;
      });
    }
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
      final next = _seconds + 1;
      final targetSeconds = (_targetMinutes <= 0 ? 1 : _targetMinutes) * 60;
      setState(() {
        _seconds = next;
      });

      if (_recording && next % 5 == 0) {
        unawaited(_fetchLiveCoaching());
      }

      if (_recording && !_autoStopTriggered && next >= targetSeconds) {
        _autoStopTriggered = true;
        unawaited(_stopRecording(autoStopped: true));
      }
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
      _autoStopTriggered = false;
      _slideTransitions.clear();
      _sessionFindings = [];
      _liveMetrics = {
        'pacing': 0,
        'slide_sync': 0,
        'confidence': 0,
        'clarity': 0,
        'engagement': 0,
      };
      _liveTip = 'Connecting to AI pitch coach...';
      _liveBackend = 'loading';
      _liveModelLoaded = false;

      await _cameraController!.startVideoRecording();

      setState(() => _recording = true);
      _startTimer();
      unawaited(_fetchLiveCoaching(force: true));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to start recording: $e')));
    }
  }

  Future<void> _stopRecording({bool autoStopped = false}) async {
    if (!_recording) return;
    try {
      if (_cameraController == null) return;
      final file = await _cameraController!.stopVideoRecording();
      final recordedPath = file.path;

      _stopTimer();
      if (recordedPath.isEmpty) {
        throw Exception('No recording file was generated.');
      }

      if (!mounted) return;
      setState(() {
        _recording = false;
        _sessionComplete = true;
        _recordedFilePath = recordedPath;
        _recordedDurationSeconds = _seconds;
        _sessionFindings = _buildSessionFindings();
      });
      await _showStopSummaryDialog();
      if (!mounted) return;
      if (autoStopped) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Target duration reached. Recording stopped automatically.',
            ),
          ),
        );
      }
    } catch (e) {
      _stopTimer();
      if (!mounted) return;
      setState(() => _recording = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to stop recording: $e')));
    }
  }

  Future<void> _showStopSummaryDialog() async {
    if (!mounted) return;
    final pacing = _metricPercent('pacing');
    final clarity = _metricPercent('clarity');
    final confidence = _metricPercent('confidence');
    final engagement = _metricPercent('engagement');
    final durationLabel =
        '${_recordedDurationSeconds ~/ 60}:${(_recordedDurationSeconds % 60).toString().padLeft(2, '0')}';

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Session Stopped'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Overall Score: $_overallScore/100'),
            const SizedBox(height: 6),
            Text('Pacing: $pacing%'),
            Text('Clarity: $clarity%'),
            Text('Confidence: $confidence%'),
            Text('Engagement: $engagement%'),
            const SizedBox(height: 6),
            Text('Recorded Duration: $durationLabel'),
          ],
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
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
      _sessionFindings = [];
      _liveTip = 'Live coaching will appear once analysis starts.';
      _liveBackend = 'loading';
      _liveModelLoaded = false;
    });
  }

  String _buildUploadNotes() {
    final findings = _sessionFindings.isNotEmpty
        ? _sessionFindings
        : _buildSessionFindings();

    final notes = <String>[
      'Recorded on mobile pitch coach.',
      'Capture mode: camera-only',
      if (_deckFileName != null) 'Deck: $_deckFileName',
      if (_slideTransitions.isNotEmpty)
        'Slide transitions: ${_slideTransitions.map((e) => '#${e['slide']}@${e['at_second']}s').join(', ')}',
      if (findings.isNotEmpty) 'Final findings: ${findings.join(' | ')}',
    ];
    return notes.join('\n');
  }

  double _normalizeMetric(dynamic raw) {
    if (raw == null) return 0;
    final n = (raw is num) ? raw.toDouble() : double.tryParse('$raw') ?? 0;
    if (n <= 0) return 0;
    if (n > 1) return (n / 100).clamp(0, 1).toDouble();
    return n.clamp(0, 1).toDouble();
  }

  Future<void> _fetchLiveCoaching({bool force = false}) async {
    if (!_recording || _selectedVentureId == null) return;
    if (!force && _seconds == 0) return;

    try {
      final response = await ApiService.instance.getPitchLiveFeedback(
        ventureId: _selectedVentureId!,
        pitchType: _pitchType,
        durationSeconds: _seconds,
        targetDurationSeconds: (_targetMinutes <= 0 ? 1 : _targetMinutes) * 60,
        currentSlide: _deckCurrentPage,
        totalSlides: _deckTotalPages <= 0 ? 1 : _deckTotalPages,
        slideTransitions: _slideTransitions
            .map(
              (entry) => {
                'slide': entry['slide'],
                'atSecond': entry['at_second'],
              },
            )
            .toList(),
      );

      if (!mounted) return;

      final metrics =
          (response['metrics'] as Map?)?.cast<String, dynamic>() ??
          <String, dynamic>{};
      final tips = response['tips'];
      final firstTip = tips is List && tips.isNotEmpty
          ? '${tips.first}'.trim()
          : '';

      setState(() {
        _liveBackend = '${response['model_backend'] ?? 'unknown'}';
        _liveModelLoaded = response['model_loaded'] == true;
        _liveMetrics = {
          'pacing': _normalizeMetric(metrics['pacing']),
          'slide_sync': _normalizeMetric(metrics['structure']),
          'confidence': _normalizeMetric(metrics['confidence']),
          'clarity': _normalizeMetric(metrics['clarity']),
          'engagement': _normalizeMetric(metrics['engagement']),
        };

        final backend = _liveBackend.toLowerCase();
        final nonAi =
            backend == 'fallback' ||
            backend == 'unavailable' ||
            backend == 'offline' ||
            !_liveModelLoaded;

        if (nonAi) {
          _liveTip =
              'AI pitch coach is currently unavailable. Scores are running in non-AI fallback mode.';
        } else if (firstTip.isNotEmpty) {
          _liveTip = firstTip;
        } else {
          _liveTip =
              'AI coach connected. Keep presenting to receive live tips.';
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _liveBackend = 'unavailable';
        _liveModelLoaded = false;
        _liveTip =
            'AI pitch coach is currently unavailable. Scores are running in non-AI fallback mode.';
      });
    }
  }

  int _metricPercent(String key) => ((_liveMetrics[key] ?? 0) * 100).round();

  int get _overallScore {
    final scores = [
      _metricPercent('pacing'),
      _metricPercent('slide_sync'),
      _metricPercent('confidence'),
      _metricPercent('clarity'),
      _metricPercent('engagement'),
    ];
    final total = scores.fold<int>(0, (sum, item) => sum + item);
    return (total / scores.length).round();
  }

  String _metricStatus(String key) {
    final score = _metricPercent(key);
    if (score >= 80) return 'Strong';
    if (score >= 65) return 'Good';
    return 'Needs work';
  }

  List<String> _buildSessionFindings() {
    final findings = <String>[];

    if (_metricPercent('clarity') >= 75) {
      findings.add('Clear explanation of the core value proposition.');
    } else {
      findings.add('Improve clarity by simplifying technical sections.');
    }

    if (_metricPercent('pacing') >= 72) {
      findings.add('Pacing stayed mostly consistent across the session.');
    } else {
      findings.add('Slow down in key sections to improve pacing.');
    }

    if (_metricPercent('confidence') >= 70) {
      findings.add('Strong vocal confidence throughout delivery.');
    } else {
      findings.add('Increase vocal projection and reduce filler words.');
    }

    if (_metricPercent('engagement') >= 70) {
      findings.add('Audience engagement signals are trending positively.');
    } else {
      findings.add('Add concrete examples to improve engagement.');
    }

    final targetSeconds = (_targetMinutes <= 0 ? 1 : _targetMinutes) * 60;
    if (_recordedDurationSeconds < (targetSeconds * 0.75).round()) {
      findings.add('Session ended early; extend to match target duration.');
    }

    return findings;
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
                                  _liveMetrics['pacing'] ?? 0,
                                  _metricStatus('pacing'),
                                  context.colors.accent,
                                ),
                                const SizedBox(height: 12),
                                _AnalysisBar(
                                  'Slide Sync',
                                  _liveMetrics['slide_sync'] ?? 0,
                                  _metricStatus('slide_sync'),
                                  context.colors.accent,
                                ),
                                const SizedBox(height: 12),
                                _AnalysisBar(
                                  'Confidence',
                                  _liveMetrics['confidence'] ?? 0,
                                  _metricStatus('confidence'),
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
                                            color: _liveFeedbackGreen,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          _liveTip,
                                          style: TextStyle(
                                            color: _liveFeedbackGreen,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
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
                                        child: TextFormField(
                                          initialValue: '$_targetMinutes',
                                          enabled: !_recording,
                                          keyboardType: TextInputType.number,
                                          onChanged: (value) {
                                            final parsed = int.tryParse(value);
                                            if (parsed == null) return;
                                            setState(() {
                                              _targetMinutes = parsed
                                                  .clamp(1, 240)
                                                  .toInt();
                                            });
                                          },
                                          decoration: const InputDecoration(
                                            labelText: 'Target (minutes)',
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
                    '$_overallScore',
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
                      _ScoreChip('Clarity', '${_metricPercent('clarity')}%'),
                      _ScoreChip(
                        'Confidence',
                        '${_metricPercent('confidence')}%',
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            _sectionTitle(context, 'Category Breakdown'),
            const SizedBox(height: 12),

            ...[
              ('Pacing', (_liveMetrics['pacing'] ?? 0), context.colors.accent),
              (
                'Slide Sync',
                (_liveMetrics['slide_sync'] ?? 0),
                const Color(0xFF8B5CF6),
              ),
              (
                'Confidence',
                (_liveMetrics['confidence'] ?? 0),
                const Color(0xFFFFB800),
              ),
              (
                'Clarity',
                (_liveMetrics['clarity'] ?? 0),
                const Color(0xFF3B82F6),
              ),
              (
                'Engagement',
                (_liveMetrics['engagement'] ?? 0),
                const Color(0xFFFF6B6B),
              ),
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

            ...(_sessionFindings.isNotEmpty
                    ? _sessionFindings
                    : _buildSessionFindings())
                .map(
                  (finding) => (
                    (finding.toLowerCase().contains('improve') ||
                            finding.toLowerCase().contains('slow down') ||
                            finding.toLowerCase().contains('ended early'))
                        ? Icons.warning_amber_rounded
                        : Icons.check_circle,
                    (finding.toLowerCase().contains('improve') ||
                            finding.toLowerCase().contains('slow down') ||
                            finding.toLowerCase().contains('ended early'))
                        ? const Color(0xFFFFB800)
                        : context.colors.accent,
                    finding,
                  ),
                )
                .toList()
                .map(
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
                              color: _liveFeedbackGreen,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _liveTip,
                            style: TextStyle(
                              color: _liveFeedbackGreen,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
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
    final cameraAvailable =
        _cameraOn && _cameraReady && _cameraController != null;
    return Container(
      width: double.infinity,
      height: _fullscreen ? null : 220,
      constraints: _fullscreen ? const BoxConstraints(minHeight: 200) : null,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.divider),
      ),
      child: !cameraAvailable
          ? SizedBox(
              height: _fullscreen ? 300 : 220,
              child: Center(
                child: Text(
                  'Camera Off',
                  style: TextStyle(color: context.colors.textSecondary),
                ),
              ),
            )
          : !_fullscreen
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.videocam_rounded,
                    color: context.colors.accent,
                    size: 30,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Camera is on',
                    style: TextStyle(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Camera preview appears in fullscreen.',
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
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
          if (_fullscreen)
            Positioned(
              top: 10,
              right: 10,
              child: Container(
                width: 96,
                height: 132,
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                ),
                child:
                    (!_cameraOn || !_cameraReady || _cameraController == null)
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

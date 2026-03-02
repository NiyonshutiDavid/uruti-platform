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
      _pdfController.nextPage();
    }
  }

  void _previousDeckPage() {
    if (_isPdfDeck && _deckCurrentPage > 1) {
      _pdfController.previousPage();
    }
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
      await _cameraController!.startVideoRecording();
      setState(() => _recording = true);
      _startTimer();
    } catch (e) {
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
      setState(() => _recording = false);
      await _uploadRecording(file.path);
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
        durationSeconds: _seconds,
        targetDurationSeconds: _targetMinutes * 60,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pitch session uploaded successfully.')),
      );
      context.go('/pitch-performance');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to upload pitch video: $e')),
      );
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
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
    return Scaffold(
      backgroundColor: context.colors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header with recording indicator
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.close, color: context.colors.textPrimary),
                    onPressed: () =>
                        context.canPop() ? context.pop() : context.go('/coach'),
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
              child: SingleChildScrollView(
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
                            AppColors.primary,
                          ),
                          const SizedBox(height: 12),
                          _AnalysisBar(
                            'Slide Sync',
                            0.65,
                            'On Track',
                            AppColors.primary,
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
                          color: AppColors.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: AppColors.primary.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(
                                  alpha: 0.15,
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.lightbulb_outline,
                                color: AppColors.primary,
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Real-time Tip',
                                    style: TextStyle(
                                      color: AppColors.primary,
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
                          border: Border.all(color: context.colors.divider),
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
                                        (v['name'] as String?) ?? 'Venture',
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
                                                () => _targetMinutes = value,
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

                    // Waveform
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _Waveform(),
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
                                  : AppColors.primary,
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
                                  : AppColors.primary,
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
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

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
                  ? AppColors.primary.withValues(alpha: 0.15)
                  : context.colors.card,
              shape: BoxShape.circle,
              border: Border.all(
                color: active
                    ? AppColors.primary.withValues(alpha: 0.4)
                    : context.colors.divider,
              ),
            ),
            child: Icon(
              icon,
              color: active ? AppColors.primary : context.colors.textSecondary,
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

  Widget _buildCameraView(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 220,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.divider),
      ),
      child: (!_cameraOn || !_cameraReady || _cameraController == null)
          ? Center(
              child: Text(
                'Camera Off',
                style: TextStyle(color: context.colors.textSecondary),
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
      height: 330,
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

class _Waveform extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width - 40;
    return SizedBox(
      height: 60,
      width: width,
      child: CustomPaint(painter: _WavePainter()),
    );
  }
}

class _WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.7)
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    final heights = [
      0.3,
      0.7,
      0.5,
      0.9,
      0.4,
      0.8,
      0.6,
      0.4,
      1.0,
      0.5,
      0.7,
      0.3,
      0.8,
      0.6,
      0.9,
      0.4,
      0.7,
      0.5,
      0.3,
      0.8,
      0.6,
      0.4,
      0.9,
      0.5,
      0.7,
      0.3,
      0.8,
      0.6,
      0.4,
      0.7,
    ];
    final spacing = size.width / heights.length;
    for (int i = 0; i < heights.length; i++) {
      final x = i * spacing + spacing / 2;
      final h = heights[i] * size.height;
      canvas.drawLine(
        Offset(x, (size.height - h) / 2),
        Offset(x, (size.height + h) / 2),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

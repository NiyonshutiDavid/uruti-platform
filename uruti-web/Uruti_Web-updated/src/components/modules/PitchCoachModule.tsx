import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Mic, MicOff, Video, VideoOff, Upload, StopCircle, Play, Pause, Volume2, Settings, AlertCircle, Check, AlertTriangle, Info, FileText, X, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { SaveRecordingDialog } from '../SaveRecordingDialog';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';

type SlideTransition = {
  slide: number;
  atSecond: number;
};

type PdfDocLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<any>;
  destroy?: () => void;
};

export function PitchCoachModule() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [deckFileName, setDeckFileName] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(10);
  const [slideTransitions, setSlideTransitions] = useState<SlideTransition[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasShownFullscreenTip, setHasShownFullscreenTip] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [liveModelStatus, setLiveModelStatus] = useState<{
    backend: string;
    loaded: boolean;
    error?: string | null;
  } | null>(null);
  const [liveModelTips, setLiveModelTips] = useState<string[]>([]);

  const liveBackend = (liveModelStatus?.backend || '').toLowerCase();
  const isNonAiScoring = Boolean(liveModelStatus) && (
    liveBackend === 'fallback' ||
    liveBackend === 'unavailable' ||
    liveBackend === 'offline' ||
    liveBackend === 'heuristic' ||
    liveBackend === 'rule-based' ||
    !liveModelStatus?.loaded ||
    Boolean(liveModelStatus?.error)
  );

  // Session configuration states
  const [ventures, setVentures] = useState<any[]>([]);
  const [selectedVenture, setSelectedVenture] = useState<any>(null);
  const [pitchType, setPitchType] = useState('Investor Pitch');
  const [targetDuration, setTargetDuration] = useState(5); // in minutes

  // Settings states
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [noiseCancellation, setNoiseCancellation] = useState(false);
  const [videoQuality, setVideoQuality] = useState('720p');
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [micSensitivity, setMicSensitivity] = useState([100]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const deckInputRef = useRef<HTMLInputElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const composedStreamRef = useRef<MediaStream | null>(null);
  const deckCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const pdfDocRef = useRef<PdfDocLike | null>(null);
  const compositionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositionRafRef = useRef<number | null>(null);
  const recorderMimeTypeRef = useRef('video/webm');
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTriggeredRef = useRef(false);
  const recordingTimeRef = useRef(0);
  const slideTransitionsRef = useRef<SlideTransition[]>([]);
  const lastTipRef = useRef('');

  // Real-time AI feedback metrics
  const [pitchMetrics, setPitchMetrics] = useState({
    pacing: 0,
    clarity: 0,
    confidence: 0,
    engagement: 0,
    structure: 0
  });

  // Real-time feedback cues
  const [liveFeedback, setLiveFeedback] = useState<Array<{
    id: number;
    type: 'positive' | 'warning' | 'info';
    message: string;
    time: string;
  }>>([]);

  // Fetch ventures on mount
  useEffect(() => {
    fetchVentures();
  }, []);

  const fetchVentures = async () => {
    try {
      let venturesData: any[] = [];
      try {
        venturesData = await apiClient.getMyVentures();
      } catch {
        // Fallback for accounts where personal ventures endpoint is unavailable.
        venturesData = await apiClient.getVentures();
      }
      setVentures(venturesData);
      if (venturesData.length > 0) {
        setSelectedVenture(venturesData[0]);
      } else {
        setSelectedVenture(null);
      }
    } catch (error) {
      console.error('Error fetching ventures:', error);
      toast.error('Failed to load ventures');
    }
  };

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopComposition();
      if (renderTaskRef.current?.cancel) {
        renderTaskRef.current.cancel();
      }
      if (pdfDocRef.current?.destroy) {
        pdfDocRef.current.destroy();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer for recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  useEffect(() => {
    recordingTimeRef.current = recordingTime;
  }, [recordingTime]);

  useEffect(() => {
    slideTransitionsRef.current = slideTransitions;
  }, [slideTransitions]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: isMicOn
      });

      cameraStreamRef.current = stream;

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.error('[VIDEO] play() error:', err);
          });
        }
      }, 100);

      setIsVideoOn(true);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Unable to access camera. Please check your browser permissions.');
      }
      
      setIsVideoOn(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsVideoOn(false);
  };

  const renderPdfPage = useCallback(async (pageNumber: number) => {
    if (!pdfDocRef.current || !deckCanvasRef.current) return;

    const page = await pdfDocRef.current.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1.0 });
    const canvas = deckCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parentWidth = canvas.parentElement?.clientWidth || 1200;
    const parentHeight = canvas.parentElement?.clientHeight || 675;
    const scale = Math.min(parentWidth / baseViewport.width, parentHeight / baseViewport.height);
    const viewport = page.getViewport({ scale: scale > 0 ? scale : 1.0 });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    if (renderTaskRef.current?.cancel) {
      renderTaskRef.current.cancel();
    }

    const renderTask = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = renderTask;

    try {
      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        throw err;
      }
    }
  }, []);

  const goToSlide = useCallback((nextSlide: number) => {
    const safeSlide = Math.min(Math.max(nextSlide, 1), Math.max(totalSlides, 1));
    setCurrentSlide((previousSlide) => {
      if (previousSlide === safeSlide) return previousSlide;
      if (isRecording) {
        setSlideTransitions((history) => [
          ...history,
          { slide: safeSlide, atSecond: recordingTime },
        ]);
      }
      return safeSlide;
    });
  }, [isRecording, recordingTime, totalSlides]);

  const toggleCamera = async () => {
    if (isVideoOn) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const toggleMicrophone = () => {
    setIsMicOn(!isMicOn);
    
    // Toggle audio tracks in camera stream
    if (cameraStreamRef.current) {
      const audioTracks = cameraStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMicOn;
      });
    }
  };

  const handleDeckUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported in Pitch Coach slide mode.');
      return;
    }

    setError(null);
    if (renderTaskRef.current?.cancel) {
      renderTaskRef.current.cancel();
    }
    if (pdfDocRef.current?.destroy) {
      pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    }

    try {
      const pdfjs = await import('pdfjs-dist');
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
      }

      const data = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data });
      const pdfDoc = (await loadingTask.promise) as PdfDocLike;
      pdfDocRef.current = pdfDoc;

      setDeckFile(file);
      setDeckFileName(file.name);
      setCurrentSlide(1);
      setTotalSlides(Math.max(1, pdfDoc.numPages || 1));
      setSlideTransitions([]);

      if (!isVideoOn) {
        await startCamera();
      }

      await renderPdfPage(1);
    } catch (err) {
      console.error('Unable to load PDF:', err);
      setError('Unable to load this PDF. Please upload a valid, non-password-protected file.');
    }
  }, [isVideoOn, renderPdfPage]);

  const removeDeck = useCallback(() => {
    if (renderTaskRef.current?.cancel) {
      renderTaskRef.current.cancel();
    }
    if (pdfDocRef.current?.destroy) {
      pdfDocRef.current.destroy();
    }
    pdfDocRef.current = null;
    setDeckFile(null);
    setDeckFileName(null);
    setCurrentSlide(1);
    setTotalSlides(1);
    setSlideTransitions([]);
  }, []);

  useEffect(() => {
    if (!deckFile || !pdfDocRef.current) return;
    void renderPdfPage(currentSlide);
  }, [currentSlide, deckFile, renderPdfPage]);

  useEffect(() => {
    if (!deckFile || !pdfDocRef.current) return;

    const rerender = () => {
      void renderPdfPage(currentSlide);
    };

    const handle = window.setTimeout(rerender, 120);
    const onResize = () => rerender();
    window.addEventListener('resize', onResize);

    return () => {
      window.clearTimeout(handle);
      window.removeEventListener('resize', onResize);
    };
  }, [deckFile, isFullscreen, currentSlide, renderPdfPage]);

  useEffect(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }
    if (isPaused && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    if (!isPaused && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  }, [isPaused]);

  useEffect(() => {
    // Reattach stream whenever view mode changes (camera-only <-> deck PiP),
    // otherwise the video element can remount without the previous srcObject.
    if (!isVideoOn || !cameraStreamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = cameraStreamRef.current;
    videoRef.current.play().catch((err) => {
      console.error('[VIDEO] play() error:', err);
    });
  }, [deckFile, isVideoOn]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (isFullscreen) {
      if (document.fullscreenElement !== stage && stage.requestFullscreen) {
        stage.requestFullscreen().catch(() => {
          // Keep CSS fullscreen fallback if requestFullscreen fails.
        });
      }
      return;
    }

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {
        // No-op: CSS fallback still works.
      });
    }
  }, [isFullscreen]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onFullscreenChange = () => {
      const activeElement = document.fullscreenElement;
      setIsFullscreen(activeElement === stage);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen && !hasShownFullscreenTip) {
      toast.info(
        'Fullscreen is recommended: portrait camera feed stays visible in a compact window while your deck remains easy to read.',
      );
      setHasShownFullscreenTip(true);
    }
    setIsFullscreen((prev) => !prev);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      autoStopTriggeredRef.current = false;
      lastTipRef.current = '';
      setIsRecording(true);
      setRecordingTime(0);
      setSlideTransitions([]);
      setLiveFeedback([]);
      setLiveModelTips([]);
      setLiveModelStatus(null);
      startRecording();
    } else {
      setIsRecording(false);
      setIsPaused(false);
      stopRecording();
    }
  };

  useEffect(() => {
    if (!isRecording || isPaused) return;

    const targetSeconds = Math.max(1, Math.round(targetDuration * 60));
    if (recordingTime < targetSeconds || autoStopTriggeredRef.current) {
      return;
    }

    autoStopTriggeredRef.current = true;
    setIsRecording(false);
    setIsPaused(false);
    stopRecording();
    toast.info('Target duration reached. Recording stopped automatically.');
  }, [isRecording, isPaused, recordingTime, targetDuration]);

  const startRecording = () => {
    if (!cameraStreamRef.current) {
      toast.error('Turn on camera before starting the recording');
      setIsRecording(false);
      return;
    }

    const begin = async () => {
      const sourceStream = cameraStreamRef.current;
      if (!sourceStream) {
        toast.error('Turn on camera before starting the recording');
        setIsRecording(false);
        return;
      }

      if (deckFile && !pdfDocRef.current) {
        toast.error('Slides are not ready yet. Re-upload your deck and try again.');
        setIsRecording(false);
        setIsPaused(false);
        stopComposition();
        return;
      }

      const composedStream = createComposedStream(sourceStream);
      composedStreamRef.current = composedStream;

      const preferredMimeTypes = [
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const chosenMimeType =
        preferredMimeTypes.find((mime) => MediaRecorder.isTypeSupported(mime)) ||
        'video/webm';
      recorderMimeTypeRef.current = chosenMimeType;

      const mediaRecorder = new MediaRecorder(composedStream, {
        mimeType: chosenMimeType,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorderMimeTypeRef.current,
        });
        setRecordedBlob(blob.size > 0 ? blob : null);
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
        stopComposition();

        if (blob.size > 0) {
          setShowSaveDialog(true);
        } else {
          toast.error('Recording ended, but no video data was captured. Please try again.');
        }
      };

      mediaRecorder.start(1000);
    };

    begin().catch((err) => {
      console.error('Unable to start recording:', err);
      toast.error('Unable to start recording. Please try again.');
      setIsRecording(false);
      stopComposition();
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping recorder:', err);
        toast.error('Unable to stop recording cleanly.');
      }
    }
    stopComposition();
  };

  const createComposedStream = (sourceStream: MediaStream) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    compositionCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return sourceStream;
    }

    const drawFrame = () => {
      // Main background (slides area)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (deckFile && deckCanvasRef.current) {
        const slideCanvas = deckCanvasRef.current;
        const srcW = slideCanvas.width || canvas.width;
        const srcH = slideCanvas.height || canvas.height;

        const ratio = Math.min(canvas.width / srcW, canvas.height / srcH);
        const drawW = srcW * ratio;
        const drawH = srcH * ratio;
        const drawX = (canvas.width - drawW) / 2;
        const drawY = (canvas.height - drawH) / 2;

        ctx.drawImage(slideCanvas, drawX, drawY, drawW, drawH);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
      }

      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        if (deckFile) {
          const pipWidth = 380;
          const pipHeight = 214;
          const pipX = canvas.width - pipWidth - 28;
          const pipY = canvas.height - pipHeight - 28;
          ctx.fillStyle = '#111827';
          ctx.fillRect(pipX - 4, pipY - 4, pipWidth + 8, pipHeight + 8);
          ctx.drawImage(video, pipX, pipY, pipWidth, pipHeight);
        } else {
          ctx.drawImage(video, 20, 20, canvas.width - 40, canvas.height - 40);
        }
      }

      compositionRafRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    const videoTrack = canvas.captureStream(30).getVideoTracks()[0];
    const audioTracks = sourceStream.getAudioTracks();
    return new MediaStream(videoTrack ? [videoTrack, ...audioTracks] : [...audioTracks]);
  };

  const stopComposition = () => {
    if (compositionRafRef.current !== null) {
      cancelAnimationFrame(compositionRafRef.current);
      compositionRafRef.current = null;
    }

    if (composedStreamRef.current) {
      composedStreamRef.current.getTracks().forEach((track) => track.stop());
      composedStreamRef.current = null;
    }

    compositionCanvasRef.current = null;
  };

  const pushLiveTip = useCallback((message: string) => {
    const text = (message || '').trim();
    if (!text || text === lastTipRef.current) {
      return;
    }
    lastTipRef.current = text;

    const lower = text.toLowerCase();
    const type: 'positive' | 'warning' | 'info' =
      lower.includes('slow down') || lower.includes('reduce') || lower.includes('improve')
        ? 'warning'
        : lower.includes('great') || lower.includes('strong') || lower.includes('clear')
          ? 'positive'
          : 'info';

    setLiveFeedback((prev) => [
      {
        id: Date.now(),
        type,
        message: text,
        time: formatTime(recordingTimeRef.current),
      },
      ...prev,
    ].slice(0, 5));
  }, []);

  // Fetch live coaching feedback from backend while recording.
  useEffect(() => {
    if (!isRecording || isPaused || !selectedVenture?.id) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const result = await apiClient.getPitchLiveFeedback({
          venture_id: Number(selectedVenture.id),
          pitch_type: pitchType,
          duration_seconds: recordingTimeRef.current,
          target_duration_seconds: targetDuration * 60,
          current_slide: currentSlide,
          total_slides: Math.max(totalSlides, 1),
          slide_transitions: slideTransitionsRef.current,
          transcript: '',
        });

        if (cancelled || !result) return;

        setLiveModelStatus({
          backend: String(result.model_backend || 'unknown'),
          loaded: Boolean(result.model_loaded),
          error: result.model_error || null,
        });

        if (Array.isArray(result.tips) && result.tips.length > 0) {
          setLiveModelTips(result.tips.filter(Boolean));
        }

        if (result.metrics) {
          setPitchMetrics({
            pacing: Number(result.metrics.pacing || 0),
            clarity: Number(result.metrics.clarity || 0),
            confidence: Number(result.metrics.confidence || 0),
            engagement: Number(result.metrics.engagement || 0),
            structure: Number(result.metrics.structure || 0),
          });
        }

        const firstTip = Array.isArray(result.tips) ? result.tips[0] : '';
        if (firstTip) {
          pushLiveTip(firstTip);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Live pitch feedback unavailable:', err);
          setLiveModelStatus({
            backend: 'unavailable',
            loaded: false,
            error: 'live endpoint unreachable',
          });
        }
      }
    };

    void run();
    const interval = window.setInterval(() => {
      void run();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    isRecording,
    isPaused,
    selectedVenture?.id,
    pitchType,
    targetDuration,
    currentSlide,
    totalSlides,
    pushLiveTip,
  ]);

  const handleSaveRecording = async (notes: string, ventureId: string | number) => {
    const venture = ventures.find(v => v.id.toString() === ventureId.toString());
    if (!venture || !recordedBlob) {
      toast.error('No venture selected or recording not found');
      return;
    }

    try {
      const shouldUseMp4 = recorderMimeTypeRef.current.includes('mp4');
      const extension = shouldUseMp4 ? 'mp4' : 'webm';
      const file = new File([recordedBlob], `pitch-${Date.now()}.${extension}`, {
        type: recorderMimeTypeRef.current,
      });

      const enrichedNotes = [
        notes,
        slideTransitions.length
          ? `Slide transitions: ${slideTransitions.map((s) => `#${s.slide}@${s.atSecond}s`).join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const uploadResult = await apiClient.uploadPitchVideo(venture.id, file, {
        pitch_type: pitchType,
        duration: recordingTime,
        target_duration: targetDuration * 60, // convert minutes to seconds
        notes: enrichedNotes,
      });

      const uploadedVideoUrl = uploadResult?.session?.video_url;
      if (uploadedVideoUrl) {
        window.dispatchEvent(
          new CustomEvent('venture-video-updated', {
            detail: {
              ventureId: Number(venture.id),
              videoUrl: uploadedVideoUrl,
            },
          }),
        );
      }

      toast.success('Pitch video saved successfully!');
      // Reset state
      setRecordedBlob(null);
      setRecordingTime(0);
      setLiveFeedback([]);
      setLiveModelTips([]);
      setLiveModelStatus(null);
      lastTipRef.current = '';
      setSlideTransitions([]);
      setPitchMetrics({
        pacing: 0,
        clarity: 0,
        confidence: 0,
        engagement: 0,
        structure: 0
      });
    } catch (error) {
      console.error('Error saving pitch video:', error);
      throw error;
    }
  };

  const handlePracticeAgain = () => {
    // Reset state for new practice session
    setRecordedBlob(null);
    setRecordingTime(0);
    setLiveFeedback([]);
    setLiveModelTips([]);
    setLiveModelStatus(null);
    lastTipRef.current = '';
    setSlideTransitions([]);
    setPitchMetrics({
      pacing: 0,
      clarity: 0,
      confidence: 0,
      engagement: 0,
      structure: 0
    });
    toast.success('Ready for another practice session!');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Pitch Coach</h1>
        <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
          Practice your pitch with AI-powered real-time coaching
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="glass-card border-red-200 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>
                {error}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Feed */}
          <Card className="glass-card border-black/5 overflow-hidden">
            <div
              ref={stageRef}
              className={`relative bg-black ${isFullscreen ? 'fixed top-0 left-0 z-[9999] h-[100dvh] w-screen' : 'aspect-video'} flex items-center justify-center`}
            >
              {/* Hidden file input for deck upload */}
              <input
                ref={deckInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleDeckUpload}
              />

              {deckFile ? (
                <div className="w-full h-full relative flex items-center justify-center bg-[#0b1120]">
                  <canvas
                    ref={deckCanvasRef}
                    className="max-h-full max-w-full h-auto w-auto rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                  />

                  <div className="absolute top-2 left-2 bg-black/65 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center space-x-2 max-w-[70%]">
                    <FileText className="h-3 w-3 text-[#76B947] shrink-0" />
                    <span className="text-white text-xs truncate" style={{ fontFamily: 'var(--font-body)' }}>
                      {deckFileName}
                    </span>
                    <button onClick={removeDeck} className="text-gray-400 hover:text-white ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="absolute top-2 right-2 bg-black/65 backdrop-blur-sm rounded-lg px-2 py-1">
                    <span className="text-white text-xs min-w-[80px] text-center block" style={{ fontFamily: 'var(--font-heading)' }}>
                      {currentSlide}/{Math.max(totalSlides, 1)}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-2 flex items-center gap-2 border border-white/10">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/10"
                      onClick={() => goToSlide(currentSlide - 1)}
                      disabled={currentSlide <= 1}
                      title="Previous slide"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-white min-w-[5.5rem] text-center" style={{ fontFamily: 'var(--font-heading)' }}>
                      Slide {currentSlide}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/10"
                      onClick={() => goToSlide(currentSlide + 1)}
                      disabled={currentSlide >= totalSlides}
                      title="Next slide"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {isVideoOn && (
                    <div className="absolute bottom-14 right-4 w-48 aspect-video rounded-lg overflow-hidden border-2 border-[#76B947] shadow-lg">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={() => {
                          if (videoRef.current) {
                            videoRef.current.play().catch((err) => {
                              console.error('[VIDEO] play() error:', err);
                            });
                          }
                        }}
                        onError={e => {
                          console.error('[VIDEO] onError', e);
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : isVideoOn ? (
                // Camera Display (only if deck is not loaded)
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch((err) => {
                        console.error('[VIDEO] play() error:', err);
                      });
                    }
                  }}
                  onError={e => {
                    console.error('[VIDEO] onError', e);
                  }}
                />
              ) : (
                // Placeholder when no video
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Video className="h-16 w-16 text-[#76B947] mx-auto" />
                    <p className="text-white text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                      Camera Off
                    </p>
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                      Click the camera button or upload a pitch deck to start
                    </p>
                  </div>
                </div>
              )}

              {/* Fullscreen exit button */}
              {isFullscreen && (
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white hover:bg-black/80 transition"
                >
                  <Minimize className="h-4 w-4" />
                </button>
              )}

              {isRecording && (
                <div className="absolute top-16 right-4 w-[min(90vw,24rem)] rounded-xl bg-[#76B947]/18 p-3 text-[#76B947] backdrop-blur-md border border-[#76B947]/40 shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                  <p className="text-xs font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                    Live AI Feedback
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#76B947]/70 bg-black/45">
                      Engine: {liveModelStatus?.backend || 'loading'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs drop-shadow-sm" style={{ fontFamily: 'var(--font-body)' }}>
                    {liveFeedback[0]?.message || 'Analyzing delivery, pacing, and confidence...'}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                    <span>Pacing: {pitchMetrics.pacing}%</span>
                    <span>Clarity: {pitchMetrics.clarity}%</span>
                    <span>Confidence: {pitchMetrics.confidence}%</span>
                    <span>Engagement: {pitchMetrics.engagement}%</span>
                  </div>
                  {isNonAiScoring && (
                    <div className="mt-2 rounded-md border border-[#76B947]/50 bg-black/35 px-2 py-1 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                      AI pitch coach is currently unavailable. Current scores are running in non-AI fallback mode.
                    </div>
                  )}
                </div>
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4">
                  <div className="glass-panel bg-red-500/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                </div>
              )}

              {/* Floating controls while fullscreen */}
              {isFullscreen && (
                <div className="absolute bottom-4 left-1/2 z-20 w-[min(96vw,56rem)] -translate-x-1/2 rounded-2xl border border-[#76B947]/35 bg-[#0c160f]/78 p-2 backdrop-blur-md">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant={isMicOn ? 'default' : 'destructive'}
                      className={isMicOn ? 'bg-[#76B947] hover:bg-[#5a8f35]' : ''}
                      onClick={toggleMicrophone}
                    >
                      {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={isVideoOn ? 'default' : 'destructive'}
                      className={isVideoOn ? 'bg-[#76B947] hover:bg-[#5a8f35]' : ''}
                      onClick={toggleCamera}
                    >
                      {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={isRecording ? 'destructive' : 'default'}
                      className={!isRecording ? 'bg-[#76B947] hover:bg-[#5a8f35]' : ''}
                      onClick={toggleRecording}
                    >
                      {isRecording ? <StopCircle className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isRecording ? 'Stop Session' : 'Start Practice'}
                    </Button>
                    {isRecording && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                        onClick={() => setIsPaused(!isPaused)}
                      >
                        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                      onClick={() => goToSlide(currentSlide - 1)}
                      disabled={!deckFile || currentSlide <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                      onClick={() => goToSlide(currentSlide + 1)}
                      disabled={!deckFile || currentSlide >= totalSlides}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                      onClick={toggleFullscreen}
                    >
                      <Minimize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

            </div>

            {/* Control Bar */}
            <div className={`glass-panel bg-black/95 backdrop-blur-md p-4 ${isFullscreen ? 'hidden' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant={isMicOn ? "default" : "destructive"}
                    className={isMicOn ? "bg-[#76B947] hover:bg-[#5a8f35]" : ""}
                    onClick={toggleMicrophone}
                  >
                    {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={isVideoOn ? "default" : "destructive"}
                    className={isVideoOn ? "bg-[#76B947] hover:bg-[#5a8f35]" : ""}
                    onClick={toggleCamera}
                  >
                    {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                    onClick={() => deckFile ? removeDeck() : deckInputRef.current?.click()}
                  >
                    {deckFile ? (
                      <><X className="h-4 w-4 mr-2" />Remove Deck</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" />Upload Deck</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  {isRecording && (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                      onClick={() => setIsPaused(!isPaused)}
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={isRecording ? "destructive" : "default"}
                    className={!isRecording ? "bg-[#76B947] hover:bg-[#5a8f35]" : ""}
                    onClick={toggleRecording}
                  >
                    {isRecording ? (
                      <>
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop Session
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Practice
                      </>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Real-time Metrics */}
          {isRecording && (
            <Card className="glass-card border-black/5">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Real-time Performance Metrics</CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                  AI-powered analysis of your pitch delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(pitchMetrics).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm capitalize" style={{ fontFamily: 'var(--font-heading)' }}>
                          {key}
                        </span>
                        <span className={`text-sm ${value >= 80 ? 'text-[#76B947]' : value >= 60 ? 'text-yellow-600' : 'text-orange-600'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                          {value}%
                        </span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="glass-card border-black/5">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Editable Current Venture */}
              <div>
                <Label htmlFor="venture" style={{ fontFamily: 'var(--font-body)' }}>Current Venture</Label>
                <Select
                  value={selectedVenture?.id?.toString() || ''}
                  onValueChange={(value: string) => {
                    const venture = ventures.find(v => v.id.toString() === value);
                    setSelectedVenture(venture);
                  }}
                  disabled={isRecording}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select a venture">
                      {selectedVenture ? selectedVenture.name : 'Select a venture'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ventures.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No ventures found
                      </div>
                    ) : (
                      ventures.map((venture) => (
                        <SelectItem key={venture.id} value={venture.id.toString()}>
                          {venture.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Editable Pitch Type */}
              <div>
                <Label htmlFor="pitchType" style={{ fontFamily: 'var(--font-body)' }}>Pitch Type</Label>
                <Select
                  value={pitchType}
                  onValueChange={setPitchType}
                  disabled={isRecording}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select pitch type">
                      {pitchType}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elevator Pitch">Elevator Pitch</SelectItem>
                    <SelectItem value="Investor Pitch">Investor Pitch</SelectItem>
                    <SelectItem value="Demo Day Pitch">Demo Day Pitch</SelectItem>
                    <SelectItem value="Customer Pitch">Customer Pitch</SelectItem>
                    <SelectItem value="Partner Pitch">Partner Pitch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Editable Target Duration */}
              <div>
                <Label htmlFor="targetDuration" style={{ fontFamily: 'var(--font-body)' }}>Target Duration</Label>
                <Input
                  id="targetDuration"
                  type="number"
                  min={1}
                  max={240}
                  step={1}
                  value={targetDuration}
                  onChange={(e) => {
                    const parsed = Number(e.target.value);
                    if (!Number.isFinite(parsed)) return;
                    setTargetDuration(Math.min(240, Math.max(1, Math.floor(parsed))));
                  }}
                  disabled={isRecording}
                  className="w-full mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Set any value from 1 to 240 minutes.
                </p>
              </div>

              {/* Non-editable Status */}
              <div>
                <Label style={{ fontFamily: 'var(--font-body)' }}>Status</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isVideoOn ? 'bg-[#76B947]' : 'bg-gray-400'}`}></div>
                    <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                      Camera {isVideoOn ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isMicOn ? 'bg-[#76B947]' : 'bg-gray-400'}`}></div>
                    <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                      Microphone {isMicOn ? 'Active' : 'Muted'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${deckFile ? 'bg-[#76B947]' : 'bg-gray-400'}`}></div>
                    <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                      Pitch Deck {deckFile ? 'Loaded' : 'Not Loaded'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Slide progression controls */}
              {deckFile && (
                <div>
                  <Label style={{ fontFamily: 'var(--font-body)' }}>Slides</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        Current slide
                      </span>
                      <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                        {currentSlide}/{Math.max(totalSlides, 1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToSlide(currentSlide - 1)}
                        disabled={currentSlide <= 1}
                      >
                        Prev
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        max={Math.max(totalSlides, 1)}
                        value={currentSlide}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (!Number.isFinite(value)) return;
                          goToSlide(value);
                        }}
                        className="text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToSlide(currentSlide + 1)}
                        disabled={currentSlide >= totalSlides}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="feedback" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feedback">Live Feedback</TabsTrigger>
              <TabsTrigger value="tips">Tips</TabsTrigger>
            </TabsList>
            <TabsContent value="feedback" className="mt-4">
              <Card className="glass-card border-black/5">
                <CardContent className="pt-6">
                  {isNonAiScoring && (
                    <div className="mb-3 rounded-lg border border-yellow-300/40 bg-yellow-100/70 px-3 py-2 text-xs text-yellow-900 dark:bg-yellow-900/25 dark:text-yellow-100" style={{ fontFamily: 'var(--font-body)' }}>
                      AI backend is unavailable right now. Feedback scores in this session are not AI-dependent.
                    </div>
                  )}
                  <div className="space-y-3">
                    {liveFeedback.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="p-3 rounded-lg bg-[#76B947]/10"
                      >
                        <div className="flex items-start space-x-2">
                          <div className="w-2 h-2 rounded-full mt-1.5 bg-[#76B947]"></div>
                          <div className="flex-1">
                            <p className="text-sm text-[#76B947]" style={{ fontFamily: 'var(--font-body)' }}>{feedback.message}</p>
                            <p className="text-xs text-[#76B947]/70 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                              {feedback.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tips" className="mt-4">
              <Card className="glass-card border-black/5">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {liveModelTips.length > 0 ? (
                      liveModelTips.map((tip, index) => (
                        <div key={`${tip}-${index}`} className="p-3 rounded-lg bg-[#76B947]/10 border border-[#76B947]/20">
                          <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                            {tip}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          Model-generated tips will appear once live feedback starts.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="glass-card border-black/5 bg-gradient-to-br from-[#76B947]/10 to-black/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-[#76B947]/20 rounded-full flex items-center justify-center mx-auto">
                  <Volume2 className="h-6 w-6 text-[#76B947]" />
                </div>
                <p className="text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                  Voice-First Mode
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Practice hands-free on mobile
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Adjust settings to optimize your pitch practice experience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backgroundBlur">Background Blur</Label>
              <Switch
                id="backgroundBlur"
                checked={backgroundBlur}
                onCheckedChange={setBackgroundBlur}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noiseCancellation">Noise Cancellation</Label>
              <Switch
                id="noiseCancellation"
                checked={noiseCancellation}
                onCheckedChange={setNoiseCancellation}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoQuality">Video Quality</Label>
              <Select
                value={videoQuality}
                onValueChange={setVideoQuality}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select video quality">
                    {videoQuality}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brightness">Brightness</Label>
              <Slider
                id="brightness"
                value={brightness}
                onValueChange={setBrightness}
                max={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contrast">Contrast</Label>
              <Slider
                id="contrast"
                value={contrast}
                onValueChange={setContrast}
                max={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="micSensitivity">Microphone Sensitivity</Label>
              <Slider
                id="micSensitivity"
                value={micSensitivity}
                onValueChange={setMicSensitivity}
                max={200}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Recording Dialog */}
      <SaveRecordingDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveRecording}
        onPracticeAgain={handlePracticeAgain}
        duration={recordingTime}
        pitchType={pitchType}
        ventures={ventures}
        selectedVentureId={selectedVenture?.id || (ventures[0]?.id ?? '')}
        onVentureChange={(id) => {
          const venture = ventures.find(v => v.id.toString() === id.toString());
          if (venture) setSelectedVenture(venture);
        }}
        pitchMetrics={pitchMetrics}
        videoBlob={recordedBlob}
      />
    </div>
  );
}
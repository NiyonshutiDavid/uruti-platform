import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Mic, MicOff, Video, VideoOff, Upload, StopCircle, Play, Pause, Volume2, Settings, AlertCircle, Check, AlertTriangle, Info, FileText, ChevronLeft, ChevronRight, X, Maximize, Minimize } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { SaveRecordingDialog } from '../SaveRecordingDialog';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';

type SlideTransition = {
  slide: number;
  atSecond: number;
};

export function PitchCoachModule() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [deckUrl, setDeckUrl] = useState<string | null>(null);
  const [deckFileName, setDeckFileName] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(10);
  const [slideTransitions, setSlideTransitions] = useState<SlideTransition[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasShownFullscreenTip, setHasShownFullscreenTip] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [aiListening, setAiListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

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
  const compositionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositionRafRef = useRef<number | null>(null);
  const recorderMimeTypeRef = useRef('video/webm');
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      if (deckUrl) URL.revokeObjectURL(deckUrl);
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

  const handleDeckUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const url = URL.createObjectURL(file);
    setDeckFile(file);
    setDeckUrl(url);
    setDeckFileName(file.name);
    setCurrentSlide(1);
    setTotalSlides(10);
    setSlideTransitions([]);
    // Auto-start camera for picture-in-picture view
    if (!isVideoOn) {
      startCamera();
    }
  }, [isVideoOn]);

  const removeDeck = useCallback(() => {
    if (deckUrl) URL.revokeObjectURL(deckUrl);
    setDeckFile(null);
    setDeckUrl(null);
    setDeckFileName(null);
    setCurrentSlide(1);
    setTotalSlides(10);
    setSlideTransitions([]);
  }, [deckUrl]);

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
  }, [deckUrl, isVideoOn]);

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
      setIsRecording(true);
      setAiListening(true);
      setRecordingTime(0);
      setSlideTransitions([]);
      startRecording();
    } else {
      setIsRecording(false);
      setAiListening(false);
      setIsPaused(false);
      stopRecording();
    }
  };

  const startRecording = () => {
    if (!cameraStreamRef.current) {
      toast.error('Turn on camera before starting the recording');
      setIsRecording(false);
      setAiListening(false);
      return;
    }

    const sourceStream = cameraStreamRef.current;
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
      setRecordedBlob(blob);
      recordedChunksRef.current = [];
      stopComposition();
    };

    mediaRecorder.start(1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // Show save dialog after recording stops
      setTimeout(() => {
        setShowSaveDialog(true);
      }, 500);
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

      ctx.fillStyle = '#1f2937';
      ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

      ctx.fillStyle = '#76B947';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(deckFileName || 'Pitch Session', 40, 62);

      ctx.fillStyle = '#d1d5db';
      ctx.font = '20px sans-serif';
      ctx.fillText(
        `Slide ${currentSlide} / ${Math.max(totalSlides, 1)}  •  ${formatTime(recordingTime)}`,
        40,
        98,
      );

      ctx.fillStyle = '#9ca3af';
      ctx.font = '18px sans-serif';
      ctx.fillText('Face + slide progression recording', 40, 132);

      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        if (deckUrl) {
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

  const changeSlide = (delta: number) => {
    const nextSlide = Math.min(Math.max(currentSlide + delta, 1), Math.max(totalSlides, 1));
    if (nextSlide === currentSlide) return;

    setCurrentSlide(nextSlide);
    if (isRecording) {
      setSlideTransitions((prev) => [
        ...prev,
        { slide: nextSlide, atSecond: recordingTime },
      ]);
    }
  };

  // Simulate live feedback during recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Update metrics randomly to simulate AI feedback
      const metricsInterval = setInterval(() => {
        setPitchMetrics((prev) => ({
          pacing: Math.min(100, Math.max(0, prev.pacing + (Math.random() - 0.5) * 10)),
          clarity: Math.min(100, Math.max(0, prev.clarity + (Math.random() - 0.5) * 10)),
          confidence: Math.min(100, Math.max(0, prev.confidence + (Math.random() - 0.5) * 10)),
          engagement: Math.min(100, Math.max(0, prev.engagement + (Math.random() - 0.5) * 10)),
          structure: Math.min(100, Math.max(0, prev.structure + (Math.random() - 0.5) * 10)),
        }));
      }, 3000);

      // Add live feedback messages
      const feedbackInterval = setInterval(() => {
        const feedbackMessages = [
          { type: 'positive', message: 'Great energy! Keep it up.' },
          { type: 'positive', message: 'Clear value proposition delivered' },
          { type: 'warning', message: 'Slow down your pacing slightly' },
          { type: 'warning', message: 'Try to maintain eye contact with the camera' },
          { type: 'info', message: 'Consider adding more market data' },
          { type: 'info', message: 'Good transition to the next point' },
        ] as Array<{ type: 'positive' | 'warning' | 'info'; message: string }>;

        const randomFeedback = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
        const newFeedback = {
          id: Date.now(),
          type: randomFeedback.type,
          message: randomFeedback.message,
          time: formatTime(recordingTime),
        };

        setLiveFeedback(prev => [newFeedback, ...prev].slice(0, 5)); // Keep only last 5 feedback items
      }, 8000);

      return () => {
        clearInterval(metricsInterval);
        clearInterval(feedbackInterval);
      };
    }
  }, [isRecording, isPaused, recordingTime]);

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

      await apiClient.uploadPitchVideo(venture.id, file, {
        pitch_type: pitchType,
        duration: recordingTime,
        target_duration: targetDuration * 60, // convert minutes to seconds
        notes: enrichedNotes,
      });

      toast.success('Pitch video saved successfully!');
      // Reset state
      setRecordedBlob(null);
      setRecordingTime(0);
      setLiveFeedback([]);
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
                accept=".pdf,.ppt,.pptx"
                className="hidden"
                onChange={handleDeckUpload}
              />

              {deckUrl ? (
                // Pitch Deck Display
                <div className="w-full h-full relative">
                  <iframe
                    src={deckUrl}
                    className="w-full h-full border-0"
                    title="Pitch Deck"
                  />
                  {/* Deck filename badge */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center space-x-2">
                    <FileText className="h-3 w-3 text-[#76B947]" />
                    <span className="text-white text-xs truncate max-w-[200px]" style={{ fontFamily: 'var(--font-body)' }}>
                      {deckFileName}
                    </span>
                    <button onClick={removeDeck} className="text-gray-400 hover:text-white ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-2">
                    <button
                      onClick={() => changeSlide(-1)}
                      className="text-white/90 hover:text-white disabled:text-white/40"
                      disabled={currentSlide <= 1}
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-white text-xs min-w-[70px] text-center" style={{ fontFamily: 'var(--font-heading)' }}>
                      {currentSlide}/{Math.max(totalSlides, 1)}
                    </span>
                    <button
                      onClick={() => changeSlide(1)}
                      className="text-white/90 hover:text-white disabled:text-white/40"
                      disabled={currentSlide >= Math.max(totalSlides, 1)}
                      aria-label="Next slide"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Picture-in-Picture Camera when deck is loaded and camera is on */}
                  {isVideoOn && (
                    <div className="absolute bottom-4 right-4 w-48 aspect-video rounded-lg overflow-hidden border-2 border-[#76B947] shadow-lg">
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

              {/* AI Coach Overlay */}
              {isRecording && (
                <div className={`absolute ${deckUrl ? 'top-12' : 'top-4'} left-4 right-4`}>
                  <div className="glass-panel bg-black/40 backdrop-blur-md rounded-xl p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#76B947] rounded-full animate-pulse" />
                      <p className="text-white text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                        AI Coach is listening...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isFullscreen && isRecording && (
                <div className="absolute top-16 right-4 w-72 rounded-xl bg-black/55 p-3 backdrop-blur-md">
                  <p className="text-xs font-semibold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                    Live AI Feedback
                  </p>
                  <p className="mt-1 text-xs text-white" style={{ fontFamily: 'var(--font-body)' }}>
                    {liveFeedback[0]?.message || 'Analyzing delivery, pacing, and confidence...'}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-gray-200" style={{ fontFamily: 'var(--font-body)' }}>
                    <span>Pacing: {pitchMetrics.pacing}%</span>
                    <span>Clarity: {pitchMetrics.clarity}%</span>
                    <span>Confidence: {pitchMetrics.confidence}%</span>
                    <span>Engagement: {pitchMetrics.engagement}%</span>
                  </div>
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

              {/* Live Feedback Toast */}
              {isRecording && liveFeedback[0] && (
                <div className="absolute bottom-20 left-4 right-4">
                  <div className={`glass-panel backdrop-blur-md rounded-xl p-3 ${
                    liveFeedback[0].type === 'positive' ? 'bg-[#76B947]/20' :
                    liveFeedback[0].type === 'warning' ? 'bg-yellow-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    <p className="text-white text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                      {liveFeedback[0].message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Control Bar */}
            <div className="glass-panel bg-black/95 backdrop-blur-md p-4">
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
                    onClick={() => deckUrl ? removeDeck() : deckInputRef.current?.click()}
                  >
                    {deckUrl ? (
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
                <Select
                  value={targetDuration.toString()}
                  onValueChange={(value: string) => setTargetDuration(parseInt(value))}
                  disabled={isRecording}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select duration">
                      {targetDuration} minutes
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="2">2 minutes</SelectItem>
                    <SelectItem value="3">3 minutes</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="7">7 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
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
                    <div className={`w-2 h-2 rounded-full ${deckUrl ? 'bg-[#76B947]' : 'bg-gray-400'}`}></div>
                    <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                      Pitch Deck {deckUrl ? 'Loaded' : 'Not Loaded'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Slide progression controls */}
              {deckUrl && (
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
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => changeSlide(-1)}
                        disabled={currentSlide <= 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => changeSlide(1)}
                        disabled={currentSlide >= Math.max(totalSlides, 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    <div>
                      <Label style={{ fontFamily: 'var(--font-body)' }} htmlFor="totalSlides">
                        Total slides
                      </Label>
                      <input
                        id="totalSlides"
                        type="number"
                        min={1}
                        max={200}
                        value={totalSlides}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          const safeValue = Number.isFinite(value)
                            ? Math.min(200, Math.max(1, Math.floor(value)))
                            : 1;
                          setTotalSlides(safeValue);
                          if (currentSlide > safeValue) {
                            setCurrentSlide(safeValue);
                          }
                        }}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
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
                  <div className="space-y-3">
                    {liveFeedback.map((feedback) => (
                      <div
                        key={feedback.id}
                        className={`p-3 rounded-lg ${
                          feedback.type === 'positive' ? 'bg-[#76B947]/10' :
                          feedback.type === 'warning' ? 'bg-yellow-500/10' :
                          'bg-blue-500/10'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${
                            feedback.type === 'positive' ? 'bg-[#76B947]' :
                            feedback.type === 'warning' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>{feedback.message}</p>
                            <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
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
                    <div className="p-3 rounded-lg bg-[#76B947]/10">
                      <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        Start with a compelling hook that addresses the problem
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#76B947]/10">
                      <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        Maintain eye contact with the camera
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#76B947]/10">
                      <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        Use data to back your market opportunity claims
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#76B947]/10">
                      <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        Practice your transitions between slides
                      </p>
                    </div>
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
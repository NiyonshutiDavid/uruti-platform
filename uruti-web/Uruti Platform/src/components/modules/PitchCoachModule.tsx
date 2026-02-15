import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Mic, MicOff, Video, VideoOff, MonitorUp, StopCircle, Play, Pause, Volume2, Settings, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';

export function PitchCoachModule() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [aiListening, setAiListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Settings states
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [noiseCancellation, setNoiseCancellation] = useState(false);
  const [videoQuality, setVideoQuality] = useState('720p');
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [micSensitivity, setMicSensitivity] = useState([100]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time AI feedback metrics
  const [pitchMetrics] = useState({
    pacing: 78,
    clarity: 85,
    confidence: 72,
    engagement: 80,
    structure: 88
  });

  // Real-time feedback cues
  const [liveFeedback] = useState([
    { id: 1, type: 'positive', message: 'Great opening! Strong value proposition', time: '0:45' },
    { id: 2, type: 'warning', message: 'Slow down your pacing slightly', time: '1:23' },
    { id: 3, type: 'info', message: 'Consider adding more market data here', time: '2:15' }
  ]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopScreenShare();
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

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

  const startScreenShare = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      screenStreamRef.current = stream;

      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

      if (screenRef.current) {
        screenRef.current.srcObject = stream;
        screenRef.current.play();
      }

      setIsPresenting(true);
      
      // Auto-start camera for picture-in-picture view
      if (!isVideoOn) {
        await startCamera();
      }
    } catch (err: any) {
      console.error('Error sharing screen:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Screen sharing was cancelled or denied. Click "Present" to try again.');
      } else if (err.message && err.message.includes('disallowed by permissions policy')) {
        setError('Screen sharing requires HTTPS or localhost. Please ensure you\'re using a secure connection.');
      } else {
        setError('Unable to share screen. Please check browser permissions and try again.');
      }
      
      setIsPresenting(false);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (screenRef.current) {
      screenRef.current.srcObject = null;
    }

    setIsPresenting(false);
  };

  const toggleScreenShare = async () => {
    if (isPresenting) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setAiListening(true);
      setRecordingTime(0);
    } else {
      setIsRecording(false);
      setAiListening(false);
      setIsPaused(false);
    }
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
            <div className="relative bg-black aspect-video flex items-center justify-center">
              {isPresenting ? (
                // Screen Share Display
                <video
                  ref={screenRef}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  muted
                />
              ) : isVideoOn ? (
                // Camera Display
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
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
                      Click the camera button to start
                    </p>
                  </div>
                </div>
              )}

              {/* Picture-in-Picture Camera when screen sharing */}
              {isPresenting && isVideoOn && (
                <div className="absolute bottom-4 right-4 w-48 aspect-video rounded-lg overflow-hidden border-2 border-[#76B947] shadow-lg">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                </div>
              )}

              {/* AI Coach Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 right-4">
                  <div className="glass-panel bg-black/40 backdrop-blur-md rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-1 bg-[#76B947] rounded-full animate-pulse-wave"
                            style={{
                              height: `${20 + Math.random() * 20}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-white text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                        AI Coach is listening...
                      </p>
                    </div>
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
                    onClick={toggleScreenShare}
                  >
                    <MonitorUp className="h-4 w-4 mr-2" />
                    {isPresenting ? 'Stop Presenting' : 'Present'}
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
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Current Venture</p>
                <p className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>AgriConnect</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Pitch Type</p>
                <Badge className="bg-[#76B947]/20 text-[#76B947]">Investor Pitch</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Target Duration</p>
                <p className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>5 minutes</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isVideoOn ? 'bg-[#76B947]' : 'bg-gray-400'}`}></div>
                  <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                    Camera {isVideoOn ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isMicOn ? 'bg-[#76B947]' : 'bg-gray-400'}`}></div>
                  <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                    Microphone {isMicOn ? 'Active' : 'Muted'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isPresenting ? 'bg-[#76B947]' : 'bg-gray-400'}`}></div>
                  <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                    Screen {isPresenting ? 'Sharing' : 'Not Sharing'}
                  </span>
                </div>
              </div>
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
    </div>
  );
}
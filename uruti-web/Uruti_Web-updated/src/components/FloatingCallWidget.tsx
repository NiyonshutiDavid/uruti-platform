import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Mic, MicOff, PhoneOff, Maximize2, Minimize2, X } from 'lucide-react';

interface FloatingCallWidgetProps {
  open: boolean;
  onClose: () => void;
  type: 'voice' | 'video';
  isRinging: boolean;
  isIncoming: boolean;
  contactName: string;
  contactAvatar?: string;
  contactOnline: boolean;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  remoteVideoEnabled: boolean;
}

export function FloatingCallWidget({
  open,
  onClose,
  type,
  isRinging,
  isIncoming,
  contactName,
  contactAvatar,
  contactOnline,
  localStream,
  remoteStream,
  remoteVideoEnabled,
}: FloatingCallWidgetProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const localFullVideoRef = useRef<HTMLVideoElement>(null);
  const localPreviewVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localMiniVideoRef = useRef<HTMLVideoElement>(null);
  const remoteMiniVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open && position === null) {
      const width = isMinimized ? 320 : 800;
      const height = isMinimized ? 180 : 650;
      setPosition({
        x: (window.innerWidth - width) / 2,
        y: (window.innerHeight - height) / 2,
      });
    }
  }, [open, position, isMinimized]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (!open) {
      setCallDuration(0);
      setIsMuted(false);
      setIsMinimized(false);
      setPosition(null);
      if (localFullVideoRef.current) localFullVideoRef.current.srcObject = null;
      if (localPreviewVideoRef.current) localPreviewVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (localMiniVideoRef.current) localMiniVideoRef.current.srcObject = null;
      if (remoteMiniVideoRef.current) remoteMiniVideoRef.current.srcObject = null;
    } else if (isRinging) {
      setCallDuration(0);
    } else {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, isRinging]);

  useEffect(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  }, [isMuted, localStream]);

  useEffect(() => {
    if (!open || type !== 'video') return;
    const localToShow = localStream ?? null;

    if (localFullVideoRef.current) {
      localFullVideoRef.current.srcObject = localToShow;
    }
    if (localPreviewVideoRef.current) {
      localPreviewVideoRef.current.srcObject = localToShow;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream ?? null;
    }
    if (localMiniVideoRef.current) {
      localMiniVideoRef.current.srcObject = localToShow;
    }
    if (remoteMiniVideoRef.current) {
      remoteMiniVideoRef.current.srcObject = remoteStream ?? null;
    }
  }, [open, type, localStream, remoteStream, isMinimized]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - (isMinimized ? 320 : 800);
      const maxY = window.innerHeight - (isMinimized ? 180 : 650);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isMinimized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!widgetRef.current) return;

    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasRemoteVideo = Boolean(remoteStream && remoteStream.getVideoTracks().length > 0);
  const showOutgoingPreview =
    type === 'video' &&
    isRinging &&
    !isIncoming &&
    !hasRemoteVideo;
  const showConnectedVideo = type === 'video' && !isRinging;

  if (!open) return null;

  return (
    <div
      ref={widgetRef}
      className={`fixed z-[100] ${isMinimized ? 'w-80' : 'w-[800px]'} ${isMinimized ? 'h-44' : 'h-[650px]'} glass-card border-2 border-[#76B947]/50 rounded-xl overflow-hidden shadow-2xl transition-all duration-300`}
      style={{
        left: position ? `${position.x}px` : 'auto',
        top: position ? `${position.y}px` : 'auto',
        cursor: isDragging ? 'grabbing' : 'auto',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-md z-10 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className={`${isMinimized ? 'h-10 w-10' : 'h-12 w-12'} border-2 border-[#76B947]`}>
              <AvatarImage src={contactAvatar} />
              <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                {contactName.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={`text-white font-semibold truncate ${isMinimized ? 'text-sm' : 'text-base'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                {contactName}
              </p>
              <p className={`text-white/70 ${isMinimized ? 'text-xs' : 'text-sm'}`} style={{ fontFamily: 'var(--font-body)' }}>
                {isRinging
                  ? (isIncoming ? 'Incoming call...' : 'Calling...')
                  : (callDuration > 0 ? formatDuration(callDuration) : 'Connected')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-red-500/80 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative w-full h-full bg-gradient-to-br from-black to-gray-900">
        {showConnectedVideo && hasRemoteVideo && remoteVideoEnabled && !isMinimized && (
          <div className="absolute inset-0">
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          </div>
        )}

        {!(showConnectedVideo && hasRemoteVideo && remoteVideoEnabled) && !isMinimized && (
          <div className="absolute inset-0 flex items-center justify-center pt-16">
            <div className="text-center">
              <Avatar className="h-40 w-40 mx-auto mb-4 border-4 border-[#76B947]">
                <AvatarImage src={contactAvatar} />
                <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-5xl">
                  {contactName.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {contactOnline && !isRinging && (
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm">Online</span>
                </div>
              )}
              {isRinging && !isIncoming && (
                <p className="text-white/70 text-sm">Ringing... waiting for pickup</p>
              )}
              {!isRinging && type === 'video' && (
                <p className="text-white/70 text-sm">Connected. Waiting for remote camera feed...</p>
              )}
            </div>
          </div>
        )}

        {type === 'video' && !isMinimized && (
          <div className="absolute bottom-28 right-6 w-32 aspect-video rounded-lg overflow-hidden border-2 border-[#76B947] shadow-lg bg-black/80 z-20">
            <video
              ref={localPreviewVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute left-2 bottom-1 text-[10px] text-white/90">You</div>
          </div>
        )}

        {type === 'video' && isMinimized && (
          <div className="absolute top-14 left-0 right-0 bottom-14 px-3 py-2">
            <div className="relative h-full rounded-lg overflow-hidden border border-white/30 bg-black/70">
              {hasRemoteVideo && remoteVideoEnabled ? (
                <video
                  ref={remoteMiniVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800/90">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contactAvatar} />
                    <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-xs">
                      {contactName.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute left-2 top-1 text-[10px] text-white/90">{contactName}</div>

              <div className="absolute bottom-2 right-2 w-24 h-16 rounded overflow-hidden border border-[#76B947] bg-black/80">
                <video
                  ref={localMiniVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="absolute left-1 bottom-0 text-[9px] text-white/90">You</div>
              </div>
            </div>
          </div>
        )}

        {type === 'voice' && isMinimized && (
          <div className="absolute top-14 left-0 right-0 bottom-14 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse absolute -top-1 -right-1 z-10" />
                <div className="w-16 h-16 rounded-full bg-[#76B947]/20 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-[#76B947]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {!isMinimized && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-30 pointer-events-auto">
            <div className="flex items-center justify-center space-x-4">
              <Button
                size="lg"
                variant={isMuted ? 'destructive' : 'default'}
                className={`w-14 h-14 rounded-full ${!isMuted && 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30'}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-white" />}
              </Button>

              <Button
                size="lg"
                variant="destructive"
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600"
                onClick={onClose}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {isMinimized && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-md z-30 pointer-events-auto">
            <div className="flex items-center justify-center space-x-2">
              <Button
                size="sm"
                variant={isMuted ? 'destructive' : 'ghost'}
                className={`h-8 w-8 p-0 rounded-full ${!isMuted && 'text-white hover:bg-white/10'}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0 rounded-full"
                onClick={onClose}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

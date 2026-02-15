import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Maximize2, Minimize2, X } from 'lucide-react';

interface FloatingCallWidgetProps {
  open: boolean;
  onClose: () => void;
  type: 'voice' | 'video';
  contactName: string;
  contactAvatar?: string;
  contactOnline: boolean;
}

export function FloatingCallWidget({ open, onClose, type, contactName, contactAvatar, contactOnline }: FloatingCallWidgetProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Initialize centered position on first open
  useEffect(() => {
    if (open && position === null) {
      const width = isMinimized ? 320 : 800;
      const height = isMinimized ? 180 : 650;
      setPosition({
        x: (window.innerWidth - width) / 2,
        y: (window.innerHeight - height) / 2
      });
    }
  }, [open, position, isMinimized]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (open) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOff(false);
      setIsMinimized(false);
      setPosition(null); // Reset position when call ends
    }
    
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Constrain to viewport
        const maxX = window.innerWidth - (isMinimized ? 320 : 800);
        const maxY = window.innerHeight - (isMinimized ? 180 : 650);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
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
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
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

  const handleEndCall = () => {
    onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={widgetRef}
      className={`fixed z-[100] ${isMinimized ? 'w-80' : 'w-[800px]'} ${isMinimized ? 'h-44' : 'h-[650px]'} glass-card border-2 border-[#76B947]/50 rounded-xl overflow-hidden shadow-2xl transition-all duration-300`}
      style={{
        left: position ? `${position.x}px` : 'auto',
        top: position ? `${position.y}px` : 'auto',
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      {/* Draggable Header */}
      <div 
        className="absolute top-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-md z-10 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className={`${isMinimized ? 'h-10 w-10' : 'h-12 w-12'} border-2 border-[#76B947]`}>
              <AvatarImage src={contactAvatar} />
              <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                {contactName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={`text-white font-semibold truncate ${isMinimized ? 'text-sm' : 'text-base'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                {contactName}
              </p>
              <p className={`text-white/70 ${isMinimized ? 'text-xs' : 'text-sm'}`} style={{ fontFamily: 'var(--font-body)' }}>
                {formatDuration(callDuration)}
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
              onClick={handleEndCall}
              className="text-white hover:bg-red-500/80 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Call Content */}
      <div className={`relative w-full h-full bg-gradient-to-br from-black to-gray-900`}>
        {/* Video Feed (for video calls) */}
        {type === 'video' && !isVideoOff && !isMinimized && (
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          </div>
        )}

        {/* Contact Avatar (for voice calls or video off) */}
        {((type === 'voice' || isVideoOff) && !isMinimized) && (
          <div className="absolute inset-0 flex items-center justify-center pt-16">
            <div className="text-center">
              <Avatar className="h-40 w-40 mx-auto mb-4 border-4 border-[#76B947]">
                <AvatarImage src={contactAvatar} />
                <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-5xl">
                  {contactName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {contactOnline && (
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm">Online</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Video Thumbnails (Picture-in-Picture for video calls) */}
        {type === 'video' && !isVideoOff && !isMinimized && (
          <div className="absolute bottom-28 right-6 flex space-x-2">
            {/* Their Video Thumbnail */}
            <div className="w-32 aspect-video rounded-lg overflow-hidden border-2 border-white/30 shadow-lg bg-gray-800">
              <div className="w-full h-full flex items-center justify-center">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contactAvatar} />
                  <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-xs">
                    {contactName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            
            {/* My Video Thumbnail */}
            <div className="w-32 aspect-video rounded-lg overflow-hidden border-2 border-[#76B947] shadow-lg bg-gray-800">
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white text-xs" style={{ fontFamily: 'var(--font-body)' }}>You</p>
              </div>
            </div>
          </div>
        )}

        {/* Minimized Video Thumbnails */}
        {type === 'video' && !isVideoOff && isMinimized && (
          <div className="absolute top-14 left-0 right-0 bottom-14 flex items-center justify-center space-x-2 px-4">
            {/* Contact Thumbnail */}
            <div className="flex-1 h-20 rounded-lg overflow-hidden border-2 border-white/30 bg-gray-800 flex items-center justify-center">
              <Avatar className="h-12 w-12">
                <AvatarImage src={contactAvatar} />
                <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-xs">
                  {contactName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* My Thumbnail */}
            <div className="flex-1 h-20 rounded-lg overflow-hidden border-2 border-[#76B947] bg-gray-800 flex items-center justify-center">
              <p className="text-white text-xs" style={{ fontFamily: 'var(--font-body)' }}>You</p>
            </div>
          </div>
        )}

        {/* Voice Call Minimized View */}
        {(type === 'voice' || isVideoOff) && isMinimized && (
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

        {/* Call Controls - Full View */}
        {!isMinimized && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center space-x-4">
              {/* Microphone Toggle */}
              <Button
                size="lg"
                variant={isMuted ? "destructive" : "default"}
                className={`w-14 h-14 rounded-full ${!isMuted && 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30'}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-white" />}
              </Button>

              {/* Video Toggle (for video calls) */}
              {type === 'video' && (
                <Button
                  size="lg"
                  variant={isVideoOff ? "destructive" : "default"}
                  className={`w-14 h-14 rounded-full ${!isVideoOff && 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30'}`}
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  {isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5 text-white" />}
                </Button>
              )}

              {/* End Call */}
              <Button
                size="lg"
                variant="destructive"
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Minimized Call Controls */}
        {isMinimized && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-md">
            <div className="flex items-center justify-center space-x-2">
              <Button
                size="sm"
                variant={isMuted ? "destructive" : "ghost"}
                className={`h-8 w-8 p-0 rounded-full ${!isMuted && 'text-white hover:bg-white/10'}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              {type === 'video' && (
                <Button
                  size="sm"
                  variant={isVideoOff ? "destructive" : "ghost"}
                  className={`h-8 w-8 p-0 rounded-full ${!isVideoOff && 'text-white hover:bg-white/10'}`}
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  {isVideoOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
                </Button>
              )}

              <Button
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0 rounded-full"
                onClick={handleEndCall}
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
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';

interface CallDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'voice' | 'video';
  contactName: string;
  contactAvatar?: string;
  contactOnline: boolean;
}

export function CallDialog({ open, onClose, type, contactName, contactAvatar, contactOnline }: CallDialogProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
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
    }
    
    return () => clearInterval(interval);
  }, [open]);

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`glass-card border-black/5 dark:border-white/10 overflow-hidden p-0 ${isMinimized ? 'max-w-md' : 'max-w-4xl'}`}>
        <div className={`relative ${isMinimized ? 'h-32' : 'h-[600px]'} bg-gradient-to-br from-black to-gray-900`}>
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
          {(type === 'voice' || isVideoOff) && !isMinimized && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-[#76B947]">
                  <AvatarImage src={contactAvatar} />
                  <AvatarFallback className="bg-[#76B947]/20 text-[#76B947] text-4xl">
                    {contactName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="relative inline-block">
                  {contactOnline && (
                    <div className="w-4 h-4 bg-green-500 rounded-full absolute -right-1 -top-1 border-2 border-black animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Call Info Overlay */}
          <div className="absolute top-0 left-0 right-0 p-6">
            <div className="flex items-center justify-between">
              <div className={`${isMinimized ? '' : 'text-center'} flex-1`}>
                {!isMinimized && (
                  <>
                    <p className="text-white text-2xl font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                      {contactName}
                    </p>
                    <p className="text-white/80 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                      {formatDuration(callDuration)}
                    </p>
                  </>
                )}
                {isMinimized && (
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border-2 border-[#76B947]">
                      <AvatarImage src={contactAvatar} />
                      <AvatarFallback className="bg-[#76B947]/20 text-[#76B947]">
                        {contactName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                        {contactName}
                      </p>
                      <p className="text-white/70 text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                        {formatDuration(callDuration)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/10"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* My Video (Picture-in-Picture for video calls) */}
          {type === 'video' && !isVideoOff && !isMinimized && (
            <div className="absolute bottom-24 right-6 w-48 aspect-video rounded-lg overflow-hidden border-2 border-[#76B947] shadow-lg">
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <p className="text-white text-xs" style={{ fontFamily: 'var(--font-body)' }}>Your Video</p>
              </div>
            </div>
          )}

          {/* Call Controls */}
          {!isMinimized && (
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-center justify-center space-x-4">
                {/* Microphone Toggle */}
                <Button
                  size="lg"
                  variant={isMuted ? "destructive" : "default"}
                  className={`w-16 h-16 rounded-full ${!isMuted && 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30'}`}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6 text-white" />}
                </Button>

                {/* Video Toggle (for video calls) */}
                {type === 'video' && (
                  <Button
                    size="lg"
                    variant={isVideoOff ? "destructive" : "default"}
                    className={`w-16 h-16 rounded-full ${!isVideoOff && 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30'}`}
                    onClick={() => setIsVideoOff(!isVideoOff)}
                  >
                    {isVideoOff ? <VideoOff className="h-6 w-6" /> : <VideoIcon className="h-6 w-6 text-white" />}
                  </Button>
                )}

                {/* End Call */}
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}

          {/* Minimized Call Controls */}
          {isMinimized && (
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  size="sm"
                  variant={isMuted ? "destructive" : "ghost"}
                  className={`${!isMuted && 'text-white hover:bg-white/10'}`}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                {type === 'video' && (
                  <Button
                    size="sm"
                    variant={isVideoOff ? "destructive" : "ghost"}
                    className={`${!isVideoOff && 'text-white hover:bg-white/10'}`}
                    onClick={() => setIsVideoOff(!isVideoOff)}
                  >
                    {isVideoOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

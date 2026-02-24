import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Mic, MicOff, Video, VideoOff, Phone, Signal } from 'lucide-react';
import { Button } from './ui/button';

interface VideoCallViewProps {
  localStream?: MediaStream;
  participants: Array<{
    id: string;
    name: string;
    stream?: MediaStream;
    isVideoOn: boolean;
    isAudioOn: boolean;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  }>;
  isVideoOn: boolean;
  isAudioOn: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onEndCall: () => void;
  onEndCallWithPeer?: (peerId: string) => void;
}

/**
 * Remote video participant component
 */
function RemoteVideoParticipant(props: {
  participant: VideoCallViewProps['participants'][0];
  onEndCall?: (peerId: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && props.participant.stream) {
      videoRef.current.srcObject = props.participant.stream;
    }
  }, [props.participant.stream]);

  const getConnectionColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConnectionLabel = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video group">
      {props.participant.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
          <div className="text-center space-y-2">
            <Video className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="text-white text-sm">{props.participant.name}</p>
            <p className="text-gray-400 text-xs">Camera off</p>
          </div>
        </div>
      )}

      {/* Participant Info Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-white font-semibold text-sm">{props.participant.name}</p>
            <div className="flex items-center space-x-2">
              <Signal className="h-3 w-3" />
              <span className={`text-xs px-2 py-1 rounded ${getConnectionColor(props.participant.connectionQuality)}`}>
                {getConnectionLabel(props.participant.connectionQuality)}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => props.onEndCall?.(props.participant.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Phone className="h-4 w-4" />
          </Button>
        </div>

        {/* Audio/Video Status */}
        <div className="flex space-x-2">
          {!props.participant.isVideoOn && (
            <Badge variant="destructive" className="text-xs">
              <VideoOff className="h-3 w-3 mr-1" />
              Camera Off
            </Badge>
          )}
          {!props.participant.isAudioOn && (
            <Badge variant="destructive" className="text-xs">
              <MicOff className="h-3 w-3 mr-1" />
              Muted
            </Badge>
          )}
        </div>
      </div>

      {/* Connection Quality Indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-3 h-3 rounded-full ${getConnectionColor(props.participant.connectionQuality)} animate-pulse`} />
      </div>
    </div>
  );
}

/**
 * Main video call view component
 */
export function VideoCallView(props: VideoCallViewProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && props.localStream) {
      localVideoRef.current.srcObject = props.localStream;
    }
  }, [props.localStream]);

  const participantCount = props.participants.length;

  // Determine grid layout based on participant count
  const getGridClass = () => {
    if (participantCount <= 2) return 'grid-cols-1 lg:grid-cols-2';
    if (participantCount <= 4) return 'grid-cols-2';
    return 'grid-cols-2 lg:grid-cols-3';
  };

  return (
    <div className="space-y-4">
      {/* Remote Participants Grid */}
      {participantCount > 0 && (
        <Card className="glass-card border-black/5 overflow-hidden">
          <CardContent className="p-4">
            <div className={`grid ${getGridClass()} gap-4`}>
              {props.participants.map((participant) => (
                <RemoteVideoParticipant
                  key={participant.id}
                  participant={participant}
                  onEndCall={props.onEndCallWithPeer}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Local Video (Picture-in-Picture when participants present) */}
      {props.localStream && (
        <div
          className={`${
            participantCount > 0 ? 'w-48 aspect-video' : 'w-full aspect-video'
          } relative bg-black rounded-lg overflow-hidden group`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Local Status Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
            <p className="text-white font-semibold text-sm">You</p>

            <div className="space-y-2">
              {/* Call Controls */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={props.isVideoOn ? 'default' : 'destructive'}
                  onClick={props.onToggleVideo}
                  className="text-xs"
                >
                  {props.isVideoOn ? (
                    <>
                      <Video className="h-3 w-3 mr-1" />
                      Camera On
                    </>
                  ) : (
                    <>
                      <VideoOff className="h-3 w-3 mr-1" />
                      Camera Off
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant={props.isAudioOn ? 'default' : 'destructive'}
                  onClick={props.onToggleAudio}
                  className="text-xs"
                >
                  {props.isAudioOn ? (
                    <>
                      <Mic className="h-3 w-3 mr-1" />
                      Unmuted
                    </>
                  ) : (
                    <>
                      <MicOff className="h-3 w-3 mr-1" />
                      Muted
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={props.onEndCall}
                  className="text-xs"
                >
                  <Phone className="h-3 w-3" />
                </Button>
              </div>

              {/* Stream Status */}
              <div className="flex flex-wrap gap-1">
                {!props.isVideoOn && (
                  <Badge variant="outline" className="text-xs bg-red-500/20">
                    <VideoOff className="h-2 w-2 mr-1" />
                    Camera Off
                  </Badge>
                )}
                {!props.isAudioOn && (
                  <Badge variant="outline" className="text-xs bg-red-500/20">
                    <MicOff className="h-2 w-2 mr-1" />
                    Muted
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

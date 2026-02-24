/**
 * Integrated Video Call Hook with WebSocket Signaling
 * 
 * Combines WebRTC video calling with backend signaling server.
 * Handles offer/answer/ICE candidate exchange through WebSocket.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSignalingWebSocket } from './useSignalingWebSocket';
import {
  createPeerConnection,
  addLocalStream,
  createOffer,
  createAnswer,
  setRemoteAnswer,
  addIceCandidate,
  closePeerConnection,
  getConnectionStats,
  PeerConnection,
  SignalingMessage
} from './webrtc-utils';

export interface CallParticipant {
  id: string;
  name: string;
  stream?: MediaStream;
  isVideoOn: boolean;
  isAudioOn: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface UseIntegratedVideoCallOptions {
  onParticipantJoined?: (participant: CallParticipant) => void;
  onParticipantLeft?: (participantId: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Integrated hook for WebRTC video calls with WebSocket signaling
 */
export function useIntegratedVideoCall(
  userId: string,
  options?: UseIntegratedVideoCallOptions
) {
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availablePeers, setAvailablePeers] = useState<any[]>([]);

  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const statsIntervalRef = useRef<NodeJS.Timeout>();
  const sessionIdRef = useRef<string>(
    Math.random().toString(36).substring(7)
  );
  const handleMessageRef = useRef<(message: any) => Promise<void>>();

  // Initialize signaling WebSocket - will be updated after handler is defined
  const signaling = useSignalingWebSocket(userId, {
    onMessage: (message) => {
      if (handleMessageRef.current) {
        handleMessageRef.current(message);
      }
    },
    onError: (err) => {
      setError(`Signaling error: ${err.message}`);
      options?.onError?.(err);
    }
  });

  /**
   * Handle incoming signaling message
   */
  const handleSignalingMessage = useCallback(
    async (message: any) => {
      const { type, from: fromPeerId, data } = message;

      // Skip if fromPeerId is missing
      if (!fromPeerId) {
        console.warn('Received message without fromPeerId');
        return;
      }

      try {
        if (type === 'offer' && data?.sdp) {
          const remoteUserName = data?.name || `Peer ${fromPeerId.substring(0, 6)}`;
          await handleOffer(data.sdp, fromPeerId, remoteUserName);
        } else if (type === 'answer' && data?.sdp) {
          await handleAnswer(data.sdp, fromPeerId);
        } else if (type === 'ice-candidate' && data?.candidate) {
          await handleIceCandidate(
            new RTCIceCandidate(data.candidate),
            fromPeerId
          );
        }
      } catch (err) {
        console.error(`Error handling ${type} message:`, err);
      }
    },
    []
  );

  // Update the ref with the handler
  useEffect(() => {
    handleMessageRef.current = handleSignalingMessage;
  }, [handleSignalingMessage]);

  /**
   * Initialize local media stream
   */
  const initializeLocalStream = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      const errorMsg =
        err.name === 'NotAllowedError'
          ? 'Camera/microphone access denied'
          : `Failed to initialize media: ${err.message}`;
      setError(errorMsg);
      options?.onError?.(err);
      throw err;
    }
  }, [options]);

  /**
   * Start a call with another peer through signaling server
   */
  const startCall = useCallback(
    async (remotePeerId: string, remoteUserName: string) => {
      try {
        if (!localStream) {
          throw new Error('Local stream not initialized');
        }

        if (!signaling.connected) {
          throw new Error('Signaling server not connected');
        }

        // Create peer connection
        const peerConnection = createPeerConnection(
          (candidate) => {
            // Send ICE candidate through signaling server
            signaling.sendIceCandidate(
              remotePeerId,
              candidate,
              sessionIdRef.current
            );
          },
          (remoteStream) => {
            // Update participant with remote stream
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === remotePeerId
                  ? { ...p, stream: remoteStream }
                  : p
              )
            );
          }
        );

        // Add local stream to peer connection
        addLocalStream(peerConnection, localStream);

        // Store peer connection
        peersRef.current.set(remotePeerId, {
          id: remotePeerId,
          peerConnection,
          offerSent: false
        });

        // Create and send offer through signaling server
        const offer = await createOffer(peerConnection);
        signaling.sendOffer(
          remotePeerId,
          offer.sdp || '',
          sessionIdRef.current
        );

        // Update peer as having sent offer
        const peer = peersRef.current.get(remotePeerId)!;
        peer.offerSent = true;

        // Add participant
        setParticipants((prev) => {
          const exists = prev.find((p) => p.id === remotePeerId);
          if (!exists) {
            return [
              ...prev,
              {
                id: remotePeerId,
                name: remoteUserName,
                isVideoOn: true,
                isAudioOn: true,
                connectionQuality: 'good'
              }
            ];
          }
          return prev;
        });

        options?.onParticipantJoined?.({
          id: remotePeerId,
          name: remoteUserName,
          isVideoOn: true,
          isAudioOn: true,
          connectionQuality: 'good'
        });

        setIsCallActive(true);
      } catch (err: any) {
        const errorMsg = `Failed to start call: ${err.message}`;
        setError(errorMsg);
        options?.onError?.(err);
      }
    },
    [userId, localStream, signaling, options]
  );

  /**
   * Handle incoming offer from remote peer
   */
  const handleOffer = useCallback(
    async (
      offer: RTCSessionDescriptionInit,
      remotePeerId: string | undefined,
      remoteUserName?: string
    ) => {
      if (!remotePeerId) return;
      const peerName = remoteUserName || `Peer ${remotePeerId.substring(0, 6)}`;
      try {
        if (!localStream) {
          throw new Error('Local stream not initialized');
        }

        let peerConnection = peersRef.current.get(remotePeerId)
          ?.peerConnection;

        if (!peerConnection) {
          peerConnection = createPeerConnection(
            (candidate) => {
              signaling.sendIceCandidate(
                remotePeerId,
                candidate,
                sessionIdRef.current
              );
            },
            (remoteStream) => {
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === remotePeerId
                    ? { ...p, stream: remoteStream }
                    : p
                )
              );
            }
          );

          addLocalStream(peerConnection, localStream);

          peersRef.current.set(remotePeerId, {
            id: remotePeerId,
            peerConnection,
            offerSent: false
          });

          // Add participant
          setParticipants((prev) =>
            prev.length === 0
              ? [
                  {
                    id: remotePeerId,
                    name: peerName,
                    isVideoOn: true,
                    isAudioOn: true,
                    connectionQuality: 'good'
                  }
                ]
              : prev
          );

          options?.onParticipantJoined?.({
            id: remotePeerId,
            name: peerName,
            isVideoOn: true,
            isAudioOn: true,
            connectionQuality: 'good'
          });
        }

        // Set remote description
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        // Create and send answer through signaling server
        const answer = await createAnswer(peerConnection, offer);
        signaling.sendAnswer(
          remotePeerId,
          answer.sdp,
          sessionIdRef.current
        );

        setIsCallActive(true);
      } catch (err: any) {
        const errorMsg = `Failed to handle offer: ${err.message}`;
        setError(errorMsg);
        options?.onError?.(err);
      }
    },
    [localStream, signaling, options]
  );

  /**
   * Handle incoming answer from remote peer
   */
  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit, remotePeerId: string | undefined) => {
      if (!remotePeerId) return;
      try {
        const peer = peersRef.current.get(remotePeerId);
        if (peer) {
          await setRemoteAnswer(peer.peerConnection, answer);
        }
      } catch (err: any) {
        const errorMsg = `Failed to handle answer: ${err.message}`;
        setError(errorMsg);
        options?.onError?.(err);
      }
    },
    [options]
  );

  /**
   * Handle incoming ICE candidate
   */
  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidate, remotePeerId: string) => {
      try {
        const peer = peersRef.current.get(remotePeerId);
        if (peer) {
          await addIceCandidate(peer.peerConnection, candidate);
        }
      } catch (err) {
        console.error('Failed to add ICE candidate:', err);
      }
    },
    []
  );

  /**
   * Toggle video on/off
   */
  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  }, [localStream, isVideoOn]);

  /**
   * Toggle audio on/off
   */
  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioOn;
      });
      setIsAudioOn(!isAudioOn);

      // Update peer connection audio
      peersRef.current.forEach((peer) => {
        peer.peerConnection
          .getSenders()
          .forEach((sender) => {
            if (sender.track?.kind === 'audio') {
              sender.track.enabled = !isAudioOn;
            }
          });
      });
    }
  }, [localStream, isAudioOn]);

  /**
   * End call with specific peer
   */
  const endCallWithPeer = useCallback((remotePeerId: string) => {
    const peer = peersRef.current.get(remotePeerId);
    if (peer) {
      closePeerConnection(peer.peerConnection);
      peersRef.current.delete(remotePeerId);
    }

    setParticipants((prev) => prev.filter((p) => p.id !== remotePeerId));
    options?.onParticipantLeft?.(remotePeerId);

    if (peersRef.current.size === 0) {
      setIsCallActive(false);
    }
  }, [options]);

  /**
   * End all calls
   */
  const endAllCalls = useCallback(() => {
    peersRef.current.forEach((peer) => {
      closePeerConnection(peer.peerConnection);
    });
    peersRef.current.clear();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setParticipants([]);
    setIsCallActive(false);
  }, [localStream]);

  /**
   * Monitor connection quality
   */
  useEffect(() => {
    statsIntervalRef.current = setInterval(async () => {
      for (const [peerId, peer] of peersRef.current.entries()) {
        try {
          const stats = await getConnectionStats(peer.peerConnection);

          // Determine connection quality based on stats
          let quality: CallParticipant['connectionQuality'] = 'good';
          const rtt = stats.connection.currentRoundTripTime;
          const packetLoss = stats.video.packetsLost || 0;

          if (rtt > 300 || packetLoss > 50) {
            quality = 'poor';
          } else if (rtt > 150 || packetLoss > 20) {
            quality = 'fair';
          } else if (rtt > 50) {
            quality = 'good';
          } else {
            quality = 'excellent';
          }

          setParticipants((prev) =>
            prev.map((p) =>
              p.id === peerId ? { ...p, connectionQuality: quality } : p
            )
          );
        } catch (err) {
          console.error('Error getting connection stats:', err);
        }
      }
    }, 3000);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      endAllCalls();
      signaling.disconnect();
    };
  }, [endAllCalls, signaling]);

  return {
    // Signaling state
    signalingConnected: signaling.connected,
    signalingError: signaling.error || error,
    availablePeers: signaling.peers,

    // Call state
    localStream,
    participants,
    isCallActive,
    isVideoOn,
    isAudioOn,
    error,

    // Actions
    initializeLocalStream,
    startCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    toggleVideo,
    toggleAudio,
    endCallWithPeer,
    endAllCalls,

    // Signaling actions
    connectSignaling: signaling.connect,
    disconnectSignaling: signaling.disconnect,
    getAvailablePeers: signaling.getAvailablePeers,
    peerId: signaling.peerId
  };
}

export default useIntegratedVideoCall;

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { apiClient } from './api-client';
import { resolveMediaUrl } from './media-url';
import { toast } from 'sonner';

interface CallState {
  isOpen: boolean;
  isRinging: boolean;
  isIncoming: boolean;
  callId?: string;
  counterpartId?: number;
  type: 'voice' | 'video';
  contactName: string;
  contactAvatar?: string;
  contactOnline: boolean;
}

interface CallContextType {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  localVideoEnabled: boolean;
  remoteVideoEnabled: boolean;
  startCall: (
    type: 'voice' | 'video',
    receiverId: number,
    contactName: string,
    contactAvatar?: string,
    contactOnline?: boolean,
  ) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => Promise<void>;
  endCall: () => void;
  setVideoEnabled: (enabled: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingOfferRef = useRef<Record<string, unknown> | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const ringingTimerRef = useRef<number | null>(null);
  const ringAudioContextRef = useRef<AudioContext | null>(null);
  const callStateRef = useRef<CallState>({
    isOpen: false,
    isRinging: false,
    isIncoming: false,
    type: 'voice',
    contactName: '',
    contactAvatar: undefined,
    contactOnline: false,
    callId: undefined,
    counterpartId: undefined,
  });
  const [callState, setCallState] = useState<CallState>({
    isOpen: false,
    isRinging: false,
    isIncoming: false,
    type: 'voice',
    contactName: '',
    contactAvatar: undefined,
    contactOnline: false,
    callId: undefined,
    counterpartId: undefined,
  });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);

  const stopRingingTone = () => {
    if (ringingTimerRef.current) {
      window.clearInterval(ringingTimerRef.current);
      ringingTimerRef.current = null;
    }
    if (ringAudioContextRef.current) {
      void ringAudioContextRef.current.close();
      ringAudioContextRef.current = null;
    }
  };

  const startRingingTone = (incoming: boolean) => {
    if (ringingTimerRef.current) return;

    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const context = new AudioCtx();
    ringAudioContextRef.current = context;

    const playPattern = () => {
      const now = context.currentTime;
      const sequence = incoming
        ? [0, 0.18, 0.7, 0.88]
        : [0, 0.15];

      sequence.forEach((offset, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.value = incoming ? (index % 2 === 0 ? 820 : 620) : 440;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(context.destination);
        const start = now + offset;
        const end = start + 0.12;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.start(start);
        osc.stop(end + 0.02);
      });
    };

    void context.resume().then(() => {
      playPattern();
      ringingTimerRef.current = window.setInterval(
        playPattern,
        incoming ? 1900 : 1100,
      );
    }).catch(() => {
      stopRingingTone();
    });
  };

  const clearCallState = () => {
    setCallState({
      isOpen: false,
      isRinging: false,
      isIncoming: false,
      type: 'voice',
      contactName: '',
      contactAvatar: undefined,
      contactOnline: false,
      callId: undefined,
      counterpartId: undefined,
    });
  };

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const teardownWebRtc = () => {
    pendingOfferRef.current = null;
    pendingIceCandidatesRef.current = [];

    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setLocalVideoEnabled(true);
    setRemoteVideoEnabled(true);
    stopRingingTone();

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
      if (remoteAudioRef.current.parentNode) {
        remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
      }
      remoteAudioRef.current = null;
    }
  };

  const getOrCreateLocalStream = async (type: 'voice' | 'video') => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
    localStreamRef.current = stream;
    setLocalVideoEnabled(type === 'video');
    setLocalStream(stream);
    return stream;
  };

  const getOrCreatePeerConnection = async (
    type: 'voice' | 'video',
    receiverId: number,
    callId: string,
  ) => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const connection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    const stream = await getOrCreateLocalStream(type);
    stream.getTracks().forEach((track) => {
      connection.addTrack(track, stream);
    });

    connection.ontrack = (event) => {
      const [incomingRemoteStream] = event.streams;
      if (!incomingRemoteStream) return;
      setRemoteStream(incomingRemoteStream);

      if (remoteAudioRef.current == null) {
        const element = document.createElement('audio');
        element.autoplay = true;
        element.playsInline = true;
        // Must be appended to the DOM — browsers block autoplay on detached elements
        document.body.appendChild(element);
        remoteAudioRef.current = element;
      }

      remoteAudioRef.current.srcObject = incomingRemoteStream;
      void remoteAudioRef.current.play().catch(() => {
        // Browser may block autoplay until user interaction; Accept/Start click usually enables it.
      });

      if (incomingRemoteStream.getVideoTracks().length > 0) {
        setRemoteVideoEnabled(true);
      }
    };

    connection.onicecandidate = ({ candidate }) => {
      if (!candidate) return;
      void apiClient.sendCallSignal({
        receiver_id: receiverId,
        action: 'webrtc_ice',
        call_id: callId,
        is_video: type === 'video',
        webrtc_data: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        },
      }).catch(() => {
        // Ignore transient signaling failures; ICE can continue with later candidates.
      });
    };

    peerConnectionRef.current = connection;
    return connection;
  };

  const applyPendingIceCandidates = async () => {
    if (!peerConnectionRef.current || pendingIceCandidatesRef.current.length === 0) {
      return;
    }

    const candidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const candidate of candidates) {
      try {
        await peerConnectionRef.current.addIceCandidate(candidate);
      } catch {
        // Ignore malformed candidates.
      }
    }
  };

  const createAndSendOffer = async (
    type: 'voice' | 'video',
    receiverId: number,
    callId: string,
  ) => {
    const connection = await getOrCreatePeerConnection(type, receiverId, callId);
    const offer = await connection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: type === 'video',
    });
    await connection.setLocalDescription(offer);

    await apiClient.sendCallSignal({
      receiver_id: receiverId,
      action: 'webrtc_offer',
      call_id: callId,
      is_video: type === 'video',
      webrtc_data: {
        type: offer.type,
        sdp: offer.sdp,
      },
    });
  };

  const answerFromOffer = async (
    type: 'voice' | 'video',
    receiverId: number,
    callId: string,
    offer: Record<string, unknown>,
  ) => {
    const offerType = typeof offer.type === 'string' ? offer.type : null;
    const offerSdp = typeof offer.sdp === 'string' ? offer.sdp : null;
    if (!offerType || !offerSdp) return;

    const connection = await getOrCreatePeerConnection(type, receiverId, callId);
    await connection.setRemoteDescription(
      new RTCSessionDescription({
        type: offerType,
        sdp: offerSdp,
      }),
    );
    await applyPendingIceCandidates();

    const answer = await connection.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: type === 'video',
    });
    await connection.setLocalDescription(answer);

    await apiClient.sendCallSignal({
      receiver_id: receiverId,
      action: 'webrtc_answer',
      call_id: callId,
      is_video: type === 'video',
      webrtc_data: {
        type: answer.type,
        sdp: answer.sdp,
      },
    });
  };

  const requestMediaPermission = async (
    type: 'voice' | 'video',
    options: { silent?: boolean } = {},
  ) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      if (!options.silent) {
        toast.error('Media devices are not available in this browser.');
      }
      return false;
    }

    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video',
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      if (!options.silent) {
        toast.error(
          type === 'video'
            ? 'Allow camera and microphone to start a video call.'
            : 'Allow microphone to start a voice call.',
        );
      }
      return false;
    }
  };

  useEffect(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (!token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let cancelled = false;
    let pingTimer: number | null = null;
    let pollTimer: number | null = null;

    const connect = () => {
      if (cancelled) return;

      const socket = apiClient.createMessagesWebSocket(token);
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          handleCallRealtimeEnvelope(JSON.parse(event.data));
        } catch {
          // ignore malformed events
        }
      };

      socket.onopen = () => {
        if (pingTimer) {
          window.clearInterval(pingTimer);
        }
        pingTimer = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event: 'ping' }));
          }
        }, 15000);
      };

      socket.onclose = () => {
        if (pingTimer) {
          window.clearInterval(pingTimer);
          pingTimer = null;
        }
        if (cancelled) return;
        reconnectTimerRef.current = window.setTimeout(() => {
          connect();
        }, 2000);
      };
    };

    pollTimer = window.setInterval(() => {
      void apiClient.consumePendingCallSignals().then((events) => {
        events.forEach((event) => handleCallRealtimeEnvelope(event));
      }).catch(() => {
        // HTTP polling is a fallback; ignore transient failures.
      });
    }, 1000);

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (pingTimer) {
        window.clearInterval(pingTimer);
      }
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      teardownWebRtc();
    };
  }, [token, user?.id]);

  const startCall = async (
    type: 'voice' | 'video',
    receiverId: number,
    contactName: string,
    contactAvatar?: string,
    contactOnline: boolean = false,
  ) => {
    const allowed = await requestMediaPermission(type);
    if (!allowed) return;

    const callId = `web_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    setCallState({
      isOpen: true,
      isRinging: true,
      isIncoming: false,
      callId,
      counterpartId: receiverId,
      type,
      contactName,
      contactAvatar: resolveMediaUrl(contactAvatar),
      contactOnline,
    });
    setRemoteVideoEnabled(true);
    setLocalVideoEnabled(type === 'video');
    startRingingTone(false);

    try {
      await apiClient.sendCallSignal({
        receiver_id: receiverId,
        action: 'invite',
        call_id: callId,
        is_video: type === 'video',
      });
      await createAndSendOffer(type, receiverId, callId);
    } catch {
      teardownWebRtc();
      setCallState((prev) => ({
        ...prev,
        isOpen: false,
        isRinging: false,
      }));
    }
  };

  const acceptIncomingCall = async () => {
    if (!callState.callId || !callState.counterpartId) {
      return;
    }

    const allowed = await requestMediaPermission(callState.type);
    if (!allowed) return;

    setCallState((prev) => ({ ...prev, isRinging: false, isIncoming: false }));
    stopRingingTone();
    try {
      await apiClient.sendCallSignal({
        receiver_id: callState.counterpartId,
        action: 'accept',
        call_id: callState.callId,
        is_video: callState.type === 'video',
      });

      if (pendingOfferRef.current) {
        await answerFromOffer(
          callState.type,
          callState.counterpartId,
          callState.callId,
          pendingOfferRef.current,
        );
        pendingOfferRef.current = null;
      }
    } catch {
      // keep call open locally even if signal fails transiently
    }
  };

  const declineIncomingCall = async () => {
    if (callState.callId && callState.counterpartId) {
      try {
        await apiClient.sendCallSignal({
          receiver_id: callState.counterpartId,
          action: 'decline',
          call_id: callState.callId,
          is_video: callState.type === 'video',
        });
      } catch {
        // ignore network errors on decline
      }
    }

    teardownWebRtc();
    clearCallState();
  };

  const endCall = () => {
    const snapshot = callState;

    if (snapshot.callId && snapshot.counterpartId) {
      void apiClient.sendCallSignal({
        receiver_id: snapshot.counterpartId,
        action: 'end',
        call_id: snapshot.callId,
        is_video: snapshot.type === 'video',
      }).catch(() => {
        // ignore network errors on end
      });
    }

    teardownWebRtc();
    clearCallState();
  };

  const setVideoEnabled = (enabled: boolean) => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
    setLocalVideoEnabled(enabled);

    const snapshot = callStateRef.current;
    if (!snapshot.callId || !snapshot.counterpartId) {
      return;
    }

    void apiClient.sendCallSignal({
      receiver_id: snapshot.counterpartId,
      action: 'media_state',
      call_id: snapshot.callId,
      is_video: snapshot.type === 'video',
      webrtc_data: {
        video_enabled: enabled,
      },
    }).catch(() => {
      // Ignore transient signaling errors for media state updates.
    });
  };

  const handleCallRealtimeEnvelope = (parsed: unknown) => {
    if (!parsed || typeof parsed !== 'object') {
      return;
    }

    const envelope = parsed as { event?: string; data?: Record<string, unknown> };
    if (envelope.event !== 'call_event' || !envelope.data) {
      return;
    }

    const payload = envelope.data as {
      action?: string;
      call_id?: string;
      caller_id?: number;
      caller_name?: string;
      caller_avatar_url?: string;
      receiver_id?: number;
      is_video?: boolean;
      webrtc_data?: Record<string, unknown>;
    };
    const currentCall = callStateRef.current;

    const action = String(payload.action || '').toLowerCase();
    const callId = String(payload.call_id || '');
    const callerId = Number(payload.caller_id || 0);
    const receiverId = Number(payload.receiver_id || 0);
    const myUserId = Number(user?.id || 0);

    if (myUserId <= 0) {
      return;
    }

    if (action === 'invite') {
      const isEchoOfOwnInvite = callerId === myUserId;
      const isTargetedToMe = receiverId === myUserId;
      if (isEchoOfOwnInvite || !isTargetedToMe) {
        return;
      }

      setCallState({
        isOpen: true,
        isRinging: true,
        isIncoming: true,
        callId,
        counterpartId: callerId,
        type: payload.is_video ? 'video' : 'voice',
        contactName: payload.caller_name || 'Incoming call',
        contactAvatar: resolveMediaUrl(payload.caller_avatar_url),
        contactOnline: true,
      });
      return;
    }

    if (action === 'webrtc_offer') {
      if (!callId || callId !== currentCall.callId) {
        return;
      }

      const offer = payload.webrtc_data;
      if (!offer || typeof offer !== 'object') {
        return;
      }

      pendingOfferRef.current = offer as Record<string, unknown>;
      if (!currentCall.isIncoming && !currentCall.isRinging && currentCall.counterpartId) {
        void answerFromOffer(
          currentCall.type,
          currentCall.counterpartId,
          currentCall.callId || callId,
          pendingOfferRef.current,
        ).then(() => {
          pendingOfferRef.current = null;
        }).catch(() => {
          // Keep pending offer so we can retry on next accept.
        });
      }
      return;
    }

    if (action === 'webrtc_answer') {
      if (!callId || callId !== currentCall.callId || !peerConnectionRef.current) {
        return;
      }
      const answerData = payload.webrtc_data;
      if (!answerData || typeof answerData !== 'object') {
        return;
      }

      const answerType = typeof answerData.type === 'string' ? answerData.type : null;
      const answerSdp = typeof answerData.sdp === 'string' ? answerData.sdp : null;
      if (!answerType || !answerSdp) {
        return;
      }

      void peerConnectionRef.current
        .setRemoteDescription(new RTCSessionDescription({ type: answerType, sdp: answerSdp }))
        .then(() => applyPendingIceCandidates())
        .catch(() => {
          // Ignore malformed remote answers.
        });
      return;
    }

    if (action === 'webrtc_ice') {
      if (!callId || callId !== currentCall.callId) {
        return;
      }

      const iceData = payload.webrtc_data;
      if (!iceData || typeof iceData !== 'object' || typeof iceData.candidate !== 'string') {
        return;
      }

      const candidate: RTCIceCandidateInit = {
        candidate: iceData.candidate,
        sdpMid: typeof iceData.sdpMid === 'string' ? iceData.sdpMid : null,
        sdpMLineIndex:
          typeof iceData.sdpMLineIndex === 'number' ? iceData.sdpMLineIndex : null,
      };

      if (peerConnectionRef.current?.remoteDescription) {
        void peerConnectionRef.current.addIceCandidate(candidate).catch(() => {
          // Ignore malformed ICE candidates.
        });
      } else {
        pendingIceCandidatesRef.current.push(candidate);
      }
      return;
    }

    if (action === 'media_state') {
      const mediaData = payload.webrtc_data;
      const callMatches = Boolean(currentCall.callId && callId && currentCall.callId === callId);
      if (!callMatches || !mediaData || typeof mediaData !== 'object') {
        return;
      }

      if (typeof mediaData.video_enabled === 'boolean') {
        setRemoteVideoEnabled(mediaData.video_enabled);
      }
      return;
    }

    const isMyOwnEvent = callerId === myUserId;
    if (isMyOwnEvent && action === 'invite') {
      return;
    }

    setCallState((prev) => {
      if (!prev.isOpen) {
        return prev;
      }

      const callMatches = Boolean(prev.callId && callId && prev.callId === callId);
      const participantMatches = Boolean(
        prev.counterpartId && (prev.counterpartId === callerId || prev.counterpartId === receiverId),
      );

      if (!callMatches && !participantMatches) {
        return prev;
      }

      if (action === 'accept') {
        return { ...prev, isRinging: false, isIncoming: false };
      }

      if (action === 'decline' || action === 'end') {
        teardownWebRtc();
        return {
          isOpen: false,
          isRinging: false,
          isIncoming: false,
          type: 'voice',
          contactName: '',
          contactAvatar: undefined,
          contactOnline: false,
          callId: undefined,
          counterpartId: undefined,
        };
      }

      return prev;
    });
  };

  useEffect(() => {
    if (!callState.isOpen) {
      stopRingingTone();
      return;
    }

    if (callState.isRinging) {
      startRingingTone(callState.isIncoming);
    } else {
      stopRingingTone();
    }

    return () => {
      if (!callState.isOpen) {
        stopRingingTone();
      }
    };
  }, [callState.isOpen, callState.isRinging, callState.isIncoming]);

  useEffect(() => {
    return () => {
      stopRingingTone();
    };
  }, []);

  return (
    <CallContext.Provider
      value={{
        callState,
        localStream,
        remoteStream,
        localVideoEnabled,
        remoteVideoEnabled,
        startCall,
        acceptIncomingCall,
        declineIncomingCall,
        endCall,
        setVideoEnabled,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}

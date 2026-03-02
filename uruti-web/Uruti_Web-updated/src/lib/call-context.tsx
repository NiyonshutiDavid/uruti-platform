import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { apiClient } from './api-client';
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
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
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
    if (!token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const socket = apiClient.createNotificationsWebSocket(token);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.event !== 'call_event' || !parsed?.data) {
          return;
        }

        const payload = parsed.data as {
          action?: string;
          call_id?: string;
          caller_id?: number;
          caller_name?: string;
          caller_avatar_url?: string;
          receiver_id?: number;
          is_video?: boolean;
        };

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
            contactAvatar: payload.caller_avatar_url,
            contactOnline: true,
          });
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
            prev.counterpartId &&
                (prev.counterpartId === callerId || prev.counterpartId === receiverId),
          );

          if (!callMatches && !participantMatches) {
            return prev;
          }

          if (action === 'accept') {
            return { ...prev, isRinging: false, isIncoming: false };
          }

          if (action === 'decline' || action === 'end') {
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
      } catch {
        // ignore malformed events
      }
    };

    const ping = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ event: 'ping' }));
      }
    }, 15000);

    return () => {
      window.clearInterval(ping);
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
      socket.close();
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
      contactAvatar,
      contactOnline,
    });

    try {
      await apiClient.sendCallSignal({
        receiver_id: receiverId,
        action: 'invite',
        call_id: callId,
        is_video: type === 'video',
      });
    } catch {
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
    try {
      await apiClient.sendCallSignal({
        receiver_id: callState.counterpartId,
        action: 'accept',
        call_id: callState.callId,
        is_video: callState.type === 'video',
      });
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

    clearCallState();
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        startCall,
        acceptIncomingCall,
        declineIncomingCall,
        endCall,
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

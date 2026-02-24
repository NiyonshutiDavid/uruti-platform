/**
 * WebSocket Signaling Client for WebRTC
 * 
 * Handles real-time WebRTC signaling through WebSocket connection to backend.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Generate simple UUID without external dependency
const generatePeerId = () => {
  return `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export interface SignalingMessage {
  type: string;
  from?: string;
  to?: string;
  data?: any;
  timestamp?: string;
  [key: string]: any;
}

export interface WebSocketPeer {
  peer_id: string;
  user_id: string;
  connected_at: string;
  user_info?: Record<string, any>;
}

export interface UseSignalingWebSocketOptions {
  onMessage?: (message: SignalingMessage) => void;
  onPeerJoined?: (peer: WebSocketPeer) => void;
  onPeerLeft?: (peerId: string) => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

/**
 * Hook for managing WebSocket signaling connection
 */
export function useSignalingWebSocket(
  userId: string,
  options?: UseSignalingWebSocketOptions
) {
  const peerId = useRef(generatePeerId());
  const ws = useRef<WebSocket | null>(null);
  
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<WebSocketPeer[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const autoConnect = options?.autoConnect !== false;

  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((message: SignalingMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message));
      } catch (err) {
        console.error('Error sending message:', err);
        const errorMsg = `Failed to send message: ${err}`;
        setError(errorMsg);
        options?.onError?.(new Error(errorMsg));
      }
    } else {
      const errorMsg = 'WebSocket not connected';
      setError(errorMsg);
      console.warn(errorMsg);
    }
  }, [options]);

  /**
   * Connect to signaling server
   */
  const connect = useCallback(async () => {
    if (ws.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      
      // Adjust port for backend (assume backend runs on 8000)
      const backendPort = ':8000';
      const wsUrl = `${protocol}//${host}${backendPort}/api/v1/ws/signal/${peerId.current}`;

      console.log(`Connecting to signaling server: ${wsUrl}`);
      ws.current = new WebSocket(wsUrl);

      ws.current.addEventListener('open', () => {
        console.log('Connected to signaling server');
        setConnected(true);
        setIsConnecting(false);
        setError(null);

        // Register peer with server
        sendMessage({
          type: 'register',
          user_id: userId,
          user_info: {
            name: userId,
            connected_at: new Date().toISOString()
          }
        });

        // Request available peers
        sendMessage({
          type: 'get-peers'
        });
      });

      ws.current.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          console.debug('Received signaling message:', message.type);

          // Handle different message types
          if (message.type === 'peers-list') {
            setPeers(message.peers || []);
          } else if (message.type === 'peer-joined') {
            const peer = message.peer;
            setPeers((prev) => {
              const exists = prev.some((p) => p.peer_id === peer.peer_id);
              return exists ? prev : [...prev, peer];
            });
            options?.onPeerJoined?.(peer);
          } else if (message.type === 'peer-left') {
            const peerId = message.peer_id;
            setPeers((prev) => prev.filter((p) => p.peer_id !== peerId));
            options?.onPeerLeft?.(peerId);
          } else if (message.type === 'available-peers') {
            setPeers(message.peers || []);
          }

          // Call generic message handler
          options?.onMessage?.(message);
        } catch (err) {
          console.error('Error processing message:', err);
        }
      });

      ws.current.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        const errorMsg = 'WebSocket connection error';
        setError(errorMsg);
        setIsConnecting(false);
        options?.onError?.(new Error(errorMsg));
      });

      ws.current.addEventListener('close', () => {
        console.log('Disconnected from signaling server');
        setConnected(false);
        setIsConnecting(false);
        setPeers([]);
      });
    } catch (err) {
      const errorMsg = `Failed to connect to signaling server: ${err}`;
      setError(errorMsg);
      setIsConnecting(false);
      options?.onError?.(new Error(errorMsg));
    }
  }, [userId, sendMessage, options, isConnecting]);

  /**
   * Disconnect from signaling server
   */
  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      setConnected(false);
      setPeers([]);
    }
  }, []);

  /**
   * Send offer message
   */
  const sendOffer = useCallback((
    toPeerId: string,
    sdp: string,
    sessionId: string
  ) => {
    sendMessage({
      type: 'offer',
      to: toPeerId,
      session_id: sessionId,
      sdp
    });
  }, [sendMessage]);

  /**
   * Send answer message
   */
  const sendAnswer = useCallback((
    toPeerId: string,
    sdp: string,
    sessionId: string
  ) => {
    sendMessage({
      type: 'answer',
      to: toPeerId,
      session_id: sessionId,
      sdp
    });
  }, [sendMessage]);

  /**
   * Send ICE candidate
   */
  const sendIceCandidate = useCallback((
    toPeerId: string,
    candidate: RTCIceCandidate,
    sessionId: string
  ) => {
    sendMessage({
      type: 'ice-candidate',
      to: toPeerId,
      session_id: sessionId,
      candidate: {
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid
      }
    });
  }, [sendMessage]);

  /**
   * Get available peers
   */
  const getAvailablePeers = useCallback(() => {
    sendMessage({
      type: 'get-peers'
    });
  }, [sendMessage]);

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);

  return {
    // State
    peerId: peerId.current,
    connected,
    error,
    isConnecting,
    peers,

    // Actions
    connect,
    disconnect,
    sendMessage,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    getAvailablePeers
  };
}

export default useSignalingWebSocket;

/**
 * WebRTC utilities for peer-to-peer video calling
 * Supports peer discovery, offer/answer exchange, and stream management
 */

export interface PeerConnection {
  id: string;
  peerConnection: RTCPeerConnection;
  stream?: MediaStream;
  remoteStream?: MediaStream;
  offerSent: boolean;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'peer-joined' | 'peer-left';
  from: string;
  to?: string;
  data?: any;
}

// ICE servers for NAT traversal
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

/**
 * Create a new RTCPeerConnection
 */
export function createPeerConnection(
  onIceCandidate?: (candidate: RTCIceCandidate) => void,
  onRemoteStream?: (stream: MediaStream) => void
): RTCPeerConnection {
  const peerConnection = new RTCPeerConnection({
    iceServers: ICE_SERVERS
  });

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  };

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    if (onRemoteStream) {
      // Use the first track of remote stream
      const remoteStream = event.streams[0];
      onRemoteStream(remoteStream);
    }
  };

  // Log connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.connectionState);
  };

  return peerConnection;
}

/**
 * Add local stream to peer connection
 */
export function addLocalStream(
  peerConnection: RTCPeerConnection,
  stream: MediaStream
): void {
  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream);
  });
}

/**
 * Create offer for peer connection
 */
export async function createOffer(
  peerConnection: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  const offer = await peerConnection.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  });
  await peerConnection.setLocalDescription(offer);
  return offer;
}

/**
 * Create answer for peer connection
 */
export async function createAnswer(
  peerConnection: RTCPeerConnection,
  offer?: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  // Only set remote description if offer is provided and not already set
  if (offer && peerConnection.remoteDescription === null) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  }
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
}

/**
 * Set remote answer
 */
export async function setRemoteAnswer(
  peerConnection: RTCPeerConnection,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

/**
 * Add ICE candidate
 */
export async function addIceCandidate(
  peerConnection: RTCPeerConnection,
  candidate: RTCIceCandidate
): Promise<void> {
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
  }
}

/**
 * Close peer connection and stop tracks
 */
export function closePeerConnection(peerConnection: RTCPeerConnection): void {
  peerConnection.close();
}

/**
 * Get connection stats for quality monitoring
 */
export async function getConnectionStats(
  peerConnection: RTCPeerConnection
): Promise<any> {
  const stats = await peerConnection.getStats();
  const result: any = {
    audio: {},
    video: {},
    connection: {}
  };

  stats.forEach((report) => {
    if (report.type === 'inbound-rtp') {
      if (report.mediaType === 'video') {
        result.video.bytesReceived = report.bytesReceived;
        result.video.packetsLost = report.packetsLost;
        result.video.framesDecoded = report.framesDecoded;
      } else if (report.mediaType === 'audio') {
        result.audio.bytesReceived = report.bytesReceived;
        result.audio.packetsLost = report.packetsLost;
      }
    } else if (report.type === 'outbound-rtp') {
      if (report.mediaType === 'video') {
        result.video.bytesSent = report.bytesSent;
        result.video.framesSent = report.framesSent;
      } else if (report.mediaType === 'audio') {
        result.audio.bytesSent = report.bytesSent;
      }
    } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      result.connection.currentRoundTripTime = report.currentRoundTripTime;
      result.connection.availableOutgoingBitrate = report.availableOutgoingBitrate;
      result.connection.availableIncomingBitrate = report.availableIncomingBitrate;
    }
  });

  return result;
}

/**
 * Create signaling message
 */
export function createSignalingMessage(
  type: SignalingMessage['type'],
  from: string,
  data?: any,
  to?: string
): SignalingMessage {
  return { type, from, to, data };
}

/**
 * Parse signaling message
 */
export function parseSignalingMessage(message: string): SignalingMessage {
  return JSON.parse(message);
}

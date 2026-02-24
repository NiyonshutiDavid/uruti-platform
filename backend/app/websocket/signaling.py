"""
WebRTC Signaling Server Manager

Handles peer-to-peer connection signaling for WebRTC video calls.
Routes offer/answer/ICE candidate messages between peers.
"""

import json
import logging
from typing import Optional, Dict, List, Set
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class MessageType(str, Enum):
    """WebRTC signaling message types."""
    REGISTER = "register"
    PEER_JOINED = "peer-joined"
    PEER_LEFT = "peer-left"
    GET_PEERS = "get-peers"
    PEERS_LIST = "peers-list"
    OFFER = "offer"
    ANSWER = "answer"
    ICE_CANDIDATE = "ice-candidate"
    ERROR = "error"
    PING = "ping"
    PONG = "pong"


class CallSession:
    """Represents a call session between peers."""
    
    def __init__(self, session_id: str, initiator_id: str):
        self.session_id = session_id
        self.initiator_id = initiator_id
        self.participants: Set[str] = {initiator_id}
        self.created_at = datetime.utcnow()
        self.sdp_exchanges: Dict[str, Dict] = {}  # peer_id -> {offer, answer}
        self.ice_candidates: Dict[str, List] = {}  # peer_id -> [candidates]
    
    def add_participant(self, peer_id: str) -> bool:
        """Add participant to call session."""
        if peer_id not in self.participants:
            self.participants.add(peer_id)
            self.ice_candidates[peer_id] = []
            return True
        return False
    
    def remove_participant(self, peer_id: str) -> bool:
        """Remove participant from call session."""
        if peer_id in self.participants:
            self.participants.discard(peer_id)
            if peer_id in self.sdp_exchanges:
                del self.sdp_exchanges[peer_id]
            if peer_id in self.ice_candidates:
                del self.ice_candidates[peer_id]
            return True
        return False
    
    def is_empty(self) -> bool:
        """Check if session has no participants."""
        return len(self.participants) == 0
    
    def to_dict(self) -> dict:
        """Convert to dictionary representation."""
        return {
            "session_id": self.session_id,
            "initiator_id": self.initiator_id,
            "participants": list(self.participants),
            "participant_count": len(self.participants),
            "created_at": self.created_at.isoformat(),
        }


class PeerConnection:
    """Represents a connected peer."""
    
    def __init__(self, peer_id: str, user_id: str, socket=None):
        self.peer_id = peer_id
        self.user_id = user_id
        self.socket = socket
        self.connected_at = datetime.utcnow()
        self.user_info = {}
        self.active_sessions: Set[str] = set()
    
    def to_dict(self) -> dict:
        """Convert to dictionary representation."""
        return {
            "peer_id": self.peer_id,
            "user_id": self.user_id,
            "connected_at": self.connected_at.isoformat(),
            "active_sessions": list(self.active_sessions),
            "user_info": self.user_info,
        }


class SignalingManager:
    """Manages WebRTC peer connections and signaling."""
    
    def __init__(self):
        self.peers: Dict[str, PeerConnection] = {}  # peer_id -> PeerConnection
        self.sessions: Dict[str, CallSession] = {}  # session_id -> CallSession
        self.user_to_peer: Dict[str, str] = {}  # user_id -> peer_id (for quick lookup)
        self.peer_to_session: Dict[str, List[str]] = {}  # peer_id -> [session_ids]
    
    # ============ Peer Registration ============
    
    def register_peer(self, peer_id: str, user_id: str, socket=None, user_info: Optional[dict] = None) -> PeerConnection:
        """Register a new peer connection."""
        logger.info(f"Registering peer {peer_id} for user {user_id}")
        
        # Remove old connection if exists
        if user_id in self.user_to_peer:
            old_peer_id = self.user_to_peer[user_id]
            self.unregister_peer(old_peer_id)
        
        peer = PeerConnection(peer_id, user_id, socket)
        if user_info:
            peer.user_info = user_info
        
        self.peers[peer_id] = peer
        self.user_to_peer[user_id] = peer_id
        self.peer_to_session[peer_id] = []
        
        logger.info(f"Peer {peer_id} registered. Total peers: {len(self.peers)}")
        return peer
    
    def unregister_peer(self, peer_id: str) -> Optional[PeerConnection]:
        """Unregister a peer connection."""
        if peer_id not in self.peers:
            return None
        
        logger.info(f"Unregistering peer {peer_id}")
        peer = self.peers.pop(peer_id)
        
        # Remove from user lookup
        if peer.user_id in self.user_to_peer:
            del self.user_to_peer[peer.user_id]
        
        # Remove from all sessions
        if peer_id in self.peer_to_session:
            for session_id in list(self.peer_to_session[peer_id]):
                self.remove_peer_from_session(peer_id, session_id)
            del self.peer_to_session[peer_id]
        
        logger.info(f"Peer {peer_id} unregistered. Total peers: {len(self.peers)}")
        return peer
    
    def get_peer(self, peer_id: str) -> Optional[PeerConnection]:
        """Get peer by ID."""
        return self.peers.get(peer_id)
    
    def get_peer_by_user_id(self, user_id: str) -> Optional[PeerConnection]:
        """Get peer by user ID."""
        peer_id = self.user_to_peer.get(user_id)
        return self.peers.get(peer_id) if peer_id else None
    
    # ============ Peer Discovery ============
    
    def get_available_peers(self, exclude_peer_id: str = None) -> List[dict]:
        """Get list of available peers for calling."""
        available = []
        for peer_id, peer in self.peers.items():
            if exclude_peer_id and peer_id == exclude_peer_id:
                continue
            available.append(peer.to_dict())
        return available
    
    def broadcast_peer_joined(self, joined_peer_id: str) -> dict:
        """Broadcast a peer joined message to all peers."""
        joined_peer = self.get_peer(joined_peer_id)
        if not joined_peer:
            return {}
        
        message = {
            "type": MessageType.PEER_JOINED,
            "peer": joined_peer.to_dict(),
            "total_peers": len(self.peers),
        }
        return message
    
    def broadcast_peer_left(self, left_peer_id: str) -> dict:
        """Broadcast a peer left message to all peers."""
        message = {
            "type": MessageType.PEER_LEFT,
            "peer_id": left_peer_id,
            "total_peers": len(self.peers),
        }
        return message
    
    # ============ Call Session Management ============
    
    def create_session(self, session_id: str, initiator_id: str) -> CallSession:
        """Create a new call session."""
        logger.info(f"Creating session {session_id} initiated by peer {initiator_id}")
        session = CallSession(session_id, initiator_id)
        self.sessions[session_id] = session
        
        if initiator_id not in self.peer_to_session:
            self.peer_to_session[initiator_id] = []
        self.peer_to_session[initiator_id].append(session_id)
        
        return session
    
    def get_session(self, session_id: str) -> Optional[CallSession]:
        """Get call session by ID."""
        return self.sessions.get(session_id)
    
    def add_peer_to_session(self, peer_id: str, session_id: str) -> bool:
        """Add peer to existing call session."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        logger.info(f"Adding peer {peer_id} to session {session_id}")
        added = session.add_participant(peer_id)
        
        if added:
            if peer_id not in self.peer_to_session:
                self.peer_to_session[peer_id] = []
            self.peer_to_session[peer_id].append(session_id)
        
        return added
    
    def remove_peer_from_session(self, peer_id: str, session_id: str) -> bool:
        """Remove peer from call session."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        logger.info(f"Removing peer {peer_id} from session {session_id}")
        removed = session.remove_participant(peer_id)
        
        if removed:
            if peer_id in self.peer_to_session:
                try:
                    self.peer_to_session[peer_id].remove(session_id)
                except ValueError:
                    pass
            
            # Clean up empty sessions
            if session.is_empty():
                del self.sessions[session_id]
                logger.info(f"Session {session_id} cleaned up (empty)")
        
        return removed
    
    def get_peer_sessions(self, peer_id: str) -> List[CallSession]:
        """Get all active sessions for a peer."""
        session_ids = self.peer_to_session.get(peer_id, [])
        return [self.sessions[sid] for sid in session_ids if sid in self.sessions]
    
    def get_session_participants(self, session_id: str, exclude_peer_id: str = None) -> List[dict]:
        """Get list of participants in a session."""
        session = self.get_session(session_id)
        if not session:
            return []
        
        participants = []
        for peer_id in session.participants:
            if exclude_peer_id and peer_id == exclude_peer_id:
                continue
            peer = self.get_peer(peer_id)
            if peer:
                participants.append(peer.to_dict())
        
        return participants
    
    # ============ WebRTC Signaling ============
    
    def create_signaling_message(self, 
                                message_type: MessageType,
                                from_peer_id: str,
                                to_peer_id: str,
                                data: Optional[dict] = None) -> dict:
        """Create a WebRTC signaling message."""
        return {
            "type": message_type.value,
            "from": from_peer_id,
            "to": to_peer_id,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data or {},
        }
    
    def handle_offer(self, session_id: str, from_peer_id: str, sdp: str) -> bool:
        """Handle SDP offer from peer."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        logger.info(f"Storing offer from {from_peer_id} in session {session_id}")
        
        if from_peer_id not in session.sdp_exchanges:
            session.sdp_exchanges[from_peer_id] = {}
        
        session.sdp_exchanges[from_peer_id]["offer"] = {
            "sdp": sdp,
            "timestamp": datetime.utcnow().isoformat(),
        }
        return True
    
    def handle_answer(self, session_id: str, from_peer_id: str, sdp: str) -> bool:
        """Handle SDP answer from peer."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        logger.info(f"Storing answer from {from_peer_id} in session {session_id}")
        
        if from_peer_id not in session.sdp_exchanges:
            session.sdp_exchanges[from_peer_id] = {}
        
        session.sdp_exchanges[from_peer_id]["answer"] = {
            "sdp": sdp,
            "timestamp": datetime.utcnow().isoformat(),
        }
        return True
    
    def handle_ice_candidate(self, session_id: str, from_peer_id: str, candidate: dict) -> bool:
        """Handle ICE candidate from peer."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        if from_peer_id not in session.ice_candidates:
            session.ice_candidates[from_peer_id] = []
        
        session.ice_candidates[from_peer_id].append({
            "candidate": candidate,
            "timestamp": datetime.utcnow().isoformat(),
        })
        return True
    
    # ============ Statistics ============
    
    def get_stats(self) -> dict:
        """Get server statistics."""
        total_sessions = len(self.sessions)
        total_participants = sum(len(s.participants) for s in self.sessions.values())
        
        return {
            "total_peers": len(self.peers),
            "total_sessions": total_sessions,
            "total_participants": total_participants,
            "peers": [p.to_dict() for p in self.peers.values()],
            "sessions": [s.to_dict() for s in self.sessions.values()],
        }
    
    def cleanup(self):
        """Cleanup manager resources."""
        logger.info("Cleaning up SignalingManager")
        self.peers.clear()
        self.sessions.clear()
        self.user_to_peer.clear()
        self.peer_to_session.clear()

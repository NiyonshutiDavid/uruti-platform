"""
WebSocket Handler for Socket.io Integration

Handles WebSocket connections and routes WebRTC signaling messages.
"""

import logging
from typing import Optional
import uuid
from fastapi import WebSocketDisconnect
from app.websocket.signaling import SignalingManager, MessageType

logger = logging.getLogger(__name__)


class WebSocketHandler:
    """Handles WebSocket connections for WebRTC signaling."""
    
    def __init__(self, signaling_manager: SignalingManager):
        self.signaling_manager = signaling_manager
        self.connections = {}  # websocket -> peer_id mapping
    
    async def handle_connection(self, websocket, connection_id: Optional[str] = None) -> str:
        """Handle new WebSocket connection."""
        peer_id = connection_id or str(uuid.uuid4())
        self.connections[websocket] = peer_id
        
        logger.info(f"WebSocket connected: {peer_id}")
        
        # Send connection acknowledgment
        await websocket.send_json({
            "type": "connection-ack",
            "peer_id": peer_id,
            "message": "Connected to signaling server",
        })
        
        return peer_id
    
    async def handle_disconnect(self, websocket):
        """Handle WebSocket disconnection."""
        peer_id = self.connections.pop(websocket, None)
        if peer_id:
            logger.info(f"WebSocket disconnected: {peer_id}")
            # Unregister peer and notify others
            self.signaling_manager.unregister_peer(peer_id)
            # Broadcast peer left message (to be handled by caller)
    
    async def handle_message(self, websocket, message_data: dict) -> Optional[dict]:
        """Handle incoming WebSocket message."""
        peer_id = self.connections.get(websocket)
        if not peer_id:
            return {"type": "error", "message": "Not connected"}
        
        message_type = message_data.get("type")
        
        if message_type == MessageType.REGISTER.value:
            return await self._handle_register(websocket, peer_id, message_data)
        elif message_type == MessageType.GET_PEERS.value:
            return self._handle_get_peers(peer_id, message_data)
        elif message_type == MessageType.OFFER.value:
            return await self._handle_offer(peer_id, message_data)
        elif message_type == MessageType.ANSWER.value:
            return await self._handle_answer(peer_id, message_data)
        elif message_type == MessageType.ICE_CANDIDATE.value:
            return await self._handle_ice_candidate(peer_id, message_data)
        else:
            logger.warning(f"Unknown message type: {message_type}")
            return {"type": "error", "message": f"Unknown message type: {message_type}"}
    
    async def _handle_register(self, websocket, peer_id: str, message_data: dict) -> dict:
        """Handle peer registration."""
        user_id = message_data.get("user_id")
        user_info = message_data.get("user_info", {})
        
        if not user_id:
            return {"type": "error", "message": "user_id required"}
        
        logger.info(f"Registering peer {peer_id} with user_id {user_id}")
        
        peer = self.signaling_manager.register_peer(peer_id, user_id, websocket, user_info)
        
        return {
            "type": MessageType.REGISTER.value,
            "success": True,
            "peer_id": peer_id,
            "user_id": user_id,
        }
    
    def _handle_get_peers(self, peer_id: str, message_data: dict) -> dict:
        """Handle get peers request."""
        available_peers = self.signaling_manager.get_available_peers(exclude_peer_id=peer_id)
        
        return {
            "type": MessageType.PEERS_LIST.value,
            "peers": available_peers,
            "count": len(available_peers),
        }
    
    async def _handle_offer(self, peer_id: str, message_data: dict) -> Optional[dict]:
        """Handle SDP offer."""
        to_peer_id = message_data.get("to")
        session_id = message_data.get("session_id")
        sdp = message_data.get("sdp")
        
        if not all([to_peer_id, session_id, sdp]):
            return {"type": "error", "message": "Missing required fields: to, session_id, sdp"}
        
        logger.info(f"Offer from {peer_id} to {to_peer_id} in session {session_id}")
        
        # Store offer
        self.signaling_manager.handle_offer(session_id, peer_id, sdp)
        
        # Create session if not exists
        session = self.signaling_manager.get_session(session_id)
        if not session:
            self.signaling_manager.create_session(session_id, peer_id)
            self.signaling_manager.add_peer_to_session(to_peer_id, session_id)
        
        # Forward offer to recipient
        message = self.signaling_manager.create_signaling_message(
            MessageType.OFFER,
            peer_id,
            to_peer_id,
            {"sdp": sdp, "session_id": session_id}
        )
        
        return message
    
    async def _handle_answer(self, peer_id: str, message_data: dict) -> Optional[dict]:
        """Handle SDP answer."""
        to_peer_id = message_data.get("to")
        session_id = message_data.get("session_id")
        sdp = message_data.get("sdp")
        
        if not all([to_peer_id, session_id, sdp]):
            return {"type": "error", "message": "Missing required fields: to, session_id, sdp"}
        
        logger.info(f"Answer from {peer_id} to {to_peer_id} in session {session_id}")
        
        # Store answer
        self.signaling_manager.handle_answer(session_id, peer_id, sdp)
        
        # Forward answer to recipient
        message = self.signaling_manager.create_signaling_message(
            MessageType.ANSWER,
            peer_id,
            to_peer_id,
            {"sdp": sdp, "session_id": session_id}
        )
        
        return message
    
    async def _handle_ice_candidate(self, peer_id: str, message_data: dict) -> Optional[dict]:
        """Handle ICE candidate."""
        to_peer_id = message_data.get("to")
        session_id = message_data.get("session_id")
        candidate = message_data.get("candidate")
        
        if not all([to_peer_id, session_id, candidate]):
            return {"type": "error", "message": "Missing required fields: to, session_id, candidate"}
        
        # Store ICE candidate
        self.signaling_manager.handle_ice_candidate(session_id, peer_id, candidate)
        
        # Forward candidate to recipient
        message = self.signaling_manager.create_signaling_message(
            MessageType.ICE_CANDIDATE,
            peer_id,
            to_peer_id,
            {"candidate": candidate, "session_id": session_id}
        )
        
        return message


class ConnectionManager:
    """Manages active WebSocket connections for broadcasting."""
    
    def __init__(self):
        self.active_connections: dict = {}  # peer_id -> websocket
    
    def register(self, peer_id: str, websocket):
        """Register a peer connection."""
        self.active_connections[peer_id] = websocket
    
    def unregister(self, peer_id: str):
        """Unregister a peer connection."""
        self.active_connections.pop(peer_id, None)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected peers."""
        disconnected = []
        for peer_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {peer_id}: {e}")
                disconnected.append(peer_id)
        
        # Clean up disconnected peers
        for peer_id in disconnected:
            self.unregister(peer_id)
    
    async def send_to_peer(self, to_peer_id: str, message: dict) -> bool:
        """Send message to specific peer."""
        connection = self.active_connections.get(to_peer_id)
        if not connection:
            logger.warning(f"Peer {to_peer_id} not connected")
            return False
        
        try:
            await connection.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Error sending to {to_peer_id}: {e}")
            self.unregister(to_peer_id)
            return False
    
    def get_connected_peers(self) -> list:
        """Get list of connected peers."""
        return list(self.active_connections.keys())
    
    async def forward_message(self, message: dict):
        """Forward message to recipient peer."""
        to_peer_id = message.get("to")
        if to_peer_id:
            await self.send_to_peer(to_peer_id, message)

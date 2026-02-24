"""
WebSocket endpoints for WebRTC signaling.
"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.websocket.signaling import SignalingManager
from app.websocket.handler import WebSocketHandler, ConnectionManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])

# Global manager instances
signaling_manager = SignalingManager()
connection_manager = ConnectionManager()
websocket_handler = WebSocketHandler(signaling_manager)


@router.websocket("/signal/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for WebRTC signaling.
    
    Handles:
    - Peer registration
    - Offer/Answer/ICE candidate exchange
    - Peer discovery
    
    Example client connection:
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/api/v1/ws/signal/my-peer-id');
    
    ws.addEventListener('open', () => {
        ws.send(JSON.stringify({
            type: 'register',
            user_id: 'user123',
            user_info: { name: 'John Doe', role: 'trainee' }
        }));
    });
    
    ws.addEventListener('message', async (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'offer') {
            // Handle offer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({
                type: 'answer',
                to: message.from,
                session_id: message.data.session_id,
                sdp: answer.sdp
            }));
        } else if (message.type === 'answer') {
            // Handle answer
            await pc.setRemoteDescription(new RTCSessionDescription(message.data.sdp));
        } else if (message.type === 'ice-candidate') {
            // Handle ICE candidate
            await pc.addIceCandidate(message.data.candidate);
        }
    });
    ```
    """
    await websocket.accept()
    
    try:
        # Handle connection
        peer_id = await websocket_handler.handle_connection(websocket, client_id)
        connection_manager.register(peer_id, websocket)
        
        # Send available peers
        available_peers = signaling_manager.get_available_peers(exclude_peer_id=peer_id)
        await websocket.send_json({
            "type": "available-peers",
            "peers": available_peers,
        })
        
        # Message loop
        while True:
            data = await websocket.receive_json()
            logger.debug(f"Message from {peer_id}: {data.get('type')}")
            
            # Handle message
            response = await websocket_handler.handle_message(websocket, data)
            
            if response:
                # For offer/answer/ice-candidate, forward to recipient
                if data.get("type") in ["offer", "answer", "ice-candidate"]:
                    await connection_manager.forward_message(response)
                else:
                    # For other messages, send back to sender
                    await websocket.send_json(response)
    
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
        connection_manager.unregister(client_id)
        await websocket_handler.handle_disconnect(websocket)
    
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        connection_manager.unregister(client_id)
        try:
            await websocket.close(code=1011, reason=str(e))
        except:
            pass


@router.get("/signal/peers")
async def get_peers():
    """
    Get list of available peers for calling.
    
    Returns:
    ```json
    {
        "peers": [
            {
                "peer_id": "abc123",
                "user_id": "user1",
                "connected_at": "2026-02-18T10:30:00",
                "user_info": {"name": "John Doe", "role": "trainee"}
            }
        ],
        "count": 1
    }
    ```
    """
    available_peers = signaling_manager.get_available_peers()
    return {
        "peers": available_peers,
        "count": len(available_peers),
    }


@router.get("/signal/stats")
async def get_signal_stats():
    """
    Get WebRTC signaling server statistics.
    
    Returns:
    ```json
    {
        "total_peers": 5,
        "total_sessions": 2,
        "total_participants": 4,
        "peers": [...],
        "sessions": [...]
    }
    ```
    """
    return signaling_manager.get_stats()


@router.post("/signal/create-session")
async def create_session(initiator_id: str, session_id: str = None):
    """
    Create a new call session.
    
    Query Parameters:
    - initiator_id: Peer ID of session initiator (required)
    - session_id: Custom session ID (optional, auto-generated if not provided)
    
    Returns:
    ```json
    {
        "session_id": "session123",
        "initiator_id": "peer1",
        "participants": ["peer1"],
        "created_at": "2026-02-18T10:30:00"
    }
    ```
    """
    import uuid
    
    if not session_id:
        session_id = str(uuid.uuid4())
    
    session = signaling_manager.create_session(session_id, initiator_id)
    return session.to_dict()


@router.get("/signal/session/{session_id}")
async def get_session(session_id: str):
    """
    Get call session details.
    
    Returns:
    ```json
    {
        "session_id": "session123",
        "initiator_id": "peer1",
        "participants": ["peer1", "peer2"],
        "participant_count": 2,
        "created_at": "2026-02-18T10:30:00"
    }
    ```
    """
    session = signaling_manager.get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    return session.to_dict()

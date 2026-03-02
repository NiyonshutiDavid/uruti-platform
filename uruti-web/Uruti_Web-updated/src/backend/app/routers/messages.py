from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Dict, Set, Any, Optional
from pathlib import Path
import uuid
from jose import JWTError, jwt
from ..database import get_db
from ..config import settings
from ..database import SessionLocal
from ..models import User, Message, NotificationType
from ..schemas import MessageCreate, MessageResponse
from ..auth import get_current_active_user
from .notifications import (
    create_notification,
    publish_notification,
    notification_hub,
)
from datetime import datetime

router = APIRouter(prefix="/messages", tags=["Messages"])


class _MessageRealtimeHub:
    def __init__(self):
        self._connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        self._connections.setdefault(user_id, set()).add(websocket)

    async def disconnect(self, user_id: int, websocket: WebSocket):
        user_sockets = self._connections.get(user_id)
        if not user_sockets:
            return
        user_sockets.discard(websocket)
        if not user_sockets:
            self._connections.pop(user_id, None)

    async def broadcast_to_user(self, user_id: int, payload: Dict[str, Any]):
        sockets = list(self._connections.get(user_id, set()))
        if not sockets:
            return

        stale: List[WebSocket] = []
        for socket in sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                stale.append(socket)

        if stale:
            user_sockets = self._connections.get(user_id)
            if user_sockets:
                for socket in stale:
                    user_sockets.discard(socket)
                if not user_sockets:
                    self._connections.pop(user_id, None)


realtime_hub = _MessageRealtimeHub()


def _to_message_payload(message: Message) -> Dict[str, Any]:
    return {
        "id": message.id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "subject": message.subject,
        "body": message.body,
        "attachments": message.attachments,
        "is_read": bool(message.is_read),
        "read_at": message.read_at.isoformat() if message.read_at else None,
        "is_archived": bool(message.is_archived),
        "thread_id": message.thread_id,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


def _get_ws_user(token: str, db: Session) -> Optional[User]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        subject = payload.get("sub")
        user_id = int(subject) if subject is not None else None
    except (JWTError, ValueError, TypeError):
        return None

    if user_id is None:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        return None
    return user


@router.websocket("/ws")
async def messages_ws(websocket: WebSocket, token: str = Query(...)):
    db = SessionLocal()
    user: Optional[User] = None

    try:
        user = _get_ws_user(token, db)
        if user is None:
            await websocket.close(code=1008)
            return

        await websocket.accept()
        await realtime_hub.connect(user.id, websocket)
        await websocket.send_json({"event": "connected", "user_id": user.id})

        while True:
            raw = await websocket.receive_text()
            if raw:
                await websocket.send_json({"event": "pong"})
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if user is not None:
            await realtime_hub.disconnect(user.id, websocket)
        db.close()


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a new message"""
    
    # Check if receiver exists
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Create message
    db_message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        subject=message_data.subject,
        body=message_data.body,
        attachments=message_data.attachments
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    payload = {
        "event": "message_created",
        "data": _to_message_payload(db_message),
    }

    message_notification = create_notification(
        db,
        user_id=db_message.receiver_id,
        title=f"New message from {current_user.display_name}",
        message=(db_message.body or "New message")[:140],
        notification_type=NotificationType.MESSAGE,
        data={
            "kind": "message",
            "sender_id": db_message.sender_id,
            "thread_user_id": db_message.sender_id,
            "message_id": db_message.id,
        },
    )

    await realtime_hub.broadcast_to_user(db_message.sender_id, payload)
    if db_message.receiver_id != db_message.sender_id:
        await realtime_hub.broadcast_to_user(db_message.receiver_id, payload)
    await publish_notification(message_notification, db)
    
    return db_message


@router.post("/call/signal", status_code=status.HTTP_200_OK)
async def signal_call_event(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Broadcast call signaling events (invite/accept/decline/end) to participants."""

    receiver_id = int(payload.get("receiver_id") or 0)
    action = str(payload.get("action") or "").strip().lower()
    call_id = str(payload.get("call_id") or "").strip() or uuid.uuid4().hex

    if receiver_id <= 0:
        raise HTTPException(status_code=400, detail="receiver_id is required")
    if action not in {"invite", "accept", "decline", "end"}:
        raise HTTPException(status_code=400, detail="Invalid call action")

    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    event_payload = {
        "event": "call_event",
        "data": {
            "call_id": call_id,
            "action": action,
            "caller_id": current_user.id,
            "caller_name": current_user.display_name,
            "caller_avatar_url": current_user.avatar_url,
            "receiver_id": receiver_id,
            "is_video": bool(payload.get("is_video", False)),
            "handle": payload.get("handle"),
            "created_at": datetime.utcnow().isoformat(),
        },
    }

    await realtime_hub.broadcast_to_user(current_user.id, event_payload)
    if receiver_id != current_user.id:
        await realtime_hub.broadcast_to_user(receiver_id, event_payload)

    await notification_hub.broadcast_to_user(current_user.id, event_payload)
    if receiver_id != current_user.id:
        await notification_hub.broadcast_to_user(receiver_id, event_payload)

    return {"status": "ok", "call_id": call_id, "action": action}


@router.get("/inbox", response_model=List[MessageResponse])
def get_inbox(
    skip: int = 0,
    limit: int = 100,
    is_read: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get received messages (inbox)"""
    
    query = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_archived == False
    )
    
    if is_read is not None:
        query = query.filter(Message.is_read == is_read)
    
    messages = query.order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
    
    return messages


@router.get("/sent", response_model=List[MessageResponse])
def get_sent_messages(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get sent messages"""
    
    messages = db.query(Message).filter(
        Message.sender_id == current_user.id
    ).order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
    
    return messages


@router.post("/attachments/upload")
async def upload_message_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Upload chat attachment and return downloadable URL."""

    uploads_dir = Path("uploads") / "messages"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix
    stored_name = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    target_path = uploads_dir / stored_name

    content = await file.read()
    target_path.write_bytes(content)

    return {
        "file_name": file.filename or stored_name,
        "url": f"/api/v1/messages/uploads/{stored_name}",
        "content_type": file.content_type,
        "size": len(content),
    }


@router.put("/read/thread/{other_user_id}")
def mark_thread_as_read(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all incoming messages from a specific user as read."""

    unread_messages = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.sender_id == other_user_id,
        Message.is_read == False,
        Message.is_archived == False,
    ).all()

    now = datetime.utcnow()
    for message in unread_messages:
        message.is_read = True
        message.read_at = now

    db.commit()

    return {"updated_count": len(unread_messages)}


@router.get("/{message_id}", response_model=MessageResponse)
def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific message"""
    
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if user is sender or receiver
    if message.sender_id != current_user.id and message.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Mark as read if user is receiver
    if message.receiver_id == current_user.id and not message.is_read:
        message.is_read = True
        message.read_at = datetime.utcnow()
        db.commit()
        db.refresh(message)
    
    return message


@router.put("/{message_id}/read", response_model=MessageResponse)
def mark_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a message as read"""
    
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if user is receiver
    if message.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    message.is_read = True
    message.read_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return message


@router.put("/{message_id}/archive", response_model=MessageResponse)
def archive_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Archive a message"""
    
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if user is receiver
    if message.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    message.is_archived = True
    
    db.commit()
    db.refresh(message)
    
    return message


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a message"""
    
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if user is sender or receiver
    if message.sender_id != current_user.id and message.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(message)
    db.commit()
    
    return None


@router.get("/unread/count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get count of unread messages"""
    
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False,
        Message.is_archived == False
    ).count()
    
    return {"unread_count": count}

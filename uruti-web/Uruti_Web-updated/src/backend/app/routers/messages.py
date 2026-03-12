from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Dict, Set, Any, Optional
from pathlib import Path
import uuid
import asyncio
import json
import logging
from jose import JWTError, jwt
from ..database import get_db
from ..config import settings
from ..database import SessionLocal
from ..models import User, Message, NotificationType, Connection, Notification
from ..schemas import MessageCreate, MessageResponse
from ..auth import get_current_active_user
from .notifications import (
    create_notification,
    publish_notification,
    notification_hub,
)
from datetime import datetime, timedelta

router = APIRouter(prefix="/messages", tags=["Messages"])

CALL_SIGNAL_KIND = "call_event"


logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Optional Redis import – degrades gracefully if redis package not installed
# or if Redis server is unreachable.
# ---------------------------------------------------------------------------
try:
    import redis.asyncio as aioredis  # type: ignore[import-not-found]
    _REDIS_AVAILABLE = True
except ImportError:
    aioredis = None  # type: ignore[assignment]
    _REDIS_AVAILABLE = False


class _MessageRealtimeHub:
    def __init__(self):
        self._connections: Dict[int, Set[WebSocket]] = {}
        self._redis: Any = None
        self._pubsub: Any = None
        self._listener_task: Any = None

    async def _try_init_redis(self) -> bool:
        """Attempt to connect to Redis. Returns True on success."""
        if not _REDIS_AVAILABLE:
            return False
        redis_url = getattr(settings, "REDIS_URL", None) or "redis://localhost:6379/0"
        try:
            r = aioredis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)
            await r.ping()
            self._redis = r
            logger.info("MessageRealtimeHub: Redis connected at %s", redis_url)
            return True
        except Exception as exc:
            logger.debug("MessageRealtimeHub: Redis unavailable (%s). Using in-process hub.", exc)
            return False

    async def start_redis_listener(self):
        """Subscribe to all user channels and push payloads to local sockets."""
        if self._redis is None:
            return
        try:
            self._pubsub = self._redis.pubsub()
            await self._pubsub.psubscribe("msg:user:*")
            async for raw in self._pubsub.listen():
                if raw["type"] != "pmessage":
                    continue
                channel: str = raw.get("channel", "")
                try:
                    user_id = int(channel.split(":")[-1])
                except (ValueError, IndexError):
                    continue
                try:
                    payload = json.loads(raw["data"])
                except Exception:
                    continue
                await self._local_broadcast(user_id, payload)
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error("MessageRealtimeHub Redis listener error: %s", exc)

    async def connect(self, user_id: int, websocket: WebSocket):
        self._connections.setdefault(user_id, set()).add(websocket)
        # Start Redis listener on first connection if not running
        if self._redis is not None and (self._listener_task is None or self._listener_task.done()):
            self._listener_task = asyncio.create_task(self.start_redis_listener())

    async def disconnect(self, user_id: int, websocket: WebSocket):
        user_sockets = self._connections.get(user_id)
        if not user_sockets:
            return
        user_sockets.discard(websocket)
        if not user_sockets:
            self._connections.pop(user_id, None)

    @property
    def connected_user_ids(self) -> Set[int]:
        """Return the set of user IDs with at least one active WebSocket."""
        return {uid for uid, sockets in self._connections.items() if sockets}

    async def _local_broadcast(self, user_id: int, payload: Dict[str, Any]):
        """Deliver payload to WebSocket connections in this process."""
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

    async def broadcast_to_user(self, user_id: int, payload: Dict[str, Any]):
        """Broadcast to user – via Redis pub/sub if available, otherwise in-process."""
        if self._redis is not None:
            try:
                channel = f"msg:user:{user_id}"
                await self._redis.publish(channel, json.dumps(payload))
                return
            except Exception as exc:
                logger.warning("MessageRealtimeHub Redis publish failed (%s). Fallback to local.", exc)
        # Fallback: direct in-process delivery
        await self._local_broadcast(user_id, payload)


realtime_hub = _MessageRealtimeHub()


def _get_connection_user_ids(user_id: int, db: Session) -> List[int]:
    """Return user IDs of all accepted connections for a given user."""
    rows = db.query(Connection).filter(
        or_(Connection.user1_id == user_id, Connection.user2_id == user_id)
    ).all()
    ids = []
    for conn in rows:
        other = conn.user2_id if conn.user1_id == user_id else conn.user1_id
        ids.append(other)
    return ids


def _enqueue_call_signal_fallback(
    db: Session,
    *,
    user_id: int,
    payload: Dict[str, Any],
) -> None:
    create_notification(
        db,
        user_id=user_id,
        title="Call event",
        message=str(payload.get("action") or "call_event"),
        notification_type=NotificationType.SYSTEM,
        data={
            "kind": CALL_SIGNAL_KIND,
            "payload": payload,
        },
    )


def _parse_call_created_at(payload: Dict[str, Any]) -> Optional[datetime]:
    raw = str(payload.get("created_at") or "").strip()
    if not raw:
        return None
    normalized = raw.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def _to_message_payload(message: Message, sender: Optional[User] = None) -> Dict[str, Any]:
    # Resolve sender info for the WebSocket payload so the client can show
    # real names in notifications instead of "Someone messaged you".
    resolved_sender = sender or getattr(message, "sender", None)
    sender_name = None
    sender_full_name = None
    sender_avatar_url = None
    if resolved_sender is not None:
        sender_name = getattr(resolved_sender, "display_name", None)
        sender_full_name = getattr(resolved_sender, "full_name", None)
        sender_avatar_url = getattr(resolved_sender, "avatar_url", None)

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
        "sender_name": sender_name,
        "sender_full_name": sender_full_name,
        "sender_avatar_url": sender_avatar_url,
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

        # Broadcast presence "online" to all connections
        connection_ids = _get_connection_user_ids(user.id, db)
        online_payload = {"event": "user_online", "data": {"user_id": user.id}}
        for cid in connection_ids:
            await realtime_hub.broadcast_to_user(cid, online_payload)
            await notification_hub.broadcast_to_user(cid, online_payload)

        await websocket.send_json({"event": "connected", "user_id": user.id})

        while True:
            raw = await websocket.receive_text()
            if raw:
                # Update last_login on heartbeat to keep presence fresh
                user.last_login = datetime.utcnow()
                db.commit()
                await websocket.send_json({"event": "pong"})
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if user is not None:
            await realtime_hub.disconnect(user.id, websocket)
            # Broadcast "offline" only when this was the last socket for the user
            if user.id not in realtime_hub.connected_user_ids:
                connection_ids = _get_connection_user_ids(user.id, db)
                offline_payload = {"event": "user_offline", "data": {"user_id": user.id}}
                for cid in connection_ids:
                    await realtime_hub.broadcast_to_user(cid, offline_payload)
                    await notification_hub.broadcast_to_user(cid, offline_payload)
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
        "data": _to_message_payload(db_message, sender=current_user),
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
    if receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot signal a call to yourself")
    valid_actions = {
        "invite",
        "accept",
        "decline",
        "end",
        "webrtc_offer",
        "webrtc_answer",
        "webrtc_ice",
        "media_state",
    }
    if action not in valid_actions:
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
            "webrtc_data": payload.get("webrtc_data"),
            "created_at": datetime.utcnow().isoformat(),
        },
    }

    # Do not echo signaling to sender; sender already updates local state and
    # self-echo can trigger duplicate incoming-call UI on some mobile builds.
    await realtime_hub.broadcast_to_user(receiver_id, event_payload)
    await notification_hub.broadcast_to_user(receiver_id, event_payload)
    _enqueue_call_signal_fallback(db, user_id=receiver_id, payload=event_payload["data"])

    # Push the incoming invite to all registered devices so backgrounded/locked
    # devices still ring even when WebSocket delivery is not active.
    if action == "invite":
        invite_notification = create_notification(
            db,
            user_id=receiver_id,
            title=f"Incoming {('video' if bool(payload.get('is_video', False)) else 'voice')} call",
            message=f"{current_user.display_name} is calling you",
            notification_type=NotificationType.SYSTEM,
            data={
                "kind": CALL_SIGNAL_KIND,
                **event_payload["data"],
            },
        )
        await publish_notification(invite_notification, db)

    return {"status": "ok", "call_id": call_id, "action": action}


@router.get("/call/pending", status_code=status.HTTP_200_OK)
def consume_pending_call_events(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return and delete pending call signaling events for polling fallbacks."""

    rows = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.asc()).all()

    pending: List[Dict[str, Any]] = []
    consumed_ids: List[int] = []
    grouped_by_call: Dict[str, List[Dict[str, Any]]] = {}
    terminal_actions = {"decline", "end"}
    stale_cutoff = datetime.utcnow() - timedelta(seconds=20)

    for notification in rows:
        data = notification.data or {}
        if not isinstance(data, dict) or data.get("kind") != CALL_SIGNAL_KIND:
            continue

        payload = data.get("payload")
        consumed_ids.append(notification.id)
        if not isinstance(payload, dict):
            continue

        call_id = str(payload.get("call_id") or "").strip()
        if not call_id:
            pending.append({
                "event": CALL_SIGNAL_KIND,
                "data": payload,
            })
            if len(pending) >= limit:
                break
            continue

        grouped_by_call.setdefault(call_id, []).append(payload)

    if len(pending) < limit:
        for call_id, events in grouped_by_call.items():
            terminal = [item for item in events if str(item.get("action") or "").lower() in terminal_actions]
            if terminal:
                latest_terminal = sorted(
                    terminal,
                    key=lambda item: _parse_call_created_at(item) or datetime.min,
                )[-1]
                pending.append({
                    "event": CALL_SIGNAL_KIND,
                    "data": latest_terminal,
                })
            else:
                filtered = [
                    item for item in events
                    if str(item.get("action") or "").lower() != "invite"
                    or (_parse_call_created_at(item) and _parse_call_created_at(item) >= stale_cutoff)
                ]
                for item in filtered:
                    pending.append({
                        "event": CALL_SIGNAL_KIND,
                        "data": item,
                    })
                    if len(pending) >= limit:
                        break
            if len(pending) >= limit:
                break

    if consumed_ids:
        db.query(Notification).filter(Notification.id.in_(consumed_ids)).delete(synchronize_session=False)
        db.commit()

    return pending


@router.get("/conversations", status_code=status.HTTP_200_OK)
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    connection_ids = _get_connection_user_ids(current_user.id, db)
    if not connection_ids:
        return []

    users = db.query(User).filter(User.id.in_(connection_ids)).all()
    users_by_id = {user.id: user for user in users}
    conversations: List[Dict[str, Any]] = []

    for other_user_id in connection_ids:
        other_user = users_by_id.get(other_user_id)
        if other_user is None:
            continue

        last_message = db.query(Message).filter(
            or_(
                (Message.sender_id == current_user.id) & (Message.receiver_id == other_user_id),
                (Message.sender_id == other_user_id) & (Message.receiver_id == current_user.id),
            )
        ).order_by(desc(Message.created_at)).first()

        # Only show established conversations (threads with at least one message).
        if last_message is None:
            continue

        unread_count = db.query(Message).filter(
            Message.sender_id == other_user_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False,
            Message.is_archived == False,
        ).count()

        is_online = bool(
            other_user.is_active and
            other_user.last_login and
            (datetime.utcnow() - other_user.last_login.replace(tzinfo=None)).total_seconds() < 600
        )

        conversations.append({
            "other_user": {
                "id": other_user.id,
                "full_name": other_user.display_name,
                "display_name": other_user.display_name,
                "role": other_user.role.value if hasattr(other_user.role, "value") else str(other_user.role),
                "avatar_url": other_user.avatar_url,
                "phone": other_user.phone,
                "is_online": is_online,
            },
            "last_message": (last_message.body if last_message else "") or "",
            "last_message_time": last_message.created_at.isoformat() if last_message and last_message.created_at else "",
            "unread_count": unread_count,
            "is_starred": False,
        })

    conversations.sort(key=lambda item: item.get("last_message_time") or "", reverse=True)
    return conversations


@router.get("/thread/{other_user_id}", response_model=List[MessageResponse])
def get_thread_messages(
    other_user_id: int,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    messages = db.query(Message).filter(
        or_(
            (Message.sender_id == current_user.id) & (Message.receiver_id == other_user_id),
            (Message.sender_id == other_user_id) & (Message.receiver_id == current_user.id),
        )
    ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()
    return messages


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


@router.delete("/threads/{other_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete all messages in a direct thread between current user and other user."""

    if other_user_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid user id")

    db.query(Message).filter(
        or_(
            (Message.sender_id == current_user.id) & (Message.receiver_id == other_user_id),
            (Message.sender_id == other_user_id) & (Message.receiver_id == current_user.id),
        )
    ).delete(synchronize_session=False)

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

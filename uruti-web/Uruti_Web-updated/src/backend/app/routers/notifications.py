from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Set, Any, Optional
from datetime import datetime
from jose import JWTError, jwt
from ..database import get_db
from ..database import SessionLocal
from ..config import settings
from ..models import User, Notification, NotificationType, PushDeviceToken, PushPlatform
from ..schemas import NotificationCreate, NotificationResponse, PushTokenUpsert, PushTokenRemove
from ..auth import get_current_active_user
from ..services.push_notifications import send_push_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class _NotificationRealtimeHub:
    def __init__(self):
        self._connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        self._connections.setdefault(user_id, set()).add(websocket)

    async def disconnect(self, user_id: int, websocket: WebSocket):
        sockets = self._connections.get(user_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self._connections.pop(user_id, None)

    @property
    def connected_user_ids(self) -> Set[int]:
        """Return the set of user IDs with at least one active WebSocket."""
        return {uid for uid, sockets in self._connections.items() if sockets}

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
            current = self._connections.get(user_id)
            if current:
                for socket in stale:
                    current.discard(socket)
                if not current:
                    self._connections.pop(user_id, None)


notification_hub = _NotificationRealtimeHub()


def _to_notification_payload(notification: Notification) -> Dict[str, Any]:
    return {
        "id": notification.id,
        "user_id": notification.user_id,
        "type": notification.type.value if hasattr(notification.type, "value") else notification.type,
        "title": notification.title,
        "message": notification.message,
        "data": notification.data,
        "is_read": bool(notification.is_read),
        "read_at": notification.read_at.isoformat() if notification.read_at else None,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
    }


def create_notification(
    db: Session,
    *,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.SYSTEM,
    data: Optional[Dict[str, Any]] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        data=data or {},
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


async def publish_notification_event(notification: Notification):
    await notification_hub.broadcast_to_user(
        notification.user_id,
        {
            "event": "notification_created",
            "data": _to_notification_payload(notification),
        },
    )

async def publish_notification(notification: Notification, db: Session):
    await publish_notification_event(notification)

    tokens = db.query(PushDeviceToken).filter(
        PushDeviceToken.user_id == notification.user_id,
        PushDeviceToken.is_active == True,
    ).all()

    if not tokens:
        return

    token_values = [item.token for item in tokens if item.token]
    if not token_values:
        return

    result = send_push_notification(
        tokens=token_values,
        title=notification.title,
        body=notification.message,
        data={
            "notification_id": notification.id,
            "type": notification.type.value if hasattr(notification.type, "value") else notification.type,
            **(notification.data or {}),
        },
    )

    invalid = set(result.get("invalid_tokens", []))
    if invalid:
        for item in tokens:
            if item.token in invalid:
                item.is_active = False
        db.commit()


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
async def notifications_ws(websocket: WebSocket, token: str = Query(...)):
    db = SessionLocal()
    user: Optional[User] = None

    try:
        user = _get_ws_user(token, db)
        if user is None:
            await websocket.close(code=1008)
            return

        await websocket.accept()
        await notification_hub.connect(user.id, websocket)
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
            await notification_hub.disconnect(user.id, websocket)
        db.close()


@router.post("/device-token", status_code=status.HTTP_200_OK)
def register_device_token(
    payload: PushTokenUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    token = payload.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    platform_text = (payload.platform or "unknown").strip().lower()
    if platform_text not in {"ios", "android", "web", "unknown"}:
        platform_text = "unknown"

    existing = db.query(PushDeviceToken).filter(PushDeviceToken.token == token).first()
    if existing:
        existing.user_id = current_user.id
        existing.platform = PushPlatform(platform_text)
        existing.device_id = payload.device_id
        existing.is_active = True
        db.commit()
        return {"status": "updated"}

    db_token = PushDeviceToken(
        user_id=current_user.id,
        token=token,
        platform=PushPlatform(platform_text),
        device_id=payload.device_id,
        is_active=True,
    )
    db.add(db_token)
    db.commit()
    return {"status": "registered"}


@router.delete("/device-token")
def unregister_device_token(
    payload: PushTokenRemove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    token = payload.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    existing = db.query(PushDeviceToken).filter(
        PushDeviceToken.user_id == current_user.id,
        PushDeviceToken.token == token,
    ).first()
    if existing:
        existing.is_active = False
        db.commit()

    return {"status": "removed"}


@router.get("", response_model=List[NotificationResponse], include_in_schema=False)
@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    is_read: Optional[bool] = Query(default=None),
    notification_type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get notifications for current user"""
    
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    
    if notification_type:
        query = query.filter(Notification.type == notification_type)
    
    notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
    
    return notifications


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific notification"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Check ownership
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return notification


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a notification as read"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Check ownership
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    
    db.commit()
    db.refresh(notification)
    
    return notification


@router.put("/read-all", status_code=status.HTTP_200_OK)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all notifications as read"""
    
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True, "read_at": datetime.utcnow()})
    
    db.commit()
    
    return {"message": "All notifications marked as read"}


@router.delete("/clear-all", status_code=status.HTTP_200_OK)
def clear_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete all notifications for the current user"""

    deleted = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).delete(synchronize_session=False)

    db.commit()

    return {"message": "All notifications cleared", "deleted_count": int(deleted or 0)}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a notification"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Check ownership
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(notification)
    db.commit()
    
    return None


@router.get("/unread/count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get count of unread notifications"""
    
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {"unread_count": count}

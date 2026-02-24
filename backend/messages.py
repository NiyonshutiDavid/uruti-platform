from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.api import deps

from pydantic import BaseModel
from fastapi import WebSocket, WebSocketDisconnect
from ws_manager import manager

router = APIRouter()


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, nullable=False)
    recipient_id = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MessageCreate(BaseModel):
    recipient_id: int
    content: str


class MessageRead(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    content: str
    created_at: str

    class Config:
        from_attributes = True


@router.post("/", response_model=MessageRead)
async def send_message(
    message_in: MessageCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a message from current_user to recipient."""
    # Basic recipient check
    result = await db.execute(select(User).where(User.id == message_in.recipient_id))
    recipient = result.scalars().first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    msg = Message(
        sender_id=current_user.id,
        recipient_id=message_in.recipient_id,
        content=message_in.content,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


@router.get("/conversations/{user_id}", response_model=List[MessageRead])
async def get_conversation(
    user_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Return messages between current_user and user_id."""
    q = select(Message).where(
        ((Message.sender_id == current_user.id) & (Message.recipient_id == user_id))
        | ((Message.sender_id == user_id) & (Message.recipient_id == current_user.id))
    ).order_by(Message.created_at)
    result = await db.execute(q)
    messages = result.scalars().all()
    return messages


@router.websocket_route("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    # Simple WebSocket for receiving messages in real-time (dev only)
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo to sender and broadcast to recipient (simple protocol: "to:recipient_id|message")
            if data.startswith("to:"):
                try:
                    parts = data.split("|", 1)
                    target_part = parts[0]
                    msg = parts[1]
                    target_id = int(target_part.split(":", 1)[1])
                    await manager.send_personal_message(target_id, msg)
                except Exception:
                    await websocket.send_text("error: invalid format")
            else:
                await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

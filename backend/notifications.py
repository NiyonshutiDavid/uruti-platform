from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import Base
from app.db.session import get_db
from app.api import deps
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    body: str | None = None


class NotificationRead(BaseModel):
    id: int
    user_id: int
    title: str
    body: str | None
    created_at: str

    class Config:
        from_attributes = True


@router.post("/", response_model=NotificationRead)
async def create_notification(
    n_in: NotificationCreate, db: AsyncSession = Depends(get_db)
) -> Any:
    n = Notification(user_id=n_in.user_id, title=n_in.title, body=n_in.body)
    db.add(n)
    await db.commit()
    await db.refresh(n)
    return n


@router.get("/user/{user_id}", response_model=List[NotificationRead])
async def get_notifications(user_id: int, current_user: User = Depends(deps.get_current_user), db: AsyncSession = Depends(get_db)) -> Any:
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    q = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
    result = await db.execute(q)
    items = result.scalars().all()
    return items

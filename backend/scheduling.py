from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.api import deps
from pydantic import BaseModel

router = APIRouter()


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0-6 for Monday-Sunday
    start_time = Column(String(5), nullable=False)  # HH:MM format
    end_time = Column(String(5), nullable=False)  # HH:MM format
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ScheduledSession(Base):
    __tablename__ = "scheduled_sessions"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, nullable=False)
    participant_id = Column(Integer, nullable=False)  # founder/startup
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=60)
    session_type = Column(String(50), nullable=False)  # mentorship, pitch, advisory, call
    status = Column(String(50), default="scheduled")  # scheduled, started, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AvailabilitySlotCreate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str


class ScheduledSessionCreate(BaseModel):
    mentor_id: int
    scheduled_at: datetime
    duration_minutes: int = 60
    session_type: str
    notes: Optional[str] = None


class AvailabilitySlotRead(BaseModel):
    id: int
    user_id: int
    day_of_week: int
    start_time: str
    end_time: str
    is_available: bool

    class Config:
        from_attributes = True


class ScheduledSessionRead(BaseModel):
    id: int
    mentor_id: int
    participant_id: int
    scheduled_at: datetime
    duration_minutes: int
    session_type: str
    status: str
    notes: Optional[str]

    class Config:
        from_attributes = True


@router.post("/availability", response_model=AvailabilitySlotRead)
async def add_availability(
    slot_in: AvailabilitySlotCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Add availability slot for mentor."""
    slot = AvailabilitySlot(
        user_id=current_user.id,
        day_of_week=slot_in.day_of_week,
        start_time=slot_in.start_time,
        end_time=slot_in.end_time,
        is_available=True,
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return slot


@router.get("/availability/{user_id}", response_model=List[AvailabilitySlotRead])
async def get_availability(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get availability slots for a user."""
    result = await db.execute(
        select(AvailabilitySlot).where(AvailabilitySlot.user_id == user_id)
    )
    slots = result.scalars().all()
    return slots


@router.put("/availability/{slot_id}", response_model=AvailabilitySlotRead)
async def update_availability(
    slot_id: int,
    is_available: Optional[bool] = None,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update availability slot."""
    result = await db.execute(select(AvailabilitySlot).where(AvailabilitySlot.id == slot_id))
    slot = result.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if is_available is not None:
        slot.is_available = is_available
    
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return slot


@router.delete("/availability/{slot_id}")
async def delete_availability(
    slot_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Delete availability slot."""
    result = await db.execute(select(AvailabilitySlot).where(AvailabilitySlot.id == slot_id))
    slot = result.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    await db.delete(slot)
    await db.commit()
    return {"detail": "Slot deleted"}


@router.post("/sessions", response_model=ScheduledSessionRead)
async def schedule_session(
    session_in: ScheduledSessionCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Schedule a session with mentor."""
    session = ScheduledSession(
        mentor_id=session_in.mentor_id,
        participant_id=current_user.id,
        scheduled_at=session_in.scheduled_at,
        duration_minutes=session_in.duration_minutes,
        session_type=session_in.session_type,
        status="scheduled",
        notes=session_in.notes,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/sessions/my-scheduled", response_model=List[ScheduledSessionRead])
async def get_my_sessions(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get sessions created by current user (mentee)."""
    result = await db.execute(
        select(ScheduledSession).where(ScheduledSession.participant_id == current_user.id)
    )
    sessions = result.scalars().all()
    return sessions


@router.get("/sessions/my-mentoring", response_model=List[ScheduledSessionRead])
async def get_mentoring_sessions(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get sessions where current user is the mentor."""
    result = await db.execute(
        select(ScheduledSession).where(ScheduledSession.mentor_id == current_user.id)
    )
    sessions = result.scalars().all()
    return sessions


@router.put("/sessions/{session_id}", response_model=ScheduledSessionRead)
async def update_session(
    session_id: int,
    status: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update session status (reschedule, cancel, mark complete)."""
    result = await db.execute(select(ScheduledSession).where(ScheduledSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Allow mentor or participant to update
    if session.mentor_id != current_user.id and session.participant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if status:
        session.status = status
    if notes:
        session.notes = notes
    
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=ScheduledSessionRead)
async def get_session(
    session_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get session details."""
    result = await db.execute(select(ScheduledSession).where(ScheduledSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    # Allow mentor or participant to view
    if session.mentor_id != current_user.id and session.participant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return session

from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.api import deps
from pydantic import BaseModel

router = APIRouter()


class PitchSession(Base):
    __tablename__ = "pitch_sessions"

    id = Column(Integer, primary_key=True, index=True)
    founder_id = Column(Integer, nullable=False)
    venture_id = Column(Integer, nullable=True)
    pitch_text = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    overall_score = Column(Float, default=0.0)
    delivery_score = Column(Float, default=0.0)
    content_score = Column(Float, default=0.0)
    engagement_score = Column(Float, default=0.0)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PitchSessionCreate(BaseModel):
    pitch_text: Optional[str] = None
    video_url: Optional[str] = None
    duration_seconds: Optional[int] = None


class PitchSessionUpdate(BaseModel):
    pitch_text: Optional[str] = None
    video_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    overall_score: Optional[float] = None
    delivery_score: Optional[float] = None
    content_score: Optional[float] = None
    engagement_score: Optional[float] = None
    feedback: Optional[str] = None


class PitchSessionRead(BaseModel):
    id: int
    founder_id: int
    venture_id: Optional[int]
    pitch_text: Optional[str]
    video_url: Optional[str]
    duration_seconds: Optional[int]
    overall_score: float
    delivery_score: float
    content_score: float
    engagement_score: float
    feedback: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.post("/", response_model=PitchSessionRead)
async def create_pitch_session(
    session_in: PitchSessionCreate,
    venture_id: Optional[int] = None,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a new pitch session."""
    session = PitchSession(
        founder_id=current_user.id,
        venture_id=venture_id,
        pitch_text=session_in.pitch_text,
        video_url=session_in.video_url,
        duration_seconds=session_in.duration_seconds,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/", response_model=List[PitchSessionRead])
async def get_pitch_sessions(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get all pitch sessions for current user."""
    result = await db.execute(
        select(PitchSession).where(PitchSession.founder_id == current_user.id)
    )
    sessions = result.scalars().all()
    return sessions


@router.get("/{session_id}", response_model=PitchSessionRead)
async def get_pitch_session(
    session_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get a specific pitch session."""
    result = await db.execute(select(PitchSession).where(PitchSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return session


@router.put("/{session_id}", response_model=PitchSessionRead)
async def update_pitch_session(
    session_id: int,
    update_in: PitchSessionUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update a pitch session (scores and feedback)."""
    result = await db.execute(select(PitchSession).where(PitchSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    update_data = update_in.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(session, key, val)
    
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/performance/analytics", response_model=dict)
async def get_pitch_analytics(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get pitch performance analytics."""
    result = await db.execute(
        select(PitchSession).where(PitchSession.founder_id == current_user.id)
    )
    sessions = result.scalars().all()
    
    if not sessions:
        return {
            "total_pitches": 0,
            "avg_score": 0.0,
            "best_score": 0.0,
            "improvement_trend": [],
        }
    
    scores = [s.overall_score for s in sessions]
    avg_score = sum(scores) / len(scores) if scores else 0.0
    
    return {
        "total_pitches": len(sessions),
        "avg_score": round(avg_score, 2),
        "best_score": round(max(scores), 2) if scores else 0.0,
        "latest_score": round(sessions[-1].overall_score, 2) if sessions else 0.0,
        "improvement_trend": [round(s.overall_score, 2) for s in sessions],
    }

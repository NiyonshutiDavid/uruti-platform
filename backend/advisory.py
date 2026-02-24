from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.api import deps
from pydantic import BaseModel

router = APIRouter()


class AdvisoryTrack(Base):
    __tablename__ = "advisory_tracks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # business, tech, marketing, finance, etc.
    duration_weeks = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TrackEnrollment(Base):
    __tablename__ = "track_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    founder_id = Column(Integer, nullable=False)
    track_id = Column(Integer, nullable=False)
    status = Column(String(50), default="active")  # active, completed, paused
    progress_percentage = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AdvisoryTrackCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    duration_weeks: Optional[int] = None


class TrackEnrollmentCreate(BaseModel):
    track_id: int


class AdvisoryTrackRead(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    duration_weeks: Optional[int]

    class Config:
        from_attributes = True


class TrackEnrollmentRead(BaseModel):
    id: int
    founder_id: int
    track_id: int
    status: str
    progress_percentage: int

    class Config:
        from_attributes = True


@router.post("/tracks", response_model=AdvisoryTrackRead)
async def create_track(
    track_in: AdvisoryTrackCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a new advisory track (admin only)."""
    # In production, check if user is admin
    track = AdvisoryTrack(
        title=track_in.title,
        description=track_in.description,
        category=track_in.category,
        duration_weeks=track_in.duration_weeks,
    )
    db.add(track)
    await db.commit()
    await db.refresh(track)
    return track


@router.get("/tracks", response_model=List[AdvisoryTrackRead])
async def list_tracks(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List all advisory tracks."""
    query = select(AdvisoryTrack)
    if category:
        query = query.where(AdvisoryTrack.category == category)
    
    result = await db.execute(query)
    tracks = result.scalars().all()
    return tracks


@router.get("/tracks/{track_id}", response_model=AdvisoryTrackRead)
async def get_track(
    track_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get a specific track."""
    result = await db.execute(select(AdvisoryTrack).where(AdvisoryTrack.id == track_id))
    track = result.scalars().first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return track


@router.post("/enroll", response_model=TrackEnrollmentRead)
async def enroll_in_track(
    enrollment_in: TrackEnrollmentCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Enroll in an advisory track."""
    # Check track exists
    result = await db.execute(select(AdvisoryTrack).where(AdvisoryTrack.id == enrollment_in.track_id))
    track = result.scalars().first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    # Check not already enrolled
    result = await db.execute(
        select(TrackEnrollment).where(
            (TrackEnrollment.founder_id == current_user.id) & 
            (TrackEnrollment.track_id == enrollment_in.track_id) &
            (TrackEnrollment.status == "active")
        )
    )
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this track")
    
    enrollment = TrackEnrollment(
        founder_id=current_user.id,
        track_id=enrollment_in.track_id,
        status="active",
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment


@router.get("/my-enrollments", response_model=List[TrackEnrollmentRead])
async def get_my_enrollments(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get all track enrollments for current user."""
    result = await db.execute(
        select(TrackEnrollment).where(TrackEnrollment.founder_id == current_user.id)
    )
    enrollments = result.scalars().all()
    return enrollments


@router.put("/enrollments/{enrollment_id}", response_model=TrackEnrollmentRead)
async def update_enrollment(
    enrollment_id: int,
    status: Optional[str] = None,
    progress_percentage: Optional[int] = None,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update track enrollment progress."""
    result = await db.execute(select(TrackEnrollment).where(TrackEnrollment.id == enrollment_id))
    enrollment = result.scalars().first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if enrollment.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if status:
        enrollment.status = status
    if progress_percentage is not None:
        enrollment.progress_percentage = progress_percentage
    
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment

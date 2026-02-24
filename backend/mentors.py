from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.api import deps
from pydantic import BaseModel

router = APIRouter()


class Mentor(Base):
    __tablename__ = "mentors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True)
    expertise = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    availability = Column(String(100), default="available")  # available, on-leave, not-available
    rate_per_hour = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Mentorship(Base):
    __tablename__ = "mentorships"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, nullable=False)
    founder_id = Column(Integer, nullable=False)
    venture_id = Column(Integer, nullable=True)
    status = Column(String(50), default="active")  # active, paused, completed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MentorCreate(BaseModel):
    expertise: Optional[str] = None
    bio: Optional[str] = None
    rate_per_hour: Optional[int] = None


class MentorRead(BaseModel):
    id: int
    user_id: int
    expertise: Optional[str]
    bio: Optional[str]
    availability: str
    rate_per_hour: Optional[int]

    class Config:
        from_attributes = True


class MentorshipCreate(BaseModel):
    mentor_id: int
    venture_id: Optional[int] = None


class MentorshipRead(BaseModel):
    id: int
    mentor_id: int
    founder_id: int
    venture_id: Optional[int]
    status: str
    notes: Optional[str]

    class Config:
        from_attributes = True


@router.post("/register", response_model=MentorRead)
async def register_as_mentor(
    mentor_in: MentorCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Register current user as a mentor."""
    result = await db.execute(select(Mentor).where(Mentor.user_id == current_user.id))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as mentor")
    
    mentor = Mentor(
        user_id=current_user.id,
        expertise=mentor_in.expertise,
        bio=mentor_in.bio,
        rate_per_hour=mentor_in.rate_per_hour,
    )
    db.add(mentor)
    await db.commit()
    await db.refresh(mentor)
    return mentor


@router.get("/list", response_model=List[MentorRead])
async def list_mentors(
    expertise: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List all mentors (public)."""
    query = select(Mentor).where(Mentor.availability == "available")
    if expertise:
        query = query.where(Mentor.expertise.ilike(f"%{expertise}%"))
    
    result = await db.execute(query)
    mentors = result.scalars().all()
    return mentors


@router.post("/request", response_model=MentorshipRead)
async def request_mentorship(
    mentorship_in: MentorshipCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Request mentorship from a mentor."""
    # Check mentor exists
    result = await db.execute(select(Mentor).where(Mentor.id == mentorship_in.mentor_id))
    mentor = result.scalars().first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    mentorship = Mentorship(
        mentor_id=mentorship_in.mentor_id,
        founder_id=current_user.id,
        venture_id=mentorship_in.venture_id,
        status="active",
    )
    db.add(mentorship)
    await db.commit()
    await db.refresh(mentorship)
    return mentorship


@router.get("/my-mentees", response_model=List[MentorshipRead])
async def get_my_mentees(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get all mentees for current mentor."""
    # Check if user is a mentor
    result = await db.execute(select(Mentor).where(Mentor.user_id == current_user.id))
    mentor = result.scalars().first()
    if not mentor:
        raise HTTPException(status_code=403, detail="Not registered as a mentor")
    
    result = await db.execute(select(Mentorship).where(Mentorship.mentor_id == mentor.id))
    mentorships = result.scalars().all()
    return mentorships


@router.get("/my-mentors", response_model=List[MentorshipRead])
async def get_my_mentors(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get all mentors for current founder."""
    result = await db.execute(select(Mentorship).where(Mentorship.founder_id == current_user.id))
    mentorships = result.scalars().all()
    return mentorships

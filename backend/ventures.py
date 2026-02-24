from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.api import deps
from pydantic import BaseModel

router = APIRouter()


class Venture(Base):
    __tablename__ = "ventures"

    id = Column(Integer, primary_key=True, index=True)
    founder_id = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    stage = Column(String(50), default="idea")  # idea, mvp, traction, scaling
    pitch_score = Column(Float, default=0.0)
    investment_score = Column(Float, default=0.0)
    funding_target = Column(Float, nullable=True)
    problem_statement = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    target_market = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class VentureCreate(BaseModel):
    title: str
    description: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = "idea"
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    target_market: Optional[str] = None
    funding_target: Optional[float] = None


class VentureUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    target_market: Optional[str] = None
    funding_target: Optional[float] = None
    pitch_score: Optional[float] = None
    investment_score: Optional[float] = None


class VentureRead(BaseModel):
    id: int
    founder_id: int
    title: str
    description: Optional[str]
    industry: Optional[str]
    stage: str
    pitch_score: float
    investment_score: float
    funding_target: Optional[float]
    problem_statement: Optional[str]
    solution: Optional[str]
    target_market: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.post("/", response_model=VentureRead)
async def create_venture(
    venture_in: VentureCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a new venture for the current user."""
    venture = Venture(
        founder_id=current_user.id,
        title=venture_in.title,
        description=venture_in.description,
        industry=venture_in.industry,
        stage=venture_in.stage,
        problem_statement=venture_in.problem_statement,
        solution=venture_in.solution,
        target_market=venture_in.target_market,
        funding_target=venture_in.funding_target,
    )
    db.add(venture)
    await db.commit()
    await db.refresh(venture)
    return venture


@router.get("/", response_model=List[VentureRead])
async def get_ventures(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get all ventures for current user."""
    result = await db.execute(select(Venture).where(Venture.founder_id == current_user.id))
    ventures = result.scalars().all()
    return ventures


@router.get("/{venture_id}", response_model=VentureRead)
async def get_venture(
    venture_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get a specific venture."""
    result = await db.execute(select(Venture).where(Venture.id == venture_id))
    venture = result.scalars().first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")
    if venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return venture


@router.put("/{venture_id}", response_model=VentureRead)
async def update_venture(
    venture_id: int,
    venture_in: VentureUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update a venture."""
    result = await db.execute(select(Venture).where(Venture.id == venture_id))
    venture = result.scalars().first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")
    if venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    update_data = venture_in.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(venture, key, val)
    
    db.add(venture)
    await db.commit()
    await db.refresh(venture)
    return venture


@router.delete("/{venture_id}")
async def delete_venture(
    venture_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Delete a venture."""
    result = await db.execute(select(Venture).where(Venture.id == venture_id))
    venture = result.scalars().first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")
    if venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    await db.delete(venture)
    await db.commit()
    return {"msg": "Venture deleted"}


@router.get("/discover/all", response_model=List[VentureRead])
async def discover_ventures(
    stage: Optional[str] = None,
    industry: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Discover ventures (public, for investors)."""
    query = select(Venture)
    if stage:
        query = query.where(Venture.stage == stage)
    if industry:
        query = query.where(Venture.industry == industry)
    
    result = await db.execute(query.order_by(Venture.investment_score.desc()))
    ventures = result.scalars().all()
    return ventures

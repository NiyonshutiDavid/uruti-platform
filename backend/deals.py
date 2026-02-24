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


class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    investor_id = Column(Integer, nullable=False)
    venture_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    equity_percentage = Column(Float, nullable=True)
    status = Column(String(50), default="interested")  # interested, negotiating, completed, declined
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DealCreate(BaseModel):
    venture_id: int
    amount: float
    equity_percentage: Optional[float] = None
    notes: Optional[str] = None


class DealUpdate(BaseModel):
    status: Optional[str] = None
    amount: Optional[float] = None
    equity_percentage: Optional[float] = None
    notes: Optional[str] = None


class DealRead(BaseModel):
    id: int
    investor_id: int
    venture_id: int
    amount: float
    equity_percentage: Optional[float]
    status: str
    notes: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.post("/", response_model=DealRead)
async def create_deal(
    deal_in: DealCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a new deal (investor expresses interest)."""
    deal = Deal(
        investor_id=current_user.id,
        venture_id=deal_in.venture_id,
        amount=deal_in.amount,
        equity_percentage=deal_in.equity_percentage,
        notes=deal_in.notes,
    )
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return deal


@router.get("/my-investments", response_model=List[DealRead])
async def get_my_investments(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get all deals/investments for current investor."""
    result = await db.execute(select(Deal).where(Deal.investor_id == current_user.id))
    deals = result.scalars().all()
    return deals


@router.get("/my-offers", response_model=List[DealRead])
async def get_offers_on_my_ventures(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get all offers on current founder's ventures."""
    # Get all ventures for current user
    from ventures import Venture
    result = await db.execute(select(Venture).where(Venture.founder_id == current_user.id))
    ventures = result.scalars().all()
    venture_ids = [v.id for v in ventures]
    
    # Get all deals for these ventures
    if not venture_ids:
        return []
    
    result = await db.execute(select(Deal).where(Deal.venture_id.in_(venture_ids)))
    deals = result.scalars().all()
    return deals


@router.put("/{deal_id}", response_model=DealRead)
async def update_deal(
    deal_id: int,
    update_in: DealUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update deal status or terms."""
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalars().first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Check permission (investor or founder of venture)
    if deal.investor_id != current_user.id:
        from ventures import Venture
        result = await db.execute(select(Venture).where(Venture.id == deal.venture_id))
        venture = result.scalars().first()
        if not venture or venture.founder_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    
    update_data = update_in.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(deal, key, val)
    
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return deal


@router.get("/portfolio/summary", response_model=dict)
async def get_portfolio_summary(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get investment portfolio summary."""
    result = await db.execute(select(Deal).where(Deal.investor_id == current_user.id))
    deals = result.scalars().all()
    
    total_invested = sum(d.amount for d in deals)
    active_deals = len([d for d in deals if d.status == "completed"])
    total_equity = sum(d.equity_percentage or 0 for d in deals)
    
    return {
        "total_invested": round(total_invested, 2),
        "active_investments": active_deals,
        "total_equity_percentage": round(total_equity, 2),
        "deal_count": len(deals),
    }

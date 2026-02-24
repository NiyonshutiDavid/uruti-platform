from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from ventures import Venture
from mentors import Mentorship
from pitch_performance import PitchSession
from deals import Deal

router = APIRouter()


@router.get("/me")
async def get_dashboard(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return role-based dashboard with real data from database."""

    if current_user.role == "investor":
        deals_result = await db.execute(
            select(Deal).where(Deal.investor_id == current_user.id)
        )
        deals = deals_result.scalars().all()

        opportunities_result = await db.execute(select(Venture))
        available_startups = opportunities_result.scalars().all()

        portfolio_value = sum(float(deal.amount or 0) for deal in deals)

        return {
            "role": "investor",
            "name": current_user.full_name,
            "stats": {
                "portfolio_value": int(portfolio_value),
                "active_deals": len([d for d in deals if d.status == "completed"]),
                "deals_in_pipeline": len([d for d in deals if d.status in ["interested", "negotiating"]]),
                "available_opportunities": len(available_startups),
            },
            "recent_deals": [
                {
                    "id": d.id,
                    "venture_id": d.venture_id,
                    "amount": d.amount,
                    "status": d.status,
                    "created_at": d.created_at.isoformat() if d.created_at else None,
                }
                for d in deals[:5]
            ],
            "portfolio_summary": {
                "active": len([d for d in deals if d.status == "completed"]),
                "pending": len([d for d in deals if d.status in ["interested", "negotiating"]]),
                "completed": len([d for d in deals if d.status == "completed"]),
            },
        }

    ventures_result = await db.execute(
        select(Venture).where(Venture.founder_id == current_user.id)
    )
    ventures = ventures_result.scalars().all()

    pitch_result = await db.execute(
        select(PitchSession).where(PitchSession.founder_id == current_user.id)
    )
    pitch_sessions = pitch_result.scalars().all()

    mentorship_result = await db.execute(
        select(Mentorship).where(Mentorship.founder_id == current_user.id)
    )
    mentorships = mentorship_result.scalars().all()

    return {
        "role": "founder",
        "name": current_user.full_name,
        "stats": {
            "total_ventures": len(ventures),
            "pitch_sessions": len(pitch_sessions),
            "active_mentor_connections": len([m for m in mentorships if m.status == "active"]),
            "unread_messages": 0,
        },
        "recent_ventures": [
            {
                "id": v.id,
                "title": v.title,
                "industry": v.industry,
                "stage": v.stage,
                "pitch_score": v.pitch_score or 0,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in ventures[:5]
        ],
        "recent_pitch_sessions": [
            {
                "id": p.id,
                "score": p.overall_score or 0,
                "feedback": p.feedback,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in pitch_sessions[:5]
        ],
        "metrics": {
            "total_ideas": len(ventures),
            "investment_ready": len([v for v in ventures if v.stage in ["growth", "scaling"]]),
            "in_development": len([v for v in ventures if v.stage in ["prototype", "mvp", "seed", "development"]]),
            "mentors_connected": len([m for m in mentorships if m.status == "active"]),
        },
    }

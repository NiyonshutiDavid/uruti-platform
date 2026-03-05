from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any

from ..auth import get_current_active_user
from ..database import get_db
from ..models import User, Venture, PitchSession


router = APIRouter(prefix="/pitch-coach", tags=["Pitch Coach"])


def _format_session(session: PitchSession, venture_name: str) -> Dict[str, Any]:
    """Map a PitchSession row into a frontend-friendly dict with venture name."""
    total_seconds = session.duration_seconds or 0
    mins = total_seconds // 60
    secs = total_seconds % 60

    ai_feedback = session.ai_feedback or {}
    raw_tips = ai_feedback.get("tips") if isinstance(ai_feedback, dict) else None
    feedback = [str(t) for t in raw_tips] if isinstance(raw_tips, list) else []

    confidence = round(session.confidence_score or 0)
    pacing = round(session.pacing_score or 0)
    clarity = round(session.clarity_score or 0)
    overall = round(session.overall_score or 0)
    structure = round((confidence + clarity) / 2) if (confidence or clarity) else overall
    engagement = round((pacing + confidence) / 2) if (pacing or confidence) else overall

    return {
        "id": session.id,
        "venture_id": session.venture_id,
        "venture_name": venture_name,
        "title": session.title,
        "video_url": session.video_url or "",
        "duration": f"{mins}:{secs:02d}",
        "duration_seconds": total_seconds,
        "overall_score": overall,
        "pacing": pacing,
        "clarity": clarity,
        "confidence": confidence,
        "structure": structure,
        "engagement": engagement,
        "feedback": feedback,
        "pitch_type": ai_feedback.get("pitch_type", "") if isinstance(ai_feedback, dict) else "",
        "created_at": session.created_at.isoformat() if session.created_at else "",
    }


@router.get("/sessions")
def get_pitch_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[Dict[str, Any]]:
    """Return pitch sessions belonging to ventures owned by current user."""
    ventures = db.query(Venture).filter(Venture.founder_id == current_user.id).all()
    if not ventures:
        return []

    venture_map = {v.id: v.name for v in ventures}

    sessions = (
        db.query(PitchSession)
        .filter(PitchSession.venture_id.in_(list(venture_map.keys())))
        .order_by(desc(PitchSession.created_at))
        .all()
    )

    return [
        _format_session(s, venture_map.get(s.venture_id, "Venture"))
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
def get_pitch_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Return one pitch session if it belongs to current user's ventures."""
    session = db.query(PitchSession).filter(PitchSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Pitch session not found")

    venture = db.query(Venture).filter(Venture.id == session.venture_id).first()
    if not venture or venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return _format_session(session, venture.name)

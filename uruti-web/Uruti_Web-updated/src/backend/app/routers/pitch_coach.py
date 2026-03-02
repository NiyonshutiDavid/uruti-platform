from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from ..auth import get_current_active_user
from ..database import get_db
from ..models import User, Venture, PitchSession
from ..schemas import PitchSessionResponse


router = APIRouter(prefix="/pitch-coach", tags=["Pitch Coach"])


@router.get("/sessions", response_model=List[PitchSessionResponse])
def get_pitch_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return pitch sessions belonging to ventures owned by current user."""
    venture_ids = [
        venture.id
        for venture in db.query(Venture.id).filter(Venture.founder_id == current_user.id).all()
    ]

    if not venture_ids:
        return []

    sessions = (
        db.query(PitchSession)
        .filter(PitchSession.venture_id.in_(venture_ids))
        .order_by(desc(PitchSession.created_at))
        .all()
    )
    return sessions


@router.get("/sessions/{session_id}", response_model=PitchSessionResponse)
def get_pitch_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return one pitch session if it belongs to current user's ventures."""
    session = db.query(PitchSession).filter(PitchSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Pitch session not found")

    venture = db.query(Venture).filter(Venture.id == session.venture_id).first()
    if not venture or venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return session

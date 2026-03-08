from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any

from ..auth import get_current_active_user
from ..database import get_db
from ..models import User, Venture, PitchSession
from ..services.pitch_coach_engine import pitch_coach_engine


router = APIRouter(prefix="/pitch", tags=["Pitch"])


def _map_session(session: PitchSession, venture_name: str) -> Dict[str, Any]:
    total_seconds = session.duration_seconds or 0
    mins = total_seconds // 60
    secs = total_seconds % 60
    duration_label = f"{mins}:{secs:02d}"

    ai_feedback = session.ai_feedback or {}
    raw_tips = ai_feedback.get("tips") if isinstance(ai_feedback, dict) else None
    feedback = [str(item) for item in raw_tips] if isinstance(raw_tips, list) else []
    if not feedback:
        score_hints: List[str] = []
        if (session.clarity_score or 0) < 70:
            score_hints.append("Simplify key points and use shorter sentences to improve clarity.")
        if (session.pacing_score or 0) < 70:
            score_hints.append("Slow down in the core value proposition to improve pacing.")
        if (session.confidence_score or 0) < 70:
            score_hints.append("Use a stronger voice and fewer filler words to build confidence.")
        if not score_hints:
            score_hints.append("Delivery is consistent. Keep your close focused on a clear investor ask.")
        feedback = score_hints

    confidence = int(round(session.confidence_score or 0))
    pacing = int(round(session.pacing_score or 0))
    clarity = int(round(session.clarity_score or 0))
    overall = int(round(session.overall_score or 0))
    structure = int(round((confidence + clarity) / 2)) if (confidence or clarity) else overall
    engagement = int(round((pacing + confidence) / 2)) if (pacing or confidence) else overall

    return {
        "id": str(session.id),
        "date": session.created_at.isoformat() if session.created_at else "",
        "venture": venture_name,
        "duration": duration_label,
        "overallScore": overall,
        "pacing": pacing,
        "clarity": clarity,
        "confidence": confidence,
        "structure": structure,
        "engagement": engagement,
        "videoUrl": session.video_url or "",
        "transcriptUrl": "",
        "feedback": feedback,
    }


@router.get("/analyses")
def get_pitch_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[Dict[str, Any]]:
    ventures = db.query(Venture).filter(Venture.founder_id == current_user.id).all()
    if not ventures:
        return []

    venture_map = {venture.id: venture.name for venture in ventures}
    sessions = (
        db.query(PitchSession)
        .filter(PitchSession.venture_id.in_(list(venture_map.keys())))
        .order_by(desc(PitchSession.created_at))
        .all()
    )

    return [_map_session(session, venture_map.get(session.venture_id, "Venture")) for session in sessions]


@router.post("/analyses")
def create_pitch_analysis(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    venture_id = int(payload.get("venture_id") or 0)
    venture = db.query(Venture).filter(Venture.id == venture_id).first()
    if not venture or venture.founder_id != current_user.id:
        return {"message": "Invalid venture_id"}

    payload_feedback = payload.get("feedback")
    feedback = payload_feedback if isinstance(payload_feedback, list) and payload_feedback else None
    if not feedback:
        source_text = str(payload.get("notes") or payload.get("transcript") or payload.get("title") or "")
        feedback = pitch_coach_engine.generate_feedback(source_text)

    session = PitchSession(
        venture_id=venture_id,
        title=payload.get("title") or "Pitch Session",
        video_url=payload.get("videoUrl") or payload.get("video_url"),
        duration_seconds=int(payload.get("duration_seconds") or 0),
        confidence_score=float(payload.get("confidence") or 0),
        pacing_score=float(payload.get("pacing") or 0),
        clarity_score=float(payload.get("clarity") or 0),
        overall_score=float(payload.get("overallScore") or payload.get("overall_score") or 0),
        ai_feedback={"tips": feedback},
    )

    # Keep startup profile pitch video aligned with latest recorded session.
    if session.video_url:
        venture.demo_video_url = session.video_url

    db.add(session)
    db.commit()
    db.refresh(session)

    return _map_session(session, venture.name)


@router.delete("/analyses/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pitch_analysis(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = db.query(PitchSession).filter(PitchSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Pitch session not found")

    venture = db.query(Venture).filter(Venture.id == session.venture_id).first()
    if not venture or venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this pitch session")

    deleted_video_url = session.video_url
    db.delete(session)
    db.flush()

    if deleted_video_url and venture.demo_video_url == deleted_video_url:
        latest_session = (
            db.query(PitchSession)
            .filter(PitchSession.venture_id == venture.id)
            .order_by(desc(PitchSession.created_at))
            .first()
        )
        venture.demo_video_url = latest_session.video_url if latest_session else None

    db.commit()
    return None

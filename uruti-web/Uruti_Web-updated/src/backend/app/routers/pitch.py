from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any
from datetime import timezone

from ..auth import get_current_active_user
from ..database import get_db
from ..models import User, Venture, PitchSession
from ..services.pitch_coach_engine import pitch_coach_engine


router = APIRouter(prefix="/pitch", tags=["Pitch"])


def _best_pitch_video_for_venture(db: Session, venture_id: int) -> str | None:
    best_session = (
        db.query(PitchSession)
        .filter(
            PitchSession.venture_id == venture_id,
            PitchSession.video_url.isnot(None),
        )
        .order_by(desc(PitchSession.overall_score), desc(PitchSession.created_at))
        .first()
    )
    if not best_session:
        return None
    return best_session.video_url


def _clamp_score(value: float, low: int = 0, high: int = 100) -> int:
    return max(low, min(high, int(round(value))))


def _derive_live_metrics(
    *,
    duration_seconds: int,
    target_duration_seconds: int,
    current_slide: int,
    total_slides: int,
    transitions_count: int,
) -> Dict[str, int]:
    duration = max(duration_seconds, 0)
    target = max(target_duration_seconds, 1)
    progress_ratio = min(max(duration / float(target), 0.0), 1.5)

    pacing = _clamp_score(62 + (1.0 - min(abs(1.0 - progress_ratio), 1.0)) * 34)

    safe_total = max(total_slides, 1)
    expected_slide = 1 + int(progress_ratio * max(safe_total - 1, 0))
    slide_gap = abs(current_slide - expected_slide)
    sync_quality = max(0.0, 1.0 - (slide_gap / float(max(safe_total, 1))))
    transition_bonus = min(transitions_count, 10) * 1.5
    clarity = _clamp_score(58 + sync_quality * 34 + transition_bonus)

    confidence = _clamp_score(60 + min(progress_ratio, 1.0) * 28 + min(transitions_count, 6) * 1.2)
    engagement = _clamp_score((pacing * 0.45) + (confidence * 0.35) + (clarity * 0.20))
    structure = _clamp_score((clarity * 0.55) + (pacing * 0.45))

    return {
        "pacing": pacing,
        "clarity": clarity,
        "confidence": confidence,
        "engagement": engagement,
        "structure": structure,
    }


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

    created_at = session.created_at
    if created_at:
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        created_at_iso = created_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    else:
        created_at_iso = ""

    return {
        "id": str(session.id),
        "date": created_at_iso,
        "venture": venture_name,
        "pitchType": (
            (ai_feedback.get("pitch_type") if isinstance(ai_feedback, dict) else None)
            or (session.title.replace(" Practice", "") if session.title else "Pitch Session")
        ),
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

    db.add(session)
    db.commit()
    db.refresh(session)

    # Keep startup profile pitch video aligned with the strongest session.
    venture.demo_video_url = _best_pitch_video_for_venture(db, venture.id)
    db.commit()

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
        venture.demo_video_url = _best_pitch_video_for_venture(db, venture.id)

    db.commit()
    return None


@router.post("/live-feedback")
def get_live_pitch_feedback(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    venture_id = int(payload.get("venture_id") or 0)
    if not venture_id:
        raise HTTPException(status_code=400, detail="venture_id is required")

    venture = db.query(Venture).filter(Venture.id == venture_id).first()
    if not venture or venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this venture")

    duration_seconds = int(payload.get("duration_seconds") or 0)
    target_duration_seconds = int(payload.get("target_duration_seconds") or 0)
    current_slide = int(payload.get("current_slide") or 1)
    total_slides = int(payload.get("total_slides") or 1)

    transitions = payload.get("slide_transitions")
    transitions_count = len(transitions) if isinstance(transitions, list) else 0

    transcript = str(payload.get("transcript") or "").strip()
    pitch_type = str(payload.get("pitch_type") or "Investor Pitch").strip()
    context_text = (
        transcript
        or f"{pitch_type}. duration={duration_seconds}s target={target_duration_seconds}s "
           f"slide={current_slide}/{max(total_slides, 1)} transitions={transitions_count}"
    )

    tips = pitch_coach_engine.generate_feedback(
        context_text,
        duration_seconds=duration_seconds,
        target_duration_seconds=target_duration_seconds,
        pitch_type=pitch_type,
    )
    model_status = pitch_coach_engine.status()

    metrics = _derive_live_metrics(
        duration_seconds=duration_seconds,
        target_duration_seconds=target_duration_seconds,
        current_slide=current_slide,
        total_slides=total_slides,
        transitions_count=transitions_count,
    )

    return {
        "tips": tips,
        "metrics": metrics,
        "model_backend": model_status.get("backend"),
        "model_loaded": model_status.get("loaded"),
        "model_error": model_status.get("load_error"),
    }

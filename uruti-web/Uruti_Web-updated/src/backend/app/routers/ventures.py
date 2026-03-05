from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional
from pathlib import Path
import shutil
import uuid
from ..database import get_db
from ..models import User, Venture, PitchSession, Connection, Bookmark, NotificationType, UserRole
from ..schemas import VentureCreate, VentureResponse, VentureUpdate
from ..auth import get_current_active_user
from .notifications import create_notification, publish_notification
from ..services.venture_scorer import venture_scorer

router = APIRouter(prefix="/ventures", tags=["Ventures"])

VENTURE_FIELD_LABELS = {
    "name": "name",
    "tagline": "tagline",
    "description": "description",
    "problem_statement": "problem statement",
    "solution": "solution",
    "stage": "stage",
    "industry": "industry",
    "target_market": "target market",
    "business_model": "business model",
    "funding_goal": "funding goal",
    "funding_raised": "funding raised",
    "revenue": "revenue",
    "monthly_burn_rate": "monthly burn rate",
    "team_size": "team size",
    "team_info": "team info",
    "customers": "customers",
    "mrr": "MRR",
    "highlights": "highlights",
    "competitive_edge": "competitive edge",
    "team_background": "team background",
    "funding_plans": "funding plans",
    "milestones": "milestones",
    "activities": "activities",
    "logo_url": "logo",
    "banner_url": "banner",
    "pitch_deck_url": "pitch deck",
    "demo_video_url": "demo video",
    "is_published": "publish status",
    "is_seeking_funding": "funding status",
}

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_VIDEO_TYPES = {
    "video/webm",
    "video/mp4",
    "video/quicktime",
}

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
}


def _apply_venture_score(venture: Venture) -> None:
    analysis = venture_scorer.score_venture(venture)
    venture.uruti_score = float(analysis.get("uruti_score") or 0.0)
    venture.score_breakdown = analysis


def _ensure_admin(current_user: User) -> None:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.post("/", response_model=VentureResponse, status_code=status.HTTP_201_CREATED)
async def create_venture(
    venture_data: VentureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new venture"""
    
    # Auto-publish ventures so they're visible to investors immediately
    venture_dict = venture_data.model_dump()
    venture_dict['is_published'] = True
    
    db_venture = Venture(
        **venture_dict,
        founder_id=current_user.id
    )

    _apply_venture_score(db_venture)
    
    db.add(db_venture)
    db.commit()
    db.refresh(db_venture)

    connected = db.query(Connection).filter(
        or_(
            Connection.user1_id == current_user.id,
            Connection.user2_id == current_user.id,
        )
    ).all()

    recipient_ids = {
        c.user2_id if c.user1_id == current_user.id else c.user1_id
        for c in connected
    }

    for recipient_id in recipient_ids:
        notification = create_notification(
            db,
            user_id=recipient_id,
            title="New venture posted",
            message=f"{current_user.display_name} added a new venture: {db_venture.name}.",
            notification_type=NotificationType.SYSTEM,
            data={
                "kind": "new_venture",
                "venture_id": db_venture.id,
                "founder_id": current_user.id,
                "venture_name": db_venture.name,
            },
        )
        await publish_notification(notification, db)
    
    return db_venture


@router.get("/", response_model=List[VentureResponse])
def get_ventures(
    skip: int = 0,
    limit: int = 100,
    stage: Optional[str] = None,
    industry: Optional[str] = None,
    is_seeking_funding: Optional[bool] = None,
    min_score: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of ventures with filtering and search"""
    
    query = db.query(Venture).filter(Venture.is_published == True)
    
    # Apply filters
    if stage:
        query = query.filter(Venture.stage == stage)
    
    if industry:
        query = query.filter(Venture.industry == industry)
    
    if is_seeking_funding is not None:
        query = query.filter(Venture.is_seeking_funding == is_seeking_funding)
    
    if min_score:
        query = query.filter(Venture.uruti_score >= min_score)
    
    if search:
        query = query.filter(
            or_(
                Venture.name.ilike(f"%{search}%"),
                Venture.tagline.ilike(f"%{search}%"),
                Venture.description.ilike(f"%{search}%")
            )
        )
    
    # Order by Uruti Score (highest first)
    ventures = query.order_by(desc(Venture.uruti_score)).offset(skip).limit(limit).all()
    
    return ventures


@router.get("/my-ventures", response_model=List[VentureResponse])
def get_my_ventures(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's ventures"""
    
    ventures = db.query(Venture).filter(
        Venture.founder_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return ventures


@router.get("/admin/model-performance")
def get_model_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get model information and runtime performance metrics (admin only)."""

    _ensure_admin(current_user)

    ventures = db.query(Venture).all()
    scored = [v for v in ventures if v.uruti_score is not None]
    scores = [float(v.uruti_score or 0.0) for v in scored]

    class_distribution = {
        "not_ready": 0,
        "mentorship_needed": 0,
        "investment_ready": 0,
    }
    source_distribution = {
        "root_models_bundle": 0,
        "heuristic_fallback": 0,
        "other": 0,
    }

    for venture in scored:
        breakdown = venture.score_breakdown if isinstance(venture.score_breakdown, dict) else {}

        predicted_class = str(breakdown.get("predicted_class") or "").strip().lower()
        if predicted_class in class_distribution:
            class_distribution[predicted_class] += 1

        model_source = str(breakdown.get("model_source") or "").strip().lower()
        if model_source == "root_models_bundle":
            source_distribution["root_models_bundle"] += 1
        elif model_source == "heuristic_fallback":
            source_distribution["heuristic_fallback"] += 1
        elif model_source:
            source_distribution["other"] += 1

    average_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    max_score = round(max(scores), 2) if scores else 0.0
    min_score = round(min(scores), 2) if scores else 0.0

    model_info = venture_scorer.get_model_info()

    return {
        "model_info": model_info,
        "performance": {
            "total_ventures": len(ventures),
            "scored_ventures": len(scored),
            "average_score": average_score,
            "max_score": max_score,
            "min_score": min_score,
            "class_distribution": class_distribution,
            "source_distribution": source_distribution,
        },
    }


@router.get("/{venture_id}", response_model=VentureResponse)
def get_venture(
    venture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific venture by ID"""
    
    venture = db.query(Venture).filter(Venture.id == venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")
    
    # Check if venture is published or user is the founder
    if not venture.is_published and venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return venture


@router.put("/{venture_id}", response_model=VentureResponse)
async def update_venture(
    venture_id: int,
    venture_update: VentureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a venture"""
    
    venture = db.query(Venture).filter(Venture.id == venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")
    
    # Check ownership
    if venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this venture")
    
    # Update fields
    update_data = venture_update.model_dump(exclude_unset=True)
    changed_fields = [
        field for field in update_data.keys()
        if field in VENTURE_FIELD_LABELS
    ]

    for field, value in update_data.items():
        setattr(venture, field, value)

    _apply_venture_score(venture)
    
    db.commit()
    db.refresh(venture)

    if changed_fields:
        connected = db.query(Connection).filter(
            or_(
                Connection.user1_id == current_user.id,
                Connection.user2_id == current_user.id,
            )
        ).all()

        connected_ids = {
            conn.user2_id if conn.user1_id == current_user.id else conn.user1_id
            for conn in connected
        }

        bookmark_user_ids = {
            row.user_id
            for row in db.query(Bookmark).filter(Bookmark.venture_id == venture.id).all()
        }

        candidate_ids = connected_ids.union(bookmark_user_ids)
        investors = db.query(User).filter(
            User.id.in_(candidate_ids),
            User.role == UserRole.INVESTOR,
            User.id != current_user.id,
        ).all() if candidate_ids else []

        primary_field = VENTURE_FIELD_LABELS.get(changed_fields[0], changed_fields[0])
        extra_count = max(0, len(changed_fields) - 1)
        extra_suffix = f" and {extra_count} more field{'s' if extra_count > 1 else ''}" if extra_count > 0 else ""

        for investor in investors:
            notification = create_notification(
                db,
                user_id=investor.id,
                title="Startup update",
                message=f"{venture.name} updated its {primary_field}{extra_suffix}.",
                notification_type=NotificationType.SYSTEM,
                data={
                    "kind": "venture_updated",
                    "venture_id": venture.id,
                    "venture_name": venture.name,
                    "founder_id": current_user.id,
                    "updated_fields": changed_fields,
                    "primary_field": changed_fields[0],
                    "route": "/discovery",
                },
            )
            await publish_notification(notification, db)
    
    return venture


@router.delete("/{venture_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venture(
    venture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a venture"""
    
    venture = db.query(Venture).filter(Venture.id == venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")
    
    # Check ownership
    if venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this venture")
    
    db.delete(venture)
    db.commit()
    
    return None


@router.post("/{venture_id}/analyze", response_model=VentureResponse)
def analyze_venture(
    venture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Analyze a venture with the deployed MLP bundle and update its Uruti score."""

    venture = db.query(Venture).filter(Venture.id == venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")

    if venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to analyze this venture")

    _apply_venture_score(venture)

    db.commit()
    db.refresh(venture)
    return venture


@router.get("/leaderboard/top", response_model=List[VentureResponse])
def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get top ventures by Uruti Score"""
    
    ventures = db.query(Venture).filter(
        Venture.is_published == True
    ).order_by(desc(Venture.uruti_score)).limit(limit).all()
    
    return ventures


@router.post("/{venture_id}/logo", response_model=VentureResponse)
async def upload_venture_logo(
    venture_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload or replace venture logo image."""
    venture = db.query(Venture).filter(Venture.id == venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")

    if venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this venture")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image format")

    extension = Path(file.filename or "logo.png").suffix or ".png"
    filename = f"venture_logo_{venture_id}_{uuid.uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        venture.logo_url = f"/api/v1/profile/uploads/{filename}"
        db.commit()
        db.refresh(venture)
        return venture
    except Exception as exc:
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload venture logo: {exc}")


@router.post("/{venture_id}/banner", response_model=VentureResponse)
async def upload_venture_banner(
    venture_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload or replace venture banner (landscape logo) image."""
    venture = db.query(Venture).filter(Venture.id == venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")

    if venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this venture")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image format")

    extension = Path(file.filename or "banner.png").suffix or ".png"
    filename = f"venture_banner_{venture_id}_{uuid.uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        venture.banner_url = f"/api/v1/profile/uploads/{filename}"
        db.commit()
        db.refresh(venture)
        return venture
    except Exception as exc:
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload venture banner: {exc}")


@router.post("/{venture_id}/pitch-video")
async def upload_pitch_video(
    venture_id: int,
    file: UploadFile = File(...),
    pitch_type: str = Form("Investor Pitch"),
    duration: int = Form(0),
    target_duration: int = Form(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload pitch video and create a PitchSession record."""
    venture = db.query(Venture).filter(Venture.id == venture_id).first()
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found")

    if venture.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to upload for this venture")

    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail="Invalid video format")

    extension = Path(file.filename or "pitch.webm").suffix or ".webm"
    filename = f"pitch_{venture_id}_{uuid.uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        target = target_duration if target_duration > 0 else max(duration, 1)
        ratio = min(max(float(duration) / float(target), 0.0), 1.0)
        pacing_score = round(60 + ratio * 40, 2)
        confidence_score = round(65 + ratio * 30, 2)
        clarity_score = round(68 + ratio * 28, 2)
        overall_score = round((pacing_score + confidence_score + clarity_score) / 3, 2)

        ai_feedback = {
            "pitch_type": pitch_type,
            "target_duration": target_duration,
            "duration": duration,
            "tips": [
                "Open with the strongest traction point in the first 20 seconds.",
                "Keep each section focused on one key message.",
                "End with a clear ask and next step.",
            ],
        }

        session = PitchSession(
            venture_id=venture_id,
            title=f"{pitch_type} Practice",
            video_url=f"/api/v1/profile/uploads/{filename}",
            duration_seconds=duration,
            pacing_score=pacing_score,
            confidence_score=confidence_score,
            clarity_score=clarity_score,
            overall_score=overall_score,
            ai_feedback=ai_feedback,
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return {
            "message": "Pitch video uploaded successfully",
            "session": {
                "id": session.id,
                "venture_id": session.venture_id,
                "title": session.title,
                "video_url": session.video_url,
                "duration_seconds": session.duration_seconds,
                "overall_score": session.overall_score,
                "created_at": session.created_at,
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload pitch video: {exc}")

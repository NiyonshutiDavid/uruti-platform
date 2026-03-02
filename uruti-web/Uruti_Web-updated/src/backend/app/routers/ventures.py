from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional
from pathlib import Path
import shutil
import uuid
from ..database import get_db
from ..models import User, Venture, PitchSession, Connection, NotificationType
from ..schemas import VentureCreate, VentureResponse, VentureUpdate
from ..auth import get_current_active_user
from .notifications import create_notification, publish_notification

router = APIRouter(prefix="/ventures", tags=["Ventures"])

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
def update_venture(
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
    for field, value in update_data.items():
        setattr(venture, field, value)
    
    db.commit()
    db.refresh(venture)
    
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

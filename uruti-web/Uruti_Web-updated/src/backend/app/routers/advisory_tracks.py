from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import AdvisoryTrack, AdvisoryMaterialProgress, User, UserRole
from ..schemas import AdvisoryTrackCreate, AdvisoryTrackUpdate, AdvisoryTrackResponse
from ..auth import get_current_user

router = APIRouter(prefix="/advisory", tags=["advisory_tracks"])


def _get_completed_material_ids(db: Session, user_id: int, track_id: int) -> List[int]:
    rows = db.query(AdvisoryMaterialProgress).filter(
        AdvisoryMaterialProgress.user_id == user_id,
        AdvisoryMaterialProgress.track_id == track_id,
    ).all()
    return sorted({int(row.material_id) for row in rows})


def _validate_material_index(track: AdvisoryTrack, material_id: int) -> None:
    if material_id < 0:
        raise HTTPException(status_code=400, detail="Invalid material id")
    materials = track.materials or []
    if material_id > len(materials) - 1:
        raise HTTPException(status_code=404, detail="Material not found in track")


def _build_progress_payload(track: AdvisoryTrack, completed_material_ids: List[int], user_id: int) -> dict:
    total_materials = len(track.materials) if track.materials else 0
    completed_count = len(completed_material_ids)
    progress = (completed_count / total_materials * 100) if total_materials > 0 else 0

    return {
        "track_id": track.id,
        "user_id": user_id,
        "completed_materials": completed_material_ids,
        "completed_materials_count": completed_count,
        "total_materials": total_materials,
        "progress_percentage": int(progress),
        "status": "not-started" if progress == 0 else ("completed" if progress == 100 else "in-progress"),
    }


def _build_track_payload(track: AdvisoryTrack, completed_material_ids: List[int]) -> dict:
    total_materials = len(track.materials) if track.materials else 0
    completed_count = len(completed_material_ids)
    progress = (completed_count / total_materials * 100) if total_materials > 0 else 0
    status = "not-started" if progress == 0 else ("completed" if progress == 100 else "in-progress")

    return {
        "id": track.id,
        "title": track.title,
        "description": track.description,
        "category": track.category,
        "modules": track.modules,
        "duration": track.duration,
        "objectives": track.objectives,
        "materials": track.materials,
        "is_active": track.is_active,
        "created_at": track.created_at,
        "updated_at": track.updated_at,
        "completed_materials": completed_material_ids,
        "progress_percentage": int(progress),
        "status": status,
    }


@router.get("/tracks", response_model=List[AdvisoryTrackResponse])
async def get_advisory_tracks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get advisory tracks available to the current user
    
    All users (founders, investors, admins) see all active advisory tracks.
    These are general learning materials available to all.
    """
    # All users see all active tracks - they are general educational materials
    tracks = db.query(AdvisoryTrack).filter(AdvisoryTrack.is_active == True).all()
    payload = []
    for track in tracks:
        completed_material_ids = _get_completed_material_ids(db, current_user.id, track.id)
        payload.append(_build_track_payload(track, completed_material_ids))
    return payload


@router.get("/tracks/{track_id}", response_model=AdvisoryTrackResponse)
async def get_advisory_track(
    track_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific advisory track"""
    track = db.query(AdvisoryTrack).filter(AdvisoryTrack.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    # All authenticated users can view active tracks - they are public learning materials
    if not track.is_active and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="This track is not currently available")
    
    completed_material_ids = _get_completed_material_ids(db, current_user.id, track.id)
    return _build_track_payload(track, completed_material_ids)


@router.get("/admin/tracks", response_model=List[AdvisoryTrackResponse])
async def get_all_advisory_tracks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all advisory tracks (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can view all tracks")
    
    tracks = db.query(AdvisoryTrack).all()
    return tracks


@router.post("/admin/tracks", response_model=AdvisoryTrackResponse)
async def create_advisory_track(
    track_data: AdvisoryTrackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new advisory track (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create tracks")
    
    new_track = AdvisoryTrack(
        title=track_data.title,
        description=track_data.description,
        category=track_data.category,
        modules=track_data.modules,
        duration=track_data.duration,
        objectives=track_data.objectives or [],
        materials=track_data.materials or [],
        created_by_admin=current_user.id
    )
    
    db.add(new_track)
    db.commit()
    db.refresh(new_track)
    
    return new_track


@router.put("/admin/tracks/{track_id}", response_model=AdvisoryTrackResponse)
async def update_advisory_track(
    track_id: int,
    track_data: AdvisoryTrackUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an advisory track (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can update tracks")
    
    track = db.query(AdvisoryTrack).filter(AdvisoryTrack.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    # Update fields if provided
    if track_data.title is not None:
        track.title = track_data.title
    if track_data.description is not None:
        track.description = track_data.description
    if track_data.category is not None:
        track.category = track_data.category
    if track_data.modules is not None:
        track.modules = track_data.modules
    if track_data.duration is not None:
        track.duration = track_data.duration
    if track_data.objectives is not None:
        track.objectives = track_data.objectives
    if track_data.materials is not None:
        track.materials = track_data.materials
    if track_data.is_active is not None:
        track.is_active = track_data.is_active
    
    db.commit()
    db.refresh(track)
    
    return track


@router.delete("/admin/tracks/{track_id}")
async def delete_advisory_track(
    track_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an advisory track (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete tracks")
    
    track = db.query(AdvisoryTrack).filter(AdvisoryTrack.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    db.delete(track)
    db.commit()
    
    return {"message": "Track deleted successfully"}


@router.get("/tracks/{track_id}/progress")
async def get_track_progress(
    track_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's progress on a specific track"""
    track = db.query(AdvisoryTrack).filter(AdvisoryTrack.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    completed_material_ids = _get_completed_material_ids(db, current_user.id, track.id)
    return _build_progress_payload(track, completed_material_ids, current_user.id)


@router.post("/tracks/{track_id}/materials/{material_id}/complete")
async def mark_material_complete(
    track_id: int,
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a material as complete for the user"""
    track = db.query(AdvisoryTrack).filter(AdvisoryTrack.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    _validate_material_index(track, material_id)

    existing = db.query(AdvisoryMaterialProgress).filter(
        AdvisoryMaterialProgress.user_id == current_user.id,
        AdvisoryMaterialProgress.track_id == track_id,
        AdvisoryMaterialProgress.material_id == material_id,
    ).first()

    if not existing:
        completion = AdvisoryMaterialProgress(
            user_id=current_user.id,
            track_id=track_id,
            material_id=material_id,
        )
        db.add(completion)
        db.commit()

    completed_material_ids = _get_completed_material_ids(db, current_user.id, track.id)
    progress = _build_progress_payload(track, completed_material_ids, current_user.id)

    return {
        "message": "Material marked as complete",
        "track_id": track_id,
        "material_id": material_id,
        "user_id": current_user.id,
        "progress": progress,
    }


@router.delete("/tracks/{track_id}/materials/{material_id}/complete")
async def unmark_material_complete(
    track_id: int,
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a material as incomplete for the user"""
    track = db.query(AdvisoryTrack).filter(AdvisoryTrack.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    _validate_material_index(track, material_id)

    db.query(AdvisoryMaterialProgress).filter(
        AdvisoryMaterialProgress.user_id == current_user.id,
        AdvisoryMaterialProgress.track_id == track_id,
        AdvisoryMaterialProgress.material_id == material_id,
    ).delete()
    db.commit()

    completed_material_ids = _get_completed_material_ids(db, current_user.id, track.id)
    progress = _build_progress_payload(track, completed_material_ids, current_user.id)

    return {
        "message": "Material marked as incomplete",
        "track_id": track_id,
        "material_id": material_id,
        "user_id": current_user.id,
        "progress": progress,
    }

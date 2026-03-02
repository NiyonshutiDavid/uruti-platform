from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, MentorAvailability
from ..schemas import MentorAvailabilityCreate, MentorAvailabilityResponse, MentorAvailabilityUpdate
from ..auth import get_current_active_user

router = APIRouter(prefix="/availability", tags=["Availability"])


@router.get("/my-slots", response_model=List[MentorAvailabilityResponse])
def get_my_availability(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's availability slots"""
    slots = db.query(MentorAvailability).filter(
        MentorAvailability.mentor_id == current_user.id
    ).all()
    return slots


@router.get("/{user_id}", response_model=List[MentorAvailabilityResponse])
def get_user_availability(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get availability slots for a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    slots = db.query(MentorAvailability).filter(
        MentorAvailability.mentor_id == user_id,
        MentorAvailability.is_available == True
    ).all()
    return slots


@router.post("/", response_model=MentorAvailabilityResponse, status_code=status.HTTP_201_CREATED)
def create_availability_slot(
    slot_data: MentorAvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new availability slot"""
    
    # Validate time
    if slot_data.end_time <= slot_data.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    # Create slot
    db_slot = MentorAvailability(
        mentor_id=current_user.id,
        day_of_week=slot_data.day_of_week,
        start_time=slot_data.start_time,
        end_time=slot_data.end_time,
        is_available=slot_data.is_available
    )
    
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    
    return db_slot


@router.put("/{slot_id}", response_model=MentorAvailabilityResponse)
def update_availability_slot(
    slot_id: int,
    slot_update: MentorAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an availability slot (toggle active/inactive)"""
    
    slot = db.query(MentorAvailability).filter(MentorAvailability.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    
    # Check ownership
    if slot.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update
    if slot_update.is_available is not None:
        slot.is_available = slot_update.is_available
    
    db.commit()
    db.refresh(slot)
    
    return slot


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an availability slot"""
    
    slot = db.query(MentorAvailability).filter(MentorAvailability.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    
    # Check ownership
    if slot.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(slot)
    db.commit()
    
    return None

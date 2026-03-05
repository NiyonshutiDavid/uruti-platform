from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from datetime import datetime, date, time, timedelta
from ..database import get_db
from ..models import User, MentorAvailability, Meeting, MeetingStatus
from ..schemas import MentorAvailabilityCreate, MentorAvailabilityResponse, MentorAvailabilityUpdate
from ..auth import get_current_active_user

router = APIRouter(prefix="/availability", tags=["Availability"])


def _parse_hhmm(value: str) -> time:
    hour_text, minute_text = value.split(":")
    return time(hour=int(hour_text), minute=int(minute_text))


def _strip_tz(value: datetime) -> datetime:
    if value.tzinfo is not None:
        return value.replace(tzinfo=None)
    return value


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
    week_start: str = None,
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

    if not week_start:
        return slots

    try:
        week_start_date = date.fromisoformat(week_start)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid week_start format. Use YYYY-MM-DD")

    monday_offset = week_start_date.weekday()
    week_start_date = week_start_date - timedelta(days=monday_offset)
    week_start_dt = datetime.combine(week_start_date, time.min)
    week_end_dt = week_start_dt + timedelta(days=7)

    meetings = db.query(Meeting).filter(
        or_(Meeting.host_id == user_id, Meeting.participant_id == user_id),
        Meeting.status != MeetingStatus.CANCELLED,
        Meeting.start_time < week_end_dt,
        Meeting.end_time > week_start_dt,
    ).all()

    meeting_windows = [(_strip_tz(m.start_time), _strip_tz(m.end_time)) for m in meetings]
    available_slots: List[MentorAvailability] = []

    for slot in slots:
        slot_date = week_start_date + timedelta(days=slot.day_of_week)
        slot_start = datetime.combine(slot_date, _parse_hhmm(slot.start_time))
        slot_end = datetime.combine(slot_date, _parse_hhmm(slot.end_time))

        is_booked = any(slot_start < meeting_end and slot_end > meeting_start for meeting_start, meeting_end in meeting_windows)
        if not is_booked:
            available_slots.append(slot)

    return available_slots


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

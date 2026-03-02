from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, Meeting
from ..schemas import MeetingCreate, MeetingResponse, MeetingUpdate
from ..auth import get_current_active_user

router = APIRouter(prefix="/meetings", tags=["Meetings"])


@router.post("/", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    meeting_data: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new meeting"""
    
    # Check if participant exists
    participant = db.query(User).filter(User.id == meeting_data.participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Validate time
    if meeting_data.end_time <= meeting_data.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    # Create meeting
    db_meeting = Meeting(
        host_id=current_user.id,
        participant_id=meeting_data.participant_id,
        title=meeting_data.title,
        description=meeting_data.description,
        meeting_type=meeting_data.meeting_type,
        start_time=meeting_data.start_time,
        end_time=meeting_data.end_time,
        timezone=meeting_data.timezone,
        meeting_url=meeting_data.meeting_url,
        location=meeting_data.location
    )
    
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    # TODO: Create notification for participant
    
    return db_meeting


@router.get("/", response_model=List[MeetingResponse])
def get_meetings(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    upcoming: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get meetings for current user (as host or participant)"""
    
    query = db.query(Meeting).filter(
        or_(
            Meeting.host_id == current_user.id,
            Meeting.participant_id == current_user.id
        )
    )
    
    if status_filter:
        query = query.filter(Meeting.status == status_filter)
    
    if upcoming:
        now = datetime.utcnow()
        query = query.filter(Meeting.start_time >= now)
    
    meetings = query.order_by(Meeting.start_time).offset(skip).limit(limit).all()
    
    return meetings


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific meeting"""
    
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check if user is host or participant
    if meeting.host_id != current_user.id and meeting.participant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return meeting


@router.put("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: int,
    meeting_update: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a meeting"""
    
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check if user is host
    if meeting.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can update meeting")
    
    # Update fields
    update_data = meeting_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(meeting, field, value)
    
    db.commit()
    db.refresh(meeting)
    
    # TODO: Create notification for participant
    
    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a meeting"""
    
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check if user is host
    if meeting.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can cancel meeting")
    
    meeting.status = "cancelled"
    db.commit()
    
    # TODO: Create notification for participant
    
    return None


@router.put("/{meeting_id}/accept", response_model=MeetingResponse)
def accept_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Accept a meeting request"""
    
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check if user is participant
    if meeting.participant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only participant can accept meeting")
    
    # Update meeting status to scheduled if it was pending
    if meeting.status == "scheduled":
        # Meeting already accepted
        return meeting
    
    meeting.status = "scheduled"
    db.commit()
    db.refresh(meeting)
    
    # TODO: Create notification for host
    
    return meeting


@router.put("/{meeting_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reject a meeting request"""
    
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check if user is participant
    if meeting.participant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only participant can reject meeting")
    
    meeting.status = "cancelled"
    db.commit()
    
    # TODO: Create notification for host
    
    return None


@router.get("/calendar/upcoming", response_model=List[MeetingResponse])
def get_upcoming_meetings(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get upcoming meetings for next N days"""
    
    now = datetime.utcnow()
    future = now + timedelta(days=days)
    
    meetings = db.query(Meeting).filter(
        or_(
            Meeting.host_id == current_user.id,
            Meeting.participant_id == current_user.id
        ),
        Meeting.start_time >= now,
        Meeting.start_time <= future,
        Meeting.status == "scheduled"
    ).order_by(Meeting.start_time).all()
    
    return meetings
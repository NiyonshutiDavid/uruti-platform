from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, Meeting, NotificationType, MeetingStatus
from ..schemas import MeetingCreate, MeetingResponse, MeetingUpdate
from ..auth import get_current_active_user
from .notifications import create_notification, publish_notification

router = APIRouter(prefix="/meetings", tags=["Meetings"])


def _meeting_route_for_user(user_id: int, meeting: Meeting) -> str:
    if meeting.participant_id == user_id:
        return "/dashboard/availability"
    return "/dashboard/calendar"


async def _notify_user_about_meeting(
    *,
    db: Session,
    user_id: int,
    title: str,
    message: str,
    meeting: Meeting,
    action: str,
):
    notification = create_notification(
        db,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=NotificationType.MEETING,
        data={
            "meeting_id": meeting.id,
            "action": action,
            "route": _meeting_route_for_user(user_id, meeting),
        },
    )
    await publish_notification(notification, db)


@router.post("/", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting(
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

    # Prevent host from booking themselves
    if meeting_data.participant_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot book a meeting with yourself")

    # Prevent overlapping bookings for either participant
    for user_id in [current_user.id, meeting_data.participant_id]:
        conflict = db.query(Meeting).filter(
            or_(Meeting.host_id == user_id, Meeting.participant_id == user_id),
            Meeting.status != MeetingStatus.CANCELLED,
            Meeting.start_time < meeting_data.end_time,
            Meeting.end_time > meeting_data.start_time,
        ).first()

        if conflict:
            raise HTTPException(
                status_code=409,
                detail="Selected slot is already booked",
            )
    
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

    host_name = current_user.full_name or current_user.email
    await _notify_user_about_meeting(
        db=db,
        user_id=participant.id,
        title="New meeting request",
        message=f"{host_name} requested a meeting: {db_meeting.title}",
        meeting=db_meeting,
        action="review",
    )
    
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
        # Validate against the enum to avoid DB errors
        valid_statuses = [s.value for s in MeetingStatus]
        if status_filter not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status_filter '{status_filter}'. Valid values: {valid_statuses}"
            )
        query = query.filter(Meeting.status == status_filter)
    
    if upcoming:
        now = datetime.utcnow()
        query = query.filter(Meeting.start_time >= now)
    
    meetings = query.order_by(Meeting.start_time).offset(skip).limit(limit).all()
    
    return meetings


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
async def update_meeting(
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

    participant = db.query(User).filter(User.id == meeting.participant_id).first()
    host_name = current_user.full_name or current_user.email
    if participant:
        await _notify_user_about_meeting(
            db=db,
            user_id=participant.id,
            title="Meeting updated",
            message=f"{host_name} updated meeting details for: {meeting.title}",
            meeting=meeting,
            action="updated",
        )
    
    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meeting(
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

    participant = db.query(User).filter(User.id == meeting.participant_id).first()
    host_name = current_user.full_name or current_user.email
    if participant:
        await _notify_user_about_meeting(
            db=db,
            user_id=participant.id,
            title="Meeting cancelled",
            message=f"{host_name} cancelled meeting: {meeting.title}",
            meeting=meeting,
            action="cancelled",
        )
    
    return None


@router.put("/{meeting_id}/accept", response_model=MeetingResponse)
async def accept_meeting(
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

    participant_name = current_user.full_name or current_user.email
    await _notify_user_about_meeting(
        db=db,
        user_id=meeting.host_id,
        title="Meeting approved",
        message=f"{participant_name} approved your meeting: {meeting.title}",
        meeting=meeting,
        action="approved",
    )
    
    return meeting


@router.put("/{meeting_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_meeting(
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

    participant_name = current_user.full_name or current_user.email
    await _notify_user_about_meeting(
        db=db,
        user_id=meeting.host_id,
        title="Meeting declined",
        message=f"{participant_name} declined your meeting: {meeting.title}",
        meeting=meeting,
        action="declined",
    )
    
    return None


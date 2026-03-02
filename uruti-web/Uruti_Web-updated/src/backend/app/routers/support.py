from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..auth import get_current_active_user
from ..database import get_db
from ..models import SupportMessage, User, UserRole
from ..schemas import SupportMessageCreate, SupportMessageRespond, SupportMessageResponse
from pydantic import EmailStr

router = APIRouter(prefix="/support", tags=["Support"])


@router.post("/messages", response_model=SupportMessageResponse, status_code=status.HTTP_201_CREATED)
def create_support_message(
    payload: SupportMessageCreate,
    db: Session = Depends(get_db),
):
    """Create a public support message from live chat widget."""
    support_message = SupportMessage(
        visitor_name=payload.visitor_name,
        visitor_email=payload.visitor_email,
        message=payload.message,
        status="pending",
    )
    db.add(support_message)
    db.commit()
    db.refresh(support_message)
    return support_message


@router.get("/messages", response_model=List[SupportMessageResponse])
def get_support_messages(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get support messages for admins."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    return (
        db.query(SupportMessage)
        .order_by(desc(SupportMessage.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/messages/public", response_model=List[SupportMessageResponse])
def get_public_support_messages(
    visitor_email: EmailStr,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get support conversation history for a visitor email (chatbot polling)."""
    return (
        db.query(SupportMessage)
        .filter(SupportMessage.visitor_email == visitor_email)
        .order_by(desc(SupportMessage.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.put("/messages/{message_id}/respond", response_model=SupportMessageResponse)
def respond_to_support_message(
    message_id: int,
    payload: SupportMessageRespond,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Respond to a support message (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    support_message = db.query(SupportMessage).filter(SupportMessage.id == message_id).first()
    if not support_message:
        raise HTTPException(status_code=404, detail="Support message not found")

    support_message.response = payload.response
    support_message.status = "responded"
    support_message.responded_at = datetime.utcnow()

    db.commit()
    db.refresh(support_message)
    return support_message


@router.put("/messages/{message_id}/close", response_model=SupportMessageResponse)
def close_support_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Close a support message (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    support_message = db.query(SupportMessage).filter(SupportMessage.id == message_id).first()
    if not support_message:
        raise HTTPException(status_code=404, detail="Support message not found")

    support_message.status = "closed"
    db.commit()
    db.refresh(support_message)
    return support_message

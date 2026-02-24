from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, Integer, Boolean, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.api import deps
from pydantic import BaseModel

router = APIRouter()


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False)
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    push_notifications = Column(Boolean, default=True)
    newsletter = Column(Boolean, default=True)
    message_notifications = Column(Boolean, default=True)
    deal_notifications = Column(Boolean, default=True)
    mentorship_notifications = Column(Boolean, default=True)
    pitch_feedback_notifications = Column(Boolean, default=True)
    privacy_profile = Column(String(50), default="public")  # public, private, connections-only
    allow_direct_messages = Column(Boolean, default=True)
    allow_collaboration_requests = Column(Boolean, default=True)
    marketing_emails = Column(Boolean, default=False)
    theme = Column(String(20), default="light")  # light, dark
    language = Column(String(10), default="en")
    timezone = Column(String(50), default="UTC")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserPreferencesUpdate(BaseModel):
    email_notifications: bool | None = None
    sms_notifications: bool | None = None
    push_notifications: bool | None = None
    newsletter: bool | None = None
    message_notifications: bool | None = None
    deal_notifications: bool | None = None
    mentorship_notifications: bool | None = None
    pitch_feedback_notifications: bool | None = None
    privacy_profile: str | None = None
    allow_direct_messages: bool | None = None
    allow_collaboration_requests: bool | None = None
    marketing_emails: bool | None = None
    theme: str | None = None
    language: str | None = None
    timezone: str | None = None


class UserPreferencesRead(BaseModel):
    id: int
    user_id: int
    email_notifications: bool
    sms_notifications: bool
    push_notifications: bool
    newsletter: bool
    message_notifications: bool
    deal_notifications: bool
    mentorship_notifications: bool
    pitch_feedback_notifications: bool
    privacy_profile: str
    allow_direct_messages: bool
    allow_collaboration_requests: bool
    marketing_emails: bool
    theme: str
    language: str
    timezone: str

    class Config:
        from_attributes = True


@router.get("/settings", response_model=UserPreferencesRead)
async def get_settings(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get user preferences and settings."""
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    preferences = result.scalars().first()
    
    if not preferences:
        # Create default preferences if not exist
        preferences = UserPreferences(user_id=current_user.id)
        db.add(preferences)
        await db.commit()
        await db.refresh(preferences)
    
    return preferences


@router.put("/settings", response_model=UserPreferencesRead)
async def update_settings(
    prefs_in: UserPreferencesUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update user preferences and settings."""
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    preferences = result.scalars().first()
    
    if not preferences:
        preferences = UserPreferences(user_id=current_user.id)
        db.add(preferences)
        await db.flush()
    
    # Update only provided fields
    update_data = prefs_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(preferences, field, value)
    
    db.add(preferences)
    await db.commit()
    await db.refresh(preferences)
    return preferences


@router.post("/settings/notification-preferences", response_model=UserPreferencesRead)
async def update_notification_preferences(
    email: bool | None = None,
    sms: bool | None = None,
    push: bool | None = None,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Quick update for notification preferences."""
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    preferences = result.scalars().first()
    
    if not preferences:
        preferences = UserPreferences(user_id=current_user.id)
        db.add(preferences)
        await db.flush()
    
    if email is not None:
        preferences.email_notifications = email
    if sms is not None:
        preferences.sms_notifications = sms
    if push is not None:
        preferences.push_notifications = push
    
    db.add(preferences)
    await db.commit()
    await db.refresh(preferences)
    return preferences


@router.post("/settings/privacy", response_model=UserPreferencesRead)
async def update_privacy_settings(
    privacy_profile: str | None = None,
    allow_messages: bool | None = None,
    allow_requests: bool | None = None,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update privacy settings."""
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    preferences = result.scalars().first()
    
    if not preferences:
        preferences = UserPreferences(user_id=current_user.id)
        db.add(preferences)
        await db.flush()
    
    if privacy_profile:
        preferences.privacy_profile = privacy_profile
    if allow_messages is not None:
        preferences.allow_direct_messages = allow_messages
    if allow_requests is not None:
        preferences.allow_collaboration_requests = allow_requests
    
    db.add(preferences)
    await db.commit()
    await db.refresh(preferences)
    return preferences


@router.post("/settings/display", response_model=UserPreferencesRead)
async def update_display_settings(
    theme: str | None = None,
    language: str | None = None,
    timezone: str | None = None,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update display preferences (theme, language, timezone)."""
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    preferences = result.scalars().first()
    
    if not preferences:
        preferences = UserPreferences(user_id=current_user.id)
        db.add(preferences)
        await db.flush()
    
    if theme:
        preferences.theme = theme
    if language:
        preferences.language = language
    if timezone:
        preferences.timezone = timezone
    
    db.add(preferences)
    await db.commit()
    await db.refresh(preferences)
    return preferences

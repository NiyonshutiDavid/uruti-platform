from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.models.user import User
from app.api import deps
from app.core.security import get_password_hash, verify_password
from database import get_db
from config import settings

router = APIRouter()

# Store password reset tokens in memory (in production, use database)
reset_tokens = {}

@router.get("/profile/me")
async def get_profile(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    # Refresh user from database to get latest data
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "bio": getattr(user, 'bio', None),
        "avatar": getattr(user, 'avatar_url', None),
        "phone": getattr(user, 'phone', None),
        "location": getattr(user, 'location', None),
        "website": getattr(user, 'website', None),
        "linkedin": getattr(user, 'linkedin', None),
        "twitter": getattr(user, 'twitter', None),
        "skills": getattr(user, 'skills', "").split(',') if getattr(user, 'skills', None) else [],
        "headline": getattr(user, 'headline', None),
        "is_mentor": getattr(user, 'is_mentor', False),
        "expertise": getattr(user, 'expertise', None),
        "hourly_rate": getattr(user, 'hourly_rate', None),
        "created_at": user.created_at,
        "updated_at": getattr(user, 'updated_at', None),
    }

@router.put("/profile/me")
async def update_profile(
    profile_data: dict,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update allowed fields
    allowed_fields = {
        'full_name', 'bio', 'avatar_url', 'phone', 'location', 
        'website', 'linkedin', 'twitter', 'skills', 'headline',
        'is_mentor', 'expertise', 'hourly_rate'
    }
    
    for field, value in profile_data.items():
        if field in allowed_fields:
            if field == 'skills' and isinstance(value, list):
                setattr(user, field, ','.join(value))
            else:
                setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "bio": getattr(user, 'bio', None),
        "avatar": getattr(user, 'avatar_url', None),
        "phone": getattr(user, 'phone', None),
        "location": getattr(user, 'location', None),
        "website": getattr(user, 'website', None),
        "linkedin": getattr(user, 'linkedin', None),
        "twitter": getattr(user, 'twitter', None),
        "skills": getattr(user, 'skills', "").split(',') if getattr(user, 'skills', None) else [],
        "headline": getattr(user, 'headline', None),
        "is_mentor": getattr(user, 'is_mentor', False),
        "expertise": getattr(user, 'expertise', None),
        "hourly_rate": getattr(user, 'hourly_rate', None),
    }

@router.post("/auth/forgot-password")
async def forgot_password(
    email: str,
    db: Session = Depends(get_db)
):
    """Request password reset email"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal if email exists (security best practice)
        return {"message": "If account exists, reset email will be sent"}
    
    # Generate reset token
    token = secrets.token_urlsafe(32)
    reset_tokens[token] = {
        "user_id": user.id,
        "email": user.email,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=1)
    }
    
    # In production, send email
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    try:
        send_reset_email(user.email, user.full_name, reset_url)
    except Exception as e:
        print(f"Error sending email: {e}")
        # Still return success (don't expose email server details)
    
    return {"message": "If account exists, reset email will be sent"}

@router.post("/auth/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    """Reset password using token"""
    if token not in reset_tokens:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    token_data = reset_tokens[token]
    
    # Check if token expired
    if datetime.utcnow() > token_data["expires_at"]:
        del reset_tokens[token]
        raise HTTPException(status_code=400, detail="Reset token expired")
    
    # Get user
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    
    # Remove used token
    del reset_tokens[token]
    
    return {"message": "Password reset successful"}

@router.post("/auth/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Change password for authenticated user"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify old password
    if not verify_password(old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "Password changed successfully"}

def send_reset_email(email: str, full_name: str, reset_url: str):
    """Send password reset email (configure SMTP in production)"""
    # In production, configure SMTP server
    if not settings.SMTP_HOST:
        # For development, just log
        print(f"Password reset for {email}: {reset_url}")
        return
    
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM
        msg['To'] = email
        msg['Subject'] = 'Uruti Platform - Password Reset Request'
        
        body = f"""
        Hello {full_name},
        
        You requested a password reset for your Uruti Platform account.
        Click the link below to reset your password:
        
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        Uruti Platform Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        if settings.SMTP_TLS:
            server.starttls()
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Error sending email: {e}")
        # Don't raise, as email failure shouldn't block API

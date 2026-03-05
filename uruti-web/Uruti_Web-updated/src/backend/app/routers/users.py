from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, UserRole
from ..schemas import UserResponse, UserUpdate, UserCreate, CredentialsUpdate, AdminUserUpdate
from ..auth import get_current_active_user
from ..auth import get_password_hash, verify_password

router = APIRouter(prefix="/users", tags=["Users"])


def _ensure_admin(current_user: User):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    role: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get list of users with optional filtering"""
    query = db.query(User)

    if role:
        try:
            role_enum = UserRole(role)
            query = query.filter(User.role == role_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    users = query.order_by(desc(User.id)).offset(skip).limit(limit).all()
    return users


@router.get("/search", response_model=List[UserResponse])
def search_users(
    query: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Search users by full name or email (admin only)."""
    _ensure_admin(current_user)

    users = (
        db.query(User)
        .filter(
            or_(
                User.full_name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%"),
            )
        )
        .order_by(desc(User.id))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return users


@router.get("/online-ids", response_model=List[int])
def get_online_user_ids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return IDs of users currently online (admin only).

    A user is considered online if they have an active WebSocket connection
    (notification or message hub) OR if their last_login was within the last
    5 minutes (covers active API usage without a WebSocket).
    """
    _ensure_admin(current_user)

    from .notifications import notification_hub
    from .messages import realtime_hub

    ws_ids: set[int] = notification_hub.connected_user_ids | realtime_hub.connected_user_ids

    cutoff = datetime.utcnow() - timedelta(minutes=5)
    recent_rows = (
        db.query(User.id)
        .filter(User.is_active == True, User.last_login >= cutoff)
        .all()
    )
    recent_ids = {row[0] for row in recent_rows}

    return sorted(ws_ids | recent_ids)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a user account (admin only)."""
    _ensure_admin(current_user)

    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        hashed_password=get_password_hash(user_data.password),
        is_active=True,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update current user profile"""
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.put("/me/credentials", response_model=UserResponse)
def update_my_credentials(
    payload: CredentialsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update current user's email and/or password."""

    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if payload.email is not None and payload.email != current_user.email:
        existing_email = (
            db.query(User)
            .filter(User.email == payload.email, User.id != current_user.id)
            .first()
        )
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = payload.email

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete current user account"""
    db.delete(current_user)
    db.commit()
    return None


@router.get("/mentors/all", response_model=List[UserResponse])
def get_mentors(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get list of all mentors"""
    mentors = db.query(User).filter(User.role == UserRole.MENTOR).offset(skip).limit(limit).all()
    return mentors


@router.put("/{user_id}", response_model=UserResponse)
def update_user_by_id(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a user account (admin only)."""
    _ensure_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.email and payload.email != user.email:
        existing_email = db.query(User).filter(User.email == payload.email).first()
        if existing_email and existing_email.id != user.id:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = payload.email

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)

    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete any non-self user account (admin only)."""
    _ensure_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot delete own account")

    db.delete(user)
    db.commit()
    return None

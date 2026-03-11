from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import Optional
from secrets import token_urlsafe
from pydantic import BaseModel
from ..database import get_db
from ..models import User, UserSession, QrLoginChallenge
from ..schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    Token,
    QrLoginApproveRequest,
)
from ..auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user,
    get_current_active_user
)
from ..config import settings
from jose import jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


class LoginRequestExt(BaseModel):
    """Extended login request with optional device info for session tracking."""
    email: str
    password: str
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    platform: Optional[str] = None
    os: Optional[str] = None


def _create_session(
    db: Session,
    user_id: int,
    *,
    device_id: Optional[str] = None,
    device_name: Optional[str] = None,
    platform: Optional[str] = None,
    os_name: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> UserSession:
    """Create a new user session record."""
    session = UserSession(
        user_id=user_id,
        device_id=device_id,
        device_name=device_name,
        platform=platform,
        os=os_name,
        ip_address=ip_address,
        is_active=True,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


_QR_LOGIN_TTL_SECONDS = 180


def _cleanup_qr_challenges(db: Session, now: datetime) -> None:
    db.query(QrLoginChallenge).filter(
        (QrLoginChallenge.expires_at <= now) | (QrLoginChallenge.consumed == True)
    ).delete(synchronize_session=False)
    db.commit()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""

    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    db_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        hashed_password=get_password_hash(user_data.password)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
def login(login_data: LoginRequestExt, request: Request, db: Session = Depends(get_db)):
    """Login and get access token"""
    
    print(f"🔍 LOGIN ATTEMPT - Email: {login_data.email}, Password length: {len(login_data.password)}")
    
    user = authenticate_user(db, login_data.email, login_data.password)
    print(f"🔍 AUTH RESULT - User found: {user is not None}")
    
    if not user:
        print(f"❌ LOGIN FAILED for {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ LOGIN SUCCESS for {login_data.email}")

    # Track login session
    ip = request.client.host if request.client else None
    session = _create_session(
        db,
        user.id,
        device_id=login_data.device_id,
        device_name=login_data.device_name,
        platform=login_data.platform,
        os_name=login_data.os,
        ip_address=ip,
    )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "sid": session.id},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/qr/request")
def request_qr_login(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    request_id = token_urlsafe(18)
    code = token_urlsafe(16)
    expires_at = now + timedelta(seconds=_QR_LOGIN_TTL_SECONDS)

    _cleanup_qr_challenges(db, now)
    challenge = QrLoginChallenge(
        request_id=request_id,
        code=code,
        status="pending",
        approved_user_id=None,
        consumed=False,
        expires_at=expires_at,
    )
    db.add(challenge)
    db.commit()

    qr_payload = f"uruti://linked-login?request_id={request_id}&code={code}"
    return {
        "request_id": request_id,
        "code": code,
        "status": "pending",
        "expires_at": expires_at.isoformat(),
        "qr_payload": qr_payload,
    }


@router.post("/qr/approve")
def approve_qr_login(
    payload: QrLoginApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    now = datetime.now(timezone.utc)
    _cleanup_qr_challenges(db, now)
    challenge = db.query(QrLoginChallenge).filter(
        QrLoginChallenge.request_id == payload.request_id
    ).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="QR login request not found")
    if challenge.expires_at <= now:
        challenge.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="QR login request expired")
    if challenge.code != payload.code:
        raise HTTPException(status_code=400, detail="Invalid QR login code")

    challenge.status = "approved"
    challenge.approved_user_id = current_user.id
    db.commit()

    return {
        "request_id": payload.request_id,
        "status": "approved",
        "approved_user_id": current_user.id,
    }


@router.get("/qr/status/{request_id}")
def qr_login_status(request_id: str, code: str, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    _cleanup_qr_challenges(db, now)
    challenge = db.query(QrLoginChallenge).filter(
        QrLoginChallenge.request_id == request_id
    ).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="QR login request not found")
    if challenge.expires_at <= now:
        challenge.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="QR login request expired")
    if challenge.code != code:
        raise HTTPException(status_code=400, detail="Invalid QR login code")

    if challenge.status != "approved" or not challenge.approved_user_id:
        return {
            "request_id": request_id,
            "status": challenge.status,
            "expires_at": challenge.expires_at.isoformat(),
        }

    user = db.query(User).filter(User.id == challenge.approved_user_id).first()
    if not user or not user.is_active:
        challenge.status = "failed"
        db.commit()
        return {
            "request_id": request_id,
            "status": "failed",
            "detail": "Approved user is no longer active",
        }

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=access_token_expires,
    )
    challenge.status = "consumed"
    challenge.consumed = True
    db.commit()

    return {
        "request_id": request_id,
        "status": "approved",
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information.

    Uses get_current_user (not get_current_active_user) so that
    deactivated accounts can still retrieve their profile and be
    shown the dedicated deactivated-account screen.
    """
    return current_user


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Logout current user (client should delete token)"""
    return {"message": "Successfully logged out"}


# ──────────────────── SESSION MANAGEMENT ────────────────────

@router.get("/sessions")
def get_active_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    token: str = Depends(oauth2_scheme),
):
    """List all active sessions (linked devices) for the current user."""
    sessions = (
        db.query(UserSession)
        .filter(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True,
        )
        .order_by(UserSession.last_active.desc())
        .all()
    )

    current_session_id: Optional[int] = None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sid = payload.get("sid")
        current_session_id = int(sid) if sid is not None else None
    except Exception:
        current_session_id = None

    return {
        "sessions": [
            {
                "id": s.id,
                "device_id": s.device_id,
                "device_name": s.device_name,
                "platform": s.platform,
                "os": s.os,
                "ip_address": s.ip_address,
                "last_active": s.last_active.isoformat() if s.last_active else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "is_current": bool(current_session_id is not None and s.id == current_session_id),
            }
            for s in sessions
        ]
    }


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Revoke (log out) a specific device session."""
    session = db.query(UserSession).filter(UserSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    session.is_active = False
    db.commit()
    return {"message": "Session revoked"}


class RegisterSessionPayload(BaseModel):
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    platform: Optional[str] = None
    os: Optional[str] = None


@router.post("/sessions/register")
def register_session(
    payload: RegisterSessionPayload,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Register/refresh a session for the current device.

    Called after login or on app startup so sessions stay up-to-date even
    for users who logged in before session tracking was added.
    """
    ip = request.client.host if request.client else None

    # If a device_id is provided, update an existing active session rather
    # than creating a duplicate.
    if payload.device_id:
        existing = (
            db.query(UserSession)
            .filter(
                UserSession.user_id == current_user.id,
                UserSession.device_id == payload.device_id,
                UserSession.is_active == True,
            )
            .first()
        )
        if existing:
            existing.device_name = payload.device_name or existing.device_name
            existing.platform = payload.platform or existing.platform
            existing.os = payload.os or existing.os
            existing.ip_address = ip or existing.ip_address
            existing.last_active = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing)
            return {"status": "updated", "session_id": existing.id}

    session = _create_session(
        db,
        current_user.id,
        device_id=payload.device_id,
        device_name=payload.device_name,
        platform=payload.platform,
        os_name=payload.os,
        ip_address=ip,
    )
    return {"status": "created", "session_id": session.id}

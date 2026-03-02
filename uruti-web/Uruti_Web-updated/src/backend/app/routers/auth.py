from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import Dict
from secrets import token_urlsafe
from threading import Lock
from ..database import get_db
from ..models import User
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
    get_current_active_user
)
from ..config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


class _QrLoginChallenge:
    def __init__(self, request_id: str, code: str, expires_at: datetime):
        self.request_id = request_id
        self.code = code
        self.expires_at = expires_at
        self.status = "pending"
        self.approved_user_id = None
        self.consumed = False


_QR_LOGIN_CHALLENGES: Dict[str, _QrLoginChallenge] = {}
_QR_LOGIN_LOCK = Lock()
_QR_LOGIN_TTL_SECONDS = 180


def _cleanup_qr_challenges(now: datetime) -> None:
    stale_keys = [
        key
        for key, challenge in _QR_LOGIN_CHALLENGES.items()
        if challenge.expires_at <= now or challenge.consumed
    ]
    for key in stale_keys:
        _QR_LOGIN_CHALLENGES.pop(key, None)


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
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
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
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/qr/request")
def request_qr_login():
    now = datetime.now(timezone.utc)
    request_id = token_urlsafe(18)
    code = token_urlsafe(16)
    expires_at = now + timedelta(seconds=_QR_LOGIN_TTL_SECONDS)

    with _QR_LOGIN_LOCK:
        _cleanup_qr_challenges(now)
        _QR_LOGIN_CHALLENGES[request_id] = _QrLoginChallenge(
            request_id=request_id,
            code=code,
            expires_at=expires_at,
        )

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
    current_user: User = Depends(get_current_active_user),
):
    now = datetime.now(timezone.utc)
    with _QR_LOGIN_LOCK:
        _cleanup_qr_challenges(now)
        challenge = _QR_LOGIN_CHALLENGES.get(payload.request_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="QR login request not found")
        if challenge.expires_at <= now:
            challenge.status = "expired"
            raise HTTPException(status_code=410, detail="QR login request expired")
        if challenge.code != payload.code:
            raise HTTPException(status_code=400, detail="Invalid QR login code")
        challenge.status = "approved"
        challenge.approved_user_id = current_user.id

    return {
        "request_id": payload.request_id,
        "status": "approved",
        "approved_user_id": current_user.id,
    }


@router.get("/qr/status/{request_id}")
def qr_login_status(request_id: str, code: str, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    with _QR_LOGIN_LOCK:
        _cleanup_qr_challenges(now)
        challenge = _QR_LOGIN_CHALLENGES.get(request_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="QR login request not found")
        if challenge.expires_at <= now:
            challenge.status = "expired"
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

    return {
        "request_id": request_id,
        "status": "approved",
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current authenticated user information"""
    return current_user


@router.post("/logout")
def logout(current_user: User = Depends(get_current_active_user)):
    """Logout current user (client should delete token)"""
    return {"message": "Successfully logged out"}

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.revoked_token import RevokedToken
from app.core.security import verify_password, create_access_token
from app.schemas import Token
from app.api import deps

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # 1. Find user by email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    # 2. Verify password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    # 3. Create token
    return {
        "access_token": create_access_token(subject=user.id),
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout_current_user(
    token: str = Depends(deps.reusable_oauth2),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Revoke the currently used access token (store jti)."""
    from jose import jwt
    from app.core.config import settings

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        exp = payload.get("exp")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid token")

    if not jti:
        raise HTTPException(status_code=400, detail="Token missing jti")

    revoked = RevokedToken(jti=jti)
    db.add(revoked)
    await db.commit()
    return {"msg": "token revoked"}
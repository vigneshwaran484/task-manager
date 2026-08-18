"""
Auth routes: register, login, refresh, logout (client-side token drop),
and /me endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import (
    AccessToken,
    RefreshRequest,
    TokenPair,
    UserRegister,
    UserResponse,
)
from app.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)) -> User:
    """
    Create a new user account.
    Email uniqueness is enforced at the DB level (unique index) AND here
    to return a clear 409 rather than a 500 IntegrityError.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()  # get the generated UUID before commit
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenPair)
async def login(
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db),
) -> TokenPair:
    """
    Authenticate with email + password; returns an access + refresh token pair.
    The same generic error is returned for unknown email OR wrong password
    to prevent user enumeration (CWE-204).
    """
    result = await db.execute(select(User).where(User.email == email))
    user: User | None = result.scalar_one_or_none()

    # verify_password runs even if user is None (constant-time check workaround)
    dummy_hash = "$2b$12$invalidhashpadding000000000000000000000000000000000000000"
    valid = verify_password(password, user.hashed_password if user else dummy_hash)

    if not valid or user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenPair(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=AccessToken)
async def refresh_access_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> AccessToken:
    """
    Exchange a valid refresh token for a new access token.
    Refresh tokens are stateless here (no DB blacklist) — for a production
    system you'd store a token family in Redis to enable revocation.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id_str = verify_refresh_token(payload.refresh_token)
    except JWTError:
        raise credentials_exception

    from uuid import UUID

    result = await db.execute(select(User).where(User.id == UUID(user_id_str)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception

    return AccessToken(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> User:
    """Return the currently authenticated user's profile."""
    return current_user

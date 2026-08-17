"""
Security helpers — password hashing and JWT operations.

Security decisions worth explaining in a viva:
- bcrypt with default work factor (12) — deliberately slow to resist
  brute-force even if the DB is breached (CWE-916).
- Access tokens expire in 15 minutes (configurable) — limits the blast
  radius of a stolen token.
- Refresh tokens are rotated on each use — if a refresh token is stolen
  and used, the legitimate user's next refresh will fail (their token is
  gone), giving an early warning signal.
- JWT secret comes from Key Vault, not .env in prod — eliminates the
  risk of accidental commit.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password ──────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────

def _make_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    settings = get_settings()
    payload = data.copy()
    payload["exp"] = datetime.now(UTC) + expires_delta
    payload["iat"] = datetime.now(UTC)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: str) -> str:
    """subject = user UUID as string."""
    settings = get_settings()
    return _make_token(
        {"sub": subject, "type": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(subject: str) -> str:
    settings = get_settings()
    return _make_token(
        {"sub": subject, "type": "refresh"},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and verify a JWT. Raises JWTError on any failure
    (expired, tampered, wrong algorithm).
    """
    settings = get_settings()
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


def verify_access_token(token: str) -> str:
    """Returns the subject (user UUID) or raises JWTError."""
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise JWTError("Wrong token type")
    sub: str | None = payload.get("sub")
    if sub is None:
        raise JWTError("Missing subject")
    return sub


def verify_refresh_token(token: str) -> str:
    """Returns the subject (user UUID) or raises JWTError."""
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise JWTError("Wrong token type")
    sub: str | None = payload.get("sub")
    if sub is None:
        raise JWTError("Missing subject")
    return sub

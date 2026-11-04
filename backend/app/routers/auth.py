
import hashlib
import secrets
from datetime import datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import LoginRequest, UserResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

password_hasher = PasswordHasher()

SESSION_COOKIE_NAME = "dairysync_session"
SESSION_DURATION_DAYS = 7


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    session_token = request.cookies.get(SESSION_COOKIE_NAME)

    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    token_hash = hash_session_token(session_token)

    user_session = (
        db.query(models.UserSession)
        .filter(
            models.UserSession.token_hash == token_hash,
            models.UserSession.revoked_at.is_(None),
            models.UserSession.expires_at > datetime.utcnow()
        )
        .first()
    )

    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )

    user = (
        db.query(models.User)
        .filter(
            models.User.id == user_session.user_id,
            models.User.is_active.is_(True)
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is inactive or unavailable"
        )

    return user


@router.post("/login", response_model=UserResponse)
def login(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    email = login_data.email.strip().lower()

    user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    try:
        password_hasher.verify(
            user.password_hash,
            login_data.password
        )
    except (VerifyMismatchError, VerificationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    session_token = secrets.token_urlsafe(32)

    user_session = models.UserSession(
        user_id=user.id,
        token_hash=hash_session_token(session_token),
        expires_at=datetime.utcnow() + timedelta(
            days=SESSION_DURATION_DAYS
        )
    )

    db.add(user_session)
    db.commit()

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=SESSION_DURATION_DAYS * 24 * 60 * 60,
        path="/"
    )

    return user


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: models.User = Depends(get_current_user)
):
    return current_user


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    session_token = request.cookies.get(SESSION_COOKIE_NAME)

    if session_token:
        token_hash = hash_session_token(session_token)

        user_session = (
            db.query(models.UserSession)
            .filter(
                models.UserSession.token_hash == token_hash,
                models.UserSession.revoked_at.is_(None)
            )
            .first()
        )

        if user_session:
            user_session.revoked_at = datetime.utcnow()
            db.commit()

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=False,
        samesite="lax"
    )

    return {"message": "Logged out successfully"}

from typing import Callable


def require_roles(*allowed_roles: str) -> Callable:
    def role_checker(
        current_user: models.User = Depends(get_current_user)
    ):
        if current_user.role.strip().lower() not in {
            role.strip().lower() for role in allowed_roles
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )

        return current_user

    return role_checker
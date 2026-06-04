from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as g_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.models.user import User
from app.schemas.auth import GoogleLoginRequest, LoginResponse, UserOut


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=LoginResponse)
def login_with_google(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not settings.GOOGLE_OAUTH_CLIENT_ID:
        raise HTTPException(500, "GOOGLE_OAUTH_CLIENT_ID não configurado no servidor.")

    try:
        info = google_id_token.verify_oauth2_token(
            payload.id_token,
            g_requests.Request(),
            settings.GOOGLE_OAUTH_CLIENT_ID,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Token Google inválido: {e}")

    sub = info.get("sub")
    email = info.get("email")
    if not sub or not email:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token Google sem sub/email")

    user = db.query(User).filter(User.google_sub == sub).first()
    if user is None:
        user = User(
            google_sub=sub,
            email=email,
            name=info.get("name"),
            avatar_url=info.get("picture"),
        )
        db.add(user)
    else:
        # atualiza dados públicos se mudaram
        user.email = email
        user.name = info.get("name") or user.name
        user.avatar_url = info.get("picture") or user.avatar_url

    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

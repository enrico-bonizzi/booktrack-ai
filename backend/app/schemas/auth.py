from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(..., min_length=10)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str | None
    avatar_url: str | None
    created_at: datetime


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.api import books, ai, auth


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="BookTrack AI",
    description="Painel inteligente de acompanhamento de leitura com IA.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pasta de uploads servida como /uploads
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(ai.router)


@app.get("/", tags=["health"])
def root():
    return {"app": "BookTrack AI", "status": "ok", "env": settings.APP_ENV}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}

import os
import warnings

os.environ["TOKENIZERS_PARALLELISM"] = "false"
warnings.filterwarnings(
    "ignore",
    message=r"`clean_up_tokenization_spaces` was not set.*",
    category=FutureWarning,
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from .config import settings
from .database import engine, Base
from .routers import (
    auth,
    users,
    ventures,
    messages,
    bookmarks,
    meetings,
    notifications,
    connections,
    support,
    advisory_tracks,
    availability,
    profile,
    ai,
    chat,
    pitch_coach,
    pitch,
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Migrate: add new venture columns if they don't exist
def _migrate_venture_columns():
    """Add activities, highlights, competitive_edge, team_background,
    funding_plans, milestones columns to the ventures table if missing."""
    from sqlalchemy import text, inspect as sa_inspect
    inspector = sa_inspect(engine)
    existing = {c["name"] for c in inspector.get_columns("ventures")}
    new_cols = {
        "highlights": "JSON",
        "competitive_edge": "TEXT",
        "team_background": "TEXT",
        "funding_plans": "TEXT",
        "milestones": "JSON",
        "activities": "JSON",
    }
    with engine.begin() as conn:
        for col, col_type in new_cols.items():
            if col not in existing:
                conn.execute(text(f'ALTER TABLE ventures ADD COLUMN "{col}" {col_type}'))

_migrate_venture_columns()

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Uruti Digital Ecosystem - AI-driven entrepreneurship and investment readiness platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Uruti Digital Ecosystem API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


# Health check
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }


# Static file serving for uploaded images
@app.get("/api/v1/profile/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded profile images"""
    file_path = Path("uploads") / filename
    if not file_path.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.get("/api/v1/messages/uploads/{filename}")
async def get_uploaded_message_file(filename: str):
    """Serve uploaded message attachments"""
    file_path = Path("uploads") / "messages" / filename
    if not file_path.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(ventures.router, prefix=settings.API_V1_PREFIX)
app.include_router(messages.router, prefix=settings.API_V1_PREFIX)
app.include_router(bookmarks.router, prefix=settings.API_V1_PREFIX)
app.include_router(meetings.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(connections.router, prefix=settings.API_V1_PREFIX)
app.include_router(support.router, prefix=settings.API_V1_PREFIX)
app.include_router(advisory_tracks.router, prefix=settings.API_V1_PREFIX)
app.include_router(availability.router, prefix=settings.API_V1_PREFIX)
app.include_router(profile.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(pitch_coach.router, prefix=settings.API_V1_PREFIX)
app.include_router(pitch.router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
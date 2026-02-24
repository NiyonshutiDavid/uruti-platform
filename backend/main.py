from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine
from app.db.base import Base


async def _ensure_sqlite_schema(conn):
    """Apply lightweight dev-time SQLite schema updates for existing databases."""
    dialect = conn.engine.dialect.name
    if dialect != "sqlite":
        return

    columns_result = await conn.execute(text("PRAGMA table_info(users)"))
    existing_columns = {row[1] for row in columns_result.fetchall()}

    missing_columns = [
        ("bio", "TEXT"),
        ("avatar_url", "VARCHAR"),
        ("headline", "VARCHAR"),
        ("phone", "VARCHAR"),
        ("location", "VARCHAR"),
        ("website", "VARCHAR"),
        ("linkedin", "VARCHAR"),
        ("twitter", "VARCHAR"),
        ("skills", "VARCHAR"),
        ("is_mentor", "BOOLEAN DEFAULT 0"),
        ("expertise", "VARCHAR"),
        ("hourly_rate", "FLOAT"),
        ("created_at", "DATETIME"),
        ("updated_at", "DATETIME"),
    ]

    for column_name, column_type in missing_columns:
        if column_name not in existing_columns:
            await conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))

# Lifecycle manager to create tables on startup (for dev only)
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # WARNING: This creates tables if they don't exist. 
        # In production, use Alembic migrations.
        await conn.run_sync(Base.metadata.create_all)
        await _ensure_sqlite_schema(conn)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Uruti Platform API",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
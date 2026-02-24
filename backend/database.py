from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from pathlib import Path
from app.core.config import settings


def _resolve_database_url(url: str) -> str:
    prefix = "sqlite+aiosqlite:///./"
    if url.startswith(prefix):
        relative_db = url.removeprefix(prefix)
        absolute_db = Path(__file__).resolve().parent / relative_db
        return f"sqlite+aiosqlite:///{absolute_db}"
    return url


DATABASE_URL = _resolve_database_url(settings.DATABASE_URL)

# Create Async Engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True, # Set to False in production
    future=True
)

# Create Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    """Base class for all database models to be loaded later."""
    pass

async def get_db():
    """Dependency for getting async database sessions."""
    async with AsyncSessionLocal() as session:
        yield session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
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

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
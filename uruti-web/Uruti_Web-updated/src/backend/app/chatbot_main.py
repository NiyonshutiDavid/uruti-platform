import os
import asyncio
import warnings

os.environ["TOKENIZERS_PARALLELISM"] = "false"
warnings.filterwarnings(
    "ignore",
    message=r"`clean_up_tokenization_spaces` was not set.*",
    category=FutureWarning,
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth
from .routers import chatbot as chatbot_router
from .services.chatbot_engine import chatbot_engine

# Ensure chatbot service can run independently and create required tables.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=f"{settings.APP_NAME} - Uruti AI Modules",
    version=settings.APP_VERSION,
    description="Dedicated Uruti AI modules service (chatbot only)",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|([a-z0-9-]+\.)?uruti\.rw|([a-z0-9-]+\.)?netlify\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to Uruti AI Modules",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "service": "uruti-ai-modules",
    }


app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(chatbot_router.router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
async def _warmup_chatbot_model() -> None:
    # Start chatbot model initialization at service boot.
    asyncio.create_task(asyncio.to_thread(chatbot_engine.warmup))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.chatbot_main:app", host="0.0.0.0", port=8020, reload=True)

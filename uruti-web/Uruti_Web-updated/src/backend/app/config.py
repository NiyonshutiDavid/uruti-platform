import os
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    """Application settings and configuration"""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
        enable_decoding=False,
    )
    
    # App Info
    APP_NAME: str = "Uruti Digital Ecosystem API"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/uruti_db"
    )
    
    # Security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "your-secret-key-here-change-in-production-min-32-chars"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS – set CORS_ORIGINS env var to a comma-separated list in production
    # e.g. CORS_ORIGINS=https://uruti.rw,https://www.uruti.rw
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default=[
        "https://uruti.rw",
        "https://www.uruti.rw",
        "http://173.249.25.80:1199",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        ],
        validation_alias="CORS_ORIGINS",
    )

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Email (for future implementation)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SUPPORT_EMAIL: str = "uruti.info@gmail.com"
    
    # AI Settings (for future AI integration)
    OPENAI_API_KEY: Optional[str] = None
    HF_TOKEN: Optional[str] = None
    HUGGINGFACE_TOKEN: Optional[str] = None
    HUGGINGFACE_API_TOKEN: Optional[str] = None
    HUGGINGFACEHUB_API_TOKEN: Optional[str] = None

    URUTI_BEST_MODEL_ID: str = "uruti-ai"
    URUTI_CHATBOT_REPO_ID: str = "NiyonshutiDavid/uruti-qwen2_5-7b-instruct-q4_k_m-gguf"
    URUTI_CHATBOT_GGUF_FILENAME: str = "qwen2_5-7b-instruct-q4_k_m.gguf"
    URUTI_CHATBOT_LOCAL_GGUF_PATH: Optional[str] = None
    URUTI_CHATBOT_CTX: int = 3072
    URUTI_CHATBOT_MAX_TOKENS: int = 256
    URUTI_CHATBOT_TEMPERATURE: float = 0.2
    URUTI_CHATBOT_HISTORY_MESSAGES: int = 8
    URUTI_CHATBOT_MAX_INPUT_CHARS: int = 1800
    URUTI_CHATBOT_RESPONSE_TIMEOUT_SECONDS: float = 45.0
    URUTI_CHATBOT_LOCAL_TIMEOUT_SECONDS: float = 20.0
    CHATBOT_SERVICE_URL: str = os.getenv("CHATBOT_SERVICE_URL", "http://127.0.0.1:8020")
    CHATBOT_HEALTH_PROBE_TIMEOUT_SECONDS: float = 5.0
    CORE_SERVICE_URL: str = os.getenv("CORE_SERVICE_URL", "http://173.249.25.80:1199")
    PITCH_COACH_MODEL_ID: Optional[str] = None
    PITCH_COACH_ENABLE_LOCAL_RL: bool = False
    PITCH_COACH_LOCAL_MODEL_DIR: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3-flash-preview"
    GEMINI_TIMEOUT_SECONDS: float = 12.0

    # Push Notifications (Firebase Cloud Messaging)
    FCM_SERVICE_ACCOUNT_PATH: Optional[str] = os.getenv("FCM_SERVICE_ACCOUNT_PATH")
    FCM_SERVICE_ACCOUNT_JSON: Optional[str] = os.getenv("FCM_SERVICE_ACCOUNT_JSON")
    
settings = Settings()

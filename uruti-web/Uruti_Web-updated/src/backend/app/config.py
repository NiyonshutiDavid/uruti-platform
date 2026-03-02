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
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default=[
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
    
    # AI Settings (for future AI integration)
    OPENAI_API_KEY: Optional[str] = None

    # Push Notifications (Firebase Cloud Messaging)
    FCM_SERVICE_ACCOUNT_PATH: Optional[str] = os.getenv("FCM_SERVICE_ACCOUNT_PATH")
    FCM_SERVICE_ACCOUNT_JSON: Optional[str] = os.getenv("FCM_SERVICE_ACCOUNT_JSON")
    
settings = Settings()

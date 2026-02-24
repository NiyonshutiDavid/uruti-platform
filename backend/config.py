from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Uruti Platform"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str

    # Frontend URL for password reset links
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Email/SMTP Configuration (optional for development)
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = "test@urutiplatform.com"
    SMTP_PASSWORD: str = "test-password"
    SMTP_FROM: str = "noreply@urutiplatform.com"
    SMTP_TLS: bool = True

    model_config = ConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
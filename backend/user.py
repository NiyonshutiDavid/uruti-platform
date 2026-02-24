from sqlalchemy import Boolean, Column, Integer, String, DateTime, Float, Text
from datetime import datetime
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(String, default="founder")
    
    # Profile fields
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    headline = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    twitter = Column(String, nullable=True)
    skills = Column(String, nullable=True)  # Comma-separated
    
    # Mentor fields
    is_mentor = Column(Boolean, default=False)
    expertise = Column(String, nullable=True)
    hourly_rate = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
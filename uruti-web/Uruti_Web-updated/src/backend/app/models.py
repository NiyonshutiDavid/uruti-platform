from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, Enum, Float, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base


# Enums
class UserRole(str, enum.Enum):
    FOUNDER = "founder"
    INVESTOR = "investor"
    MENTOR = "mentor"
    ADMIN = "admin"


class VentureStage(str, enum.Enum):
    IDEATION = "ideation"
    VALIDATION = "validation"
    MVP = "mvp"
    EARLY_TRACTION = "early_traction"
    GROWTH = "growth"
    SCALE = "scale"


class IndustryType(str, enum.Enum):
    TECHNOLOGY = "technology"
    AGRICULTURE = "agriculture"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    FINTECH = "fintech"
    MANUFACTURING = "manufacturing"
    SERVICES = "services"
    RETAIL = "retail"
    OTHER = "other"


class MeetingStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class NotificationType(str, enum.Enum):
    MESSAGE = "message"
    MEETING = "meeting"
    SCORE_UPDATE = "score_update"
    BOOKMARK = "bookmark"
    SYSTEM = "system"


class PushPlatform(str, enum.Enum):
    IOS = "ios"
    ANDROID = "android"
    WEB = "web"
    UNKNOWN = "unknown"


# Association Tables for Many-to-Many Relationships
venture_industries = Table(
    'venture_industries',
    Base.metadata,
    Column('venture_id', Integer, ForeignKey('ventures.id', ondelete='CASCADE')),
    Column('industry', String, nullable=False)
)

user_skills = Table(
    'user_skills',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('skill', String, nullable=False)
)


# Models
class User(Base):
    """User model for founders, investors, mentors, and admins"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.FOUNDER)

    @property
    def display_name(self) -> str:
        if self.full_name and self.full_name.strip():
            return self.full_name
        return (self.email.split("@")[0] if self.email else "User")
    
    # Profile Information
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    cover_image_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    twitter_url = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    
    # Professional Info
    title = Column(String, nullable=True)  # Job title
    company = Column(String, nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    
    # Profile Detail Fields (for display on ProfileViewModule)
    expertise = Column(JSON, nullable=True)  # List of skills/expertise
    industry = Column(String, nullable=True)  # Industry focus for founders
    preferred_sectors = Column(JSON, nullable=True)  # List of sectors for investors
    investment_focus = Column(JSON, nullable=True)  # List of investment focus areas
    achievements = Column(JSON, nullable=True)  # List of achievements
    funding_amount = Column(String, nullable=True)  # For founders: funding raised/goal
    stage = Column(String, nullable=True)  # Startup stage (ideation, MVP, growth, etc.)
    
    # Settings
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_notifications = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    ventures = relationship("Venture", back_populates="founder", cascade="all, delete-orphan")
    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    messages_received = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    push_tokens = relationship("PushDeviceToken", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    meetings_as_host = relationship("Meeting", foreign_keys="Meeting.host_id", back_populates="host")
    meetings_as_participant = relationship("Meeting", foreign_keys="Meeting.participant_id", back_populates="participant")
    mentor_availability = relationship("MentorAvailability", back_populates="mentor", cascade="all, delete-orphan")
    ai_track_progress = relationship("AITrackProgress", back_populates="user", cascade="all, delete-orphan")
    ai_chat_messages = relationship("AiChatMessage", back_populates="user", cascade="all, delete-orphan")
    advisory_material_progress = relationship("AdvisoryMaterialProgress", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class Venture(Base):
    """Startup/Business Venture model"""
    __tablename__ = "ventures"

    id = Column(Integer, primary_key=True, index=True)
    founder_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Basic Information
    name = Column(String, nullable=False, index=True)
    tagline = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    problem_statement = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    
    # Business Details
    stage = Column(Enum(VentureStage), nullable=False, default=VentureStage.IDEATION)
    industry = Column(Enum(IndustryType), nullable=False)
    target_market = Column(Text, nullable=True)
    business_model = Column(Text, nullable=True)
    
    # Financial Information
    funding_goal = Column(Float, nullable=True)
    funding_raised = Column(Float, default=0.0)
    revenue = Column(Float, nullable=True)
    monthly_burn_rate = Column(Float, nullable=True)
    
    # Team
    team_size = Column(Integer, default=1)
    team_info = Column(JSON, nullable=True)  # Array of team members
    
    # Traction
    customers = Column(Integer, default=0)
    mrr = Column(Float, nullable=True)  # Monthly Recurring Revenue
    
    # Uruti Score
    uruti_score = Column(Float, default=0.0)
    score_breakdown = Column(JSON, nullable=True)  # Detailed score metrics

    # Extended Info (editable by founder, visible to investors)
    highlights = Column(JSON, nullable=True)  # List of key highlight strings
    competitive_edge = Column(Text, nullable=True)
    team_background = Column(Text, nullable=True)
    funding_plans = Column(Text, nullable=True)
    milestones = Column(JSON, nullable=True)  # [{title, description, status}]
    activities = Column(JSON, nullable=True)  # [{id, type, title, description, date}]

    # Media
    logo_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    pitch_deck_url = Column(String, nullable=True)
    demo_video_url = Column(String, nullable=True)
    
    # Status
    is_published = Column(Boolean, default=False)
    is_seeking_funding = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    founder = relationship("User", back_populates="ventures")
    bookmarks = relationship("Bookmark", back_populates="venture", cascade="all, delete-orphan")
    pitch_sessions = relationship("PitchSession", back_populates="venture", cascade="all, delete-orphan")


class Message(Base):
    """Message/Inbox model for user communication"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Message Content
    subject = Column(String, nullable=True)
    body = Column(Text, nullable=False)
    
    # Attachments
    attachments = Column(JSON, nullable=True)  # Array of file URLs
    
    # Status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    is_archived = Column(Boolean, default=False)
    
    # Thread
    thread_id = Column(String, nullable=True, index=True)  # For grouping conversations
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")


class SupportMessage(Base):
    """Support chat messages from public visitors to admin support inbox"""
    __tablename__ = "support_messages"

    id = Column(Integer, primary_key=True, index=True)
    visitor_name = Column(String, nullable=False)
    visitor_email = Column(String, nullable=False, index=True)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)


class Notification(Base):
    """Notification model for user alerts"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Notification Content
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    # Metadata
    data = Column(JSON, nullable=True)  # Additional data (IDs, links, etc.)
    
    # Status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notifications")


class PushDeviceToken(Base):
    """Stores device push token for each authenticated user/device."""
    __tablename__ = "push_device_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String, nullable=False, unique=True, index=True)
    platform = Column(Enum(PushPlatform), nullable=False, default=PushPlatform.UNKNOWN)
    device_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "token", name="uq_push_user_token"),
    )

    user = relationship("User", back_populates="push_tokens")


class Bookmark(Base):
    """Bookmark model for deal flow and saved ventures"""
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    venture_id = Column(Integer, ForeignKey("ventures.id", ondelete="CASCADE"), nullable=False)
    
    # Bookmark Details
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)  # Array of custom tags
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="bookmarks")
    venture = relationship("Venture", back_populates="bookmarks")


class Meeting(Base):
    """Meeting/Calendar model for scheduling"""
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    participant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Meeting Details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    meeting_type = Column(String, nullable=True)  # video, call, in-person
    
    # Schedule
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String, default="Africa/Kigali")
    
    # Meeting Link
    meeting_url = Column(String, nullable=True)  # For video calls
    location = Column(String, nullable=True)  # For in-person meetings
    
    # Status
    status = Column(Enum(MeetingStatus), default=MeetingStatus.SCHEDULED)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    host = relationship("User", foreign_keys=[host_id], back_populates="meetings_as_host")
    participant = relationship("User", foreign_keys=[participant_id], back_populates="meetings_as_participant")


class MentorAvailability(Base):
    """Mentor availability for booking system"""
    __tablename__ = "mentor_availability"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Availability
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String, nullable=False)  # HH:MM format
    end_time = Column(String, nullable=False)  # HH:MM format
    
    # Settings
    is_available = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    mentor = relationship("User", back_populates="mentor_availability")


class AITrackProgress(Base):
    """AI Advisory Track progress model"""
    __tablename__ = "ai_track_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Track Information
    track_type = Column(String, nullable=False)  # legal, finance, marketing, operations
    track_name = Column(String, nullable=False)
    
    # Progress
    total_modules = Column(Integer, nullable=False)
    completed_modules = Column(Integer, default=0)
    progress_percentage = Column(Float, default=0.0)
    
    # Module Data
    modules_data = Column(JSON, nullable=True)  # Detailed module completion info
    
    # Status
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="ai_track_progress")


class AdvisoryMaterialProgress(Base):
    """Per-user completion state for advisory track materials"""
    __tablename__ = "advisory_material_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    track_id = Column(Integer, ForeignKey("advisory_tracks.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, nullable=False)

    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "track_id", "material_id", name="uq_user_track_material_completion"),
    )

    user = relationship("User", back_populates="advisory_material_progress")


class PitchSession(Base):
    """Pitch coaching session recordings and analysis"""
    __tablename__ = "pitch_sessions"

    id = Column(Integer, primary_key=True, index=True)
    venture_id = Column(Integer, ForeignKey("ventures.id", ondelete="CASCADE"), nullable=False)
    
    # Session Details
    title = Column(String, nullable=False)
    video_url = Column(String, nullable=True)
    audio_url = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    
    # AI Analysis
    ai_feedback = Column(JSON, nullable=True)  # Structured AI feedback
    confidence_score = Column(Float, nullable=True)
    pacing_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)
    
    # Duration
    duration_seconds = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    venture = relationship("Venture", back_populates="pitch_sessions")


class Connection(Base):
    """Connection model for user-to-user connections/relationships"""
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Ensure user1_id is always less than user2_id to avoid duplicates
    __table_args__ = (
        UniqueConstraint('user1_id', 'user2_id', name='unique_connection'),
    )


class ConnectionRequest(Base):
    """Connection request model for managing connection requests"""
    __tablename__ = "connection_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Status
    status = Column(String, default="pending")  # pending, accepted, rejected
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AiChatMessage(Base):
    """AI Chatbot conversation history per user"""
    __tablename__ = "ai_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Conversation grouping
    session_id = Column(String, nullable=False, index=True)  # UUID per conversation

    # Message content
    role = Column(String, nullable=False)  # 'user' | 'assistant'
    content = Column(Text, nullable=False)

    # Optional metadata stored alongside message
    model_used = Column(String, nullable=True)          # e.g. uruti-ai, venture-mlop
    startup_context = Column(JSON, nullable=True)       # {name, description, ...}
    has_attachment = Column(Boolean, default=False)
    attachment_name = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="ai_chat_messages")


class AiChatSession(Base):
    """Per-user AI chat session metadata (title, timestamps)."""
    __tablename__ = "ai_chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "session_id", name="uq_ai_chat_session_user_session"),
    )


class UserSession(Base):
    """Tracks active device sessions for linked-device management."""
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(String, nullable=True, index=True)
    device_name = Column(String, nullable=True)
    platform = Column(String, nullable=True)  # ios, android, web
    os = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_active = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")


class AdvisoryTrack(Base):
    """AI Advisory Track model for educational content"""
    __tablename__ = "advisory_tracks"

    id = Column(Integer, primary_key=True, index=True)
    
    # Track Information
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # financial, legal, market, pitch
    
    # Structure
    modules = Column(Integer, nullable=False)
    duration = Column(String, nullable=False)  # e.g., "4 weeks"
    
    # Content
    objectives = Column(JSON, nullable=True)  # Array of learning objectives
    materials = Column(JSON, nullable=True)  # Array of materials with name, type, url, description, content
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_by_admin = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who created it
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
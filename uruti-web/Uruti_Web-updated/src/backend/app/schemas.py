from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum


# Enums
class UserRole(str, Enum):
    FOUNDER = "founder"
    INVESTOR = "investor"
    MENTOR = "mentor"
    ADMIN = "admin"


class VentureStage(str, Enum):
    IDEATION = "ideation"
    VALIDATION = "validation"
    MVP = "mvp"
    EARLY_TRACTION = "early_traction"
    GROWTH = "growth"
    SCALE = "scale"


class IndustryType(str, Enum):
    TECHNOLOGY = "technology"
    AGRICULTURE = "agriculture"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    FINTECH = "fintech"
    MANUFACTURING = "manufacturing"
    SERVICES = "services"
    RETAIL = "retail"
    OTHER = "other"


class MeetingStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class NotificationType(str, Enum):
    MESSAGE = "message"
    MEETING = "meeting"
    SCORE_UPDATE = "score_update"
    BOOKMARK = "bookmark"
    SYSTEM = "system"


class PushTokenUpsert(BaseModel):
    token: str
    platform: Optional[str] = "unknown"
    device_id: Optional[str] = None


class PushTokenRemove(BaseModel):
    token: str


# Base Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.FOUNDER


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.FOUNDER
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    years_of_experience: Optional[int] = None
    expertise: Optional[list] = None
    industry: Optional[str] = None
    preferred_sectors: Optional[list] = None
    investment_focus: Optional[list] = None
    achievements: Optional[list] = None
    funding_amount: Optional[str] = None
    stage: Optional[str] = None
    email_notifications: Optional[bool] = None


class CredentialsUpdate(BaseModel):
    email: Optional[EmailStr] = None
    current_password: str
    new_password: str = Field(..., min_length=8)


class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=8)


class UserResponse(UserBase):
    id: int
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    years_of_experience: Optional[int] = None
    expertise: Optional[list] = None
    industry: Optional[str] = None
    preferred_sectors: Optional[list] = None
    investment_focus: Optional[list] = None
    achievements: Optional[list] = None
    funding_amount: Optional[str] = None
    stage: Optional[str] = None
    is_active: bool
    is_verified: bool
    email_notifications: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    uruti_score: float = 0.0

    class Config:
        from_attributes = True


# Authentication
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class QrLoginApproveRequest(BaseModel):
    request_id: str
    code: str


# Venture Schemas
class VentureBase(BaseModel):
    name: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    stage: VentureStage = VentureStage.IDEATION
    industry: IndustryType
    target_market: Optional[str] = None
    business_model: Optional[str] = None
    logo_url: Optional[str] = None


class VentureCreate(VentureBase):
    pass


class VentureUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    stage: Optional[VentureStage] = None
    industry: Optional[IndustryType] = None
    target_market: Optional[str] = None
    business_model: Optional[str] = None
    funding_goal: Optional[float] = None
    funding_raised: Optional[float] = None
    revenue: Optional[float] = None
    monthly_burn_rate: Optional[float] = None
    team_size: Optional[int] = None
    team_info: Optional[Dict[str, Any]] = None
    customers: Optional[int] = None
    mrr: Optional[float] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    pitch_deck_url: Optional[str] = None
    demo_video_url: Optional[str] = None
    is_published: Optional[bool] = None
    is_seeking_funding: Optional[bool] = None


class VentureResponse(VentureBase):
    id: int
    founder_id: int
    funding_goal: Optional[float] = None
    funding_raised: float
    revenue: Optional[float] = None
    monthly_burn_rate: Optional[float] = None
    team_size: int
    team_info: Optional[Dict[str, Any]] = None
    customers: int
    mrr: Optional[float] = None
    uruti_score: float
    score_breakdown: Optional[Dict[str, Any]] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    pitch_deck_url: Optional[str] = None
    demo_video_url: Optional[str] = None
    is_published: bool
    is_seeking_funding: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Message Schemas
class MessageBase(BaseModel):
    receiver_id: int
    subject: Optional[str] = None
    body: str


class MessageCreate(MessageBase):
    attachments: Optional[List[str]] = None


class MessageResponse(MessageBase):
    id: int
    sender_id: int
    attachments: Optional[List[str]] = None
    is_read: bool
    read_at: Optional[datetime] = None
    is_archived: bool
    thread_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SupportMessageCreate(BaseModel):
    visitor_name: str
    visitor_email: EmailStr
    message: str


class SupportMessageRespond(BaseModel):
    response: str


class SupportMessageResponse(BaseModel):
    id: int
    visitor_name: str
    visitor_email: EmailStr
    message: str
    response: Optional[str] = None
    status: str
    created_at: datetime
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Notification Schemas
class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str


class NotificationCreate(NotificationBase):
    user_id: int
    data: Optional[Dict[str, Any]] = None


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Bookmark Schemas
class BookmarkBase(BaseModel):
    venture_id: int


class BookmarkCreate(BookmarkBase):
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class BookmarkUpdate(BaseModel):
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class BookmarkResponse(BookmarkBase):
    id: int
    user_id: int
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    venture: Optional[VentureResponse] = None

    class Config:
        from_attributes = True


# Meeting Schemas
class MeetingBase(BaseModel):
    participant_id: int
    title: str
    description: Optional[str] = None
    meeting_type: Optional[str] = None
    start_time: datetime
    end_time: datetime
    timezone: str = "Africa/Kigali"


class MeetingCreate(MeetingBase):
    meeting_url: Optional[str] = None
    location: Optional[str] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    meeting_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    timezone: Optional[str] = None
    meeting_url: Optional[str] = None
    location: Optional[str] = None
    status: Optional[MeetingStatus] = None


class MeetingResponse(MeetingBase):
    id: int
    host_id: int
    meeting_url: Optional[str] = None
    location: Optional[str] = None
    status: MeetingStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Mentor Availability Schemas
class MentorAvailabilityBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")


class MentorAvailabilityCreate(MentorAvailabilityBase):
    is_available: bool = True


class MentorAvailabilityUpdate(BaseModel):
    is_available: Optional[bool] = None


class MentorAvailabilityResponse(MentorAvailabilityBase):
    id: int
    mentor_id: int
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True


# AI Track Progress Schemas
class AITrackProgressBase(BaseModel):
    track_type: str
    track_name: str
    total_modules: int


class AITrackProgressCreate(AITrackProgressBase):
    modules_data: Optional[Dict[str, Any]] = None


class AITrackProgressUpdate(BaseModel):
    completed_modules: Optional[int] = None
    progress_percentage: Optional[float] = None
    modules_data: Optional[Dict[str, Any]] = None
    is_completed: Optional[bool] = None


class AITrackProgressResponse(AITrackProgressBase):
    id: int
    user_id: int
    completed_modules: int
    progress_percentage: float
    modules_data: Optional[Dict[str, Any]] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    started_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Pitch Session Schemas
class PitchSessionBase(BaseModel):
    title: str


class PitchSessionCreate(PitchSessionBase):
    venture_id: int
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    transcript: Optional[str] = None


class PitchSessionUpdate(BaseModel):
    ai_feedback: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None
    pacing_score: Optional[float] = None
    clarity_score: Optional[float] = None
    overall_score: Optional[float] = None
    duration_seconds: Optional[int] = None


class PitchSessionResponse(PitchSessionBase):
    id: int
    venture_id: int
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    transcript: Optional[str] = None
    ai_feedback: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None
    pacing_score: Optional[float] = None
    clarity_score: Optional[float] = None
    overall_score: Optional[float] = None
    duration_seconds: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Pagination
class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(100, ge=1, le=100)


# Generic Response
class GenericResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


# Connection Schemas
class ConnectionRequestCreate(BaseModel):
    user_id: int


class ConnectionResponse(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ConnectionRequestResponse(BaseModel):
    id: int
    requester_id: int
    receiver_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Advisory Track Schemas
class AdvisoryTrackBase(BaseModel):
    title: str
    description: str
    category: str  # financial, legal, market, pitch
    modules: int
    duration: str
    objectives: Optional[List[str]] = None
    materials: Optional[List[Dict[str, Any]]] = None


class AdvisoryTrackCreate(AdvisoryTrackBase):
    pass


class AdvisoryTrackUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    modules: Optional[int] = None
    duration: Optional[str] = None
    objectives: Optional[List[str]] = None
    materials: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None


class AdvisoryTrackResponse(AdvisoryTrackBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_materials: List[int] = []
    progress_percentage: Optional[int] = 0
    status: Optional[str] = "not-started"

    class Config:
        from_attributes = True


# ─── AI Chat ──────────────────────────────────────────────────────────────────

class AiStartupContext(BaseModel):
    name: str
    description: Optional[str] = None
    stage: Optional[str] = None
    industry: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    target_market: Optional[str] = None
    business_model: Optional[str] = None


class AiChatRequest(BaseModel):
    message: str
    model: Optional[str] = "uruti-ai"          # uruti-ai | gpt-4 | gpt-3.5-turbo
    session_id: Optional[str] = None            # continue existing session
    startup_context: Optional[AiStartupContext] = None
    file_content: Optional[str] = None          # plain-text file content
    file_name: Optional[str] = None


class AiChatResponse(BaseModel):
    message: str
    session_id: str
    model: str

    class Config:
        from_attributes = True


class AiChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    model_used: Optional[str] = None
    has_attachment: bool
    attachment_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AiChatSessionSummary(BaseModel):
    session_id: str
    first_message: str
    message_count: int
    created_at: datetime
    model_used: Optional[str] = None


class FounderProfilePayload(BaseModel):
    founder_profile: str


class ChatTextRequest(BaseModel):
    user_query: str
    founder_profile: Optional[str] = None
    mode: Literal["production", "research"] = "production"


class ChatResponse(BaseModel):
    model: str
    mode: str
    advisory: Dict[str, Any]
    retrieved_chunks: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}
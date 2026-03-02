# Uruti Digital Ecosystem - Backend API

FastAPI backend for the Uruti Digital Ecosystem, a comprehensive AI-driven entrepreneurship and investment readiness platform for Rwanda.

## Features

- **User Management**: Authentication, registration, and profile management for founders, investors, mentors, and admins
- **Venture Management**: Create, update, and manage startup ventures with Uruti Score ranking
- **Messaging System**: Inbox/outbox functionality with file attachments
- **Bookmarks & Deal Flow**: Save and organize ventures for investors
- **Calendar & Meetings**: Schedule and manage meetings between founders, investors, and mentors
- **Notifications**: Real-time notification system
- **AI Advisory Tracks**: Track user progress through advisory modules (to be implemented with AI models)
- **Pitch Sessions**: Record and analyze pitch performances (to be implemented with AI models)

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Bcrypt
- **Validation**: Pydantic

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration and settings
│   ├── database.py          # Database connection and session
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic schemas for validation
│   ├── auth.py              # Authentication utilities
│   └── routers/             # API route handlers
│       ├── __init__.py
│       ├── auth.py          # Authentication endpoints
│       ├── users.py         # User management endpoints
│       ├── ventures.py      # Venture/startup endpoints
│       ├── messages.py      # Messaging endpoints
│       ├── bookmarks.py     # Bookmark/deal flow endpoints
│       ├── meetings.py      # Calendar/meeting endpoints
│       └── notifications.py # Notification endpoints
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Setup Instructions

### 1. Prerequisites

- Python 3.9+
- PostgreSQL 12+
- pip (Python package manager)

### 2. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 3. Create Database

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE uruti_db;

# Create user (optional)
CREATE USER uruti_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE uruti_db TO uruti_user;

# Exit
\q
```

### 4. Install Python Dependencies

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 5. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use any text editor
```

**Important:** Update the following in `.env`:
- `DATABASE_URL`: Your PostgreSQL connection string
- `SECRET_KEY`: Generate a secure secret key (min 32 characters)

**Generate a secure SECRET_KEY:**
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 6. Run Database Migrations

The application will automatically create tables on first run. Alternatively, you can use Alembic for migrations:

```bash
# Install Alembic (if not already installed)
pip install alembic

# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Run migration
alembic upgrade head
```

### 7. Start the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use Python directly
python -m app.main
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users/` - Get all users
- `GET /api/v1/users/{user_id}` - Get specific user
- `PUT /api/v1/users/me` - Update current user profile
- `DELETE /api/v1/users/me` - Delete current user
- `GET /api/v1/users/mentors/all` - Get all mentors
- `GET /api/v1/users/investors/all` - Get all investors

### Ventures
- `POST /api/v1/ventures/` - Create a new venture
- `GET /api/v1/ventures/` - Get all ventures (with filters)
- `GET /api/v1/ventures/my-ventures` - Get current user's ventures
- `GET /api/v1/ventures/{venture_id}` - Get specific venture
- `PUT /api/v1/ventures/{venture_id}` - Update venture
- `DELETE /api/v1/ventures/{venture_id}` - Delete venture
- `GET /api/v1/ventures/leaderboard/top` - Get top ventures by Uruti Score

### Messages
- `POST /api/v1/messages/` - Send a message
- `GET /api/v1/messages/inbox` - Get inbox messages
- `GET /api/v1/messages/sent` - Get sent messages
- `GET /api/v1/messages/{message_id}` - Get specific message
- `PUT /api/v1/messages/{message_id}/read` - Mark as read
- `PUT /api/v1/messages/{message_id}/archive` - Archive message
- `DELETE /api/v1/messages/{message_id}` - Delete message
- `GET /api/v1/messages/unread/count` - Get unread count

### Bookmarks (Deal Flow)
- `POST /api/v1/bookmarks/` - Create bookmark
- `GET /api/v1/bookmarks/` - Get user's bookmarks
- `GET /api/v1/bookmarks/{bookmark_id}` - Get specific bookmark
- `PUT /api/v1/bookmarks/{bookmark_id}` - Update bookmark
- `DELETE /api/v1/bookmarks/{bookmark_id}` - Delete bookmark
- `GET /api/v1/bookmarks/venture/{venture_id}/check` - Check bookmark status

### Meetings
- `POST /api/v1/meetings/` - Create meeting
- `GET /api/v1/meetings/` - Get user's meetings
- `GET /api/v1/meetings/{meeting_id}` - Get specific meeting
- `PUT /api/v1/meetings/{meeting_id}` - Update meeting
- `DELETE /api/v1/meetings/{meeting_id}` - Cancel meeting
- `GET /api/v1/meetings/calendar/upcoming` - Get upcoming meetings

### Notifications
- `GET /api/v1/notifications/` - Get notifications
- `GET /api/v1/notifications/{notification_id}` - Get specific notification
- `PUT /api/v1/notifications/{notification_id}/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/{notification_id}` - Delete notification
- `GET /api/v1/notifications/unread/count` - Get unread count

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Example using curl:**
```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "securepassword"}'

# Use token in subsequent requests
curl -X GET http://localhost:8000/api/v1/ventures/ \
  -H "Authorization: Bearer <your_token>"
```

## Database Models

### User
- Stores user information (founders, investors, mentors, admins)
- Includes profile, professional info, and settings

### Venture
- Startup/business venture information
- Includes business details, financials, Uruti Score
- Linked to founder (User)

### Message
- User-to-user messaging
- Supports attachments and threading

### Notification
- System notifications for users
- Various types: message, meeting, score update, etc.

### Bookmark
- Save ventures to deal flow
- Custom notes and tags

### Meeting
- Calendar events between users
- Video call/in-person meeting support

### MentorAvailability
- Mentor's weekly availability schedule

### AITrackProgress
- User progress through AI advisory tracks

### PitchSession
- Pitch practice recordings and AI analysis

## Development

### Run Tests
```bash
pytest
```

### Code Formatting
```bash
# Install black
pip install black

# Format code
black app/
```

### Type Checking
```bash
# Install mypy
pip install mypy

# Check types
mypy app/
```

## Production Deployment

### Using Gunicorn
```bash
pip install gunicorn

gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production
- Set strong `SECRET_KEY`
- Use production database URL
- Configure proper CORS origins
- Enable HTTPS
- Set appropriate `ACCESS_TOKEN_EXPIRE_MINUTES`

## Future Enhancements

- [ ] AI model integration for Uruti Score calculation
- [ ] Pitch performance analysis with AI
- [ ] Email notifications (SMTP integration)
- [ ] File upload handling for pitch decks, documents
- [ ] WebSocket support for real-time notifications
- [ ] Advanced search and filtering
- [ ] Analytics and reporting endpoints
- [ ] Rate limiting and security hardening
- [ ] Comprehensive test suite
- [ ] API versioning
- [ ] Database query optimization and indexing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

Proprietary - Uruti Digital Ecosystem

## Support

For issues and questions, contact: support@uruti.rw

# Uruti Platform Backend Setup & Quick Start

## Installation

1. **Install Python dependencies:**
```bash
cd backend
python3 -m pip install -r requirements.txt
```

2. **Environment variables** (`.env` already configured for local dev with SQLite):
```
PROJECT_NAME="Uruti Platform"
DATABASE_URL="sqlite+aiosqlite:///./dev.db"
SECRET_KEY="CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_IN_PRODUCTION"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

For **production**, switch to PostgreSQL:
```
DATABASE_URL="postgresql+asyncpg://user:password@host:5432/uruti_db"
```

## Running the Backend

```bash
cd backend
python3 main.py
```

Server starts on `http://0.0.0.0:8000`.

- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **Health Check:** http://localhost:8000/health

## Database Migrations (Alembic)

### Initialize Alembic (already done):
```bash
alembic init alembic
```

### Create Migration:
```bash
alembic revision --autogenerate -m "Add new tables"
```

### Apply Migration:
```bash
alembic upgrade head
```

### Downgrade:
```bash
alembic downgrade -1
```

## API Endpoints

### Authentication
- **POST** `/api/v1/auth/login/access-token` — Login with email/password (OAuth2 form)
- **POST** `/api/v1/auth/logout` — Revoke current access token

### Users
- **POST** `/api/v1/users/signup` — Create new user (role: founder|investor)
- **GET** `/api/v1/users/me` — Get current user profile
- **DELETE** `/api/v1/users/me` — Delete account
- **PATCH** `/api/v1/users/me/deactivate` — Deactivate account (soft)

### Messaging
- **POST** `/api/v1/messages/` — Send a message
- **GET** `/api/v1/messages/conversations/{user_id}` — Get conversation history
- **WebSocket** `/api/v1/messages/ws/{user_id}` — Real-time messaging (dev)

### Call Signaling (Developer)
- **POST** `/api/v1/calls/signal` — Post signal for another user
- **GET** `/api/v1/calls/signal/{user_id}` — Get queued signals

### Notifications
- **POST** `/api/v1/notifications/` — Create notification
- **GET** `/api/v1/notifications/user/{user_id}` — Get user notifications

### Dashboard
- **GET** `/api/v1/dashboard/me` — Get role-based dashboard (investor vs founder)

## Features Implemented

### 1. Authentication & Authorization
- ✅ Sign up (with role: founder|investor)
- ✅ Login (JWT + OAuth2)
- ✅ **Token Blacklist** — Logout revokes token via JWT ID (jti)
- ✅ Role-based access control (RBAC)

### 2. Account Management
- ✅ Delete account
- ✅ Deactivate account (soft delete)
- ✅ View profile

### 3. Messaging
- ✅ Send/receive messages
- ✅ Conversation history
- ✅ WebSocket endpoint for real-time messaging (dev)

### 4. Call Signaling
- ✅ In-memory signaling queue (dev)
- 🔄 Use WebSockets or pub/sub (Redis) for production

### 5. Notifications
- ✅ Create notifications
- ✅ Fetch user notifications

### 6. Dashboard
- ✅ Role-based views (investor vs founder)
- ✅ Example stats per role

### 7. STUN/TURN
- See [STUN-TURN.md](./STUN-TURN.md) for WebRTC media setup

## Development Notes

### Token Blacklist (Logout)
- Tokens include a `jti` (JWT ID) claim
- On logout, the `jti` is added to the `revoked_tokens` table
- All subsequent requests with that token are rejected

### WebSocket for Messaging
- Simple connection manager in [ws_manager.py](./ws_manager.py)
- Clients connect to `/api/v1/messages/ws/{user_id}`
- Send messages via WebSocket (dev only; use STOMP or AMQP in production)

### Signaling (WebRTC Calls)
- Current: in-memory queue (development only)
- Production: Use WebSockets or a pub/sub system (Redis, RabbitMQ)
- Implement STUN/TURN for NAT traversal

### Database
- **Dev:** SQLite (`sqlite+aiosqlite:///./dev.db`)
- **Prod:** PostgreSQL + Alembic migrations
- Tables auto-created on startup (dev). Use Alembic in production.

## Testing

### Test Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpass"
```

### Test Protected Endpoint
```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer <your_token>"
```

### Test Send Message
```bash
curl -X POST "http://localhost:8000/api/v1/messages/" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id": 2, "content": "Hi there!"}'
```

## Frontend Integration

The frontend should:
1. Call `/api/v1/users/signup` with `{ email, password, full_name, role }`
2. Call `/api/v1/auth/login/access-token` to get JWT token
3. Store token in localStorage/sessionStorage
4. Include `Authorization: Bearer <token>` in all requests
5. Use `/api/v1/messages/ws/{user_id}` for real-time messaging
6. Call `/api/v1/dashboard/me` to get role-based information
7. Call `/api/v1/auth/logout` on logout (then delete stored token)

## Production Checklist

- [ ] Switch to PostgreSQL
- [ ] Run `alembic upgrade head` to set up schema
- [ ] Set strong `SECRET_KEY` in `.env`
- [ ] Disable debug mode
- [ ] Set up WebSockets/pub-sub for messaging and signaling (not in-memory)
- [ ] Implement STUN/TURN servers for WebRTC
- [ ] Add rate limiting
- [ ] Set up proper CORS for production domain
- [ ] Use HTTPS only
- [ ] Implement proper token refresh and expiration
- [ ] Add proper error handling and logging

## Files & Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── api.py                  # Router setup
├── auth.py                 # Login/logout
├── users.py                # Signup/profile/delete/deactivate
├── messages.py             # Messaging + WebSocket
├── calls.py                # Call signaling (dev)
├── notifications.py        # Notifications
├── dashboard.py            # Role-based dashboard
├── user.py                 # User model
├── token_blacklist.py      # Revoked tokens model
├── ws_manager.py           # WebSocket connection manager
├── security.py             # JWT + password hashing
├── schemas.py              # Pydantic models
├── config.py               # Settings
├── session.py              # Database session
├── base.py                 # SQLAlchemy base
├── deps.py                 # Dependency injection (get_current_user)
├── alembic/                # Database migrations
│   ├── env.py
│   └── versions/
│       └── 0001_create_initial_tables.py
├── app/                    # Package shims (app.* imports)
└── requirements.txt        # Dependencies

```

## Troubleshooting

### `greenlet` error
Install: `python3 -m pip install greenlet`

### `aiosqlite` error
Install: `python3 -m pip install aiosqlite`

### Database connection error (Postgres)
Ensure PostgreSQL is running, or switch back to SQLite in `.env`:
```
DATABASE_URL="sqlite+aiosqlite:///./dev.db"
```

### CORS errors
Check `main.py` — `allow_origins` includes your frontend URL.

### Uvicorn reload loops
If using `python3 main.py` directly, reload is disabled. For hot reload, use:
```bash
uvicorn main:app --reload
```

## Next Steps

1. ✅ **Local Backend Running** — Start with the setup above
2. 🚀 **Frontend Integration** — Update frontend API calls to match endpoint paths
3. 🗣️ **WebSocket Integration** — Use `/api/v1/messages/ws/{user_id}` in frontend for real-time messaging
4. 📱 **Call Signaling** — Implement WebRTC peer connection + signaling on frontend
5. 🔐 **Production Deploy** — Set up PostgreSQL, Alembic migrations, proper secrets


# Uruti Digital Ecosystem

A comprehensive AI-driven entrepreneurship and investment readiness platform for Rwanda that bridges the gap between startup ideation and investment funding.

![Uruti Platform](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%2B%20FastAPI-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

## 🌟 Overview

The Uruti Digital Ecosystem is a full-stack application featuring:

- **Frontend**: React with TypeScript, Tailwind CSS v4, and Bio-Digital Fusion design system
- **Backend**: FastAPI with PostgreSQL, JWT authentication, and RESTful APIs
- **Design**: Liquidglass aesthetic with translucent panels and backdrop blur effects
- **AI Integration**: Advisory tracks, pitch coaching, and startup scoring
- **User Types**: Founders, Investors, and Admins

### Key Features

#### For Founders
- 🎯 **Founder Snapshot**: Comprehensive dashboard with venture metrics
- 🚀 **Startup Hub**: Create and manage ventures with AI-powered insights
- 🎤 **Pitch Coach**: AI-powered pitch practice with real-time feedback
- 📚 **Advisory Tracks**: Guided learning modules for entrepreneurship
- 📊 **Pitch Performance**: Track and analyze pitch presentations
- 🤝 **Build Connections**: Network with mentors and investors

#### For Investors
- 🔍 **Startup Discovery**: AI-ranked leaderboard with Uruti Score
- 💼 **Deal Flow Management**: Bookmark and organize investment opportunities
- 📈 **Investment Analytics**: Portfolio insights and sector distribution
- 🎯 **Smart Filtering**: Advanced search by stage, sector, and readiness band
- 📬 **Direct Messaging**: Communicate with founders

#### For Admins
- 🛠️ **Advisory Track Management**: CRUD operations for learning modules
- 📊 **Platform Analytics**: User and venture statistics
- 🔒 **Admin Access**: Secure `/admin` route protection

## 📁 Project Structure

```
uruti-digital-ecosystem/
├── frontend/                    # React frontend (this directory)
│   ├── components/              # React components
│   │   ├── modules/            # Feature modules
│   │   ├── ui/                 # Reusable UI components
│   │   ├── auth/               # Authentication pages
│   │   └── landing/            # Landing page components
│   ├── lib/                     # Utilities and contexts
│   │   ├── api-client.ts       # API client with all endpoints
│   │   ├── auth-context.tsx    # Authentication state management
│   │   ├── router-config.ts    # Route configuration
│   │   └── theme-context.tsx   # Dark/light theme management
│   ├── styles/                  # Global styles
│   │   └── globals.css         # Tailwind v4 + custom tokens
│   ├── App.tsx                  # Main application entry
│   └── package.json             # Frontend dependencies
│
├── backend/                     # FastAPI backend
│   ├── app/                     # Application code
│   │   ├── routers/            # API route handlers
│   │   ├── main.py             # FastAPI entry point
│   │   ├── models.py           # SQLAlchemy database models
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   ├── auth.py             # JWT authentication
│   │   ├── database.py         # Database connection
│   │   └── config.py           # Configuration settings
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example            # Environment variables template
│   └── README.md               # Backend documentation
│
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

**System Requirements:**
- Node.js 18+ and npm/yarn
- Python 3.9+
- PostgreSQL 12+

**Check if installed:**
```bash
node --version    # Should be 18+
python --version  # Should be 3.9+
psql --version    # Should be 12+
```

## 📦 Backend Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/) and run the installer.

### 2. Create Database

```bash
# Access PostgreSQL shell
sudo -u postgres psql

# Create database and user
CREATE DATABASE uruti_db;
CREATE USER uruti_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE uruti_db TO uruti_user;

# Exit
\q
```

### 3. Set Up Python Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use any text editor
```

**Required environment variables in `.env`:**
```env
# Database
DATABASE_URL=postgresql://uruti_user:your_secure_password@localhost:5432/uruti_db

# Security
SECRET_KEY=your-super-secret-key-min-32-characters-long
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS (for frontend)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

**Generate a secure SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Initialize Database Tables

The application automatically creates tables on first run. To verify:

```bash
# Start the backend server (see next section)
# Then check database:
psql -U uruti_user -d uruti_db -c "\dt"
```

### 5.5. Seed Database with Demo Accounts (Recommended)

Populate the database with 9 demo accounts so the platform doesn't look empty:

```bash
# Make sure you're in the backend directory with venv activated
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run seed script
python -m app.seed_data
```

**This creates:**
- 6 Founder accounts with ventures
- 3 Investor accounts

**All demo accounts use password: `DemoPass123!`**

### 🔑 Demo Account Credentials

**Founder Accounts:**
| Username | Password | Full Name | Company | Industry |
|----------|----------|-----------|---------|----------|
| `amahoro_tech` | `DemoPass123!` | Amahoro Uwase | Amahoro Tech | EdTech |
| `mucyo_ventures` | `DemoPass123!` | Mucyo Nkubito | AgriSmart Rwanda | AgriTech |
| `uwera_innovations` | `DemoPass123!` | Uwera Mutesi | MamaConnect | HealthTech |
| `neza_tech` | `DemoPass123!` | Neza Gasana | PayNeza | FinTech |
| `ubuzima_health` | `DemoPass123!` | Ubuzima Nkusi | TeleMed Rwanda | HealthTech |
| `urugendo_logistics` | `DemoPass123!` | Urugendo Hakizimana | SwiftDeliver | Logistics |

**Investor Accounts:**
| Username | Password | Full Name | Company | Investment Range |
|----------|----------|-----------|---------|------------------|
| `keza_invest` | `DemoPass123!` | Keza Mugisha | Keza Capital Partners | $50K - $500K |
| `imena_capital` | `DemoPass123!` | Imena Kalisa | Imena Capital | $100K - $1M |
| `izuba_energy` | `DemoPass123!` | Izuba Uwizeye | Green Ventures Africa | $75K - $750K |

**📝 Notes:**
- All emails follow format: `username@urutidemoacc.rw`
- Each founder has a complete venture profile with Uruti Score
- Use these accounts to test different user roles and features
- Login at: http://localhost:3000/login

See `/SEED_DATABASE_GUIDE.md` for full details on all demo accounts.

### 6. Start Backend Server

```bash
# Make sure you're in the backend directory with venv activated
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Start FastAPI server with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Alternative: Run with Python
python -m app.main
```

**Backend will be available at:**
- 🔗 API: http://localhost:8000
- 📚 Interactive Docs (Swagger): http://localhost:8000/docs
- 📖 Alternative Docs (ReDoc): http://localhost:8000/redoc

**Test the backend:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","message":"Uruti Digital Ecosystem API is running"}
```

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
# Navigate to project root (frontend directory)
cd ..  # if you're in backend directory

# Install Node.js dependencies
npm install
# or
yarn install
```

### 2. Configure Frontend Environment (Optional)

The frontend is pre-configured to connect to `http://localhost:8000`. 

If you need to change the API URL, update `/lib/api-client.ts`:

```typescript
// /lib/api-client.ts
private baseURL = 'http://your-backend-url:8000';
```

### 3. Start Frontend Development Server

```bash
# Start Vite dev server
npm run dev
# or
yarn dev
```

**Frontend will be available at:**
- 🌐 Application: http://localhost:3000

### 4. First-Time Setup

1. **Open the app**: Navigate to http://localhost:3000
2. **Create an account**: Click "Get Started" and follow the 3-step registration
   - Step 1: Choose role (Founder or Investor)
   - Step 2: Enter basic info (name, email, password)
   - Step 3: Complete profile (role-specific fields)
3. **Login**: Use your credentials to access the dashboard

## 🔄 Running Both Frontend & Backend Together

### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend:
```bash
# From project root
npm run dev
```

### Terminal 3 - Monitor (Optional):
```bash
# Watch backend logs
tail -f backend/logs/app.log

# Or monitor database
psql -U uruti_user -d uruti_db
```

## 🧪 Testing the Integration

### 1. Test Backend Health
```bash
curl http://localhost:8000/health
```

### 2. Test Registration
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testfounder",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "full_name": "Test Founder",
    "role": "founder"
  }'
```

### 3. Test Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testfounder",
    "password": "SecurePass123!"
  }'
```

### 4. Test Frontend
1. Open http://localhost:3000
2. Click "Get Started"
3. Register as a Founder
4. Complete profile setup
5. Explore dashboard features

## 🗄️ Database Schema

### Core Tables

**users**
- User accounts (founders, investors, mentors, admins)
- Profile information and authentication

**ventures**
- Startup/business ventures
- Linked to founders with Uruti Score

**messages**
- User-to-user messaging system
- Supports attachments and threading

**bookmarks**
- Investor's saved ventures (deal flow)
- Custom notes and tags

**meetings**
- Calendar events between users
- Video call and in-person support

**notifications**
- System notifications for users
- Various types: message, meeting, score update

**mentor_availability**
- Mentor's weekly availability schedule

**ai_track_progress**
- User progress through AI advisory modules

**pitch_sessions**
- Pitch recordings and AI analysis

## 🔐 Authentication Flow

### Registration
1. User submits registration form (3-step process)
2. Backend validates and hashes password
3. Creates user account in database
4. Returns success response

### Login
1. User submits credentials
2. Backend verifies password
3. Generates JWT access token
4. Frontend stores token in localStorage
5. Token included in all subsequent API requests

### Protected Routes
- All dashboard routes require authentication
- Admin routes require `role: "admin"`
- API client automatically includes JWT token in headers

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/logout` - Logout user

### User Endpoints
- `GET /api/v1/users/` - Get all users
- `PUT /api/v1/profile/` - Update profile
- `POST /api/v1/profile/avatar` - Upload avatar
- `POST /api/v1/profile/cover` - Upload cover image

### Venture Endpoints
- `POST /api/v1/ventures/` - Create venture
- `GET /api/v1/ventures/` - Get all ventures
- `GET /api/v1/ventures/my-ventures` - Get user's ventures
- `PUT /api/v1/ventures/{id}` - Update venture
- `DELETE /api/v1/ventures/{id}` - Delete venture

### Bookmark Endpoints
- `POST /api/v1/bookmarks/venture/{id}` - Bookmark venture
- `DELETE /api/v1/bookmarks/venture/{id}` - Remove bookmark
- `GET /api/v1/bookmarks/` - Get bookmarked ventures

### Message Endpoints
- `POST /api/v1/messages/` - Send message
- `GET /api/v1/messages/inbox` - Get inbox
- `GET /api/v1/messages/sent` - Get sent messages

**Full API documentation available at:**
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

## 🎨 Design System

### Colors
- **Primary Green**: `#76B947` - Bio-Digital Fusion accent
- **Black**: `#000000` - Primary brand color
- **White**: `#FFFFFF` - Secondary color

### Typography
- **Headings**: Inter Tight (font-heading)
- **Body**: Century Gothic (font-body)

### Liquidglass Aesthetic
- Translucent panels with backdrop blur
- Glass-card components with border-black/5
- Smooth hover transitions
- Professional gradient overlays

### Tailwind v4
Uses CSS variables and modern tokens:
```css
@import "tailwindcss";
--font-heading: 'Inter Tight', sans-serif;
--font-body: 'Century Gothic', sans-serif;
```

## 🔧 Troubleshooting

### Backend Issues

**Database Connection Error:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# or
brew services list

# Verify database exists
psql -U postgres -c "\l" | grep uruti_db

# Test connection
psql -U uruti_user -d uruti_db
```

**Port 8000 Already in Use:**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9
# keep backend on port 8000 (recommended)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Module Import Errors:**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Frontend Issues

**Port 3000 Already in Use:**
```bash
# Kill process
lsof -ti:3000 | xargs kill -9
# or Vite will auto-increment port
```

**API Connection Failed:**
- Verify backend is running: http://localhost:8000/health
- Check CORS settings in backend `.env`
- Inspect browser console for errors
- Verify API client baseURL in `/lib/api-client.ts`

**Build Errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors:**
```bash
# Rebuild types
npm run build
```

## 📱 User Roles & Access

### Founder
✅ Founder Snapshot Dashboard
✅ Startup Hub (create/manage ventures)
✅ Pitch Performance tracking
✅ Advisory Tracks
✅ Pitch Coach
✅ Profile Management
✅ AI Chat
✅ Build Connections (mentors)
✅ Calendar & Meetings
✅ Messages
❌ Investor Dashboard
❌ Startup Discovery
❌ Deal Flow
❌ Admin routes

### Investor
✅ Investor Dashboard
✅ Startup Discovery (leaderboard)
✅ Deal Flow Management
✅ Profile Management
✅ Messages
✅ Calendar & Meetings
✅ AI Chat
✅ Build Connections
❌ Founder Dashboard
❌ Startup Hub
❌ Pitch Coach
❌ Advisory Tracks
❌ Admin routes

### Admin
✅ All Investor features
✅ Admin Dashboard
✅ Advisory Track Management (CRUD)
✅ User management
✅ Platform analytics
✅ Access via `/admin` route

## 🚢 Production Deployment

### Backend Deployment

**Using Gunicorn:**
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Using Docker:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Environment Variables:**
```env
DEBUG=False
SECRET_KEY=<strong-production-key>
DATABASE_URL=<production-database-url>
CORS_ORIGINS=["https://yourdomain.com"]
```

### Frontend Deployment

**Build for production:**
```bash
npm run build
# Output in /dist folder
```

**Deploy to:**
- Vercel: `vercel deploy`
- Netlify: `netlify deploy --prod`
- Static hosting: Upload `/dist` folder

**Update API URL:**
Change `baseURL` in `/lib/api-client.ts` to production backend URL.

## 🛣️ Roadmap

### Completed ✅
- Full authentication system
- Founder & Investor dashboards
- Startup Hub with venture management
- Pitch Coach with AI feedback
- Advisory Tracks with progress tracking
- Real backend integration (no dummy data)
- Profile management with image uploads
- Messaging system
- Bookmark/Deal Flow
- Calendar & Meetings

### In Progress 🚧
- AI model integration for Uruti Score calculation
- Pitch performance AI analysis
- Email notifications

### Planned 📋
- WebSocket for real-time notifications
- Advanced analytics dashboard
- Mobile responsive optimization
- Payment integration (Stripe/Flutterwave)
- Document uploads (pitch decks, legal docs)
- Video call integration
- Multi-language support (Kinyarwanda, French, English)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- **Frontend**: ESLint + Prettier
- **Backend**: Black + Flake8
- **TypeScript**: Strict mode enabled
- **Python**: PEP 8 compliance

## 📄 License

Proprietary - Uruti Digital Ecosystem © 2024

## 💬 Support

- **Email**: support@uruti.rw
- **Documentation**: http://localhost:8000/docs
- **Issues**: GitHub Issues

## 🙏 Acknowledgments

- **Design System**: Bio-Digital Fusion branding
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Framework**: React + FastAPI
- **Database**: PostgreSQL

---

**Built with ❤️ for Rwanda's entrepreneurship ecosystem**

🌍 Empowering founders, connecting investors, building the future.
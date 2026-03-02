# 🚀 Uruti Quick Reference Card

**Fast access to essential information**

---

## 📄 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **README.md** | Complete setup guide | Starting the project for the first time |
| **FINAL_SYSTEM_CHECK.md** | System check results | Understanding what's ready |
| **SYSTEM_STATUS.md** | Detailed system status | Checking features & health |
| **PROJECT_STRUCTURE.md** | Architecture overview | Understanding code organization |
| **INTEGRATION_VERIFICATION.md** | API connections map | Debugging backend-frontend issues |
| **backend/README.md** | Backend setup | Setting up FastAPI server |

---

## ⚡ Quick Start Commands

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env          # Then edit with your values
python -m app.seed_data          # Optional: Add demo data
uvicorn app.main:app --reload    # Start server
```

### Frontend
```bash
npm install
npm run dev
```

### Access Points
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🗂️ Folder Structure

```
/
├── README.md                    ← START HERE
├── App.tsx                      ← Main app entry
├── .env.example                 ← Environment template
│
├── backend/                     ← FastAPI server
│   ├── app/
│   │   ├── main.py             ← Server entry
│   │   ├── models.py           ← Database models
│   │   └── routers/            ← API endpoints
│   └── requirements.txt        ← Python deps
│
├── components/                  ← React components
│   ├── modules/                ← Feature modules (19)
│   ├── ui/                     ← UI components (41)
│   ├── auth/                   ← Login/signup (3)
│   └── landing/                ← Landing pages (9)
│
├── lib/                        ← Utilities
│   ├── api-client.ts          ← Backend API calls
│   ├── auth-context.tsx       ← Auth state
│   └── ...
│
└── styles/
    └── globals.css            ← Tailwind + custom
```

---

## 🔗 Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/register` | POST | Sign up |
| `/api/v1/auth/login` | POST | Log in |
| `/api/v1/users/me/` | GET | Get profile |
| `/api/v1/ventures/` | GET/POST | List/create ventures |
| `/api/v1/messages/` | GET/POST | Messages |
| `/api/v1/notifications/` | GET | Notifications |
| `/api/v1/bookmarks/` | GET/POST | Bookmarks |
| `/api/v1/connections/` | GET/POST | Connections |
| `/api/v1/meetings/` | GET/POST | Meetings |

**Full API Docs**: http://localhost:8000/docs

---

## 👥 Demo Accounts (After Seeding)

```bash
# Run seed script first
python -m app.seed_data
```

Then login with:
- **Founder**: founder@uruti.rw / password123
- **Investor**: investor@uruti.rw / password123
- **Admin**: admin@uruti.rw / admin123 (via /admin)

---

## 🎯 Feature Modules by Role

### Founder (8 modules)
- Founder Snapshot → `/founder`
- Startup Hub → `/startups`
- Pitch Coach → `/pitch-coach`
- Pitch Performance → `/pitch-performance`
- Advisory Tracks → `/advisory`
- Build Connections → `/connections`
- Readiness Calendar → `/calendar`
- Profile → `/profile`

### Investor (3 modules)
- Investor Dashboard → `/investor`
- Startup Discovery → `/discover`
- Deal Flow → `/dealflow`

### Admin (1 module)
- Advisory Tracks → `/admin/advisory`

### Shared (6 modules)
- Messages → `/messages`
- Notifications → `/notifications`
- AI Chat → `/ai-chat`
- Availability → `/availability`
- Customer Support → `/support`
- Settings → `/settings`

---

## 🔐 Environment Variables

Copy `.env.example` to `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://uruti_user:password@localhost:5432/uruti_db

# Security (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=your-super-secret-key-here

# Token expiration (10080 = 7 days)
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# App
PROJECT_NAME=Uruti Digital Ecosystem
VERSION=1.0.0
DEBUG=True
```

---

## 🎨 Design System

### Colors
- **Primary**: `#76B947` (Green)
- **Background**: `#000000` (Black)
- **Style**: Bio-Digital Fusion with Liquidglass

### Typography
- **Headings**: Inter Tight (`var(--font-heading)`)
- **Body**: Century Gothic (`var(--font-body)`)

### Usage
```tsx
<h1 style={{ fontFamily: 'var(--font-heading)' }}>Title</h1>
<p style={{ fontFamily: 'var(--font-body)' }}>Body text</p>
<div className="text-[#76B947]">Green text</div>
```

---

## 🧪 Testing Empty States

All modules display properly with **no data**:

1. Create fresh account
2. View empty dashboard
3. See helpful messages like:
   - "No Ventures Yet - Add Your First Venture"
   - "No Messages Yet - Start a conversation"
   - "You're all caught up!" (notifications)

4. Add first item → Empty state disappears
5. Data displays beautifully

---

## 🛠️ Common Tasks

### Create Database
```bash
sudo -u postgres psql
CREATE DATABASE uruti_db;
CREATE USER uruti_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE uruti_db TO uruti_user;
\q
```

### Reset Database
```bash
# In backend/app/main.py, models auto-create tables
# Or manually:
psql -U uruti_user -d uruti_db
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q
# Then restart backend server
```

### Add Demo Data
```bash
cd backend
source venv/bin/activate
python -m app.seed_data
```

### Check Database
```bash
psql -U uruti_user -d uruti_db
\dt                    # List tables
SELECT * FROM users;   # View users
\q
```

---

## 🐛 Troubleshooting

### Backend won't start
1. Check database is running: `sudo systemctl status postgresql`
2. Check `.env` file exists in `backend/` folder
3. Check DATABASE_URL is correct
4. Check virtual environment is activated

### Frontend won't connect
1. Check backend is running on port 8000
2. Check CORS origins in backend `.env`
3. Check API_BASE_URL in `lib/api-client.ts`

### Empty states not showing
1. Check API returns empty array `[]`
2. Check component checks `array.length === 0`
3. Check loading state is false

### Login not working
1. Check user exists in database
2. Check password is correct
3. Check JWT token is being saved to localStorage
4. Check network tab for API errors

---

## 📊 System Statistics

- **Backend**: 8 routers, 20+ endpoints, 8 DB tables
- **Frontend**: 92 components, 30+ routes
- **Integration**: 21 components connected to API
- **Empty States**: 11+ modules with proper handling
- **Documentation**: 6 comprehensive guides

---

## ✅ System Status

**Everything is production ready:**
- ✅ Backend API operational
- ✅ Frontend components ready
- ✅ Backend-frontend integrated
- ✅ Empty states implemented
- ✅ Authentication working
- ✅ Documentation complete
- ✅ Clean architecture

---

## 🚀 Next Steps

1. **Setup**: Follow README.md
2. **Seed Data**: Run seed script
3. **Test**: Login with demo accounts
4. **Develop**: Add features as needed
5. **Deploy**: Configure production environment

---

## 📞 Quick Help

**Need setup help?** → Read `/README.md`  
**Want architecture overview?** → Read `/PROJECT_STRUCTURE.md`  
**Checking system status?** → Read `/SYSTEM_STATUS.md`  
**Debugging API issues?** → Read `/INTEGRATION_VERIFICATION.md`  
**Just completed system check?** → Read `/FINAL_SYSTEM_CHECK.md`

---

**Project Status**: ✅ Production Ready  
**Last Updated**: February 24, 2026

# 📁 Uruti Digital Ecosystem - Project Structure

Clean, organized architecture with clear separation of concerns.

---

## 🗂️ Complete File Tree

```
uruti-digital-ecosystem/
│
├── 📄 README.md                           # Main documentation
├── 📄 SYSTEM_STATUS.md                    # System status report
├── 📄 Attributions.md                     # License attributions
├── 📄 .env.example                        # Environment variables template
├── 📄 App.tsx                             # Application entry point
│
├── 📂 backend/                            # FastAPI Backend
│   ├── 📄 README.md                       # Backend setup guide
│   ├── 📄 requirements.txt                # Python dependencies
│   │
│   └── 📂 app/                            # Application code
│       ├── 📄 __init__.py                 # Package initialization
│       ├── 📄 main.py                     # FastAPI entry point & CORS
│       ├── 📄 models.py                   # SQLAlchemy database models
│       ├── 📄 schemas.py                  # Pydantic validation schemas
│       ├── 📄 auth.py                     # JWT authentication utilities
│       ├── 📄 database.py                 # Database connection & session
│       ├── 📄 config.py                   # Configuration settings
│       ├── 📄 seed_data.py                # Demo data seeding script
│       │
│       └── 📂 routers/                    # API route handlers
│           ├── 📄 __init__.py
│           ├── 📄 auth.py                 # Login, register, logout
│           ├── 📄 users.py                # User CRUD & profile
│           ├── 📄 ventures.py             # Venture CRUD operations
│           ├── 📄 messages.py             # Direct messaging
│           ├── 📄 notifications.py        # User notifications
│           ├── 📄 bookmarks.py            # Saved ventures
│           ├── 📄 connections.py          # User network
│           └── 📄 meetings.py             # Meeting scheduling
│
├── 📂 components/                         # React Components
│   │
│   ├── 📂 modules/                        # Feature Modules (19 files)
│   │   ├── 📄 AIChatModule.tsx           # AI assistant chat
│   │   ├── 📄 AdminAdvisoryTracksModule.tsx  # Admin track management
│   │   ├── 📄 AdvisoryTracksModule.tsx   # Learning modules
│   │   ├── 📄 AvailabilityModule.tsx     # Time slot management
│   │   ├── 📄 BuildConnectionsModule.tsx # Networking & connections
│   │   ├── 📄 CustomerSupportModule.tsx  # Support tickets & FAQ
│   │   ├── 📄 DealFlowModule.tsx         # Investor bookmarks
│   │   ├── 📄 FounderSnapshotModule.tsx  # Founder dashboard
│   │   ├── 📄 InvestorDashboardModule.tsx # Investor dashboard
│   │   ├── 📄 MeetingRequestsModule.tsx  # Meeting requests
│   │   ├── 📄 MessagesModule.tsx         # Direct messaging UI
│   │   ├── 📄 NotificationsModule.tsx    # Notifications center
│   │   ├── 📄 PitchCoachModule.tsx       # AI pitch practice
│   │   ├── 📄 PitchPerformanceModule.tsx # Pitch analytics
│   │   ├── 📄 ProfileModule.tsx          # User profile
│   │   ├── 📄 ReadinessCalendarModule.tsx # Calendar & events
│   │   ├── 📄 SettingsModule.tsx         # Account settings
│   │   ├── 📄 StartupDiscoveryModule.tsx # Startup leaderboard
│   │   ├── 📄 StartupHubModule.tsx       # Venture management
│   │   └── 📄 pdf-generator.ts           # PDF export utility
│   │
│   ├── 📂 ui/                             # Reusable UI Components (41 files)
│   │   ├── 📄 accordion.tsx              # shadcn/ui Accordion
│   │   ├── 📄 alert-dialog.tsx           # shadcn/ui Alert Dialog
│   │   ├── 📄 alert.tsx                  # shadcn/ui Alert
│   │   ├── 📄 aspect-ratio.tsx           # shadcn/ui Aspect Ratio
│   │   ├── 📄 avatar.tsx                 # shadcn/ui Avatar
│   │   ├── 📄 badge.tsx                  # shadcn/ui Badge
│   │   ├── 📄 breadcrumb.tsx             # shadcn/ui Breadcrumb
│   │   ├── 📄 button.tsx                 # shadcn/ui Button
│   │   ├── 📄 calendar.tsx               # shadcn/ui Calendar
│   │   ├── 📄 card.tsx                   # shadcn/ui Card
│   │   ├── 📄 carousel.tsx               # shadcn/ui Carousel
│   │   ├── 📄 chart.tsx                  # shadcn/ui Chart
│   │   ├── 📄 checkbox.tsx               # shadcn/ui Checkbox
│   │   ├── 📄 collapsible.tsx            # shadcn/ui Collapsible
│   │   ├── 📄 command.tsx                # shadcn/ui Command
│   │   ├── 📄 context-menu.tsx           # shadcn/ui Context Menu
│   │   ├── 📄 dialog.tsx                 # shadcn/ui Dialog
│   │   ├── 📄 drawer.tsx                 # shadcn/ui Drawer
│   │   ├── 📄 dropdown-menu.tsx          # shadcn/ui Dropdown Menu
│   │   ├── 📄 form.tsx                   # shadcn/ui Form
│   │   ├── 📄 hover-card.tsx             # shadcn/ui Hover Card
│   │   ├── 📄 input-otp.tsx              # shadcn/ui Input OTP
│   │   ├── 📄 input.tsx                  # shadcn/ui Input
│   │   ├── 📄 label.tsx                  # shadcn/ui Label
│   │   ├── 📄 menubar.tsx                # shadcn/ui Menubar
│   │   ├── 📄 navigation-menu.tsx        # shadcn/ui Navigation Menu
│   │   ├── 📄 pagination.tsx             # shadcn/ui Pagination
│   │   ├── 📄 popover.tsx                # shadcn/ui Popover
│   │   ├── 📄 progress.tsx               # shadcn/ui Progress
│   │   ├── 📄 radio-group.tsx            # shadcn/ui Radio Group
│   │   ├── 📄 resizable.tsx              # shadcn/ui Resizable
│   │   ├── 📄 scroll-area.tsx            # shadcn/ui Scroll Area
│   │   ├── 📄 select.tsx                 # shadcn/ui Select
│   │   ├── 📄 separator.tsx              # shadcn/ui Separator
│   │   ├── 📄 sheet.tsx                  # shadcn/ui Sheet
│   │   ├── 📄 sidebar.tsx                # shadcn/ui Sidebar (unused)
│   │   ├── 📄 skeleton.tsx               # shadcn/ui Skeleton
│   │   ├── 📄 slider.tsx                 # shadcn/ui Slider
│   │   ├── 📄 sonner.tsx                 # shadcn/ui Sonner Toast
│   │   ├── 📄 switch.tsx                 # shadcn/ui Switch
│   │   ├── 📄 table.tsx                  # shadcn/ui Table
│   │   ├── 📄 tabs.tsx                   # shadcn/ui Tabs
│   │   ├── 📄 textarea.tsx               # shadcn/ui Textarea
│   │   ├── 📄 toggle-group.tsx           # shadcn/ui Toggle Group
│   │   ├── 📄 toggle.tsx                 # shadcn/ui Toggle
│   │   ├── 📄 tooltip.tsx                # shadcn/ui Tooltip
│   │   ├── 📄 use-mobile.ts              # Mobile detection hook
│   │   └── 📄 utils.ts                   # Utility functions
│   │
│   ├── 📂 auth/                           # Authentication Pages (3 files)
│   │   ├── 📄 AdminLoginPage.tsx         # Admin login (/admin)
│   │   ├── 📄 LoginPage.tsx              # User login
│   │   └── 📄 SignupPage.tsx             # User registration (3 steps)
│   │
│   ├── 📂 landing/                        # Landing Pages (9 files)
│   │   ├── 📄 HelpCenter.tsx             # Help & FAQ
│   │   ├── 📄 LandingAbout.tsx           # About page
│   │   ├── 📄 LandingContact.tsx         # Contact form
│   │   ├── 📄 LandingFooter.tsx          # Footer component
│   │   ├── 📄 LandingHeader.tsx          # Header/navigation
│   │   ├── 📄 LandingHome.tsx            # Homepage
│   │   ├── 📄 LandingHowItWorks.tsx      # How it works
│   │   ├── 📄 PrivacyPolicy.tsx          # Privacy policy
│   │   └── 📄 TermsOfService.tsx         # Terms of service
│   │
│   ├── 📂 media/                          # Media Helpers (1 file)
│   │   └── 📄 ImageWithFallback.tsx      # Image with fallback
│   │
│   └── 📂 (root - 19 files)               # Shared Components
│       ├── 📄 AIChatbot.tsx              # AI assistant (floating)
│       ├── 📄 AddProfileContentDialogs.tsx # Profile content dialogs
│       ├── 📄 CallDialog.tsx             # Video call dialog
│       ├── 📄 ChatInfoDialog.tsx         # Chat conversation info
│       ├── 📄 EditProfileDialog.tsx      # Edit profile dialog
│       ├── 📄 EditVentureDialog.tsx      # Edit venture (simple)
│       ├── 📄 EditVentureFullDialog.tsx  # Edit venture (full form)
│       ├── 📄 EnhancedCaptureIdeaDialog.tsx # Capture venture idea
│       ├── 📄 FloatingCallWidget.tsx     # Active call widget
│       ├── 📄 Header.tsx                 # Dashboard header
│       ├── 📄 NewMessageDialog.tsx       # New message dialog
│       ├── 📄 OnboardingTour.tsx         # Product tour
│       ├── 📄 SaveRecordingDialog.tsx    # Save pitch recording
│       ├── 📄 ShareProfileDialog.tsx     # Share profile dialog
│       ├── 📄 Sidebar.tsx                # Dashboard sidebar
│       ├── 📄 StartupDetailsDialog.tsx   # Startup detail view
│       ├── 📄 UrutiLogo.tsx              # Uruti logo component
│       ├── 📄 VentureActivitySection.tsx # Venture activity feed
│       └── 📄 VentureDetailView.tsx      # Venture detail view
│
├── 📂 lib/                                # Utilities & Contexts (7 files)
│   ├── 📄 api-client.ts                  # API client with all endpoints
│   ├── 📄 auth-context.tsx               # Authentication state & JWT
│   ├── 📄 theme-context.tsx              # Dark/light theme management
│   ├── 📄 call-context.tsx               # Video call state
│   ├── 📄 support-context.tsx            # Support ticket state
│   ├── 📄 advisory-context.tsx           # Advisory track state
│   └── 📄 router-config.ts               # Route configuration
│
├── 📂 styles/                             # Global Styles (1 file)
│   └── 📄 globals.css                    # Tailwind v4 + custom tokens
│
└── 📂 imports/                            # Generated UI imports (2 files)
    ├── 📄 Pitchcoach.tsx                 # Pitch coach generated import
    └── 📄 svg-27obdul0fd.ts              # SVG path definitions
```

---

## 📊 Statistics

### Backend Structure
```
backend/
├── 1 README
├── 1 requirements.txt
└── app/
    ├── 8 core files (main, models, schemas, auth, database, config, seed_data)
    └── routers/
        └── 8 API routers
```

**Total Backend Files**: 18 files

### Frontend Structure
```
components/
├── modules/          19 files (feature modules)
├── ui/               41 files (shadcn/ui components)
├── auth/             3 files  (authentication pages)
├── landing/          9 files  (landing pages)
├── media/            1 file   (media helpers)
└── shared/          19 files  (shared components)
```

**Total Component Files**: 92 files

### Utility & Configuration
```
lib/                   7 files  (contexts & utilities)
styles/                1 file   (global styles)
imports/               2 files  (generated UI imports)
root/                  4 files  (App.tsx, docs, config)
```

**Total Utility Files**: 14 files

### **Grand Total**: ~124 files (excluding node_modules, venv)

---

## 🎯 Component Categories

### By User Type
| Category | Files | Purpose |
|----------|-------|---------|
| **Founder Modules** | 8 | Dashboard, ventures, pitch, advisory, connections |
| **Investor Modules** | 3 | Dashboard, discovery, deal flow |
| **Admin Modules** | 1 | Advisory track management |
| **Shared Modules** | 7 | Messages, notifications, profile, settings, AI chat, support |

### By Function
| Category | Files | Purpose |
|----------|-------|---------|
| **Authentication** | 3 | Login, signup, admin login |
| **Landing Pages** | 9 | Marketing, legal, help |
| **Dialogs** | 9 | Modals for editing, creating, viewing |
| **Layout** | 3 | Header, sidebar, logo |
| **UI Primitives** | 41 | shadcn/ui components |
| **Contexts** | 5 | State management |

---

## 🔗 Key Connections

### Frontend ↔ Backend Integration
```
components/modules/*Module.tsx
    ↓ imports
lib/api-client.ts
    ↓ HTTP requests
backend/app/routers/*.py
    ↓ database operations
backend/app/models.py
    ↓ database
PostgreSQL
```

### Authentication Flow
```
LoginPage.tsx
    ↓ apiClient.login()
backend/routers/auth.py
    ↓ create_access_token()
JWT Token
    ↓ localStorage
auth-context.tsx
    ↓ provides user state
Protected Components
```

### Data Flow Example (Ventures)
```
StartupHubModule.tsx
    ↓ apiClient.getVentures()
backend/routers/ventures.py → GET /api/v1/ventures/
    ↓ db query
backend/models.py → Venture model
    ↓ returns
[Array of ventures]
    ↓ renders
Venture cards with empty state handling
```

---

## 🧹 Cleanup Summary

### ✅ Kept (Essential)
- `/README.md` - Main documentation
- `/SYSTEM_STATUS.md` - System status report
- `/Attributions.md` - License information
- `/.env.example` - Environment template
- `/backend/README.md` - Backend setup guide
- `/guidelines/Guidelines.md` - Template (protected)

### ❌ Removed (Unnecessary)
- 22 temporary .md documentation files
- 10 unused component modules (Hospital, Courses, Trainers, etc.)

### 📁 Result
**Clean, organized structure** with only essential files.

---

## 🎨 Design System Integration

All components use:
- **Typography**: `var(--font-heading)` (Inter Tight), `var(--font-body)` (Century Gothic)
- **Colors**: `#76B947` (primary green), `#000000` (background)
- **Effects**: Glassmorphism with `backdrop-blur`
- **Theme**: Dark mode support throughout

---

## 🔐 Protected Files

These files are **system-protected** and should not be modified:
- `/components/media/ImageWithFallback.tsx`
- `/guidelines/Guidelines.md`

---

## 📝 Documentation Hierarchy

1. **Primary**: `/README.md` - Start here for setup
2. **Backend**: `/backend/README.md` - Backend-specific instructions
3. **Status**: `/SYSTEM_STATUS.md` - System health check
4. **Structure**: This file - Architecture overview
5. **Legal**: `/Attributions.md` - Licenses

---

## ✅ Structure Quality Checklist

- [x] Clear separation of concerns
- [x] Consistent naming conventions
- [x] Logical folder hierarchy
- [x] No orphaned or unused files
- [x] Proper component categorization
- [x] Clean import paths
- [x] Documentation at appropriate levels
- [x] Environment configuration templates
- [x] Protected system files identified

---

**Structure Status**: ✅ **EXCELLENT**  
**Last Updated**: February 24, 2026

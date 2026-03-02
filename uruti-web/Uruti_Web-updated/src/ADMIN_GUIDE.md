# 🔐 Admin Access Guide - Quick Reference

**Last Updated**: February 24, 2026

---

## 🚀 Quick Access

### Admin Credentials
```
Email:    dniyonshuti@nexventures.net
Password: Uruti@January2026.
```

### Access URLs
```
Development:  http://localhost:5173/admin
Production:   https://uruti.rw/admin  (when deployed)
```

---

## 📋 Admin Dashboard Features

### 1. Overview Tab
**What You See:**
- Total users on platform
- Founders vs. investors breakdown
- Total registered ventures
- AI interaction count (coming soon)
- Support ticket status

**Quick Stats:**
```
┌──────────────────────────────────┐
│ 👥 11 Total Users                │
│ 🚀 6 Founders                    │
│ 💼 3 Investors                   │
│ 🏢 6 Ventures                    │
│ 💬 0 Support Tickets             │
└──────────────────────────────────┘
```

---

### 2. Users Tab
**Features:**
- View all platform users
- Search by name or email
- See user roles and details
- Add new users (click "Add User")
- Manage user accounts

**Actions:**
- Click "Manage" to edit user details
- Search bar for quick filtering
- Role badges show user type

---

### 3. Ventures Tab
**Features:**
- View all registered startups
- See Uruti Scores (leaderboard)
- Search by name or industry
- Monitor funding goals
- Track venture stages

**Leaderboard:**
- Sorted by highest Uruti Score
- Shows industry and stage
- Displays team size and funding goals

---

### 4. Support Tab
**Features:**
- View all support tickets
- Open vs. closed status
- Respond to user messages
- Close resolved tickets

**Actions:**
1. Click "Respond" to reply to ticket
2. Enter your response in the prompt
3. Click "Close" when resolved

---

### 5. Advisory Tracks
**Access:** Click "Advisory Tracks" in sidebar

**Features:**
- Create new advisory tracks
- Edit existing content
- Delete tracks
- Add learning materials
- Organize modules

---

## 🔑 Admin Login Flow

### Step-by-Step:
```
1. Visit: /admin URL
   ↓
2. Enter admin credentials
   ↓
3. Click "Sign In"
   ↓
4. Redirected to Admin Dashboard
```

### First Time Setup:
```bash
# Run seed script to create admin account
cd backend
source venv/bin/activate
python -m app.seed_data

# Output shows:
🔐 Creating admin account...
✅ Admin account created: dniyonshuti@nexventures.net
   Password: Uruti@January2026.
```

---

## 📊 How to Monitor Platform

### Daily Tasks:
1. **Check Statistics**
   - Review user growth
   - Monitor venture registrations
   - Track support tickets

2. **Review Support**
   - Respond to open tickets
   - Close resolved issues
   - Track response times

3. **Monitor Ventures**
   - Check new startups
   - Review Uruti Scores
   - Identify top performers

4. **User Management**
   - Review new registrations
   - Verify user roles
   - Handle account issues

---

## 🎯 Common Admin Tasks

### Add New User
```
1. Go to "Users" tab
2. Click "Add User" button
3. Fill in user details
4. Select role (founder/investor)
5. Click "Create"
```

### Respond to Support Ticket
```
1. Go to "Support" tab
2. Find open ticket
3. Click "Respond"
4. Type your response
5. Click "Send"
6. Close ticket when resolved
```

### Manage Advisory Content
```
1. Click "Advisory Tracks" in sidebar
2. Click "Create New Track"
3. Enter track details
4. Add materials
5. Save and publish
```

### View Leaderboard
```
1. Go to "Ventures" tab
2. Ventures automatically sorted by Uruti Score
3. Top performers appear first
4. Click venture for details
```

---

## 🔒 Security Notes

### Admin Access:
- **Never share** admin credentials
- Admin account cannot register via signup
- Only accessible via `/admin` route
- Credentials hardcoded in backend

### Password Policy:
- Current password: `Uruti@January2026.`
- Change in production environment
- Update `seed_data.py` to change

---

## 🚨 Troubleshooting

### Can't Login?
```
✓ Check you're on /admin URL (not regular login)
✓ Verify credentials are exact (case-sensitive)
✓ Ensure seed script was run
✓ Check backend is running
```

### Don't See Data?
```
✓ Run seed script: python -m app.seed_data
✓ Verify database connection
✓ Check backend logs for errors
✓ Refresh the page
```

### Support Tab Empty?
```
ℹ️ No support messages yet
✓ Wait for users to send tickets
✓ Test by using customer support module
```

---

## 📞 Quick Commands

### Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Start Frontend
```bash
npm run dev
```

### Seed Database (includes admin)
```bash
cd backend
python -m app.seed_data
```

### Check Admin Account
```bash
# In PostgreSQL
psql -U uruti_user -d uruti_db
SELECT * FROM users WHERE role = 'admin';
```

---

## 🎯 Admin Capabilities Summary

| Feature | Status | Location |
|---------|--------|----------|
| View All Users | ✅ Ready | Users Tab |
| Search Users | ✅ Ready | Users Tab |
| Add Users | ✅ UI Ready | Users Tab |
| View Ventures | ✅ Ready | Ventures Tab |
| Leaderboard | ✅ Ready | Ventures Tab (sorted) |
| Support Tickets | ✅ Ready | Support Tab |
| Respond to Tickets | ✅ Ready | Support Tab |
| Advisory Tracks | ✅ Ready | Sidebar |
| Platform Stats | ✅ Ready | Overview Tab |

---

## 📈 Statistics Tracked

### Current:
- ✅ Total users
- ✅ Founders count
- ✅ Investors count
- ✅ Total ventures
- ✅ Support tickets

### Coming Soon:
- ⏳ AI prompts per user
- ⏳ Upload statistics
- ⏳ User activity metrics

---

## 🎓 Best Practices

### For User Management:
1. Verify user information before approval
2. Monitor for duplicate accounts
3. Keep roles accurately assigned
4. Respond to support within 24 hours

### For Venture Oversight:
1. Review new ventures regularly
2. Monitor Uruti Score trends
3. Identify top performers
4. Support struggling startups

### For Support:
1. Respond quickly to open tickets
2. Be professional and helpful
3. Close tickets when resolved
4. Track common issues

---

## ✅ Admin Checklist

### Daily:
- [ ] Check support tickets
- [ ] Review new user registrations
- [ ] Monitor new ventures

### Weekly:
- [ ] Review platform statistics
- [ ] Update advisory content
- [ ] Analyze growth trends

### Monthly:
- [ ] Generate reports
- [ ] Review user feedback
- [ ] Plan platform improvements

---

## 📞 Support

For technical issues with the admin panel:
- Check backend logs: `backend/logs/`
- Review database: `psql -U uruti_user -d uruti_db`
- Restart services if needed

---

**Admin**: David Niyonshuti  
**Email**: dniyonshuti@nexventures.net  
**Platform**: Uruti Digital Ecosystem  
**Version**: 1.0.0

---

**Status**: ✅ **ADMIN PANEL ACTIVE AND READY**

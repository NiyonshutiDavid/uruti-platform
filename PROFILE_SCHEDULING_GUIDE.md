# Profile Viewing and Scheduling - Quick Start Guide

## New Features Available

### 1. Profile Viewing

Users can now view detailed profiles of other users (founders/investors) with a professional card-based layout.

#### How to Access
- Navigate to connections/mentors module
- Click on any user's name or avatar
- Profile view will display with comprehensive information

#### What Users See

**Left Card - Basic Info:**
- Profile photo
- Full name and display name  
- Role badge (Founder/Investor)
- Company name
- Location
- Email address

**Right Card - Detailed Profile:**
- Professional bio
- Industry/investment focus areas
- Expertise and skills
- Startup stage and funding (for founders)
- Years of experience (for investors)
- Achievements
- LinkedIn and website links

#### Available Actions

**For Non-Connected Users:**
- Send Connection Request button

**For Pending Connections:**
- Disabled "Connection Pending" indicator

**For Connected Users:**
- Send Message button → Opens messages module with conversation
- Book a Session button → Opens scheduling interface
- Video Call button → Initiates video meeting
- Voice Call button → Initiates voice call

### 2. Availability Management

Investors and mentors can now manage their availability for booking sessions.

#### How to Access
- Navigate to "Availability" module from sidebar
- View shows current time slots and booking settings

#### Managing Time Slots

**Adding a Slot:**
1. Click "Add Time Slot" button
2. Select day of week (Monday-Sunday)
3. Choose start time
4. Choose end time
5. Click "Save Slot"

**Toggling Slots:**
- Use the switch next to each slot to activate/deactivate
- Inactive slots are hidden from founders but not deleted

**Deleting Slots:**
- Click the trash icon next to a slot
- Slot is permanently removed

**Viewing Slots:**
- Slots are grouped by day of week
- Shows start-end time and duration
- Color-coded: active (green) vs inactive (gray)

#### Features

**Stats Dashboard:**
- Weekly Hours: Total available hours per week
- Confirmed Bookings: Upcoming confirmed sessions
- Pending Requests: Sessions awaiting approval
- Active Slots: Currently enabled time slots

**Booking Settings:**
- Session duration (15/30/60 minutes)
- Buffer time between sessions (0/15/30 minutes)
- Max daily bookings
- Advance booking days
- Meeting type (virtual/in-person/both)
- Virtual platform (Zoom, Google Meet, etc.)
- Physical location
- Session fee
- Auto-approve toggle
- Booking instructions

### 3. Session Booking Flow

**For Founders:**
1. View investor/mentor profile
2. Click "Book a Session"
3. Select available time slot
4. Provide session details
5. Submit booking request

**For Investors/Mentors:**
1. Receive booking notification
2. Review session details
3. Accept or reject request
4. Auto-approved if setting enabled

## Technical Integration

### Backend Endpoints

```bash
# Get my time slots
GET /api/v1/availability/my-slots

# Get another user's availability
GET /api/v1/availability/{user_id}

# Create new time slot
POST /api/v1/availability/
{
  "day_of_week": 0,  // 0=Monday, 6=Sunday
  "start_time": "09:00",
  "end_time": "10:00",
  "is_available": true
}

# Toggle slot active/inactive
PUT /api/v1/availability/{slot_id}
{
  "is_available": false
}

# Delete time slot
DELETE /api/v1/availability/{slot_id}

# Get user profile
GET /api/v1/users/{user_id}
```

### Component Usage

```tsx
import { ProfileViewModule } from './components/modules/ProfileViewModule';

// View a specific user's profile
<ProfileViewModule
  userId={123}
  onBack={() => navigateBack()}
  onModuleChange={(module) => switchModule(module)}
/>
```

### API Client Usage

```typescript
import { apiClient } from './lib/api-client';

// Fetch profile
const profile = await apiClient.getUserById(userId);

// Check connection status
const status = await apiClient.checkConnectionStatus(userId);

// Manage availability
const slots = await apiClient.getMyAvailability();
await apiClient.createAvailability({
  day_of_week: 1,
  start_time: "14:00",
  end_time: "16:00"
});
await apiClient.updateAvailability(slotId, { is_available: false });
await apiClient.deleteAvailability(slotId);
```

## User Workflows

### Founder Connecting with Investor

1. **Discover:** Browse investors in "Build Connections" module
2. **Connect:** Send connection request
3. **Wait:** Investor accepts request
4. **View Profile:** Click investor name to see full profile
5. **Book:** Click "Book a Session" on profile
6. **Select Time:** Choose from available slots
7. **Confirm:** Submit booking request
8. **Meet:** Join session at scheduled time

### Investor Managing Availability

1. **Navigate:** Go to Availability module
2. **Set Hours:** Add time slots for each day available
3. **Configure:** Set session duration, fees, platform
4. **Activate:** Toggle slots on/off as needed
5. **Review:** Check pending booking requests
6. **Approve:** Accept or reject session bookings
7. **Update:** Modify slots as schedule changes

### Messaging After Booking

1. **Profile View:** View connected user's profile
2. **Message:** Click "Send Message" button
3. **Chat:** Opens messages module with conversation
4. **Coordinate:** Discuss session details
5. **Prepare:** Share materials before meeting

## Best Practices

### For Investors/Mentors

✅ **Do:**
- Keep availability updated regularly
- Set realistic buffer times between sessions
- Provide clear booking instructions
- Respond to requests promptly
- Update profile with expertise areas
- Add LinkedIn and website links

❌ **Don't:**
- Leave inactive slots active
- Double-book time slots
- Forget to set timezone considerations
- Ignore pending booking requests
- Over-schedule without breaks

### For Founders

✅ **Do:**
- Review investor profiles before connecting
- Send personalized connection requests
- Book sessions with clear objectives
- Prepare materials ahead of time
- Respect cancellation policies
- Follow up after sessions

❌ **Don't:**
- Send generic mass connection requests
- Book sessions without preparation
- Cancel at the last minute
- Ignore booking instructions
- Spam message requests

## Troubleshooting

### Can't Send Connection Request
- **Check:** User may already have pending request
- **Solution:** Wait for response or check notifications

### Can't Book Session
- **Check:** Must be connected to book
- **Solution:** Send connection request first

### No Available Slots Showing
- **Check:** Investor may not have set availability
- **Solution:** Send message to coordinate

### Slot Creation Fails
- **Check:** End time must be after start time
- **Solution:** Verify time range is valid

### Profile Not Loading
- **Check:** Network connection
- **Solution:** Refresh page or retry

## Support

For issues or questions:
1. Check this guide first
2. Review implementation docs
3. Contact platform support
4. Check error logs in console

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Status:** Production Ready ✅

# Call UX Design - Incoming/Active Call Interface

This document describes the **incoming call and in-call experience** implemented in the Uruti mobile app.

---

## 🎯 Overview

The call system provides two core experiences:

1. **OS-level incoming call** (full-screen, locked screen)  
2. **In-app incoming/active call banner** (top snackbar-like widget that can expand)

Both experiences are synchronised via `CallProvider` and `CallService`.

---

## 📱 User Flow

### 1. Incoming Call (Outside App / Locked Screen)

When the user receives a call **while the app is backgrounded or the phone is locked**:

- **Native OS incoming call UI** is displayed full-screen (via `flutter_callkit_incoming`).
- User can **Accept** or **Decline** the call directly from the OS UI.
- tapping **Accept** opens the app and transitions to the active call screen.
- Tapping **Decline** dismisses the incoming call.

### 2. Incoming Call (Inside App)

When the user receives a call **while actively using the app**:

- A **banner overlay** appears at the **top of the screen** (above all other content).
- The banner displays:
  - Caller name
  - Caller avatar
  - "Incoming call" subtitle
  - **Accept** (green) and **Decline** (red) buttons
  - **Expand** icon to open full screen

- User can:
  - **Accept** → transitions to full-screen active call
  - **Decline** → dismisses the banner
  - **Tap expand icon** → opens full-screen incoming call view
  - **Continue using the app** with the banner visible at the top

### 3. Active Call (In-App)

Once a call is accepted:

- **Full-screen by default** showing:
  - Large caller avatar
  - Caller name + call duration timer
  - Control buttons: Mute, Speaker, Video, More
  - **End Call** button (red, centered at bottom)
  - **Minimize button** (top-left) to collapse back to banner

- User can:
  - **Tap minimize** → collapses call to a compact banner at the top
  - **Continue using the app** while the banner shows ongoing call duration
  - **Tap expand on banner** → returns to full-screen call view
  - **End call** → dismisses call UI entirely

---

## 🏗 Architecture

```
CallProvider (ChangeNotifier)
  ├─ CallPhase: idle | incoming | active
  ├─ CallSession: id, callerId, callerName, avatar, handle
  ├─ isFullScreen: bool (controls banner vs full-screen)
  ├─ muted, speakerOn: controls
  └─ activeDuration: timer for ongoing call

CallService (Singleton)
  ├─ showSystemIncomingCall() → OS-level incoming UI
  ├─ endSystemCall(id) → dismiss OS call
  └─ bindNativeEvents() → listen to accept/decline from native UI

CallOverlayHost (Widget)
  ├─ Wraps entire app in main.dart
  ├─ Watches CallProvider
  ├─ Shows IncomingCallBanner (collapsed) or CallFullscreenScreen (expanded)
  └─ Positioned above all routes

```

---

## 🎨 Visual States

### **Incoming Call Banner** (Collapsed, In-App)

```
┌─────────────────────────────────────────────┐
│  [Avatar] Ben Mark                 [↗] [X] [✓] │
│            Incoming call                    │
└─────────────────────────────────────────────┘
```

### **Active Call Banner** (Collapsed, In-App)

```
┌─────────────────────────────────────────────┐
│  [Avatar] Ben Mark              [↗]    [END] │
│            On call • 02:34               │
└─────────────────────────────────────────────┘
```

### **Full-Screen Incoming Call**

```
┌─────────────────────────────────────────────┐
│  [<]                                  [+]  │
│                                             │
│             Ben Mark                        │
│        +250 722 358 345                     │
│                                             │
│         (Large Avatar)                      │
│                                             │
│                                             │
│                                             │
│       [Decline]        [Accept]             │
│         (red)          (green)              │
└─────────────────────────────────────────────┘
```

### **Full-Screen Active Call**

```
┌─────────────────────────────────────────────┐
│  [<]                                  [+]  │
│                                             │
│             Johny                           │
│            00:20                            │
│                                             │
│         (Large Avatar)                      │
│                                             │
│   ┌───────────────────────────────────┐    │
│   │ [Speaker] [Mute] [Video] [More]   │    │
│   └───────────────────────────────────┘    │
│                                             │
│              [End Call]                     │
│                (red)                        │
└─────────────────────────────────────────────┘
```

---

## 🔌 Integration Points

### `main.dart`

```dart
CallOverlayHost(
  child: MaterialApp.router(...),
)
```

### `CallProvider` (for testing)

```dart
// Simulate an incoming call in dev mode
context.read<CallProvider>().simulateIncomingCall(
  callerName: 'Ben Mark',
  handle: '+250 722 358 345',
  avatarUrl: 'https://...',
);
```

---

## 📂 File Structure

```
lib/
├─ models/
│  └─ call_session.dart          # CallSession data model
├─ providers/
│  └─ call_provider.dart         # CallProvider state management
├─ services/
│  └─ call_service.dart          # CallService native bridge
├─ screens/
│  └─ calls/
│     └─ call_fullscreen_screen.dart  # Full-screen call UI
├─ widgets/
│  ├─ call_overlay_host.dart     # Global overlay coordinator
│  └─ incoming_call_banner.dart  # Compact top banner
└─ main.dart                     # App entry, wraps with CallOverlayHost
```

---

## 🚀 Usage

### Trigger an Incoming Call (Demo)

Add this button anywhere in your app (e.g., in the profile or settings screen):

```dart
ElevatedButton(
  onPressed: () {
    context.read<CallProvider>().simulateIncomingCall(
      callerName: 'Ben Mark',
      handle: '+250 700 000 000',
    );
  },
  child: const Text('Simulate Call'),
)
```

### Accept/Decline from Provider

```dart
final calls = context.read<CallProvider>();

// Accept
calls.acceptCall();

// Decline
calls.declineCall();

// End active call
calls.endCall();

// Toggle full screen
calls.openFullScreen();
calls.minimizeToBanner();

// Controls
calls.toggleMute();
calls.toggleSpeaker();
```

---

## 🎯 Native Configuration

### Android

**Permissions** (`android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### iOS

**Background Modes** (`ios/Runner/Info.plist`):

```xml
<key>UIBackgroundModes</key>
<array>
    <string>voip</string>
    <string>remote-notification</string>
    <string>processing</string>
</array>
```

---

## 🔗 Backend Integration

To wire real incoming calls:

1. **Push notification** arrives (FCM/APNs) with call payload:
   ```json
   {
     "call_id": "abc123",
     "caller_id": "user456",
     "caller_name": "Ben Mark",
     "caller_avatar_url": "https://...",
     "handle": "+250 722 358 345",
     "is_video": false
   }
   ```

2. **Parse payload** and trigger:
   ```dart
   final session = CallSession.fromPayload(payload);
   context.read<CallProvider>().onIncomingCall(session);
   ```

3. **CallService** automatically displays OS-level incoming UI.

4. User accepts → **CallProvider** transitions to active state.

---

## 🧪 Testing Checklist

- [ ] Incoming call shows OS full-screen when app is backgrounded
- [ ] Incoming call shows top banner when app is foregrounded
- [ ] Accept button transitions to active call (full screen)
- [ ] Decline button dismisses the call
- [ ] Minimize button collapses to banner
- [ ] Banner expand icon opens full screen
- [ ] End call button dismisses UI
- [ ] Call duration timer updates every second
- [ ] Mute/Speaker toggles update UI state
- [ ] Multiple incoming calls are queued (optional enhancement)

---

## 🎨 Design Reference

Matches the WhatsApp-style incoming call UX shown in the attached images:
1. OS-level full-screen incoming call with large avatar
2. In-app top banner with inline accept/decline
3. Full-screen active call with controls + minimize

---

## 📝 License

MIT — built for Uruti Platform


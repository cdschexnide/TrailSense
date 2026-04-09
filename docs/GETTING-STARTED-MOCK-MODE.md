# Getting Started with TrailSense - Mock Mode Guide

## 🎯 Quick Start - Get the App Running in 5 Minutes

This guide will walk you through setting up and running the TrailSense app with **full mock data** and **real-time WebSocket events** - no backend server required!

---

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)

   ```bash
   node --version  # Should show v18.x or higher
   ```

2. **npm** (comes with Node.js)

   ```bash
   npm --version
   ```

3. **Expo CLI** (will be installed with dependencies)

4. **iOS Simulator** (Mac only) or **Android Emulator** or **Physical Device**
   - iOS: Install Xcode from Mac App Store
   - Android: Install Android Studio
   - Physical Device: Install Expo Go app from App Store/Play Store

---

## 🚀 Step-by-Step Setup

### Step 1: Navigate to Project Directory

```bash
cd /Users/home/Documents/TrailSense
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected output:**

```
added 1234 packages in 45s
```

**⏱️ This takes 1-2 minutes**

---

### Step 3: Verify Mock Mode is Enabled

Check that the `.env` file exists and has mock mode enabled:

```bash
cat .env
```

**You should see:**

```env
USE_MOCK_API=true
```

✅ **If the file exists and shows `USE_MOCK_API=true`, you're good to go!**

❌ **If the file doesn't exist or shows `false`:**

```bash
# Create/edit the .env file
echo "USE_MOCK_API=true" >> .env
```

Or manually create `.env` file with this content:

```env
# API Configuration
API_BASE_URL=https://api.trailsense.com
API_TIMEOUT=30000
WS_URL=wss://ws.trailsense.com

# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_app.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CRASH_REPORTING=false
ENABLE_DEBUG_LOGS=true

# Environment
NODE_ENV=development

# Mock Data Mode - THIS IS THE IMPORTANT LINE!
USE_MOCK_API=true
```

---

### Step 4: Start the Development Server

```bash
npm start
```

**Expected output:**

```
Starting Metro Bundler...

═══════════════════════════════════════════
          🎭 MOCK MODE ENABLED 🎭
═══════════════════════════════════════════

  ✓ Static mock data loaded
  ✓ Mock WebSocket enabled
  ✓ Live radar events every 5 seconds
  ✓ No backend connection required

  To disable: Set USE_MOCK_API=false in .env
═══════════════════════════════════════════

[MockData] Starting mock data seeding...
[MockData] Seeding Redux store...
[MockData] Seeding React Query cache...
[MockData] ✓ Mock data seeding complete!
[MockData] Seeded:
  - 55 alerts
  - 5 devices
  - 10 whitelist entries
  - Analytics data
  - Heatmap data (55 points)
  - 10 device fingerprints
  - User: admin@trailsense.com (admin)

Metro waiting on exp://192.168.1.xxx:8081
```

**⏱️ Server starts in ~30 seconds**

---

### Step 5: Launch the App

You'll see a QR code and options. Choose your platform:

#### Option A: iOS Simulator (Mac Only)

Press `i` in the terminal

**Or run:**

```bash
npm run ios
```

**⏱️ Takes 30-60 seconds to build and launch**

#### Option B: Android Emulator

Press `a` in the terminal

**Or run:**

```bash
npm run android
```

**⏱️ Takes 30-60 seconds to build and launch**

#### Option C: Physical Device (Easiest!)

1. Install **Expo Go** app from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in the terminal
3. App will load on your device

**⏱️ Takes 10-20 seconds to load**

---

### Step 6: Watch the Magic Happen! ✨

When the app loads, you'll see in the **Metro Bundler console**:

```
[MockWebSocket] 🎭 Connecting to mock WebSocket...
[MockWebSocket] ✓ Connected
[MockWebSocket] 📡 Alert: HIGH wifi @ -68dBm from North Gate Sensor
[MockWebSocket] 📡 Alert: MEDIUM bluetooth @ -78dBm from East Trail Monitor
[MockWebSocket] 📡 Alert: CRITICAL cellular @ -55dBm from South Boundary
[MockWebSocket] 🔋 Device Status: North Gate Sensor battery: 87%
```

**🎉 The app is now running with full mock data and real-time events!**

---

## 🎮 What You Can Test Now

### 1. **Alerts Tab (Bottom Navigation)** 📢

**What you'll see:**

- **55 pre-loaded alerts** from the last 30 days
- Mix of threat levels (Critical, High, Medium, Low)
- Search and filter functionality
- Pull-to-refresh
- Alert details when you tap an alert

**Try this:**

- Scroll through the alert list
- Tap on an alert to see details
- Use the filter button (top right)
- Search for specific alerts
- Mark alerts as reviewed

---

### 2. **Live Radar Tab (Bottom Navigation)** 📡

**What you'll see:**

- **Real-time radar display**
- New detections appearing **every 5 seconds**
- Color-coded threat levels:
  - 🔴 Red = Critical
  - 🟠 Orange = High
  - 🟡 Yellow = Medium
  - 🟢 Green = Low
- Detection counter updating automatically
- Detections fade after 30 seconds

**Try this:**

- Watch for 30 seconds - you should see 6 new detections appear
- Observe the radar animation
- Note the different colors and positions
- Check the detection counter at the top

**Console will show:**

```
[MockWebSocket] 📡 Alert: HIGH wifi @ -68dBm from North Gate Sensor
[MockWebSocket] 📡 Alert: CRITICAL cellular @ -55dBm from South Boundary
[MockWebSocket] 📡 Alert: MEDIUM bluetooth @ -78dBm from East Trail
```

---

### 3. **Devices Tab (Bottom Navigation)** 🎯

**What you'll see:**

- **5 detection devices**
  - 3 online (green status)
  - 2 offline (gray status)
- Battery levels
- Signal strength
- Detection counts
- Last seen timestamps

**Try this:**

- Tap on a device to see details
- Check the device locations on map (if implemented)
- Watch battery levels update every 15 seconds (via WebSocket)

**Console will show:**

```
[MockWebSocket] 🔋 Device Status: North Gate Sensor battery: 87%
[MockWebSocket] 🔋 Device Status: South Boundary battery: 92%
```

---

### 4. **Analytics Tab (Bottom Navigation)** 📊

**What you'll see:**

- Total detections count
- Detection type breakdown (Cellular, WiFi, Bluetooth)
- Threat level distribution
- Daily detection trends (last 30 days)
- Hourly distribution charts

**Try this:**

- Scroll through the dashboard
- Check the charts and graphs
- View detection statistics
- Explore heatmap data

---

### 5. **Settings Tab (Bottom Navigation)** ⚙️

**What you'll see:**

- Profile settings (logged in as admin@trailsense.com)
- Whitelist management (10 entries)
- Notification settings
- App preferences
- Theme settings

**Try this:**

- Navigate to Whitelist screen
- View whitelist entries
- Check different categories (Family, Guests, Service, Other)
- Explore notification settings

---

## 🔍 Detailed Feature Testing

### Test Real-Time WebSocket Events

1. **Go to Live Radar Tab**
2. **Wait and watch** - Every 5 seconds, you'll see:
   - New detection appears on radar
   - Console logs the event
   - Detection counter increases
   - Color/position varies by threat level

3. **Simultaneously check Alerts Tab**:
   - Pull down to refresh
   - New alerts should appear at the top
   - These are the same alerts from the radar!

### Test Device Status Updates

1. **Go to Devices Tab**
2. **Watch battery levels** - Every 15 seconds:
   - Battery percentage changes slightly (±2%)
   - Last seen timestamp updates
   - Online status may change if battery < 5%

3. **Check console:**
   ```
   [MockWebSocket] 🔋 Device Status: North Gate Sensor battery: 85%
   ```

### Test Data Persistence

1. **Mark some alerts as reviewed**
2. **Close the app completely**
3. **Reopen the app**
4. **Check if alerts are still marked as reviewed**
   - ✅ They should be! (Redux persist)

---

## 📊 Mock Data Summary

Here's what's pre-loaded:

| Data Type     | Count     | Details                                |
| ------------- | --------- | -------------------------------------- |
| **Users**     | 2         | Admin & regular user                   |
| **Auth**      | ✅        | Auto-logged in as admin@trailsense.com |
| **Devices**   | 5         | 3 online, 2 offline                    |
| **Alerts**    | 55        | Past 30 days, mixed threat levels      |
| **Whitelist** | 10        | Family, guests, service, other         |
| **Analytics** | ✅        | Full dashboard data                    |
| **Heatmap**   | 55 points | Location-based detection data          |
| **WebSocket** | ✅        | Live events every 5 seconds            |

---

## 🎨 Visual Indicators

### App is Working When You See:

✅ **Console shows mock mode banner**

```
═══════════════════════════════════════════
          🎭 MOCK MODE ENABLED 🎭
═══════════════════════════════════════════
```

✅ **Mock data seeding logs**

```
[MockData] ✓ Mock data seeding complete!
[MockData] Seeded:
  - 55 alerts
  - 5 devices
  ...
```

✅ **WebSocket connection**

```
[MockWebSocket] 🎭 Connecting to mock WebSocket...
[MockWebSocket] ✓ Connected
```

✅ **Regular alert events**

```
[MockWebSocket] 📡 Alert: HIGH wifi @ -68dBm from North Gate Sensor
```

✅ **Device status updates**

```
[MockWebSocket] 🔋 Device Status: North Gate Sensor battery: 87%
```

---

## 🐛 Troubleshooting

### Problem: App shows login screen instead of auto-logging in

**Solution:**

1. Check `.env` has `USE_MOCK_API=true`
2. Restart the dev server
3. Clear app cache: `npm start --reset-cache`

### Problem: No WebSocket events appearing

**Check these:**

1. Console shows `[MockWebSocket] ✓ Connected`?
2. Are you on the Live Radar tab?
3. Check console for alert events every 5 seconds
4. Restart the app if needed

### Problem: Empty screens / No data

**Solution:**

1. Check console for `[MockData] ✓ Mock data seeding complete!`
2. Verify `.env` has `USE_MOCK_API=true`
3. Restart the dev server: `Ctrl+C`, then `npm start`
4. Clear cache: `npm start --reset-cache`

### Problem: Metro bundler errors

**Solution:**

```bash
# Clear all caches
npm start --reset-cache

# Or full clean
rm -rf node_modules
npm install
npm start
```

### Problem: "Can't find module" errors

**Solution:**

```bash
# Reinstall dependencies
npm install

# Check TypeScript compilation
npm run type-check
```

### Problem: iOS Simulator won't open

**Solution:**

1. Open Xcode
2. Go to Xcode → Preferences → Locations
3. Set Command Line Tools to latest version
4. Try `npm run ios` again

### Problem: Android Emulator won't start

**Solution:**

1. Open Android Studio
2. Tools → AVD Manager
3. Start an emulator manually
4. Try `npm run android` again

---

## 🎯 Quick Commands Reference

```bash
# Start development server
npm start

# Start on iOS simulator
npm run ios

# Start on Android emulator
npm run android

# Clear cache and restart
npm start --reset-cache

# Run type checker
npm run type-check

# Run linter
npm run lint

# Run tests
npm test

# View all available scripts
npm run
```

---

## 🔄 Stopping and Restarting

### To Stop the App:

```bash
# In the terminal where Metro is running:
Ctrl + C
```

### To Restart:

```bash
npm start
```

**The mock data will re-seed automatically on each start!**

---

## 🎪 Demo Flow - Show Off the App

Want to demonstrate the app? Follow this flow:

### 1. **Start on Live Radar** (30 seconds)

- Show the real-time radar
- Point out new detections appearing
- Explain the color coding
- Show detection counter

### 2. **Switch to Alerts** (30 seconds)

- Pull to refresh
- Show new alerts at top (from radar)
- Tap on an alert for details
- Show threat level and detection type

### 3. **Go to Devices** (20 seconds)

- Show online/offline status
- Point out battery levels
- Show detection counts

### 4. **Show Analytics** (20 seconds)

- Display total detections
- Show charts and trends
- Explain the data visualization

### 5. **Back to Live Radar** (20 seconds)

- Watch a few more detections appear
- Emphasize real-time nature
- End with radar active

**Total demo time: ~2 minutes**

---

## 📱 Testing Checklist

Use this to ensure everything works:

- [ ] App starts without errors
- [ ] Console shows mock mode enabled
- [ ] Mock data seeding completes
- [ ] WebSocket connects successfully
- [ ] Alerts tab shows 55 alerts
- [ ] Devices tab shows 5 devices
- [ ] Live Radar shows real-time detections
- [ ] New alerts appear every 5 seconds
- [ ] Device battery updates every 15 seconds
- [ ] Analytics tab shows charts
- [ ] Settings tab is accessible
- [ ] Whitelist shows 10 entries
- [ ] Navigation works between all tabs
- [ ] Pull-to-refresh works
- [ ] Alert details open correctly
- [ ] No console errors (warnings OK)

---

## 🎓 Understanding the Mock System

### How It Works:

1. **On App Start:**
   - Checks `USE_MOCK_API` environment variable
   - If `true`, loads mock config
   - Seeds Redux store with user/auth data
   - Seeds React Query cache with API data
   - Displays mock mode banner

2. **During App Usage:**
   - All API calls return cached mock data
   - No network requests made
   - WebSocket service uses mock implementation
   - Events generated at intervals

3. **Mock WebSocket:**
   - Connects on app start (simulated)
   - Generates alert events every 5 seconds
   - Generates device status every 15 seconds
   - Emits events to subscribers
   - Live Radar receives and displays

4. **Data Persistence:**
   - User actions (marking reviewed) are saved
   - Redux persist keeps auth state
   - React Query cache persists between sessions

---

## 🔧 Advanced: Customizing Mock Behavior

### Change WebSocket Event Frequency

Edit `src/mocks/mockWebSocket.ts`:

```typescript
class MockWebSocketService {
  // Change these values
  private readonly EVENT_INTERVAL = 3000; // 3 seconds (faster)
  private readonly DEVICE_STATUS_INTERVAL = 30000; // 30 seconds
}
```

### Change Threat Level Distribution

In `src/mocks/mockWebSocket.ts` → `generateMockAlert()`:

```typescript
// More critical alerts
const threatWeights = [20, 20, 30, 30]; // [low, medium, high, critical]
```

### Add More Mock Data

Edit the files in `src/mocks/data/`:

- `mockAlerts.ts` - Add more alerts
- `mockDevices.ts` - Add more devices
- `mockWhitelist.ts` - Add more whitelist entries

Then restart the app.

---

## 📞 Need Help?

### Resources:

- **Documentation:** `/docs/` folder
- **Mock WebSocket Guide:** `/docs/implementation/MOCK-WEBSOCKET.md`
- **Project Overview:** `/docs/plans/00-PROJECT-OVERVIEW.md`

### Common Issues:

- Most issues fixed by restarting dev server
- Clear cache if seeing old data
- Check console for error messages
- Verify `.env` file exists and has `USE_MOCK_API=true`

---

## 🎉 You're All Set!

You now have a **fully functional TrailSense app** with:

- ✅ 55 pre-loaded alerts
- ✅ 5 detection devices
- ✅ Real-time WebSocket events
- ✅ Live radar with automatic updates
- ✅ Complete analytics dashboard
- ✅ Zero backend dependencies

**Now go explore, test, and play with the app!** 🚀

---

**Last Updated:** November 16, 2025
**Status:** ✅ Complete and Tested

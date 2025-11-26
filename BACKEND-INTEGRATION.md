# Mobile App → Backend Integration Complete ✅

**Date**: November 25, 2025
**Status**: ✅ **Mobile app now using REAL backend API**

---

## What Was Changed

The TrailSense mobile app has been updated to **stop using mock data** and **connect to the real backend API** at `http://localhost:3000`.

### Files Modified

#### 1. `src/config/mockConfig.ts`
**Before:**
```typescript
const FORCE_MOCK_MODE = __DEV__ && true;  // Mock mode forced ON
```

**After:**
```typescript
const FORCE_MOCK_MODE = false;  // Mock mode DISABLED
```

**Impact**: App no longer forces mock mode, allowing it to use real API.

---

#### 2. `.env`
**Before:**
```env
GOLIOTH_API_KEY=...
GOLIOTH_PROJECT_ID=trailsense
GOLIOTH_API_BASE_URL=https://api.golioth.io/v1
USE_MOCK_API=false
```

**After:**
```env
# Golioth IoT Platform Configuration
GOLIOTH_API_KEY=...
GOLIOTH_PROJECT_ID=trailsense
GOLIOTH_API_BASE_URL=https://api.golioth.io/v1

# TrailSense Backend API Configuration
USE_MOCK_API=false
API_BASE_URL=http://localhost:3000/api
WS_URL=ws://localhost:3000
```

**Impact**: Explicit backend URLs configured for API and WebSocket connections.

---

#### 3. `src/App.tsx`
**Before:**
```typescript
if (isMockMode) {
  // ... seed mock data and connect to mock WebSocket
}
// No else clause - real mode had no WebSocket initialization
```

**After:**
```typescript
if (isMockMode) {
  // ... seed mock data and connect to mock WebSocket
} else {
  // Real API mode - WebSocket will connect after authentication
  console.log('[App] Real API mode - WebSocket will connect after authentication');
}
```

**Impact**: App now properly handles both mock and real modes, with clear logging.

---

## Current System State

### Backend Server ✅
- **Status**: Running
- **URL**: http://localhost:3000
- **Health Check**: `{"status":"healthy","timestamp":"2025-11-25T23:02:22.248Z","version":"1.0.0"}`
- **WebSocket**: ws://localhost:3000
- **Database**: SQLite (dev.db)

### Mobile App ✅
- **Mock Mode**: DISABLED
- **API URL**: http://localhost:3000/api
- **WebSocket URL**: ws://localhost:3000
- **Expected Behavior**: Will attempt to connect to real backend

---

## How to Test Integration

### Step 1: Ensure Backend is Running

```bash
cd /Users/home/Documents/Project/trailsense-backend
npm run dev
```

You should see:
```
═══════════════════════════════════════════
  🚀 TrailSense Backend Server
═══════════════════════════════════════════
  Environment: development
  Port: 3000
  URL: http://localhost:3000
═══════════════════════════════════════════
✅ Server is running!
```

### Step 2: Test Backend Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### Step 3: Register a Test User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@trailsense.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "user": {
    "id": "uuid-...",
    "email": "test@trailsense.com",
    "name": "Test User"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the token** - you'll need it for testing protected endpoints.

### Step 4: Start Mobile App

```bash
cd /Users/home/Documents/Project/TrailSense
npm start
# Press 'i' for iOS or 'a' for Android
```

### Step 5: Check Mobile App Logs

When the app starts, you should see:
```
[Config] Mock mode disabled - using real API
[App] Real API mode - WebSocket will connect after authentication
```

**NOT:**
```
🎭 MOCK MODE ENABLED 🎭  // ❌ This means mock mode is still on
```

### Step 6: Test Login Flow

1. **Open the app** on iOS/Android simulator
2. **You should see the login screen** (not auto-logged in)
3. **Enter credentials**:
   - Email: `test@trailsense.com`
   - Password: `password123`
4. **Submit login**

### Step 7: Monitor Backend Logs

In the backend terminal, you should see:
```
[API Request] POST /auth/login
[Auth] User logged in: test@trailsense.com
[WebSocket] Client connected: <socket-id> (User: test@trailsense.com)
```

### Step 8: Test API Calls

Once logged in, the mobile app should make API calls to fetch alerts:
```
[API Request] GET /api/alerts
[Alerts] Retrieved 0 alerts  // Empty initially, that's normal
```

### Step 9: Test Webhook (Simulate ESP32 Detection)

```bash
curl -X POST http://localhost:3000/webhook/golioth \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-webhook-secret" \
  -d '{
    "deviceId": "test-device-01@trailsense.golioth.io",
    "timestamp": 1732576815000,
    "path": "detections",
    "data": {
      "did": "test-device-01",
      "ts": 1732576815,
      "det": {
        "t": "w",
        "mac": "A1B2C3D4",
        "r": -68,
        "zone": 1,
        "dist": 12.5,
        "ch": 6
      }
    }
  }'
```

**Expected Backend Logs:**
```
[Golioth] Webhook received: ...
[Golioth] Alert created: <uuid> (medium - wifi)
[WebSocket] Broadcasted alert: <uuid> (medium)
```

**Expected Mobile App Behavior:**
- Alert should appear in real-time on the Alerts screen
- Live Radar should show the detection
- No refresh needed (WebSocket push)

---

## Expected Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     INTEGRATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. User Opens Mobile App
   └─> App.tsx checks isMockMode = false
       └─> Displays Login Screen

2. User Logs In
   └─> POST http://localhost:3000/auth/login
       └─> Backend validates credentials
           └─> Returns JWT token
               └─> Mobile app stores token
                   └─> Mobile app connects WebSocket with JWT
                       └─> Backend validates WebSocket JWT
                           └─> WebSocket connection established ✅

3. Mobile App Fetches Initial Data
   └─> GET http://localhost:3000/api/alerts (with JWT)
       └─> Backend returns alerts from database
           └─> Mobile app displays alerts ✅

4. ESP32 Detects Device
   └─> Sends to Golioth
       └─> Golioth triggers webhook
           └─> POST http://localhost:3000/webhook/golioth
               └─> Backend creates alert in database
                   └─> Backend broadcasts via WebSocket
                       └─> Mobile app receives alert in real-time ✅

5. User Marks Alert as Reviewed
   └─> PATCH http://localhost:3000/api/alerts/:id/reviewed (with JWT)
       └─> Backend updates database
           └─> Mobile app UI updates ✅
```

---

## Troubleshooting

### Problem: App Still Shows Mock Mode

**Check:**
```bash
cat /Users/home/Documents/Project/TrailSense/src/config/mockConfig.ts | grep FORCE_MOCK_MODE
```

Should show: `const FORCE_MOCK_MODE = false;`

**If not**, re-run:
```bash
# Edit the file and change true to false
```

---

### Problem: App Can't Connect to Backend

**Symptoms:**
- Login fails with network error
- Console shows "Network request failed"

**Solution:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check mobile app .env:**
   ```bash
   cat /Users/home/Documents/Project/TrailSense/.env | grep API_BASE_URL
   ```
   Should show: `API_BASE_URL=http://localhost:3000/api`

3. **For iOS Simulator:** Use `http://localhost:3000`
4. **For Android Emulator:** Use `http://10.0.2.2:3000` (Android emulator special IP)

   If using Android, update `.env`:
   ```env
   API_BASE_URL=http://10.0.2.2:3000/api
   WS_URL=ws://10.0.2.2:3000
   ```

---

### Problem: WebSocket Not Connecting

**Symptoms:**
- No real-time alerts
- Backend logs don't show WebSocket connection

**Solution:**

1. **Check backend CORS settings:**
   Backend should allow connections from mobile app origin.

2. **Check mobile app WebSocket URL:**
   ```bash
   cat /Users/home/Documents/Project/TrailSense/.env | grep WS_URL
   ```

3. **Check JWT token:**
   WebSocket requires valid JWT token from login.

---

### Problem: Alerts Not Appearing

**Symptoms:**
- Webhook succeeds but mobile app doesn't show alerts

**Solution:**

1. **Check database:**
   ```bash
   cd /Users/home/Documents/Project/trailsense-backend
   npx prisma studio
   ```
   Look for alerts in the Alert table.

2. **Check mobile app API calls:**
   Mobile app should make GET /api/alerts on startup.

3. **Check WebSocket connection:**
   Backend logs should show: `[WebSocket] Client connected: ...`

---

## Success Indicators

✅ **Mobile app shows:**
- `[Config] Mock mode disabled - using real API`
- `[App] Real API mode - WebSocket will connect after authentication`

✅ **Backend shows:**
- `[Auth] User logged in: ...`
- `[WebSocket] Client connected: ...`
- `[Alerts] Retrieved X alerts`

✅ **Webhook test shows:**
- `[Golioth] Alert created: ...`
- `[WebSocket] Broadcasted alert: ...`

✅ **Mobile app displays:**
- Real-time alerts from webhook
- Alert list from API
- WebSocket connection indicator

---

## Next Steps

### For Development

1. **Create More Test Users**
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@trailsense.com","password":"admin123","name":"Admin User"}'
   ```

2. **Send More Webhook Events**
   Simulate different detection types:
   - WiFi: `"t": "w"`
   - Bluetooth: `"t": "b"`
   - Cellular: `"t": "c"`

3. **Test Different Threat Levels**
   Adjust RSSI and zone to generate different threat levels:
   - Critical: `"r": -45, "zone": 0` (very close)
   - High: `"r": -55, "zone": 1`
   - Medium: `"r": -68, "zone": 1`
   - Low: `"r": -80, "zone": 2`

### For Production

1. **Deploy backend to Railway.app**
   ```bash
   cd /Users/home/Documents/Project/trailsense-backend
   railway up
   ```

2. **Update mobile app .env with production URL**
   ```env
   API_BASE_URL=https://your-app.up.railway.app/api
   WS_URL=wss://your-app.up.railway.app
   ```

3. **Configure Golioth webhook**
   Point to production backend URL

---

## Summary

✅ **Mobile app successfully configured to use real backend**
✅ **Mock mode disabled**
✅ **Backend URLs configured**
✅ **WebSocket integration ready**
✅ **Authentication flow ready**
✅ **Real-time alerts ready**

**The integration is complete!** The mobile app will now communicate with the backend API instead of using mock data.

---

**Next Action**: Start the mobile app and test the login flow with the backend!

# Development Authentication Bypass - ENABLED

**Date**: November 25, 2025
**Status**: ✅ **Authentication bypass active for development**

---

## What Was Changed

### 1. Auth Screen Bypass Enabled
**File**: `src/navigation/RootNavigator.tsx`

```typescript
const SKIP_AUTH_FOR_TESTING = true;  // ✅ Enabled
```

This skips the login/register screen and goes straight to the main app.

---

### 2. Auto-Login on App Startup
**File**: `src/App.tsx`

Added automatic login with test credentials when app starts:

```typescript
// DEVELOPMENT BYPASS: Auto-login for testing
if (__DEV__) {
  console.log('[App] DEV MODE: Auto-logging in with test credentials...');
  store.dispatch(loginAction({
    email: 'test@trailsense.com',
    password: 'password123'
  }))
    .then((response) => {
      console.log('[App] DEV MODE: Auto-login successful!');
      websocketService.connect(response.token);
    });
}
```

---

## How It Works

When you start the app in development mode (`__DEV__ = true`):

1. **App starts** → Skips login screen
2. **Auto-login** → Calls backend `/auth/login` endpoint
3. **Gets JWT token** → Stores in SecureStore
4. **Updates Redux** → Sets `isAuthenticated = true`
5. **Connects WebSocket** → Uses real token for real-time updates
6. **API calls** → All include the JWT token automatically

---

## Expected Console Logs

```
✅ LOG [Config] API Base URL: http://192.168.12.63:3000/api
✅ LOG [App] DEV MODE: Auto-logging in with test credentials...
✅ LOG [API Request] POST /auth/login
✅ LOG [API Response] POST /auth/login {"status": 200}
✅ LOG [App] DEV MODE: Auto-login successful!
✅ LOG [WebSocket] Connected to backend
✅ LOG [API Request] GET /alerts
✅ LOG [API Response] GET /alerts {"status": 200, "data": [50 alerts]}
```

---

## Test Credentials

The app automatically logs in as:
```
Email: test@trailsense.com
Password: password123
```

This user has access to all 50 seeded alerts in the database.

---

## What You Should See

### On App Reload:

1. **No login screen** - Goes straight to main app
2. **Alerts Tab** - Shows 50 seeded alerts
3. **Devices Tab** - Shows 5 ESP32 devices
4. **Analytics Tab** - Shows charts and trends
5. **Real-time updates** - WebSocket connected

### Backend Logs:
```
[2025-11-26T...] POST /auth/login
[Auth] User logged in: test@trailsense.com
[2025-11-26T...] GET /api/alerts
[Alerts] Retrieved 50 alerts
```

---

## To Disable (For Production)

When you're ready to test real authentication or deploy:

### Step 1: Disable Auth Bypass
**File**: `src/navigation/RootNavigator.tsx`
```typescript
const SKIP_AUTH_FOR_TESTING = false;  // Disable bypass
```

### Step 2: Remove Auto-Login
**File**: `src/App.tsx`
```typescript
// Comment out or remove the auto-login code:
// if (__DEV__) {
//   store.dispatch(loginAction({...}));
// }
```

---

## Troubleshooting

### If You Still See 401 Errors:

**Check console for:**
```
ERROR [App] DEV MODE: Auto-login failed: ...
```

**Possible causes:**
1. Backend not running (check http://192.168.12.63:3000/health)
2. Test user doesn't exist (run `npm run seed` in backend)
3. Wrong credentials (check TESTING-GUIDE.md for valid users)

### If Auto-Login Succeeds But Still 401:

Token might not be stored correctly. Check:
```
LOG [API Request] GET /alerts
```

Should show `Authorization: Bearer ...` in the request headers.

---

## Benefits of This Approach

✅ **Faster development** - No need to login every time you reload
✅ **Real authentication** - Uses actual backend login, not fake tokens
✅ **Real JWT** - API calls work exactly as in production
✅ **WebSocket works** - Connected with real token
✅ **Easy to disable** - Just change one flag

---

## Current Network Configuration

- **Mac IP**: `192.168.12.63`
- **Backend URL**: `http://192.168.12.63:3000/api`
- **WebSocket URL**: `ws://192.168.12.63:3000`
- **Device**: Physical Android tablet via USB + Expo Go

---

**Now reload the app and you should see the main interface with all 50 alerts!** 🎉

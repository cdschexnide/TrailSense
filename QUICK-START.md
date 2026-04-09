# TrailSense - Quick Start Guide

## 🚀 Get Running in 3 Commands

```bash
# 1. Install dependencies
npm install

# 2. Verify mock mode is enabled
cat .env  # Should show USE_MOCK_API=true

# 3. Start the app
npm start
```

Then press **`i`** for iOS or **`a`** for Android.

---

## ✅ Success Indicators

You should see in the console:

```
═══════════════════════════════════════════
          🎭 MOCK MODE ENABLED 🎭
═══════════════════════════════════════════

  ✓ Static mock data loaded
  ✓ Mock WebSocket enabled
  ✓ Live radar events every 5 seconds

[MockData] ✓ Mock data seeding complete!
[MockWebSocket] ✓ Connected
[MockWebSocket] 📡 Alert: HIGH wifi @ -68dBm from North Gate Sensor
```

---

## 📱 What to Test

### Live Radar Tab 📡

- Watch real-time detections appear every 5 seconds
- See color-coded threat levels
- Observe auto-fade after 30 seconds

### Alerts Tab 📢

- Browse 55 pre-loaded alerts
- Pull to refresh for new alerts
- Tap alerts for details

### Devices Tab 🎯

- View 5 detection devices
- Watch battery updates every 15 seconds
- Check online/offline status

### Analytics Tab 📊

- View detection trends
- Check threat distributions
- Explore charts and graphs

### Settings Tab ⚙️

- Manage 10 whitelist entries
- Configure notifications
- View user profile

---

## 🎮 Test Checklist

- [ ] Console shows "MOCK MODE ENABLED"
- [ ] Alerts tab has 55 alerts
- [ ] Live Radar shows detections every 5 seconds
- [ ] Devices tab shows 5 devices
- [ ] WebSocket events appear in console
- [ ] No errors in console

---

## 🐛 Quick Fixes

**Problem:** Login screen appears

```bash
# Check .env file
echo "USE_MOCK_API=true" > .env
npm start
```

**Problem:** No data showing

```bash
# Clear cache and restart
npm start --reset-cache
```

**Problem:** No WebSocket events

```bash
# Check you're on Live Radar tab
# Wait 5 seconds for first event
# Check console for [MockWebSocket] logs
```

---

## 📚 Full Documentation

See **[docs/GETTING-STARTED-MOCK-MODE.md](docs/GETTING-STARTED-MOCK-MODE.md)** for complete guide.

---

## 🎯 Mock Data Included

- **55 alerts** (30 days of history)
- **5 devices** (3 online, 2 offline)
- **10 whitelist entries**
- **Full analytics data**
- **Real-time WebSocket** (events every 5 seconds)
- **Auto-login** (admin@trailsense.com)

---

**Ready to code?** Start the app and explore! 🚀

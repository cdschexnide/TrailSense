# 🎯 START HERE - TrailSense Quick Guide

## ⚡ Get Running in 3 Steps

```bash
# Step 1: Install
npm install

# Step 2: Start
npm start

# Step 3: Launch (choose one)
Press 'i' for iOS
Press 'a' for Android
```

---

## ✅ What to Expect

### Console Output
```
═══════════════════════════════════════════
          🎭 MOCK MODE ENABLED 🎭
═══════════════════════════════════════════

  ✓ Static mock data loaded
  ✓ Mock WebSocket enabled
  ✓ Live radar events every 5 seconds

[MockData] ✓ Mock data seeding complete!
[MockWebSocket] ✓ Connected
[MockWebSocket] 📡 Alert: HIGH wifi @ -68dBm
```

### In the App
- **Auto-login** as admin@trailsense.com
- **55 alerts** pre-loaded
- **Live Radar** with detections every 5 seconds
- **5 devices** with real-time battery updates
- **Full analytics** dashboard

---

## 📱 Where to Go

| Tab | What You'll See |
|-----|-----------------|
| 📢 **Alerts** | 55 alerts, pull to refresh for new ones |
| 📡 **Radar** | Real-time detections every 5 seconds |
| 🎯 **Devices** | 5 devices, battery updates every 15s |
| 📊 **Analytics** | Charts, trends, heatmaps |
| ⚙️ **Settings** | Whitelist, profile, preferences |

---

## 📚 Documentation

**Choose your path:**

### 🏃 I want to start NOW
→ **[QUICK-START.md](QUICK-START.md)** (1 page)

### 📖 I want the full guide
→ **[docs/GETTING-STARTED-MOCK-MODE.md](docs/GETTING-STARTED-MOCK-MODE.md)** (Complete)

### 🔧 I want technical details
→ **[MOCK-DATA-IMPLEMENTATION-SUMMARY.md](MOCK-DATA-IMPLEMENTATION-SUMMARY.md)** (Reference)

### 🎓 I want WebSocket info
→ **[docs/implementation/MOCK-WEBSOCKET.md](docs/implementation/MOCK-WEBSOCKET.md)** (Deep dive)

---

## 🐛 Problems?

### No data showing?
```bash
npm start --reset-cache
```

### Login screen appears?
```bash
echo "USE_MOCK_API=true" > .env
npm start
```

### Still stuck?
Check **[docs/GETTING-STARTED-MOCK-MODE.md](docs/GETTING-STARTED-MOCK-MODE.md)** Troubleshooting section

---

## 🎉 You're Ready!

Everything is configured and ready to go. Just run `npm start` and explore!

**Next:** Browse to Live Radar tab and watch real-time detections! 🚀

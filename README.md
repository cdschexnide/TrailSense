# TrailSense Mobile App

Production-grade React Native mobile application for property intrusion detection.

## Overview

TrailSense is a mobile application designed to receive, process, and display real-time intrusion detection alerts from ESP32-based detection units deployed in remote property locations. The app provides property owners with immediate threat awareness through multi-band device detection (cellular uplink, WiFi, Bluetooth).

## Features

- **Real-Time Alerts**: Immediate push notifications with threat classification
- **Extended Detection Range**: 500-800+ ft cellular detection, 300ft WiFi, 100ft Bluetooth
- **Advanced Analytics**: Heatmaps, pattern recognition, visitor tracking
- **Offline-First Architecture**: Works without constant connectivity
- **Enterprise-Ready**: Scalable, secure, maintainable codebase

## Technology Stack

- **React Native 0.81** with **Expo SDK 54**
- **TypeScript 5.9** (strict mode)
- **Redux Toolkit** + **React Query** + **Zustand** for state management
- **React Navigation** for routing
- **Firebase** for push notifications and analytics
- **SQLite** for offline data persistence

## 🚀 Quick Start - Run with Mock Data (Recommended)

**Get the app running in 3 minutes with full mock data and real-time events!**

```bash
# 1. Install dependencies
npm install

# 2. Start the app (mock mode enabled by default)
npm start

# 3. Launch on iOS or Android
npm run ios    # or npm run android
```

**✨ The app will automatically:**
- Load 55 pre-seeded alerts
- Connect to mock WebSocket (real-time events every 5 seconds)
- Auto-login as admin user
- Display live radar with detections
- Work completely offline - no backend required!

**📖 See [QUICK-START.md](QUICK-START.md)** for 1-page guide or **[docs/GETTING-STARTED-MOCK-MODE.md](docs/GETTING-STARTED-MOCK-MODE.md)** for complete walkthrough.

---

## Setup (Production)

See [docs/plans/01-PROJECT-SETUP.md](docs/plans/01-PROJECT-SETUP.md) for detailed production setup instructions.

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Testing
npm test
npm run test:watch
```

## Project Structure

```
TrailSense/
├── src/
│   ├── api/            # API client and endpoints
│   ├── components/     # Reusable UI components
│   ├── constants/      # App-wide constants
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Screen components
│   ├── services/       # Business logic services
│   ├── store/          # Redux store
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Utility functions
│   └── theme/          # Theme configuration
├── assets/             # Static assets
├── docs/               # Documentation
└── __tests__/          # Test files
```

## 🎭 Mock Mode Features

The app includes a comprehensive mock data system for development and testing:

### What's Included
- ✅ **55 alerts** - 30 days of history with mixed threat levels
- ✅ **5 devices** - 3 online, 2 offline with realistic battery/signal data
- ✅ **10 whitelist entries** - Family, guests, service, other categories
- ✅ **Real-time WebSocket** - New detection events every 5 seconds
- ✅ **Live Radar** - Fully functional with automatic updates
- ✅ **Analytics data** - Charts, graphs, heatmaps, trends
- ✅ **Auto-login** - Skip login screen (admin@trailsense.com)

### Toggle Mock Mode
```env
# .env file
USE_MOCK_API=true   # Mock mode (default)
USE_MOCK_API=false  # Real backend API
```

### Learn More
- **[QUICK-START.md](QUICK-START.md)** - One-page quick reference
- **[docs/GETTING-STARTED-MOCK-MODE.md](docs/GETTING-STARTED-MOCK-MODE.md)** - Complete setup guide
- **[docs/implementation/MOCK-WEBSOCKET.md](docs/implementation/MOCK-WEBSOCKET.md)** - WebSocket details

---

## Documentation

### Getting Started
- **[Quick Start Guide](QUICK-START.md)** - Get running in 3 minutes
- **[Mock Mode Guide](docs/GETTING-STARTED-MOCK-MODE.md)** - Complete walkthrough

### Project Planning
- [Project Overview](docs/plans/00-PROJECT-OVERVIEW.md)
- [Project Setup](docs/plans/01-PROJECT-SETUP.md)
- [Design System](docs/plans/02-DESIGN-SYSTEM.md)
- [Authentication](docs/plans/03-AUTHENTICATION.md)
- [Navigation](docs/plans/04-NAVIGATION.md)
- [State Management](docs/plans/05-STATE-MANAGEMENT.md)
- [Backend Integration](docs/plans/06-BACKEND-INTEGRATION.md)

### Implementation Guides
- [Mock WebSocket System](docs/implementation/MOCK-WEBSOCKET.md)

## License

Private - All rights reserved

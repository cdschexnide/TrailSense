# TrailSense Mobile App Demo Script

> **Purpose**: Comprehensive video demo guide for the TrailSense React Native mobile application
> **Estimated Total Demo Time**: 15-20 minutes
> **Prerequisites**: Database seeded, app running on tablet, backend connected

---

## Table of Contents

1. [Demo Overview & Setup](#demo-overview--setup)
2. [Feature 1: Authentication Flow](#feature-1-authentication-flow)
3. [Feature 2: Alerts Dashboard](#feature-2-alerts-dashboard)
4. [Feature 3: Alert Details & AI Summary](#feature-3-alert-details--ai-summary)
5. [Feature 4: Alert Filtering](#feature-4-alert-filtering)
6. [Feature 5: Proximity Heatmap (Radar)](#feature-5-proximity-heatmap-radar)
7. [Feature 6: Device Management](#feature-6-device-management)
8. [Feature 7: Device History & Fingerprinting](#feature-7-device-history--fingerprinting)
9. [Feature 8: AI Security Assistant](#feature-8-ai-security-assistant)
10. [Feature 9: Settings & Configuration](#feature-9-settings--configuration)
11. [Feature 10: Whitelist Management](#feature-10-whitelist-management)
12. [Feature 11: Vacation Mode](#feature-11-vacation-mode)
13. [Demo Flow Summary](#demo-flow-summary)

---

## Demo Overview & Setup

### What TrailSense Does (Opening Statement)
> "TrailSense is a comprehensive property security monitoring system. It uses ESP32-based sensors that perform passive scans of cellular, WiFi, and Bluetooth signals to detect devices approaching your property. All detection data flows through Golioth cloud to this mobile app, giving you real-time visibility into potential security threats."

### Pre-Demo Checklist
- [ ] App is logged out (to show login flow)
- [ ] Database has seeded alerts at various threat levels
- [ ] At least 2 TrailSense devices registered
- [ ] Some whitelist entries exist
- [ ] Backend server is running and connected

---

## Feature 1: Authentication Flow

### What to Demonstrate
- Clean login screen UI
- Email/password validation
- Secure authentication process
- Loading states and transitions

### Script
> "Let's start by logging into the TrailSense app. The app uses secure JWT-based authentication with tokens stored in encrypted device storage."

### Actions
1. **Show Login Screen** (pause 2-3 seconds)
   - Point out the clean, professional login interface
   - Note the TrailSense branding/logo

2. **Enter Credentials**
   - Type email: `demo@trailsense.io`
   - Type password: `••••••••`

3. **Tap Login Button**
   - Point out the loading indicator
   - Watch for smooth transition to main app

4. **Arrive at Home Screen**
   - Brief pause to show successful authentication
   - Point out the bottom navigation tabs

### Talking Points
> "Once authenticated, the app retrieves your devices and alerts from the cloud. You'll notice five main tabs: Alerts, Map, Devices, AI, and Settings."

---

## Feature 2: Alerts Dashboard

### What to Demonstrate
- Alert list with various threat levels
- Visual threat indicators (color-coded badges)
- Detection type icons (cellular, WiFi, Bluetooth)
- Signal strength (RSSI) display
- Pull-to-refresh functionality
- Search capability

### Script
> "The Alerts tab is your security command center. Every time a TrailSense sensor detects a device, it creates an alert with threat assessment."

### Actions
1. **Show Alert List** (pause 3-4 seconds)
   - Slowly scroll through the list
   - Point out different alert cards

2. **Highlight Threat Level Badges**
   - Point to a **Critical** alert (red badge)
   - Point to a **High** alert (orange badge)
   - Point to a **Medium** alert (yellow badge)
   - Point to a **Low** alert (green badge)

3. **Explain Threat Classification System**
   > "TrailSense uses a multi-factor scoring algorithm to classify threats. Let me explain what each level means:"

   | Level | Score | Description |
   |-------|-------|-------------|
   | **CRITICAL** | 70+ | Highest risk. Typically triggered by: cellular-only detection (device hiding WiFi/Bluetooth), very close proximity (RSSI > -50 dBm), nighttime detection (10 PM - 6 AM), AND stationary behavior. This combination suggests someone intentionally concealing their device while lingering near your property. |
   | **HIGH** | 50-69 | Elevated concern. Usually a device detected at close range during unusual hours, or a cellular-only detection during daytime. Warrants immediate review. |
   | **MEDIUM** | 30-49 | Moderate attention. Could be an unknown device at moderate distance, or daytime detection with some suspicious factors. Worth monitoring. |
   | **LOW** | <30 | Minimal concern. Often repeat visitors (seen 3+ times), devices detected at distance, or daytime detections with normal patterns. Likely routine activity. |

   **Scoring Factors Explained:**
   - **Cellular-only detection** (+40 pts): Device has WiFi and Bluetooth disabled - often indicates intentional concealment
   - **Multi-band detection** (+20 pts): Detected across multiple signal types - higher confidence in identification
   - **Very close proximity** (+30 pts): RSSI stronger than -50 dBm means device is within ~15 feet
   - **Moderate proximity** (+15 pts): RSSI between -50 and -70 dBm - device within ~50 feet
   - **Nighttime hours** (+20 pts): Detection between 10 PM and 6 AM raises suspicion
   - **Stationary behavior** (+15 pts): Device not moving - potential surveillance or loitering
   - **Repeat visitor** (-30 pts): Seen more than 3 times - likely a familiar/routine visitor

4. **Explain Detection Types**
   - Show a **Cellular** detection icon
   - Show a **WiFi** detection icon
   - Show a **Bluetooth** detection icon

5. **Demonstrate Pull-to-Refresh**
   - Pull down on the list
   - Show the refresh indicator
   - Wait for new data to load

6. **Use Search Bar**
   - Tap search icon
   - Type a partial MAC address or keyword
   - Show filtered results

### Talking Points
> "Each alert shows the detection type, threat level, signal strength in RSSI, and when it occurred. The color coding lets you quickly identify which alerts need immediate attention."

---

## Feature 3: Alert Details & AI Summary

### What to Demonstrate
- Full alert information display
- AI-generated alert summary (LLM feature)
- Mark as reviewed functionality
- Feedback mechanism

### Script
> "Let's dive into a specific alert. Tapping any alert opens the detail view with comprehensive information and an AI-generated summary."

### Actions
1. **Tap on a Critical or High Alert**
   - Select an interesting alert from the list
   - Wait for detail screen to load

2. **Review Alert Information** (pause for each section)
   - **Detection Type**: "This was detected via [Cellular/WiFi/Bluetooth]"
   - **Threat Level**: "Classified as [Critical/High/Medium/Low]"
   - **Signal Strength**: "RSSI of [X] dBm indicates the device was [close/far]"
   - **MAC Address**: "Unique identifier: [XX:XX:XX:XX:XX:XX]"
   - **Timestamp**: "Detected on [date] at [time]"
   - **Device**: "Captured by TrailSense sensor [name]"

3. **Show AI Summary Section**
   - Scroll to the AI Summary card
   - If loading, show the loading animation
   - Read the generated summary aloud

4. **Demonstrate "Mark as Reviewed"**
   - Tap the "Mark as Reviewed" button
   - Show the confirmation/status change

5. **Navigate Back**
   - Tap back arrow
   - Show alert now appears as reviewed in list

### Talking Points
> "The AI summary uses an on-device Llama model to provide human-readable context about the detection. This helps you quickly understand if this is a genuine threat or routine activity without analyzing raw signal data."

---

## Feature 4: Alert Filtering

### What to Demonstrate
- Filter by threat level
- Filter by detection type
- Multiple filter combination
- Reset filters

### Script
> "When you have many alerts, filtering helps you focus on what matters. Let's filter to see only critical threats."

### Actions
1. **Tap Filter Icon** (top right of alert list)
   - Show the filter screen appear

2. **Filter by Threat Level**
   - Show all options: Critical, High, Medium, Low
   - Select only "Critical" and "High"
   - Show checkmarks appear

3. **Filter by Detection Type**
   - Show options: Cellular, WiFi, Bluetooth, GPS
   - Select "Cellular" only
   - Show checkmark

4. **Apply Filters**
   - Tap Apply/Done button
   - Return to alert list
   - Show filtered results (fewer alerts)

5. **Reset Filters**
   - Return to filter screen
   - Tap "Reset" button
   - Show all filters cleared
   - Apply and show full list again

### Talking Points
> "You can combine filters - for example, show only critical cellular detections. This is useful when investigating specific threat patterns or device types."

---

## Feature 5: Proximity Heatmap (Radar)

### What to Demonstrate
- Interactive map visualization
- Proximity zones with color coding
- Satellite vs street view toggle
- Device switching between sensors
- Radar overlay visualization

### Script
> "The Map tab shows a proximity heatmap - a visual representation of where detections are occurring around your TrailSense sensors."

### Actions
1. **Navigate to Map Tab**
   - Tap the Map icon in bottom navigation
   - Wait for map to load

2. **Explain the Visualization** (pause 5+ seconds)
   - Point to the center (device location)
   - Explain the concentric zones:
     - "0-50 feet: Immediate proximity"
     - "50-150 feet: Close range"
     - "150-300 feet: Medium range"
     - "300-500 feet: Extended range"
     - "500-800 feet: Far detection"

3. **Show Color Intensity**
   - Point to high-density areas (brighter colors)
   - Point to low-density areas (dimmer colors)
   - "Brighter areas indicate more frequent detections"

4. **Toggle Map View**
   - Find satellite/street toggle
   - Switch to satellite view
   - Pause to show the satellite imagery
   - Switch back to street view

5. **Switch Between Devices** (if multiple devices exist)
   - Tap navigation arrows
   - Show map re-center on different device location
   - Point out different detection patterns

6. **Interact with Map**
   - Pinch to zoom out (show wider area)
   - Pinch to zoom in (show detail)
   - Pan around the map

### Talking Points
> "This heatmap aggregates all detections for the selected sensor. You can quickly identify if there's unusual activity in a specific direction or if detections cluster at certain distances - perhaps along a driveway or property boundary."

---

## Feature 6: Device Management

### What to Demonstrate
- Device list with status indicators
- Online/offline status
- Battery and signal strength
- Detection count per device
- Add new device flow

### Script
> "The Devices tab shows all your TrailSense sensors. You can monitor their health and manage your sensor network."

### Actions
1. **Navigate to Devices Tab**
   - Tap Devices icon in bottom navigation
   - Show device list

2. **Review Device Cards** (point to each element)
   - **Device Name**: "This sensor is named [name]"
   - **Status Indicator**: "Green dot means online, gray means offline"
   - **Battery Level**: "[X]% battery remaining"
   - **Signal Strength**: "LTE signal is [strong/weak]"
   - **Detection Count**: "Has captured [X] detections"

3. **Tap on a Device**
   - Open device detail screen
   - Show full device information:
     - Firmware version
     - GPS coordinates
     - Last seen timestamp
     - Detection statistics

4. **Demonstrate "Add Device" Flow**
   - Tap the "+" or "Add Device" button
   - Show two options:
     - **QR Code**: "Scan the device's QR code for automatic setup"
     - **Manual Entry**: "Or enter the device ID manually"
   - Enter a sample device name and ID (don't save if not actually adding)
   - Cancel/back out

5. **Return to Device List**
   - Navigate back
   - Show the complete device inventory

### Talking Points
> "TrailSense sensors are designed to be low-maintenance, but this view lets you keep an eye on battery levels and connectivity. You'll get notified if a device goes offline or needs attention."

---

## Feature 7: Device History & Fingerprinting

### What to Demonstrate
- Historical detection data for a device
- Visit statistics
- Detection timeline
- RSSI values over time
- Pattern recognition insights

### Script
> "Each device maintains a history of all detections it's captured. Let's look at the detection history for one of our sensors."

### Actions
1. **From Device Detail Screen**
   - Tap "View History" button
   - Wait for history screen to load

2. **Show History Statistics**
   - Total visits count
   - Average visit duration
   - Most common detection hours
   - Detection type breakdown

3. **Scroll Through Detection Timeline**
   - Show individual detection entries
   - Point out timestamps
   - Show RSSI values (signal strength over time)
   - Detection types for each entry

4. **Explain Fingerprinting**
   > "The app builds a fingerprint of activity patterns - learning when regular visitors like mail carriers arrive versus unusual activity."

5. **Return to Device List**
   - Navigate back through the screens

### Talking Points
> "This history helps identify patterns. If you see a device detected at 2 AM regularly, that's more concerning than one detected at 3 PM when you expect deliveries."

---

## Feature 8: AI Security Assistant

### What to Demonstrate
- Conversational AI interface
- Security status overview
- Contextual suggestion chips
- Chat history persistence
- Real-time responses

### Script
> "TrailSense includes an on-device AI assistant powered by a Llama language model. It can answer questions about your security status and provide insights."

### Actions
1. **Navigate to AI Tab**
   - Tap AI icon in bottom navigation
   - Wait for AI interface to load

2. **Show Security Status Card** (if visible)
   - Point out current stats:
     - Unreviewed alerts count
     - Critical alerts count
     - Devices online/offline
     - Low battery warnings

3. **Show Suggestion Chips**
   - Point to the contextual suggestions
   - "These suggestions are based on your current security status"
   - Examples: "What's my security status?", "Summarize today's alerts"

4. **Tap a Suggestion Chip**
   - Select one like "What's my security status?"
   - Watch the response stream in

5. **Type a Custom Question**
   - Tap the text input
   - Type: "Are there any unusual patterns in recent detections?"
   - Send the message
   - Wait for AI response

6. **Ask a Follow-up Question**
   - Type: "Should I be concerned about the cellular detections?"
   - Send and wait for response

7. **Scroll Through Chat History**
   - Show that messages persist
   - "Your conversation history is saved locally"

### Talking Points
> "The AI runs entirely on your device for privacy - your security data never leaves your phone for AI processing. It can analyze patterns, summarize alerts, and provide security recommendations."

### Sample Questions to Ask
- "What's my security status?"
- "Summarize today's alerts"
- "Are there any suspicious patterns?"
- "Which device has the most detections?"
- "What should I do about the critical alert?"

---

## Feature 9: Settings & Configuration

### What to Demonstrate
- Settings organization
- Detection sensitivity adjustment
- Notification preferences
- Quiet hours configuration
- Theme options

### Script
> "The Settings tab lets you customize TrailSense to match your security needs and preferences. Let's explore the key configuration options."

### Actions
1. **Navigate to Settings Tab**
   - Tap Settings icon in bottom navigation
   - Show the organized settings menu

2. **Walk Through Settings Sections** (point to each)
   - **Detection**: Sensitivity, Quiet Hours
   - **Notifications**: Push, Sound, Alerts by level
   - **Appearance**: Theme (Light/Dark)
   - **Security**: Biometric, Whitelist
   - **Account**: Profile, Security, About

3. **Open Detection Sensitivity**
   - Tap "Sensitivity" option
   - Show the four levels:
     - **Low**: Fewer false positives
     - **Medium**: Recommended balance
     - **High**: Comprehensive detection
     - **Maximum**: Highest sensitivity
   - Select "Medium" or current preference
   - Tap Save

4. **Open Notification Settings**
   - Tap "Notifications" option
   - Show toggles:
     - Push notifications: ON/OFF
     - Alert sound: ON/OFF
     - Vibration: ON/OFF
   - Show threat level filters:
     - Critical: ON
     - High: ON
     - Medium: ON/OFF
     - Low: OFF
   - "You can choose which threat levels trigger notifications"

5. **Open Quiet Hours**
   - Tap "Quiet Hours" option
   - Show the toggle to enable
   - Show time pickers:
     - Start time: 10:00 PM
     - End time: 7:00 AM
   - "Critical alerts still come through during quiet hours"

6. **Return to Settings Home**
   - Navigate back

### Talking Points
> "The sensitivity setting is important - if you're getting too many false positives, lower it. If you want to catch everything, increase it. Quiet hours prevent notifications during sleep but still capture critical threats."

---

## Feature 10: Whitelist Management

### What to Demonstrate
- Whitelist concept explanation
- View existing whitelist entries
- Add a new trusted device
- Device categories
- Temporary whitelist option

### Script
> "The Whitelist feature lets you register known devices - like family phones or smart home devices - so they don't trigger alerts."

### Actions
1. **Navigate to Whitelist**
   - From Settings, tap "Whitelist"
   - Show existing whitelist entries

2. **Show Whitelist Entry Details**
   - Point to device name
   - Point to MAC address
   - Point to category (Family, Guest, Service, Other)

3. **Swipe to Delete** (optional demo)
   - Swipe left on an entry
   - Show delete button (don't actually delete)
   - Cancel/swipe back

4. **Add New Whitelist Entry**
   - Tap "+" or "Add" button
   - Show the add whitelist form

5. **Fill Out Form**
   - **Device Name**: "Mom's iPhone"
   - **MAC Address**: Enter sample MAC (XX:XX:XX:XX:XX:XX)
   - Show MAC format validation
   - **Category**: Tap "Family"
   - **Temporary**: Toggle ON
   - **Expires In**: "7 days"

6. **Explain Categories**
   - "Family: Regular household members"
   - "Guests: Temporary visitors"
   - "Service: Delivery, contractors"
   - "Other: Miscellaneous trusted devices"

7. **Save Entry**
   - Tap Save button
   - Show success confirmation
   - Return to whitelist showing new entry

### Talking Points
> "Whitelisting is crucial for reducing noise. Your own devices, family phones, and regular visitors can be added so only unknown devices trigger alerts. Temporary whitelisting is perfect for house guests or service appointments."

---

## Feature 11: Vacation Mode

### What to Demonstrate
- Vacation mode purpose
- Date range selection
- Enhanced sensitivity options
- Feature list explanation

### Script
> "When you're away from home, Vacation Mode provides enhanced security monitoring. All detections are treated with higher priority."

### Actions
1. **Navigate to Vacation Mode**
   - From Settings, tap "Vacation Mode"
   - Show the vacation mode screen

2. **Explain the Toggle**
   - "This master switch enables vacation mode"
   - Toggle ON

3. **Set Date Range**
   - Tap "Start Date" picker
   - Select a date (e.g., next week)
   - Tap "End Date" picker
   - Select return date

4. **Set Sensitivity Level**
   - Show options: Low, Medium, High
   - Select "High" for vacation
   - "Higher sensitivity while you're away"

5. **Review Feature List**
   - "Maximum alert volume"
   - "All detections treated as critical"
   - "Daily summary reports"
   - "Increased detection sensitivity"

6. **Save Configuration**
   - Tap Save/Enable button
   - Show confirmation

7. **Toggle OFF** (for demo cleanup)
   - Disable vacation mode
   - "We'll turn this off for now"

### Talking Points
> "Vacation mode is designed for peace of mind when you're traveling. Every detection gets your attention, and you receive daily summary reports of all activity around your property."

---

## Demo Flow Summary

### Recommended Demo Order (15-20 min)

| Order | Feature | Duration | Key Points |
|-------|---------|----------|------------|
| 1 | Login | 1 min | Secure auth, clean UI |
| 2 | Alerts Dashboard | 2 min | Threat levels, detection types, search |
| 3 | Alert Details + AI | 2 min | Full info, AI summary |
| 4 | Alert Filtering | 1 min | Multi-filter, reset |
| 5 | Proximity Heatmap | 3 min | Zones, map views, device switching |
| 6 | Device Management | 2 min | Status, add device |
| 7 | Device History | 1 min | Timeline, patterns |
| 8 | AI Assistant | 3 min | Chat, suggestions, questions |
| 9 | Settings | 2 min | Sensitivity, notifications, quiet hours |
| 10 | Whitelist | 2 min | Add trusted device, categories |
| 11 | Vacation Mode | 1 min | Enhanced monitoring |

### Opening Hook
> "Imagine knowing exactly who and what is approaching your property - day or night, whether you're home or away. TrailSense makes that possible with passive signal detection and AI-powered analysis."

### Closing Statement
> "TrailSense transforms passive signal intelligence into actionable security insights. With real-time alerts, AI-powered analysis, and comprehensive device management, you have complete visibility into the electromagnetic activity around your property - all in the palm of your hand."

---

## Quick Reference: Navigation Paths

| Feature | Navigation Path |
|---------|----------------|
| Alert List | Home → Alerts Tab |
| Alert Detail | Alerts Tab → Tap Alert |
| Alert Filters | Alerts Tab → Filter Icon |
| Proximity Map | Map Tab |
| Device List | Devices Tab |
| Device Detail | Devices Tab → Tap Device |
| Device History | Device Detail → View History |
| Add Device | Devices Tab → + Button |
| AI Assistant | AI Tab |
| Settings Home | Settings Tab |
| Sensitivity | Settings → Detection → Sensitivity |
| Quiet Hours | Settings → Detection → Quiet Hours |
| Notifications | Settings → Notifications |
| Whitelist | Settings → Security → Whitelist |
| Add Whitelist | Whitelist → + Button |
| Vacation Mode | Settings → Detection → Vacation Mode |
| Profile | Settings → Account → Profile |

---

## Troubleshooting During Demo

| Issue | Solution |
|-------|----------|
| No alerts showing | Pull to refresh, check backend connection |
| Map not loading | Check Mapbox token, internet connection |
| AI not responding | Model may be loading, wait for initialization |
| Device offline | Expected behavior, demonstrate monitoring |
| Slow performance | Close other apps, restart if needed |

---

## Post-Demo Notes

After the demo, consider mentioning:
- **Hardware Integration**: ESP32 sensors with LTE connectivity
- **Cloud Platform**: Golioth for reliable data transmission
- **Privacy**: On-device AI, no cloud LLM calls
- **Scalability**: Manage multiple properties and sensors
- **Future Features**: Dashboard analytics, automated responses, smart home integration

---

*Document Version: 1.0*
*Last Updated: December 2025*
*TrailSense Mobile App Demo Script*

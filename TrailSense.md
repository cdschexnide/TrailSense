# TrailSense: Distributed Mobile Device Detection System

## Technical Documentation

**Document Status:** Early R&D Phase  
**Last Updated:** November 16, 2025  
**Major Update:** Added Cellular Uplink Detection Capability

---

## Executive Summary

This document outlines the technical architecture and implementation details of a property intrusion detection system that uses passive wireless scanning to detect unauthorized presence via mobile devices. The system leverages ESP32 microcontroller technology with **enhanced cellular uplink detection**, LTE connectivity, and multi-band RF scanning to provide real-time alerts to property owners through a mobile application.

**Key Enhancement:** Addition of passive cellular uplink detection extends detection range to 500-800+ feet, providing 3-5x greater coverage than WiFi/Bluetooth alone.

---

## 1. System Overview

### 1.1 Purpose

Detect potential trespassers on private property by identifying their mobile devices through passive WiFi, Bluetooth, and **cellular uplink** scanning, providing real-time alerts to property owners with significantly extended detection range.

### 1.2 Core Components

- **Detection Device:** ESP32 microcontroller with external antenna
- **Cellular Detection Module:** AD8313 RF detector with LNA and wideband antenna
- **Connectivity:** LTE modem for cellular data transmission
- **Mobile Application:** React Native cross-platform app (iOS/Android)
- **Communication Protocol:** Cloud-based alert and data transmission system

### 1.3 Detection Methodology

The system operates by passively scanning for:

- **WiFi probe requests** from smartphones searching for networks (300 ft range)
- **Bluetooth/BLE advertisements** from nearby devices (100 ft range)
- **Cellular uplink transmissions** from phones to cell towers (500-800+ ft range)
- Device MAC addresses and signal strength (RSSI) for WiFi/BT
- RF power levels in cellular bands (824-849 MHz primary)

---

## 2. Hardware Architecture

### 2.1 ESP32 Microcontroller

#### 2.1.1 Specifications

- **Processor:** Dual-core Xtensa LX6 (up to 240 MHz)
- **RAM:** 520 KB SRAM
- **Flash:** 4-16 MB (depending on module variant)
- **Wireless Capabilities:**
  - WiFi: 802.11 b/g/n (2.4 GHz)
  - Bluetooth: v4.2 BR/EDR and BLE
- **ADC:** 12-bit SAR ADC for cellular detector interface

#### 2.1.2 Recommended Module

- **ESP32-WROOM-32D** or similar variant
- Reason: General-purpose design with maximum GPIO availability
- Alternative: ESP32-WROVER for additional RAM if needed

### 2.2 Cellular Detection Subsystem

#### 2.2.1 RF Power Detector

- **Component:** AD8313 Logarithmic RF Detector Module
- **Frequency Range:** 0.1 - 2.5 GHz
- **Sensitivity:** -70 to 0 dBm
- **Output:** 0-2.5V analog (connected to ESP32 ADC)
- **Current Draw:** 16mA @ 3.3V
- **Purpose:** Detect cellular uplink transmissions in 824-849 MHz (Band 5) and other cellular bands

#### 2.2.2 Low Noise Amplifier (LNA)

- **Component:** SPF5189Z LNA Module
- **Frequency Range:** 50-4000 MHz
- **Gain:** 20 dB typical
- **Noise Figure:** 0.6 dB
- **Current Draw:** 60mA @ 5V
- **Purpose:** Amplify weak cellular signals, extending detection range by 3-5x

#### 2.2.3 Cellular Detection Antenna

- **Type:** Wideband Log Periodic or Omni-directional
- **Frequency Range:** 700-2700 MHz
- **Gain:** 7-9 dBi (omni) or 11-14 dBi (directional)
- **Connector:** SMA
- **Mounting:** Weatherproof outdoor rated
- **Purpose:** Capture cellular uplink signals from mobile devices

#### 2.2.4 Detection Performance

- **Passive Detection Range:**
  - Idle phones: 500-800 ft
  - Active calls/data: 800-1200 ft
  - Best case (directional): 1500+ ft
- **Coverage Area:** ~26 acres with omni antenna
- **Response Time:** <100ms for active transmissions

### 2.3 WiFi/Bluetooth External Antenna

#### 2.3.1 Purpose

- Extended detection range (50-100+ meters vs 10-30 meters with onboard antenna)
- Improved signal sensitivity for weak mobile device signals
- Better performance in outdoor/challenging RF environments

#### 2.3.2 Antenna Specifications

- **Type:** External 2.4 GHz omnidirectional antenna
- **Connector:** U.FL/IPEX to RP-SMA
- **Gain:** 3-5 dBi recommended for balance of range and coverage pattern
- **Mounting:** Weatherproof outdoor rated

### 2.4 LTE Modem

#### 2.4.1 Purpose

- Cellular data connectivity for remote property locations
- Eliminates dependency on local WiFi infrastructure
- Enables deployment in areas without broadband access

#### 2.4.2 Recommended Modules

- **SIM7600** series (LTE Cat-4, global bands)
- **SIM7000** series (LTE Cat-M/NB-IoT, lower power)
- **Quectel BG96/BG77** (NB-IoT/Cat-M alternative)

#### 2.4.3 Interface

- **Communication:** UART/Serial (AT commands)
- **Power:** Separate 3.7-4.2V supply (peak current 2A during transmission)
- **Data Protocol:** HTTP/HTTPS, MQTT, or TCP/IP sockets

#### 2.4.4 Data Requirements

- **Alert payload:** ~1-5 KB per detection event
- **Estimated monthly data:** 10-100 MB depending on detection frequency
- **Recommended plan:** IoT data plan (100 MB - 1 GB/month)

### 2.5 Power System

#### 2.5.1 Power Budget Analysis (Updated)

| Component                          | Current Draw   | Notes                      |
| ---------------------------------- | -------------- | -------------------------- |
| ESP32 (WiFi scan)                  | 15-30 mA       | Passive scanning mode      |
| ESP32 (BT scan)                    | 20-40 mA       | BLE scanning               |
| ESP32 (Deep sleep)                 | 10-150 μA      | Between scan cycles        |
| **AD8313 RF Detector**             | **16 mA**      | **Continuous monitoring**  |
| **LNA (SPF5189Z)**                 | **60 mA @ 5V** | **Signal amplification**   |
| LTE modem (idle)                   | 10-30 mA       | Connected, no transmission |
| LTE modem (TX)                     | 500-2000 mA    | Peak during transmission   |
| LTE modem (sleep)                  | 1-5 mA         | Power save mode            |
| **Average (active scanning)**      | **140-180 mA** | **All systems active**     |
| **Average (optimized duty cycle)** | **50-70 mA**   | **With sleep periods**     |

#### 2.5.2 Power Supply Options

**Option A: Mains Power (Recommended for Prototype)**

- 5V/3A wall adapter (increased from 2A for LNA)
- Voltage regulation to 3.3V for ESP32/AD8313, 5V for LNA, 3.7-4.2V for LTE modem
- Simplest implementation, no battery management needed

**Option B: Battery + Solar (For Remote Deployment)**

- 18650 Li-ion battery pack (3S2P: 11.1V, 7500+ mAh) - increased capacity
- Solar panel: 10-15W, 12V with charge controller
- Buck converters for voltage regulation
- Battery management system (BMS) for protection
- Estimated runtime: Days to weeks depending on sunlight and duty cycle

**Option C: Battery Only**

- Large Li-ion battery pack (10,000+ mAh)
- Requires periodic recharging/replacement
- Runtime: 7-30 days depending on duty cycle optimization

#### 2.5.3 Power Optimization Strategies

- Implement duty-cycled scanning (scan 2-5 sec, sleep 30-60 sec)
- Use ESP32 deep sleep between scan intervals
- Put LTE modem in power save mode when not transmitting
- Optimize scan parameters (channel selection, scan duration)
- **Estimated optimized consumption:** 50-70 mA average

---

## 3. Software Architecture

### 3.1 ESP32 Firmware

#### 3.1.1 Development Environment

- **Framework:** ESP-IDF (Espressif IoT Development Framework) or Arduino
- **Language:** C/C++
- **Build System:** CMake (ESP-IDF) or Arduino IDE
- **Programming:** USB-Serial (UART) via CP2102/CH340 adapter

#### 3.1.2 Core Functional Modules

**A. Cellular Detection Module (NEW)**

```c
Functions:
- Initialize AD8313 ADC interface
- Continuous RF power monitoring in cellular bands
- Signal averaging and noise floor calibration
- Peak detection for cellular bursts
- Timestamp and log cellular events
- Correlate with WiFi/BT detections for validation

Key Parameters:
- Sample rate: 1000 Hz
- Detection threshold: -65 dBm (adjustable)
- Averaging window: 50 samples
- Burst detection: >3dB above noise floor
```

**B. WiFi Scanning Module**

```c
Functions:
- Initialize WiFi in promiscuous/scanning mode
- Perform passive channel scans (channels 1-13)
- Capture probe requests and beacon frames
- Extract MAC addresses, SSID (if available), RSSI
- Filter and deduplicate detected devices
```

**C. Bluetooth Scanning Module**

```c
Functions:
- Initialize BLE scanner
- Passive BLE advertisement scanning
- Classic Bluetooth inquiry (optional)
- Extract MAC addresses, device names, RSSI, UUID
- Maintain scan cache to avoid duplicate alerts
```

**D. Detection Logic (Enhanced)**

```c
Functions:
- Multi-source correlation (WiFi + BT + Cellular)
- Maintain whitelist of known/authorized devices
- Identify unknown devices
- Apply signal strength thresholds
- Temporal filtering (sustained presence detection)
- Priority alerting based on detection type:
  1. Cellular only (highest priority - possible WiFi/BT disabled)
  2. Multiple sources (confirmed presence)
  3. Single WiFi/BT (lower priority)
```

**E. LTE Communication Module**

```c
Functions:
- Initialize LTE modem (AT command interface)
- Network registration and connectivity
- HTTP/MQTT client for cloud communication
- Transmit detection alerts and telemetry
- Handle network failures and retries
```

**F. Power Management**

```c
Functions:
- Implement deep sleep between scan cycles
- Wake on timer for periodic scanning
- Monitor battery voltage (if battery powered)
- Emergency shutdown on low battery
```

#### 3.1.3 Enhanced Detection Algorithm

**Multi-Band Detection Flow:**

```c
// Main detection loop
void detectionTask() {
    // 1. Check cellular detector (continuous)
    int cellular_rssi = readCellularDetector();

    // 2. WiFi scan (2-3 seconds)
    wifi_detections = performWiFiScan();

    // 3. Bluetooth scan (2-3 seconds)
    bt_detections = performBluetoothScan();

    // 4. Correlate all sources
    if (cellular_rssi > CELL_THRESHOLD) {
        // Cellular detection - highest confidence
        if (wifi_detections.empty() && bt_detections.empty()) {
            // Phone has WiFi/BT disabled - high threat
            generateAlert(PRIORITY_HIGH, "Cellular only", cellular_rssi);
        } else {
            // Multi-source confirmation
            generateAlert(PRIORITY_CRITICAL, "Multi-band", cellular_rssi);
        }
    } else if (!wifi_detections.empty() || !bt_detections.empty()) {
        // WiFi/BT only - standard detection
        generateAlert(PRIORITY_NORMAL, "WiFi/BT", rssi);
    }

    // 5. Sleep cycle (adjustable 10-30 seconds)
    enterLightSleep(SCAN_INTERVAL);
}

// Cellular detector interface
int readCellularDetector() {
    const int SAMPLES = 50;
    const int CELL_DETECT_PIN = 34;  // ADC GPIO

    int sum = 0;
    int peak = 0;

    for(int i = 0; i < SAMPLES; i++) {
        int reading = analogRead(CELL_DETECT_PIN);
        sum += reading;
        if(reading > peak) peak = reading;
        delayMicroseconds(100);
    }

    int avg = sum / SAMPLES;

    // Convert ADC to dBm (AD8313: 0.5V=-70dBm, 2.5V=0dBm)
    int rssi_dbm = map(avg, 614, 3100, -70, 0);

    // Check for burst detection (phone transmission)
    if(peak > avg * 1.5) {
        logEvent("Cellular burst detected: %d dBm", rssi_dbm);
        return rssi_dbm;
    }

    return -100;  // No significant detection
}
```

#### 3.1.4 Data Payload Structure (Updated)

**Enhanced Detection Alert Format (JSON):**

```json
{
  "device_id": "ESP32_A1B2C3D4E5F6",
  "timestamp": "2025-11-15T09:55:32Z",
  "location": {
    "latitude": 29.7604,
    "longitude": -95.3698,
    "property_id": "PROP_12345"
  },
  "detections": [
    {
      "type": "cellular",
      "rssi": -55,
      "band": "850MHz",
      "confidence": "high",
      "first_seen": "2025-11-15T09:54:15Z",
      "burst_count": 5
    },
    {
      "type": "wifi",
      "mac_address": "XX:XX:XX:XX:XX:XX",
      "rssi": -65,
      "ssid": "iPhone",
      "vendor": "Apple Inc."
    }
  ],
  "threat_level": "high",
  "estimated_distance": "650ft",
  "status": "active_intrusion"
}
```

### 3.2 Cloud Backend

#### 3.2.1 Architecture Requirements (Updated)

- RESTful API or MQTT broker for device communication
- Authentication and device registration
- User account management
- **Multi-source detection correlation and analysis**
- **Cellular detection pattern recognition**
- Alert processing and routing with priority levels
- Push notification service integration
- Database for detection logs and device registry
- Web dashboard with detection heatmaps

#### 3.2.2 Technology Stack Options

- **Backend:** Node.js (Express), Python (FastAPI/Django), Go
- **Database:** PostgreSQL, MongoDB, Firebase Realtime Database
- **Message Queue:** RabbitMQ, AWS IoT Core, Google Cloud IoT
- **Push Notifications:** Firebase Cloud Messaging (FCM), AWS SNS
- **Hosting:** AWS, Google Cloud Platform, Azure, or DigitalOcean

#### 3.2.3 API Endpoints (Example)

```
POST /api/v1/devices/register
- Register new detection device
- Authenticate device, assign device_id

POST /api/v1/alerts
- Receive detection alerts from device
- Process and route to mobile app

GET /api/v1/alerts?device_id=XXX&limit=50
- Retrieve alert history

POST /api/v1/devices/whitelist
- Add/remove devices from whitelist

GET /api/v1/devices/status
- Device health and connectivity status
```

### 3.3 Mobile Application (React Native)

#### 3.3.1 Platform Support

- **iOS:** Version 13.0+
- **Android:** API Level 21+ (Android 5.0+)
- Single codebase for both platforms

#### 3.3.2 Core Features

**A. Authentication & User Management**

- User registration and login
- Multi-factor authentication (optional)
- Password reset functionality
- User profile management

**B. Device Management**

- Add/remove detection devices
- Configure device settings
- View device status and connectivity
- Device location on map

**C. Alert Interface**

- Real-time push notifications
- Alert list view with timestamps
- Detection details (MAC, RSSI, type, cellular strength)
- Alert filtering and search
- Mark alerts as reviewed/false positive

**D. Whitelist Management**

- Add known devices to whitelist
- Auto-learn from user feedback
- Import devices by MAC address
- Categorize devices (family, guests, service personnel)

**E. Settings & Configuration**

- Detection sensitivity adjustment
- Alert preferences (quiet hours, geofencing)
- Notification settings
- System arm/disarm schedule
- Privacy settings

#### 3.3.3 Technology Stack

**React Native Dependencies:**

```javascript
- react-native (core framework)
- @react-navigation/native (navigation)
- react-native-push-notification (local notifications)
- @react-native-firebase/messaging (FCM)
- react-native-maps (device location display)
- axios (HTTP client)
- @react-native-async-storage (local data)
- react-native-permissions (app permissions)
```

**State Management:**

- Redux or Context API for global state
- React Query for server state management

**Backend Communication:**

- RESTful API over HTTPS
- WebSocket or FCM for real-time alerts

#### 3.3.4 Push Notification Flow

1. Device detects unknown presence
2. Device sends alert to cloud backend
3. Backend processes alert, identifies user/device association
4. Backend sends push notification via FCM
5. Mobile app receives notification (even when closed)
6. User taps notification to view details
7. User can take action (call authorities, dismiss, add to whitelist)

---

## 4. Deployment Considerations

### 4.1 Physical Installation

#### 4.1.1 Antenna Configuration

- **Cellular antenna:** Mount highest (priority for range)
- **WiFi/BT antenna:** Secondary position
- **Separation:** Minimum 12 inches between antennas
- **Orientation:**
  - Omni antennas: vertical polarization
  - Directional: aimed at likely approach paths

#### 4.1.2 Detection Range (Updated)

- **Cellular:** 500-800 ft typical (1200+ ft optimal conditions)
- **WiFi:** 50-150 meters with external antenna (line of sight)
- **Bluetooth:** 30-100 meters with external antenna
- **Combined coverage:** ~26 acres with omni configuration
- **Factors affecting range:**
  - Antenna gain and quality
  - Mounting height (10 ft elevation = +50-100 ft range)
  - Obstacles (walls, vegetation, terrain)
  - Mobile device transmit power
  - Environmental RF noise

#### 4.1.3 Environmental Considerations

- **Operating temperature:** -20°C to +60°C (extended range ESP32)
- **Humidity:** Weatherproof enclosure required for outdoor use
- **Power:** Surge protection for mains-powered installations
- **Lightning protection:** Grounding and arrestors for antenna

### 4.2 Legal and Privacy Considerations

#### 4.2.1 Cellular Detection Compliance

- **Passive monitoring only:** No transmission to mobile devices
- **FCC Part 15:** Compliant as passive receiver
- **No content interception:** Only detecting RF power levels
- **Legal in all US jurisdictions:** Monitoring public radio frequencies
- **Similar to:** Police radar detectors (legal precedent)

#### 4.2.2 Privacy Compliance

- **Data minimization:** Collect only MAC addresses and signal strength
- **No content interception:** Passive scanning only, no packet capture
- **Anonymization:** Hash MAC addresses before storage
- **Retention policy:** Auto-delete detection logs after 30-90 days
- **User consent:** Property signage indicating monitoring
- **Whitelist consent:** Visitors can opt-in to whitelist

#### 4.2.3 Regulatory Compliance

- **FCC Part 15 (USA):** Compliance for radio frequency devices
- **CE marking (EU):** If deploying in European markets
- **GDPR/CCPA:** If storing personal data (MAC addresses may be considered PII)
- **Wiretapping laws:** Verify passive scanning legality in jurisdiction
- **Property rights:** Owner authorization required for installation

#### 4.2.4 Recommended Privacy Practices

- Display clear signage: "Wireless Device Detection Active"
- Provide opt-out mechanism for visitors
- Encrypt all data in transit and at rest
- Implement access controls on mobile app
- Provide data access and deletion rights to users
- Maintain audit logs of system access

### 4.3 Security Considerations

#### 4.3.1 Device Security

- Secure boot and firmware encryption (ESP32 flash encryption)
- Over-the-air (OTA) firmware updates with signature verification
- Unique device credentials (no hardcoded passwords)
- Secure storage of API keys and certificates
- Tamper detection (optional: physical security sensors)

#### 4.3.2 Communication Security

- TLS/SSL encryption for all cloud communication
- Certificate pinning for API connections
- Mutual authentication (device and server)
- Replay attack prevention (nonces, timestamps)

#### 4.3.3 Application Security

- Mobile app authentication tokens with expiration
- Biometric authentication option (fingerprint/face)
- Encrypted local storage on mobile device
- API rate limiting to prevent abuse
- Input validation and sanitization

---

## 5. Testing and Validation

### 5.1 Functional Testing

#### 5.1.1 Cellular Detection Testing

- Test detection at 200, 400, 600, 800, 1000 ft distances
- Verify detection with phones in different states:
  - Idle/standby
  - Active call
  - Data streaming
  - Airplane mode (should not detect)
- Test with WiFi/Bluetooth disabled
- Measure cellular burst patterns and timing

#### 5.1.2 Multi-Band Correlation Testing

- Verify correlation between cellular and WiFi/BT detections
- Test detection priority logic
- Validate distance estimation algorithms
- Measure false positive/negative rates for each band

#### 5.1.3 Detection Accuracy

- Test detection range at various distances
- Verify detection of different device types (iOS, Android, wearables)
- Measure false positive rate
- Measure false negative rate (missed detections)
- Test whitelist filtering accuracy

#### 5.1.4 Connectivity Testing

- LTE modem reliability across different carriers
- Alert delivery latency (device to mobile app)
- Network failover and recovery
- Low signal condition handling

#### 5.1.5 Power Testing

- Measure actual power consumption in various modes
- Battery life validation (if battery powered)
- Solar charging efficiency testing (if solar)
- Power supply fault recovery

### 5.2 Environmental Testing

- Temperature extremes (-20°C to +60°C)
- Humidity and water resistance (IP rating validation)
- RF interference scenarios (WiFi congestion, microwave ovens)
- Extended outdoor deployment (UV degradation, corrosion)

### 5.3 User Acceptance Testing

- Mobile app usability testing
- Alert notification clarity and timing
- Onboarding and setup process
- Whitelist management workflow

---

## 6. Bill of Materials (BOM) - Updated

### 6.1 Prototype Hardware

| Component                | Part Number              | Quantity | Est. Cost | Notes                     |
| ------------------------ | ------------------------ | -------- | --------- | ------------------------- |
| ESP32 Module             | ESP32-WROOM-32D          | 1        | $8        | Main microcontroller      |
| **AD8313 RF Detector**   | **AD8313 Module w/SMA**  | **1**    | **$20**   | **Cellular detection**    |
| **Cellular Antenna**     | **700-2700MHz 7dBi Log** | **1**    | **$25**   | **Cellular RF reception** |
| **LNA Module**           | **SPF5189Z**             | **1**    | **$8**    | **20dB gain amplifier**   |
| **SMA Cables**           | **SMA M-M 1ft**          | **2**    | **$10**   | **RF connections**        |
| WiFi/BT External Antenna | 2.4GHz 5dBi RP-SMA       | 1        | $5        | WiFi/BT range extension   |
| U.FL to RP-SMA Cable     | Pigtail adapter          | 1        | $3        | Antenna connection        |
| LTE Modem                | SIM7600A-H Module        | 1        | $35       | LTE Cat-4, US bands       |
| LTE Antenna              | 4G LTE External          | 1        | $8        | Cellular connectivity     |
| SIM Card                 | IoT Data Plan            | 1        | $10/mo    | Cellular service          |
| Power Supply             | 5V/3A Wall Adapter       | 1        | $10       | Mains power (increased)   |
| Voltage Regulators       | LM1117-3.3, 5V Buck      | 3        | $5        | Multi-voltage support     |
| Enclosure                | IP65 Weatherproof Box    | 1        | $20       | Larger for antennas       |
| PCB/Breadboard           | Custom or prototype      | 1        | $10       | Component mounting        |
| Miscellaneous            | Resistors, caps, wires   | -        | $5        | Support components        |
| **TOTAL (Prototype)**    |                          |          | **~$182** | **Single unit**           |

### 6.2 Production Considerations

- Custom PCB design with integrated RF sections: $1000-3000 (NRE), $15-25/unit
- Volume pricing on components: 30-50% reduction at 100+ units
- RF shielding and layout optimization critical
- Enclosure tooling: $2000-5000 (custom), $15-30/unit
- Certifications (FCC, CE): $5000-15000 one-time
- **Estimated production cost (volume >100):** $90-110/unit

---

## 7. Development Roadmap

### 7.1 Phase 1: Proof of Concept (Current)

- ✓ Working prototype assembled
- ✓ Basic WiFi and Bluetooth scanning functional
- ✓ LTE connectivity established
- ✓ Simple alert mechanism working
- **→ Cellular detection module integration (in progress)**
- **Milestone:** Demonstrate multi-band detection capability

### 7.2 Phase 2: Alpha Development (1-2 months)

- Optimize cellular detection algorithms
- Implement multi-source correlation
- Fine-tune detection thresholds for each band
- Develop cloud backend infrastructure
- Create basic React Native mobile app
- Implement priority-based push notifications
- **Milestone:** End-to-end system with 500+ ft detection range

### 7.3 Phase 3: Beta Testing (2-3 months)

- Field deployment at test locations
- Gather detection accuracy metrics
- User acceptance testing with property owners
- Iterate on mobile app UX
- Stress testing and reliability improvements
- **Milestone:** Production-ready system

### 7.4 Phase 4: Production Launch (3-6 months)

- Custom PCB design and manufacturing
- FCC/CE certification
- Volume component procurement
- Production enclosure tooling
- Launch marketing and sales
- **Milestone:** Commercial product release

### 7.5 Future Enhancements

- Multi-device coordination (mesh network)
- Machine learning for behavior analysis
- Integration with third-party security systems
- Computer vision (camera add-on for visual confirmation)
- Voice assistant integration (Alexa, Google Home)
- Web dashboard for property management companies
- Drone detection capabilities
- License plate recognition integration

---

## 8. Key Performance Indicators (KPIs) - Updated

### 8.1 Technical Metrics

- **Detection Range:**
  - Cellular: 500-800+ ft (primary)
  - WiFi: 150-300 ft (secondary)
  - Bluetooth: 50-100 ft (tertiary)
- **Combined Coverage Area:** ~26 acres per node
- **Detection Accuracy:** >95% for devices within range
- **False Positive Rate:** <5%
- **Alert Latency:** <30 seconds from detection to mobile notification
- **System Uptime:** >99% (excluding maintenance)
- **Battery Life (if applicable):** 7+ days continuous operation

### 8.2 User Experience Metrics

- **Setup Time:** <10 minutes for average user
- **App Response Time:** <2 seconds for all interactions
- **Notification Delivery:** >99% success rate
- **User Satisfaction:** Target 4.5+ stars on app stores

### 8.3 Competitive Advantage

- **3-5x greater range** than WiFi-only systems
- **Works with WiFi/BT disabled** on target devices
- **Multi-band validation** reduces false positives
- **Cost-effective:** <$200 prototype, <$110 production

---

## 9. Risk Assessment and Mitigation

### 9.1 Technical Risks

| Risk                       | Impact | Probability | Mitigation                                 |
| -------------------------- | ------ | ----------- | ------------------------------------------ |
| LTE coverage gaps          | High   | Medium      | Fallback to SMS, support multiple carriers |
| Power failures             | High   | Low         | Battery backup, low battery alerts         |
| False positives            | Medium | Medium      | Tunable thresholds, multi-band correlation |
| WiFi/BT interference       | Medium | Medium      | Multi-channel scanning, signal averaging   |
| Component obsolescence     | Medium | Low         | Design with alternative components in mind |
| Cellular detection failure | High   | Low         | Redundancy with WiFi/BT detection          |

### 9.2 Business Risks

| Risk                    | Impact | Probability | Mitigation                               |
| ----------------------- | ------ | ----------- | ---------------------------------------- |
| Privacy concerns        | High   | Medium      | Clear privacy policy, opt-out mechanisms |
| Regulatory changes      | High   | Low         | Monitor legislation, legal counsel       |
| Market competition      | Medium | High        | Focus on range advantage, ease of use    |
| Low adoption rate       | High   | Medium      | User testing, marketing, partnerships    |
| Technology obsolescence | Medium | Medium      | Modular design, upgradeable firmware     |

---

## 10. Support and Maintenance

### 10.1 Firmware Updates

- Over-the-air (OTA) update capability
- Staged rollout to prevent widespread failures
- Automatic update notifications in mobile app
- Rollback capability for failed updates

### 10.2 Monitoring and Diagnostics

- Device health telemetry (battery, signal strength, uptime)
- Remote diagnostics via cloud dashboard
- Error logging and crash reporting
- Connectivity status monitoring
- RF environment analysis tools

### 10.3 User Support

- In-app help and FAQ
- Email/chat support channel
- Community forum for users
- Tutorial videos and documentation
- Installation guide with best practices

---

## 11. Cost Analysis

### 11.1 Development Costs (Estimated)

- Hardware prototyping: $1,500-2,500 (increased for RF components)
- Firmware development: $8,000-15,000 (cellular detection added)
- Backend development: $8,000-15,000
- Mobile app development: $10,000-20,000
- Testing and validation: $5,000-8,000 (extended RF testing)
- Certifications: $5,000-15,000
- **Total R&D:** $37,500-75,500

### 11.2 Operational Costs (Per Unit/Year)

- LTE data plan: $60-120/year
- Cloud hosting: $5-15/year (at scale)
- Customer support: $10-30/year (allocated)
- Firmware updates: $5-10/year (allocated)
- **Total Operating Cost:** $80-175/unit/year

### 11.3 Pricing Strategy

- Hardware: $250-350 retail (40-70% margin)
- Monthly service: $5-15/month (cloud, support, data)
- Or: One-time purchase + optional service plan
- Enterprise package: Volume discounts for 10+ units

---

## 12. Technical Appendices

### 12.1 Cellular Frequency Bands (US)

| Band          | Uplink Frequency | Carrier        | Detection Priority     |
| ------------- | ---------------- | -------------- | ---------------------- |
| Band 5 (850)  | 824-849 MHz      | AT&T, Verizon  | Highest - best range   |
| Band 13 (700) | 777-787 MHz      | Verizon        | High - excellent range |
| Band 2 (1900) | 1850-1910 MHz    | All carriers   | Medium - common        |
| Band 4 (AWS)  | 1710-1755 MHz    | T-Mobile, AT&T | Medium - urban         |
| Band 12 (700) | 698-716 MHz      | T-Mobile       | High - good range      |

### 12.2 Detection Algorithm Pseudocode

```python
def multi_band_detection():
    # Initialize detection sources
    cellular_detector = AD8313()
    wifi_scanner = ESP32_WiFi()
    bt_scanner = ESP32_BT()

    while True:
        # Cellular detection (continuous)
        cellular_signal = cellular_detector.read()

        # Periodic WiFi/BT scans
        if time_for_scan():
            wifi_devices = wifi_scanner.scan()
            bt_devices = bt_scanner.scan()

        # Correlation logic
        if cellular_signal.strength > THRESHOLD:
            if not wifi_devices and not bt_devices:
                # High priority - stealth mode
                alert("HIGH", "Cellular only detection", cellular_signal)
            else:
                # Confirmed multi-band detection
                alert("CRITICAL", "Multi-band confirmation", all_signals)

        elif wifi_devices or bt_devices:
            # Standard detection
            alert("NORMAL", "WiFi/BT detection", devices)

        sleep(SCAN_INTERVAL)
```

---

## 13. Conclusion

The addition of passive cellular uplink detection transforms this property intrusion detection system into a comprehensive, long-range security solution. The combination of cellular (500-800+ ft), WiFi (300 ft), and Bluetooth (100 ft) detection provides layered security with exceptional coverage area from a single device.

### 13.1 Key Advantages (Updated)

- **Extended range:** 500-800+ ft detection radius (26+ acre coverage)
- **Multi-band detection:** Cellular + WiFi + Bluetooth correlation
- **Passive operation:** No signals transmitted to target devices
- **Universal detection:** Works even with WiFi/BT disabled
- **Low-cost hardware:** <$200 prototype, <$110 production target
- **Easy installation:** No wiring beyond power
- **Real-time alerts:** Via mobile app with threat prioritization
- **Legal compliance:** Passive monitoring of public frequencies

### 13.2 Next Steps

1. Complete cellular detection module integration
2. Develop and deploy cloud backend
3. Build React Native mobile application
4. Conduct field testing at multiple locations
5. Iterate based on testing feedback
6. Prepare for production manufacturing

### 13.3 Success Criteria (Updated)

The project will be considered successful when:

- Cellular detection range exceeds 500 ft consistently
- Multi-band correlation reduces false positives below 5%
- Alert latency remains under 30 seconds
- System operates reliably for 30+ days without intervention
- Production costs allow for $250-350 retail pricing
- User feedback indicates high satisfaction (4.5+ stars)

---

## Appendices

### Appendix A: Technical Glossary

- **BLE:** Bluetooth Low Energy
- **RSSI:** Received Signal Strength Indicator (dBm)
- **MAC Address:** Media Access Control address (unique device identifier)
- **Probe Request:** WiFi frame sent by devices searching for networks
- **LTE Cat-M/NB-IoT:** Low-power cellular technologies for IoT
- **OTA:** Over-The-Air (firmware updates)
- **GPIO:** General Purpose Input/Output pins
- **ADC:** Analog-to-Digital Converter
- **LNA:** Low Noise Amplifier
- **SDR:** Software Defined Radio
- **dBm:** Decibel-milliwatts (power measurement)
- **dBi:** Decibel isotropic (antenna gain)

### Appendix B: References and Resources

- ESP32 Technical Reference Manual
- ESP-IDF Programming Guide
- React Native Documentation
- FCC Part 15 Regulations
- GDPR Privacy Guidelines
- IEEE 802.11 WiFi Standard
- Bluetooth Core Specification
- AD8313 Datasheet (Analog Devices)
- SPF5189Z LNA Specifications
- 3GPP LTE Standards

### Appendix C: Vendor Contact Information

- ESP32 Modules: Espressif Systems, DigiKey, Mouser
- LTE Modems: SIMCom, Quectel
- RF Detectors: Analog Devices, Maxim Integrated
- LNA Modules: Mini-Circuits, Qorvo
- Antennas: Taoglas, Molex, TE Connectivity
- Enclosures: Bud Industries, Hammond Manufacturing
- PCB Manufacturing: JLCPCB, PCBWay, OSH Park

---

**Document Version:** 2.0  
**Major Changes:** Added cellular uplink detection subsystem, updated BOM, enhanced detection algorithms, expanded range capabilities  
**Prepared By:** Technical Team  
**Date:** November 16, 2025  
**Next Review:** December 15, 2025

---

_This document is confidential and proprietary. Distribution outside the organization is prohibited without authorization._

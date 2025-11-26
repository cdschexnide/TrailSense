# On-Device LLM Integration Research for TrailSense
**Research Date:** November 24, 2025
**Purpose:** Evaluate on-device LLM options for React Native mobile app integration

---

## 5. ON-DEVICE LLM USE CASES FOR TRAILSENSE

### 5.1 Natural Language Alert Summaries ⭐ **HIGH PRIORITY**

**Problem:** Technical detection data (MAC addresses, RSSI, detection types) is hard for non-technical users to interpret quickly.

**LLM Solution:** Convert structured alert data into human-readable explanations.

#### Example Transformation
**Input (Structured Data):**
```json
{
  "detection_type": "wifi",
  "rssi": -55,
  "zone": "IMMEDIATE",
  "mac_address": "XX:XX:XX:XX:XX:XX",
  "ssid": "iPhone",
  "timestamp": "2025-11-24T10:30:15Z",
  "threat_level": "high",
  "trend": "approaching"
}
```

**LLM Output (Natural Language):**
```
⚠️ HIGH ALERT: Unknown iPhone detected very close to your property (within 10 feet)
and getting closer. This device has a strong signal (-55 dBm) and was first seen
30 seconds ago. Consider checking your cameras or investigating.
```

#### Implementation
```typescript
const prompt = `
You are a security assistant. Convert this detection into a clear,
actionable alert for a homeowner:

Detection Type: ${alert.detection_type}
Signal Strength: ${alert.rssi} dBm (${alert.zone} zone)
Device: ${alert.ssid || 'Unknown'}
Threat Level: ${alert.threat_level}
Movement: ${alert.trend}

Provide a 2-3 sentence summary that explains what's happening and
suggests what the user should do.
`;

const summary = await llm.generate(prompt, { max_tokens: 100 });
```

#### Benefits
✅ Improves user comprehension
✅ Reduces decision fatigue
✅ Makes app accessible to non-technical users
✅ Actionable recommendations

---

### 5.2 Intelligent Pattern Recognition Narratives ⭐ **HIGH PRIORITY**

**Problem:** Users see individual alerts but miss broader patterns (e.g., "delivery driver arrives every weekday at 2pm").

**LLM Solution:** Analyze multiple detections and explain patterns in natural language.

#### Example
**Input (Multiple Detections):**
```javascript
const detections = [
  { device: "XX:XX:XX:XX:XX:XX", time: "14:05", day: "Monday", zone: "FAR" },
  { device: "XX:XX:XX:XX:XX:XX", time: "14:07", day: "Tuesday", zone: "FAR" },
  { device: "XX:XX:XX:XX:XX:XX", time: "14:03", day: "Wednesday", zone: "FAR" },
  { device: "XX:XX:XX:XX:XX:XX", time: "14:10", day: "Thursday", zone: "FAR" },
  { device: "XX:XX:XX:XX:XX:XX", time: "14:06", day: "Friday", zone: "FAR" }
];
```

**LLM Output:**
```
📊 PATTERN DETECTED: This device appears on your property every weekday around
2:00-2:10 PM and stays in the FAR zone (50-200 feet away, likely the street).
This is consistent with a mail carrier or delivery driver.

Recommendation: Add this device to your whitelist as "Delivery Driver" to
reduce false alarms.
```

#### Implementation
```typescript
const prompt = `
Analyze these detections and identify patterns:

${detections.map(d => `- ${d.day} at ${d.time}, ${d.zone} zone`).join('\n')}

Is this a pattern (delivery, neighbor, regular visitor)? Explain what you
observe and suggest if this device should be whitelisted.
`;

const analysis = await llm.generate(prompt, { max_tokens: 150 });
```

#### Benefits
✅ Reduces false alarms
✅ Helps users build whitelist
✅ Identifies routine vs suspicious behavior
✅ Actionable recommendations

---

### 5.3 Conversational Security Assistant ⭐ **HIGH PRIORITY**

**Problem:** Users have questions about their security data but have to navigate complex UI.

**LLM Solution:** Natural language query interface for security insights.

#### Example Queries & Responses

**User:** "What happened while I was away this weekend?"

**LLM:**
```
While you were away (Sat-Sun), there were 12 detections:
- 8 from your neighbor's WiFi (whitelisted)
- 3 from unknown BLE devices (all in FAR zone, likely passersby)
- 1 HIGH alert: Unknown cellular-only device on Saturday at 11:45 PM
  in the NEAR zone. This is unusual for nighttime. Check your cameras.
```

**User:** "Show me all suspicious detections from last night"

**LLM:**
```
Last night (10 PM - 6 AM), there were 2 suspicious detections:

1. 11:34 PM - Unknown WiFi "AndroidAP" in IMMEDIATE zone, stayed for
   4 minutes then left. HIGH threat score.

2. 2:15 AM - Cellular-only device (no WiFi/BLE) in NEAR zone. This is
   a red flag as it suggests someone with radios disabled. CRITICAL
   threat score.

Both devices have not been seen before. Review your cameras for these times.
```

**User:** "Why did I get an alert for my own phone?"

**LLM:**
```
Your phone "John's iPhone" triggered an alert because it wasn't on the whitelist
yet. I've noticed this device appears every day when you arrive home around
6:00 PM.

Would you like me to add it to your whitelist? This will prevent future alerts
for this device.
```

#### Implementation
```typescript
const conversationContext = [
  { role: 'system', content: 'You are a security assistant for TrailSense...' },
  { role: 'user', content: userQuery },
  { role: 'assistant', content: await querySecurityData(userQuery) }
];

const response = await llm.chat(conversationContext, { max_tokens: 200 });
```

#### Benefits
✅ Natural interaction (no complex UI navigation)
✅ Contextual insights
✅ Proactive recommendations
✅ Reduces support burden

---

### 5.4 Smart Whitelist Management ⭐ **MEDIUM PRIORITY**

**Problem:** Users must manually identify and whitelist known devices (family, neighbors, deliveries).

**LLM Solution:** Analyze detection patterns and automatically suggest whitelist entries.

#### Example

**LLM Analysis:**
```
🤖 WHITELIST SUGGESTION

I've detected a pattern with device XX:XX:XX:XX:XX:XX:

- Seen 47 times over the past 30 days
- Always appears 7:00-9:00 AM on weekdays
- Always in FAR zone (street level)
- WiFi name: "Verizon-MiFi-XXXX"

This matches the profile of a neighbor's commute or morning walker.

Suggested whitelist entry:
Name: "Morning Commuter"
Category: Neighbor
Auto-dismiss: Yes
```

#### Implementation
```typescript
const prompt = `
Analyze this device's detection history and determine if it should be whitelisted:

Device: ${device.mac}
Times seen: ${device.visit_count}
First seen: ${device.first_seen}
Common times: ${device.common_hours.join(', ')}
Common zones: ${device.common_zones.join(', ')}

Should this be whitelisted? If yes, suggest a name and category
(Family, Neighbor, Delivery, Service).
`;

const suggestion = await llm.generate(prompt, { max_tokens: 150 });
```

#### Benefits
✅ Reduces manual whitelist maintenance
✅ Learns user's environment
✅ Reduces false alarms over time

---

### 5.5 Threat Scenario Classification ⭐ **MEDIUM PRIORITY**

**Problem:** Existing threat classifier uses numerical scoring. Users want explanations: "Why is this high threat?"

**LLM Solution:** Explain threat classification reasoning in natural language.

#### Example

**Threat Score Breakdown:**
```javascript
const threatFactors = {
  cellular_only: true,        // +40 points
  nighttime: true,            // +20 points
  immediate_zone: true,       // +30 points
  unknown_device: true,       // +15 points
  stationary: true,           // +15 points
  total_score: 120            // CRITICAL
};
```

**LLM Explanation:**
```
🔴 CRITICAL THREAT: This detection has multiple red flags:

1. Cellular-only (no WiFi/BLE): This person has intentionally disabled
   WiFi and Bluetooth, which is a common tactic to avoid detection.
   Normal phones broadcast all three signals.

2. Nighttime (2:15 AM): Most legitimate visitors (delivery, neighbors)
   arrive during daylight hours.

3. Very close proximity (IMMEDIATE zone, < 10 feet): This device is
   directly adjacent to your property.

4. Stationary (not moving): The device has been in the same spot for
   3 minutes, suggesting someone stopped rather than passing by.

RECOMMENDATION: This is highly suspicious. Immediately check your cameras
and consider calling authorities if you don't recognize this as a expected
visitor.
```

#### Implementation
```typescript
const prompt = `
Explain why this detection received a CRITICAL threat score:

${JSON.stringify(threatFactors, null, 2)}

Provide a clear, actionable explanation for a homeowner. Focus on why
each factor matters and what action they should take.
`;

const explanation = await llm.generate(prompt, { max_tokens: 200 });
```

#### Benefits
✅ Transparency in threat scoring
✅ User education (learn what's suspicious)
✅ Actionable guidance
✅ Reduces false alarm fatigue

---

### 5.6 Voice-Activated Security Queries 🎤 **MEDIUM PRIORITY**

**Problem:** Users checking security status while driving, cooking, or away from phone screen.

**LLM Solution:** Voice interface powered by on-device speech-to-text + LLM.

#### Example Interaction

**User (voice):** "Hey TrailSense, what's the status?"

**LLM (text-to-speech):**
```
Your property is secure. No alerts in the past 8 hours. The last detection
was your neighbor's WiFi at 2:30 PM, which is whitelisted. All devices are
online and functioning normally.
```

**User:** "Any detections while I was asleep?"

**LLM:**
```
Yes, one detection at 11:45 PM. Unknown WiFi device in the FAR zone, likely
a passing car. It was marked as LOW threat and only stayed for 30 seconds.
Nothing to worry about.
```

#### Implementation (with React Native ExecuTorch)
```typescript
// Speech-to-text (on-device)
const transcript = await ExecuTorchModule.speechToText(audioBuffer);

// LLM processing
const response = await llm.generate(`
User voice query: "${transcript}"
Security context: ${await getSecuritySummary()}

Provide a concise, conversational response suitable for voice output.
`, { max_tokens: 100 });

// Text-to-speech (Expo AV or native)
await textToSpeech(response);
```

#### Benefits
✅ Hands-free security monitoring
✅ Accessibility for visually impaired
✅ Convenient for busy users
✅ Reduces screen time

---

### 5.7 Natural Language Alert Configuration ⭐ **LOW PRIORITY**

**Problem:** Complex settings UI for alert rules (zones, times, threat levels).

**LLM Solution:** Configure alerts using natural language.

#### Example

**User (text):** "Alert me when unknown devices are very close at night"

**LLM Parsing:**
```javascript
const alertRule = {
  conditions: [
    { field: 'whitelist_status', value: 'unknown' },
    { field: 'zone', value: 'IMMEDIATE' },
    { field: 'time', value: 'nighttime' } // 10 PM - 6 AM
  ],
  action: 'push_notification',
  priority: 'high'
};
```

**LLM Confirmation:**
```
✅ Alert rule created:

"HIGH priority push notifications when unknown (non-whitelisted) devices
enter the IMMEDIATE zone (0-10 feet) during nighttime hours (10 PM - 6 AM)."

This rule will override quiet hours and send immediate notifications.
```

**User:** "Don't alert me about deliveries during the day"

**LLM:**
```
✅ Alert rule updated:

"Mute notifications for devices in the FAR zone (50-200 feet) during
daytime hours (6 AM - 10 PM) that match the 'Delivery Driver' pattern."

You'll still receive alerts for close proximity or nighttime detections.
```

#### Implementation
```typescript
const prompt = `
Parse this user's alert configuration request into structured rules:

User request: "${userInput}"

Current alert rules: ${JSON.stringify(currentRules)}

Output a JSON object with:
- conditions: Array of { field, operator, value }
- action: "push_notification" | "silent" | "email"
- priority: "low" | "medium" | "high" | "critical"

Also provide a human-readable confirmation.
`;

const parsed = await llm.generate(prompt, {
  max_tokens: 200,
  response_format: 'json'
});
```

#### Benefits
✅ Dramatically simplified configuration
✅ No UI complexity
✅ Accessible to non-technical users
✅ Natural interaction

---

### 5.8 Security Insights & Recommendations 📊 **MEDIUM PRIORITY**

**Problem:** Users have rich detection data but lack insights to improve security.

**LLM Solution:** Weekly security reports with personalized recommendations.

#### Example Weekly Report

**LLM-Generated Insights:**
```
📊 WEEKLY SECURITY REPORT (Nov 18-24, 2025)

SUMMARY:
- 143 total detections (↓ 12% from last week)
- 3 HIGH threats, 8 MEDIUM threats, 132 LOW threats
- 89% of detections were whitelisted devices
- Peak detection times: 8:00 AM, 12:00 PM, 6:00 PM

KEY FINDINGS:

1. ⚠️ Nighttime Activity Increase
   You had 3 HIGH threat detections between 11 PM - 2 AM this week
   (up from 0 last week). All were unknown cellular-only devices.

   RECOMMENDATION: Enable "High Sensitivity Nighttime Mode" to get
   immediate alerts for NEAR zone detections after 10 PM.

2. ✅ Delivery Pattern Stable
   Your daily delivery detection at 2:05 PM continues as expected.
   No anomalies detected.

3. 📍 New Neighbor Detected
   A new WiFi network "NETGEAR-5G" appeared this week, seen 47 times,
   always from the EXTREME zone (property boundary).

   RECOMMENDATION: This is likely a new neighbor. Add to whitelist as
   "Neighbor - East Side" to reduce alert volume.

4. 🔋 Device Health
   All 3 ESP32 detection devices are online with good battery levels
   (85%, 92%, 88%). Next maintenance recommended in 45 days.
```

#### Implementation
```typescript
const weeklyData = await getWeeklySecurityData();

const prompt = `
Generate a weekly security report for a homeowner based on this data:

${JSON.stringify(weeklyData, null, 2)}

Include:
1. Executive summary with key metrics
2. Notable patterns or changes
3. Specific recommendations to improve security
4. Whitelist suggestions

Keep it concise (< 300 words), actionable, and non-alarmist.
`;

const report = await llm.generate(prompt, { max_tokens: 400 });
```

#### Benefits
✅ Proactive security management
✅ User education
✅ Actionable insights
✅ Increases user engagement

---

### 5.9 Detection Clustering & Event Correlation 🧩 **MEDIUM PRIORITY**

**Problem:** Multiple detections may represent a single event (e.g., person with phone + smartwatch + car Bluetooth).

**LLM Solution:** Group related detections and provide unified narrative.

#### Example

**Input (3 Simultaneous Detections):**
```javascript
const detections = [
  { type: 'wifi', device: 'iPhone', rssi: -55, zone: 'IMMEDIATE' },
  { type: 'bluetooth', device: 'Apple Watch', rssi: -58, zone: 'IMMEDIATE' },
  { type: 'bluetooth', device: 'AirPods Pro', rssi: -52, zone: 'IMMEDIATE' }
];
```

**LLM Clustering:**
```
📱 SINGLE VISITOR DETECTED

These 3 detections appear to be from the same person:
- iPhone (WiFi)
- Apple Watch (Bluetooth)
- AirPods Pro (Bluetooth)

This is consistent with one person carrying typical Apple devices. The signal
strengths are very similar (-52 to -58 dBm) and all devices appeared within
5 seconds of each other.

Instead of 3 separate alerts, I've grouped this as a single event.
```

#### Implementation
```typescript
const prompt = `
Analyze these simultaneous detections and determine if they represent
a single visitor or multiple visitors:

${detections.map(d => `- ${d.type}: ${d.device}, ${d.rssi} dBm, ${d.zone}`).join('\n')}

If they're likely the same person, explain why. If they're different
visitors, explain the evidence.
`;

const clustering = await llm.generate(prompt, { max_tokens: 150 });
```

#### Benefits
✅ Reduces alert fatigue (3 alerts → 1)
✅ More accurate threat assessment
✅ Better user experience
✅ Clearer security narrative

---

### 5.10 Contextual Help & Onboarding 💡 **LOW PRIORITY**

**Problem:** Users have questions about app features, settings, and security concepts.

**LLM Solution:** In-app AI assistant that answers questions about the app itself.

#### Example Queries

**User:** "What does RSSI mean?"

**LLM:**
```
RSSI stands for "Received Signal Strength Indicator." It measures how strong
a WiFi or Bluetooth signal is, in dBm (decibel-milliwatts).

In TrailSense:
- Stronger signal (e.g., -40 dBm) = device is very close
- Weaker signal (e.g., -80 dBm) = device is far away

We use RSSI to estimate distance and assign zones (IMMEDIATE, NEAR, FAR, EXTREME).
```

**User:** "How do I add a device to my whitelist?"

**LLM:**
```
To whitelist a device:

1. Go to the Alerts tab
2. Tap on an alert from the device you want to whitelist
3. Tap the "Add to Whitelist" button
4. Give it a name (e.g., "Mom's iPhone")
5. Choose a category (Family, Neighbor, Delivery, Service)

Whitelisted devices won't trigger high-priority alerts, but you'll still
see them in your detection history.

Would you like me to walk you through this with a specific alert?
```

**User:** "Why am I getting so many alerts?"

**LLM:**
```
High alert volume is often caused by:

1. Neighbors' WiFi networks (most common)
2. Passing cars with Bluetooth
3. Delivery drivers

To reduce alerts:
- Go to Settings → Whitelist Management
- Review your "Frequent Detections" list
- Whitelist any known/regular devices
- Enable "Far Zone Quiet Mode" to ignore distant detections

Would you like me to analyze your recent alerts and suggest specific devices
to whitelist?
```

#### Implementation
```typescript
const prompt = `
You are a helpful assistant for the TrailSense security app. Answer this
user question clearly and concisely:

User question: "${userQuestion}"

App context:
- TrailSense detects WiFi, Bluetooth, and cellular signals
- Uses zones: IMMEDIATE (0-10ft), NEAR (10-50ft), FAR (50-200ft), EXTREME (200+ft)
- Users can whitelist known devices
- Threat levels: LOW, MEDIUM, HIGH, CRITICAL

Provide a helpful answer in 2-4 sentences. If relevant, offer to take action
(e.g., "Would you like me to...").
`;

const answer = await llm.generate(prompt, { max_tokens: 150 });
```

#### Benefits
✅ Reduces support burden
✅ Improves user onboarding
✅ In-context help (no leaving app)
✅ Personalized guidance

---

## USE CASE PRIORITY SUMMARY

### High Priority (Implement in Phase 1-2)
1. ✅ **5.1 Natural Language Alert Summaries** - Core feature
2. ✅ **5.2 Pattern Recognition Narratives** - High value
3. ✅ **5.3 Conversational Security Assistant** - Differentiator

### Medium Priority (Implement in Phase 3)
4. **5.4 Smart Whitelist Management** - Automation
5. **5.5 Threat Scenario Classification** - Education
6. **5.6 Voice-Activated Queries** - Convenience
7. **5.8 Security Insights & Recommendations** - Engagement
8. **5.9 Detection Clustering** - UX improvement

### Low Priority (Future enhancements)
9. **5.7 Natural Language Alert Configuration** - Nice to have
10. **5.10 Contextual Help & Onboarding** - Support reduction

---

**Document Created:** November 24, 2025
**Total Use Cases:** 10
**Implemented in Phase 1-2:** 3 (5.1, 5.2, 5.3)
**Future Implementation:** 7 (5.4-5.10)

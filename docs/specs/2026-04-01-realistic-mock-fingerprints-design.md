# Realistic Mock Device Fingerprints

## Problem

The Device Fingerprint screen shows empty profiles ("0 visits", "Unknown", "No repeat pattern yet") for every detected device in mock mode. Two causes:

1. **MAC mismatch** — seeded positions use generated MACs (`AA:BB:CC:DD:00:01`) that don't appear in `mockAlerts`, so `computeVisitPattern()` finds zero matches.
2. **No behavioral depth** — existing mock alerts use random MACs with single detections; no MAC has enough repeated visits across days to populate visit patterns, day-of-week frequency, or time clusters.

## Solution

Create 6 device "personas" with realistic multi-day alert histories. Append these alerts to `mockAlerts.ts` and use the same MAC addresses in `seedMockData.ts` position generation.

## Personas

Each persona has a fixed MAC, signal type, threat level, and visit schedule spanning the last 14 days.

### 1. Mail Carrier — `E4:A1:30:7B:22:01`

- **Signal:** cellular | **Threat:** low
- **Pattern:** Mon–Sat, 10:15–10:25am
- **Visits:** ~12 over 14 days
- **Story:** Predictable government vehicle, brief driveway stop

### 2. Neighbor's Dog Walker — `F8:B2:41:8C:33:02`

- **Signal:** bluetooth | **Threat:** low
- **Pattern:** Tue/Thu/Sat, 7:00–7:20am
- **Visits:** ~6 over 14 days
- **Story:** Nearby resident walking past property boundary, BLE from phone

### 3. Suspicious Vehicle — `1A:C3:52:9D:44:03`

- **Signal:** cellular | **Threat:** critical
- **Pattern:** 2 visits at 2:30am and 3:15am in last 5 days
- **Visits:** 2
- **Story:** Unknown vehicle lingering at property edge late at night

### 4. Delivery Van — `2B:D4:63:AE:55:04`

- **Signal:** wifi + cellular | **Threat:** low
- **Pattern:** Mon/Wed/Fri, 1:30–1:40pm
- **Visits:** ~6 over 14 days
- **Story:** Regular package delivery, hotspot + cellular from van

### 5. Weekend Visitor — `3C:E5:74:BF:66:05`

- **Signal:** wifi | **Threat:** medium
- **Pattern:** Sat/Sun, 5:45–6:30pm
- **Visits:** ~4 over 14 days
- **Story:** Recurring weekend guest, connects to nearby wifi

### 6. One-Time Unknown — `4D:F6:85:C0:77:06`

- **Signal:** bluetooth | **Threat:** high
- **Pattern:** Single detection yesterday at 11:42pm
- **Visits:** 1
- **Story:** Never-before-seen device, single late-night BLE ping

## Implementation Details

### mockAlerts.ts changes

Add a `PERSONA_ALERTS` array generated from the persona definitions above. For each persona, iterate over the last 14 days and create alerts on the scheduled days/times with:

- Correct `macAddress`, `detectionType`, `threatLevel`
- Location derived from `generateLocation(deviceId)` (existing helper)
- Realistic RSSI values (-45 to -75 range)
- `deviceId: 'device-001'` (primary sensor)

Append `PERSONA_ALERTS` to the existing `mockAlerts` export.

### seedMockData.ts changes

Update `generateMockPositions()` to use persona MAC addresses instead of generated ones. Map the 6 personas across the 8 position slots for each device, so tapping any live map marker leads to a populated fingerprint.

### No other files change

`mockAnalytics.ts` derives fingerprints from `mockAlerts` automatically. `DeviceFingerprintScreen` and `patternDetection.ts` consume alerts by MAC — no code changes needed. The fingerprint screen will populate itself once the alert data exists.

## Verification

After implementation, the fingerprint screen for each persona should show:

- Non-zero "Total visits" and "This week" counts
- Populated "Most active days" and "Peak time window"
- Real "First seen" and "Last seen" dates
- An AI Insight that isn't "No detections recorded"

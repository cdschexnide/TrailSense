# Analytics Dashboard Implementation Task

## Context

You are working on **TrailSense**, a React Native mobile app (Expo SDK 54) for an ESP32-based perimeter intrusion detection system. The app displays real-time alerts from multiple TrailSense devices that detect approaching mobile devices using WiFi, Bluetooth, and Cellular RF detection.

## Current State

The Analytics Dashboard screen (`src/screens/analytics/DashboardScreen.tsx`) is functional but **all charts display "Chart temporarily disabled" placeholders**. The backend API is working and returns real analytics data from the `/api/analytics` endpoint.

## Your Task

**USE ULTRATHINK** to fully implement the Analytics Dashboard screen to **100% completion** with functioning, interactive charts and visualizations.

---

## Backend API Response Structure

The `/api/analytics` endpoint returns:

```typescript
{
  period: string;              // 'day' | 'week' | 'month'
  startDate: string;           // ISO date
  endDate: string;             // ISO date
  totalAlerts: number;         // Total detection count
  threatLevelDistribution: Array<{
    level: string;             // 'low' | 'medium' | 'high' | 'critical'
    count: number;
  }>;
  detectionTypeDistribution: Array<{
    type: string;              // 'wifi' | 'bluetooth' | 'cellular'
    count: number;
  }>;
  deviceDistribution: Array<{
    deviceId: string;          // Device identifier
    count: number;             // Detections for this device
  }>;
  dailyTrend: Array<{
    date: string;              // Date string
    count: number;             // Detections on that day
  }>;
  topDetectedDevices: Array<{
    macAddress: string;        // Detected device MAC (hashed)
    count: number;             // Times detected
  }>;
}
```

---

## Charts to Implement

### 1. **Detections Over Time** (Line Chart)
- **Data**: `analytics.dailyTrend`
- **X-axis**: Dates
- **Y-axis**: Detection counts
- **Features**:
  - Smooth curve
  - Gradient fill under line
  - Touch to see exact values
  - Dynamic based on selected period (day/week/month)

### 2. **Detection Types** (Pie Chart or Bar Chart)
- **Data**: `analytics.detectionTypeDistribution`
- **Display**: WiFi, Bluetooth, Cellular counts
- **Colors**:
  - WiFi: Blue (#007AFF)
  - Bluetooth: Purple (#AF52DE)
  - Cellular: Green (#34C759)
- **Features**: Percentages + absolute counts

### 3. **Device Distribution** (Horizontal Bar Chart)
- **Data**: `analytics.deviceDistribution`
- **Display**: Which TrailSense devices detected the most alerts
- **Features**:
  - Device names (fetch from devices API if needed)
  - Color-coded bars
  - Count labels

### 4. **Threat Level Distribution** (Stacked Bar or Donut Chart)
- **Data**: `analytics.threatLevelDistribution`
- **Colors**:
  - Critical: Red (#FF3B30)
  - High: Orange (#FF9500)
  - Medium: Yellow (#FFCC00)
  - Low: Green (#34C759)
- **Features**: Visual threat breakdown with counts

---

## Technical Requirements

### Chart Library Options (Choose the best fit):
1. **react-native-chart-kit** (already installed - v6.12.0)
2. **react-native-svg-charts** (if needed)
3. **@shopify/react-native-skia** (already installed - v2.2.12)
4. **victory-native** (consider if others insufficient)

### Design Guidelines

**Follow Apple iOS Human Interface Guidelines:**
- Use system colors from theme (`theme.colors.systemBlue`, etc.)
- Maintain 44pt minimum touch targets
- Use SF typography (`TextStyles` from `@constants/typography`)
- Dark mode support (theme automatically handles this)
- Smooth animations (use `Animated` API)
- Haptic feedback on interactions (`expo-haptics`)

### File Locations

**Main File:**
- `src/screens/analytics/DashboardScreen.tsx` (current implementation)

**Supporting Files:**
- `src/api/analytics.ts` (API client)
- `src/types/alert.ts` (AnalyticsData type definition)
- `src/hooks/useAnalytics.ts` (React Query hook - may need to verify)
- `src/constants/colors.ts` (theme colors)
- `src/constants/typography.ts` (text styles)

**Components to Create/Update:**
- Consider creating reusable chart components in `src/components/organisms/`
- Keep `ChartCard` wrapper for consistent styling
- Create `StatCard` if not already present

---

## Implementation Steps (Suggested)

### Phase 1: Research & Plan
1. Investigate which chart library is best suited (check package.json)
2. Review existing component patterns in the codebase
3. Determine if any new dependencies need installation
4. Plan component architecture for reusability

### Phase 2: Implement Core Charts
1. **Detections Over Time** (Line Chart)
   - Most important - shows trends
   - Implement first
2. **Threat Level Distribution** (Visual priority)
   - Security-focused users care about this
3. **Detection Types** (Pie/Bar)
4. **Device Distribution** (Bar chart)

### Phase 3: Polish & Interactivity
1. Add touch interactions (tap to see details)
2. Implement haptic feedback
3. Add loading states
4. Handle empty data gracefully
5. Add animations/transitions
6. Test dark mode

### Phase 4: Period Switching
- Ensure charts update when user switches period (day/week/month)
- Currently controlled by `period` state and period selector buttons
- Charts must respond to period changes

---

## Current Code Reference

**Period Selector (already working):**
```typescript
const [period, setPeriod] = useState<Period>('week');

// API call automatically updates when period changes
const { data: analytics, isLoading } = useAnalytics({ period });
```

**Placeholder Example (to replace):**
```typescript
<ChartCard title="Detections Over Time">
  <View style={styles.chartPlaceholder}>
    <Text style={styles.placeholderText}>Chart temporarily disabled</Text>
    <Text style={styles.placeholderSubtext}>
      {analytics.dailyTrend?.length || 0} data points available
    </Text>
  </View>
</ChartCard>
```

**You should replace this with:**
```typescript
<ChartCard title="Detections Over Time">
  <LineChart
    data={formatLineChartData(analytics.dailyTrend)}
    // ... chart props
  />
</ChartCard>
```

---

## Data Transformations Needed

Most chart libraries require specific data formats. You'll need helper functions like:

```typescript
// Example: Transform dailyTrend for line chart
function formatLineChartData(dailyTrend: Array<{date: string, count: number}>) {
  return {
    labels: dailyTrend.map(d => formatDate(d.date)),
    datasets: [{
      data: dailyTrend.map(d => d.count)
    }]
  };
}

// Example: Transform for pie chart
function formatPieChartData(distribution: Array<{type: string, count: number}>) {
  return distribution.map((item, index) => ({
    name: item.type,
    population: item.count,
    color: getColorForType(item.type),
    legendFontColor: '#7F7F7F',
  }));
}
```

---

## Success Criteria

✅ **All four charts are fully functional and displaying real data**
✅ **Charts update when period (day/week/month) is changed**
✅ **Charts follow iOS design guidelines (colors, typography, spacing)**
✅ **Dark mode works correctly**
✅ **Touch interactions provide value (show exact numbers on tap)**
✅ **Haptic feedback on interactions**
✅ **Smooth animations/transitions**
✅ **Loading states handled**
✅ **Empty state handled gracefully (no data available)**
✅ **No TypeScript errors**
✅ **No console warnings**
✅ **Charts are responsive to different screen sizes**

---

## Important Notes

1. **The backend is already running** at `http://192.168.12.63:3000`
2. **The `/api/analytics` endpoint works** and returns real data
3. **You have 50 seeded alerts** in the database over 7 days
4. **Authentication is working** (user is logged in as admin@trailsense.com)
5. **Device data is available** via `/api/devices` if you need device names
6. **Check existing dependencies first** before installing new packages
7. **Follow the established component patterns** in the codebase
8. **Use the theme system** (`useTheme()` hook) for colors

---

## Testing Your Implementation

After implementation, verify:

1. Navigate to Analytics tab in the app
2. Check all 4 charts render without errors
3. Switch between Day/Week/Month periods
4. Tap on charts to see if interactions work
5. Toggle between light/dark mode
6. Check with no network (loading state)
7. Verify TypeScript compiles without errors

---

## Getting Started

1. Read the current `DashboardScreen.tsx` implementation
2. Check `package.json` for available chart libraries
3. Review the API response structure from `/api/analytics`
4. Use **ultrathink** to plan your implementation approach
5. Start implementing charts one by one
6. Test thoroughly as you go

---

## Command to Run the App

```bash
cd /Users/home/Documents/Project/TrailSense
npm start
# Press 'i' for iOS simulator or 'a' for Android emulator
```

---

## Questions to Consider Before Starting

- Which chart library is best for React Native Expo with the available dependencies?
- Should I create reusable chart wrapper components?
- How should I handle edge cases (zero data, single data point)?
- What's the best way to format dates for different periods?
- Should charts be scrollable horizontally if data is dense?
- How should I indicate which period is currently selected in the chart context?

---

**USE ULTRATHINK. IMPLEMENT FULLY. MAKE IT PRODUCTION-READY.**

Good luck! 🚀

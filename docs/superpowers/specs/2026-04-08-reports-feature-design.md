# Reports Feature Design Spec

## Overview

Replace the placeholder ReportsScreen with a full-featured Reports hub providing three capabilities: exportable report generation from templates, saved report configurations, and LLM-powered intelligence briefs. Accessible via the existing "Reports" button on the Analytics Dashboard.

## Architecture: Hub & Spoke

The ReportsScreen serves as a hub with three sections. Each section navigates to a dedicated screen for its workflow.

### Screen Map

```
ReportsScreen (hub)
├── BriefScreen (intelligence brief generation)
├── ReportBuilderScreen (template config + filters)
│   └── ReportPreviewScreen (rendered report + export)
└── ReportBuilderScreen (loaded from saved config)
    └── ReportPreviewScreen
```

All four screens are added to both `MoreStackParamList` and `AnalyticsStackParamList`.

## Screen Specifications

### 1. ReportsScreen (Hub)

Replaces the existing placeholder at `src/screens/analytics/ReportsScreen.tsx`.

**Layout:** ScreenLayout with scrollable content, three grouped list sections.

**Section 1 — Intelligence Brief:**
- Single row: "Intelligence Brief" label, brain/sparkle icon, chevron
- Subtitle shows last generated date if a brief was previously generated, otherwise "Generate an AI-powered security briefing"
- Tapping navigates to `BriefScreen`

**Section 2 — Report Templates:**
- Three `ReportTemplateRow` items:
  - **Security Summary** — "Threat overview, detection counts, top devices, period comparison"
  - **Activity Report** — "Temporal patterns, hourly/daily breakdowns, nighttime activity"
  - **Signal Analysis** — "RSSI distributions, proximity zones, modality breakdown"
- Each row: icon, name, description, chevron
- Tapping navigates to `ReportBuilderScreen` with template pre-selected

**Section 3 — Saved Reports:**
- List of `SavedReportRow` items from Redux store
- Each row: custom name, template type badge (small colored pill), last generated date
- Inline delete action via existing `SwipeableRow` + `createSwipeActions` pattern (from `KnownDeviceItem`). Note: `SwipeableRow` renders action buttons beside the row, not a gesture-based swipe.
- Tapping navigates to `ReportBuilderScreen` with saved filters loaded
- Empty state: "No saved reports yet. Generate a report and save it for quick access."

### 2. ReportBuilderScreen

Configures filters and time range before generating a report.

**Navigation params:** `{ template: ReportTemplate; savedReportId?: string }`

When `savedReportId` is provided, loads the saved config from Redux and pre-fills all fields.

**Layout (top to bottom, scrollable):**

1. **Header** — Back button, template name as title, "Save" plain button (right action)

2. **Time Range Picker** — Period pill bar matching DashboardScreen: 24h, 7d, 30d, 1y. No custom date range — `useAnalytics` defaults a missing period to `'week'` and accepts `Date` objects (not strings) for dates, so custom ranges would require hook/API changes. Deferred to a future iteration.

3. **Filters Section** — Collapsible grouped list:
   - **Threat Levels** — Multi-select FilterChips: Critical, High, Medium, Low. All selected by default.
   - **Detection Types** — Multi-select FilterChips: WiFi, Bluetooth, Cellular. All selected by default.
   - **Devices** — Multi-select list of TrailSense sensor names from `useDevices()`. All selected by default.

4. **Generate Button** — Full-width primary Button: "Generate Report". Assembles `ReportConfig` and navigates to `ReportPreviewScreen`.

**Save flow:** Tapping "Save" opens `Alert.prompt` (iOS) or a simple modal with TextInput (Android) for the report name. On confirm, dispatches `addSavedReport()` to Redux. If editing an existing saved report, dispatches `updateSavedReport()` instead.

**Device initialization:** The devices list comes from `useDevices()` which loads asynchronously. When devices data arrives and `deviceIds` is still empty (new report, not loading from saved config), all device IDs are selected via a `useEffect`.

**Local state only:** All filter selections are `useState` — not Zustand or Redux. The assembled `ReportConfig` is passed to ReportPreviewScreen via navigation params.

### 3. ReportPreviewScreen

Renders the full report and provides export options.

**Navigation params:** `{ config: ReportConfig; savedReportId?: string }`

The optional `savedReportId` is forwarded from ReportBuilderScreen so that ReportPreviewScreen can dispatch `updateLastGenerated` when a report is successfully rendered.

**Data fetching:** Calls `useAnalytics({ period: config.period })` and `useComparison()` with the config's period (disabled when period is `'year'`).

**Filter application:** Analytics data is pre-aggregated by the API. The config's `threatLevels`, `detectionTypes`, and `deviceIds` filters act as **visibility controls** on the rendered report — they determine which items appear in distribution charts, which modality cards render, and which sensors show in per-device trends. They do not re-query or re-aggregate the underlying data. **Headline metrics (total detections, unique devices, avg confidence, closest approach) always show property-wide numbers.** Filtered sections are labeled "Filtered View" to distinguish them from property-wide stats.

**Layout:**

1. **Header** — Back button, template name as title, "Export" button (right action)

2. **Report Content** — Scrollable, rendered by template-specific organism component:

   **SecuritySummaryReport:**
   - Report title + date range subtitle
   - 4 StatCards: total detections, unique devices, avg confidence, closest approach (with comparison deltas)
   - Threat level distribution BarChart
   - Detection type breakdown BarChart
   - Top 5 detected devices list (fingerprint hash truncated, visit count, threat level badge)
   - Period comparison callout card

   **ActivityReportReport:**
   - Report title + date range subtitle
   - Daily trend line chart (StackedAreaChart or MultiLineChart)
   - Hourly distribution BarChart with peak/quiet hours highlighted
   - Day-of-week distribution BarChart
   - Nighttime activity card (percentage + count + trend MultiLineChart)
   - Anomaly list (spikes, quiet gaps, timing shifts with severity indicators)

   **SignalAnalysisReport:**
   - Report title + date range subtitle
   - RSSI distribution BarChart with median/peak callouts
   - Proximity zone breakdown (ProximityZoneVisual)
   - Modality cards (WiFi, BLE, Cellular with template-specific metrics via ModalityCard)
   - Cross-modal correlation stats card
   - Signal strength trend MultiLineChart (3 lines: WiFi, BLE, Cellular)

3. **Export Action Sheet** (triggered by header Export button):
   - "Share as PDF" — generates PDF via `expo-print`, opens share sheet via `expo-sharing` (user can save to Files from the share sheet)
   - "Share as CSV" — writes CSV to temp file, opens share sheet via `expo-sharing`

### 4. BriefScreen

LLM-powered intelligence brief with executive summary and structured findings.

**Layout:**

1. **Header** — Back button, "Intelligence Brief" title, "Export" button (right action, same action sheet as ReportPreviewScreen)

2. **Time Range Picker** — Period pill bar: 24h, 7d, 30d, 1y

3. **Generate Button** — "Generate Brief" primary button

4. **Loading State** — Skeleton cards with "Analyzing property data..." message

5. **Brief Content (after generation):**

   **Executive Summary** — `BriefSummaryCard`: 2-3 paragraph LLM-generated prose covering overall threat posture, notable changes from previous period, and key patterns. Rendered in a card with slightly larger body text.

   **Key Findings** — Array of `FindingCard` components:
   - Severity dot (critical = red, warning = amber, info = blue)
   - Finding title
   - 1-2 sentence description
   - Optional metric callout (e.g., "3 new devices, all between 2-4 AM")

**LLM integration:**
- New `BriefTemplate` class extending `PromptTemplate` in `src/services/llm/templates/`
- New `generateBrief()` method added to `LLMService` (follows the same pattern as `generateAlertSummary()` and `analyzeDevicePattern()`)
- Input: AnalyticsData + ComparisonData, serialized with truncation per base class
- LLM output is `SUMMARY:\n...\nFINDINGS:\n[json]` — parsed by a new `parseBriefResponse()` private method in LLMService into `{ summary: string, findings: Finding[] }`
- Respects feature flags: `LLM_ENABLED`, `LLM_MOCK_MODE`
- BriefScreen checks `FEATURE_FLAGS.LLM_ENABLED`: when true, calls `llmService.generateBrief()`; when false, uses deterministic fallback
- **Fallback when LLM disabled:** Summary is a structured text built from analytics metrics (total detections, threat distribution, nighttime %, comparison delta). Findings generated from `generateInsights()` service. Both sections render — the summary is just deterministic rather than LLM-generated.

## Types

New file: `src/types/report.ts`

```typescript
export type ReportTemplate = 'security-summary' | 'activity-report' | 'signal-analysis';

export interface ReportConfig {
  template: ReportTemplate;
  period: 'day' | 'week' | 'month' | 'year';
  threatLevels: ThreatLevel[];
  detectionTypes: DetectionType[];
  deviceIds: string[];
}

export interface SavedReport {
  id: string;
  name: string;
  config: ReportConfig;
  createdAt: string;
  lastGeneratedAt?: string;
}

export interface IntelligenceBrief {
  summary: string;
  findings: Finding[];
  generatedAt: string;
  period: string;
}

export interface Finding {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metric?: string;
}
```

## State Management

Follows the existing three-layer pattern:

**Redux Persist** — New `savedReportsSlice` at `src/store/slices/savedReportsSlice.ts`:
- State: `{ reports: SavedReport[]; lastBriefGeneratedAt?: string }`
- Actions: `addSavedReport`, `updateSavedReport`, `deleteSavedReport`, `updateLastGenerated`, `setLastBriefGeneratedAt`
- Added to persist whitelist alongside auth, settings, blockedDevices

**React Query** — No new hooks. ReportPreviewScreen and BriefScreen use existing `useAnalytics()` and `useComparison()` with the config's period/dates.

**Zustand** — No new stores. Ephemeral filter state in ReportBuilderScreen is local `useState`.

## Navigation Updates

Add to `MoreStackParamList` and `AnalyticsStackParamList` in `src/navigation/types.ts`:

```typescript
ReportBuilder: { template: ReportTemplate; savedReportId?: string };
ReportPreview: { config: ReportConfig; savedReportId?: string };
Brief: undefined;
```

Register all four screens in `MoreStack.tsx` and `AnalyticsStack.tsx`.

## Export Pipeline

**PDF generation:**
- `expo-print` renders an HTML string to PDF
- HTML template built per report type with inline CSS
- Charts rendered as simplified HTML/CSS representations (horizontal bars, styled tables) — no canvas
- File naming: `TrailSense_{TemplateName}_{Period}_{Date}.pdf`

**CSV generation:**
- CSV string built in-memory from analytics data
- Columns vary by template:
  - Security Summary: date, total_detections, unique_devices, threat_level, detection_type
  - Activity Report: date, hour, day_of_week, count, nighttime_flag, anomaly_type
  - Signal Analysis: date, rssi_median, rssi_peak, proximity_zone, modality, confidence_tier
- File naming: `TrailSense_{TemplateName}_{Period}_{Date}.csv`

**Share flow:**
1. User taps "Export" in header
2. Action sheet: "Share as PDF", "Share as CSV"
3. Generate file to temp directory, open `expo-sharing` share sheet (user can save to Files, AirDrop, email, etc. from the system share sheet)

## New Components

**Molecules:**
- `ReportTemplateRow` — Icon, template name, description, chevron. Used on hub screen.
- `SavedReportRow` — Name, template badge, date, swipe-to-delete. Used on hub screen.
- `BriefSummaryCard` — Card with larger body text for narrative prose.
- `FindingCard` — Severity dot, title, description, optional metric. For brief findings.
- `ReportSection` — Title + children wrapper for rendered report sections.

**Organisms:**
- `SecuritySummaryReport` — Full Security Summary template renderer. Takes AnalyticsData + ComparisonData.
- `ActivityReportReport` — Full Activity Report template renderer.
- `SignalAnalysisReport` — Full Signal Analysis template renderer.

**Services:**
- `src/services/llm/templates/BriefTemplate.ts` — LLM prompt template for intelligence brief.
- `src/services/reportExport.ts` — PDF HTML builder and CSV string builder per template.

## Reused Existing Components

- `StatCard`, `ChartCard`, `InsightCard` — analytics molecules
- `StackedAreaChart`, `MultiLineChart`, `ActivityHeatmap` — chart organisms
- `BarChart` from react-native-gifted-charts
- `ModalityCard`, `ProximityZoneVisual` — signal visualization molecules
- `FilterChip`, `TabSegment`, `Button`, `Icon`, `Text` — atoms/molecules
- `ScreenLayout`, `LoadingState`, `ErrorState`, `EmptyState` — templates
- `useAnalytics`, `useComparison`, `useDevices` — existing hooks
- `generateInsights` — existing insight generation service

## No New API Endpoints

All data comes from existing endpoints:
- `analyticsApi.getAnalytics()` — core analytics data
- `analyticsApi.getComparison()` — period comparison
- Existing LLM service pipeline for brief generation

The unused `analyticsApi.exportReport()` endpoint remains unused — export is handled client-side via `expo-print` and `expo-file-system` for offline capability.

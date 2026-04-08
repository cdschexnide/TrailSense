# Reports Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder ReportsScreen with a hub providing template-based report generation, saved report configs, and LLM-powered intelligence briefs.

**Architecture:** Hub & Spoke — ReportsScreen is a hub with three sections (Intelligence Brief, Report Templates, Saved Reports). Each section navigates to a dedicated screen (BriefScreen, ReportBuilderScreen → ReportPreviewScreen). New `savedReportsSlice` persists saved configs. Export pipeline uses `expo-print` for PDF and `expo-sharing` for the share sheet. LLM brief uses a new `BriefTemplate` extending the existing `PromptTemplate` base class.

**Tech Stack:** React Native (Expo SDK 54), Redux Toolkit + Redux Persist, React Query, expo-print, expo-sharing, react-native-gifted-charts, existing LLM pipeline

**Spec:** `docs/superpowers/specs/2026-04-08-reports-feature-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/types/report.ts` | Report types: ReportTemplate, ReportConfig, SavedReport, Finding, IntelligenceBrief |
| `src/store/slices/savedReportsSlice.ts` | Redux slice for CRUD on saved report configs (persisted) |
| `src/components/molecules/ReportTemplateRow/ReportTemplateRow.tsx` | Hub row: icon, template name, description, chevron |
| `src/components/molecules/ReportTemplateRow/index.ts` | Barrel export |
| `src/components/molecules/SavedReportRow/SavedReportRow.tsx` | Hub row: name, template badge, date, swipe-to-delete |
| `src/components/molecules/SavedReportRow/index.ts` | Barrel export |
| `src/components/molecules/FindingCard/FindingCard.tsx` | Brief finding: severity dot, title, description, metric |
| `src/components/molecules/FindingCard/index.ts` | Barrel export |
| `src/components/molecules/BriefSummaryCard/BriefSummaryCard.tsx` | Narrative summary card with larger body text |
| `src/components/molecules/BriefSummaryCard/index.ts` | Barrel export |
| `src/components/molecules/ReportSection/ReportSection.tsx` | Titled section wrapper for report content |
| `src/components/molecules/ReportSection/index.ts` | Barrel export |
| `src/components/organisms/reports/SecuritySummaryReport.tsx` | Full Security Summary template renderer |
| `src/components/organisms/reports/ActivityReportReport.tsx` | Full Activity Report template renderer |
| `src/components/organisms/reports/SignalAnalysisReport.tsx` | Full Signal Analysis template renderer |
| `src/components/organisms/reports/index.ts` | Barrel export for report organisms |
| `src/screens/analytics/ReportBuilderScreen.tsx` | Filter config + generate screen |
| `src/screens/analytics/ReportPreviewScreen.tsx` | Rendered report + export actions |
| `src/screens/analytics/BriefScreen.tsx` | LLM intelligence brief generation |
| `src/services/llm/templates/BriefTemplate.ts` | LLM prompt template for intelligence briefs |
| `src/services/reportExport.ts` | PDF HTML builder + CSV string builder per template |
| `__tests__/store/slices/savedReportsSlice.test.ts` | Slice tests |
| `__tests__/services/reportExport.test.ts` | Export service tests |
| `__tests__/screens/analytics/ReportsScreen.test.tsx` | Hub screen tests |

### Modified Files
| File | Change |
|------|--------|
| `src/types/index.ts` | Add `export * from './report'` |
| `src/store/index.ts` | Add savedReportsSlice with persist config |
| `src/navigation/types.ts` | Add ReportBuilder, ReportPreview, Brief to MoreStack + AnalyticsStack param lists |
| `src/navigation/stacks/MoreStack.tsx` | Register 3 new screens |
| `src/navigation/stacks/AnalyticsStack.tsx` | Register 3 new screens |
| `src/screens/analytics/ReportsScreen.tsx` | Replace placeholder with hub |
| `src/screens/analytics/index.ts` | Add new screen exports |
| `src/components/molecules/index.ts` | Add new molecule exports |
| `src/components/organisms/index.ts` | Add report organism exports |
| `src/services/llm/templates/index.ts` | Add BriefTemplate export |
| `package.json` | Add expo-print, expo-sharing dependencies |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install expo-print and expo-sharing**

```bash
npx expo install expo-print expo-sharing
```

- [ ] **Step 2: Verify installation**

```bash
npx expo doctor
```

Expected: No critical issues related to expo-print or expo-sharing.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add expo-print and expo-sharing dependencies for report export"
```

---

### Task 2: Report Types

**Files:**
- Create: `src/types/report.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create report types file**

```typescript
// src/types/report.ts
import type { ThreatLevel, DetectionType } from './alert';

export type ReportTemplate =
  | 'security-summary'
  | 'activity-report'
  | 'signal-analysis';

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

export interface Finding {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metric?: string;
}

export interface IntelligenceBrief {
  summary: string;
  findings: Finding[];
  generatedAt: string;
  period: string;
}

export const REPORT_TEMPLATES: Record<
  ReportTemplate,
  { name: string; description: string; icon: string }
> = {
  'security-summary': {
    name: 'Security Summary',
    description:
      'Threat overview, detection counts, top devices, period comparison',
    icon: 'shield-checkmark-outline',
  },
  'activity-report': {
    name: 'Activity Report',
    description:
      'Temporal patterns, hourly/daily breakdowns, nighttime activity',
    icon: 'bar-chart-outline',
  },
  'signal-analysis': {
    name: 'Signal Analysis',
    description: 'RSSI distributions, proximity zones, modality breakdown',
    icon: 'radio-outline',
  },
};
```

- [ ] **Step 2: Add to types barrel**

Add to `src/types/index.ts`:
```typescript
// Report types
export * from './report';
```

- [ ] **Step 3: Verify types compile**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/report.ts src/types/index.ts
git commit -m "feat: add report types (ReportConfig, SavedReport, Finding, IntelligenceBrief)"
```

---

### Task 3: savedReportsSlice (TDD)

**Files:**
- Create: `src/store/slices/savedReportsSlice.ts`
- Modify: `src/store/index.ts`
- Create: `__tests__/store/slices/savedReportsSlice.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/store/slices/savedReportsSlice.test.ts
import reducer, {
  addSavedReport,
  updateSavedReport,
  deleteSavedReport,
  updateLastGenerated,
  setLastBriefGeneratedAt,
} from '@store/slices/savedReportsSlice';
import type { SavedReport, ReportConfig } from '@/types/report';

const makeConfig = (
  overrides?: Partial<ReportConfig>
): ReportConfig => ({
  template: 'security-summary',
  period: 'week',
  threatLevels: ['critical', 'high', 'medium', 'low'],
  detectionTypes: ['cellular', 'wifi', 'bluetooth'],
  deviceIds: ['dev-1', 'dev-2'],
  ...overrides,
});

const makeSaved = (overrides?: Partial<SavedReport>): SavedReport => ({
  id: 'report-1',
  name: 'My Report',
  config: makeConfig(),
  createdAt: '2026-04-08T00:00:00.000Z',
  ...overrides,
});

describe('savedReportsSlice', () => {
  const initialState = { reports: [] as SavedReport[] };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should add a saved report', () => {
    const report = makeSaved();
    const state = reducer(initialState, addSavedReport(report));
    expect(state.reports).toHaveLength(1);
    expect(state.reports[0]).toEqual(report);
  });

  it('should update a saved report', () => {
    const report = makeSaved();
    const stateWithReport = { reports: [report] };
    const state = reducer(
      stateWithReport,
      updateSavedReport({ id: 'report-1', name: 'Updated Name' })
    );
    expect(state.reports[0].name).toBe('Updated Name');
    expect(state.reports[0].config).toEqual(report.config);
  });

  it('should delete a saved report', () => {
    const report = makeSaved();
    const stateWithReport = { reports: [report] };
    const state = reducer(stateWithReport, deleteSavedReport('report-1'));
    expect(state.reports).toHaveLength(0);
  });

  it('should update lastGeneratedAt', () => {
    const report = makeSaved();
    const stateWithReport = { reports: [report] };
    const timestamp = '2026-04-08T12:00:00.000Z';
    const state = reducer(
      stateWithReport,
      updateLastGenerated({ id: 'report-1', timestamp })
    );
    expect(state.reports[0].lastGeneratedAt).toBe(timestamp);
  });

  it('should not mutate state on update with unknown id', () => {
    const report = makeSaved();
    const stateWithReport = { reports: [report] };
    const state = reducer(
      stateWithReport,
      updateSavedReport({ id: 'nonexistent', name: 'Nope' })
    );
    expect(state.reports[0].name).toBe('My Report');
  });

  it('should set lastBriefGeneratedAt', () => {
    const timestamp = '2026-04-08T14:00:00.000Z';
    const state = reducer(
      initialState,
      setLastBriefGeneratedAt(timestamp)
    );
    expect(state.lastBriefGeneratedAt).toBe(timestamp);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/store/slices/savedReportsSlice.test.ts --no-coverage
```

Expected: FAIL — cannot resolve `@store/slices/savedReportsSlice`.

- [ ] **Step 3: Implement the slice**

```typescript
// src/store/slices/savedReportsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SavedReport } from '@/types/report';

export interface SavedReportsState {
  reports: SavedReport[];
  lastBriefGeneratedAt?: string;
}

const initialState: SavedReportsState = {
  reports: [],
};

const savedReportsSlice = createSlice({
  name: 'savedReports',
  initialState,
  reducers: {
    addSavedReport: (state, action: PayloadAction<SavedReport>) => {
      state.reports.push(action.payload);
    },
    updateSavedReport: (
      state,
      action: PayloadAction<{ id: string } & Partial<Omit<SavedReport, 'id'>>>
    ) => {
      const index = state.reports.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        const { id, ...updates } = action.payload;
        Object.assign(state.reports[index], updates);
      }
    },
    deleteSavedReport: (state, action: PayloadAction<string>) => {
      state.reports = state.reports.filter(r => r.id !== action.payload);
    },
    updateLastGenerated: (
      state,
      action: PayloadAction<{ id: string; timestamp: string }>
    ) => {
      const report = state.reports.find(
        r => r.id === action.payload.id
      );
      if (report) {
        report.lastGeneratedAt = action.payload.timestamp;
      }
    },
    setLastBriefGeneratedAt: (
      state,
      action: PayloadAction<string>
    ) => {
      state.lastBriefGeneratedAt = action.payload;
    },
  },
});

export const {
  addSavedReport,
  updateSavedReport,
  deleteSavedReport,
  updateLastGenerated,
  setLastBriefGeneratedAt,
} = savedReportsSlice.actions;

export default savedReportsSlice.reducer;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/store/slices/savedReportsSlice.test.ts --no-coverage
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Register slice in store with persistence**

Modify `src/store/index.ts`. Add these imports at the top:
```typescript
import savedReportsReducer from './slices/savedReportsSlice';
```

Add persist config after the existing `blockedDevicesPersistConfig`:
```typescript
const savedReportsPersistConfig = {
  key: 'savedReports',
  storage: AsyncStorage,
};
const persistedSavedReportsReducer = persistReducer(
  savedReportsPersistConfig,
  savedReportsReducer
);
```

Add to the `reducer` object in `configureStore`:
```typescript
savedReports: persistedSavedReportsReducer,
```

- [ ] **Step 6: Verify types compile**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/store/slices/savedReportsSlice.ts src/store/index.ts __tests__/store/slices/savedReportsSlice.test.ts
git commit -m "feat: add savedReportsSlice with persistence for saved report configs"
```

---

### Task 4: Navigation Updates

**Files:**
- Modify: `src/navigation/types.ts`
- Modify: `src/navigation/stacks/MoreStack.tsx`
- Modify: `src/navigation/stacks/AnalyticsStack.tsx`

- [ ] **Step 1: Add new screen types to navigation types**

In `src/navigation/types.ts`, add the import at the top:
```typescript
import { ReportTemplate, ReportConfig } from '@types';
```

Add three entries to `AnalyticsStackParamList`:
```typescript
export type AnalyticsStackParamList = {
  Dashboard: undefined;
  Heatmap: undefined;
  Reports: undefined;
  ReportBuilder: { template: ReportTemplate; savedReportId?: string };
  ReportPreview: { config: ReportConfig; savedReportId?: string };
  Brief: undefined;
};
```

Add the same three entries to `MoreStackParamList` (after the existing `Reports: undefined;` line):
```typescript
  ReportBuilder: { template: ReportTemplate; savedReportId?: string };
  ReportPreview: { config: ReportConfig; savedReportId?: string };
  Brief: undefined;
```

- [ ] **Step 2: Register screens in AnalyticsStack**

In `src/navigation/stacks/AnalyticsStack.tsx`, add imports:
```typescript
import {
  DashboardScreen,
  HeatmapScreen,
  ReportsScreen,
  ReportBuilderScreen,
  ReportPreviewScreen,
  BriefScreen,
} from '@screens/analytics';
```

Add three `Stack.Screen` entries after the Reports screen:
```typescript
<Stack.Screen name="ReportBuilder" component={ReportBuilderScreen} />
<Stack.Screen name="ReportPreview" component={ReportPreviewScreen} />
<Stack.Screen name="Brief" component={BriefScreen} />
```

- [ ] **Step 3: Register screens in MoreStack**

In `src/navigation/stacks/MoreStack.tsx`, update the analytics import:
```typescript
import {
  DashboardScreen,
  HeatmapScreen,
  ReportsScreen,
  ReportBuilderScreen,
  ReportPreviewScreen,
  BriefScreen,
} from '@screens/analytics';
```

Add three `Stack.Screen` entries after the Reports screen:
```typescript
<Stack.Screen name="ReportBuilder" component={ReportBuilderScreen} />
<Stack.Screen name="ReportPreview" component={ReportPreviewScreen} />
<Stack.Screen name="Brief" component={BriefScreen} />
```

- [ ] **Step 4: Create placeholder screens so navigation compiles**

Create temporary `src/screens/analytics/ReportBuilderScreen.tsx`:
```typescript
import React from 'react';
import { View } from 'react-native';
import { Text } from '@components/atoms';

export const ReportBuilderScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text variant="title1">Report Builder</Text>
  </View>
);
```

Create temporary `src/screens/analytics/ReportPreviewScreen.tsx`:
```typescript
import React from 'react';
import { View } from 'react-native';
import { Text } from '@components/atoms';

export const ReportPreviewScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text variant="title1">Report Preview</Text>
  </View>
);
```

Create temporary `src/screens/analytics/BriefScreen.tsx`:
```typescript
import React from 'react';
import { View } from 'react-native';
import { Text } from '@components/atoms';

export const BriefScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text variant="title1">Intelligence Brief</Text>
  </View>
);
```

- [ ] **Step 5: Update screen barrel exports**

In `src/screens/analytics/index.ts`, add:
```typescript
export { ReportBuilderScreen } from './ReportBuilderScreen';
export { ReportPreviewScreen } from './ReportPreviewScreen';
export { BriefScreen } from './BriefScreen';
```

- [ ] **Step 6: Verify types compile**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/navigation/types.ts src/navigation/stacks/MoreStack.tsx src/navigation/stacks/AnalyticsStack.tsx src/screens/analytics/ReportBuilderScreen.tsx src/screens/analytics/ReportPreviewScreen.tsx src/screens/analytics/BriefScreen.tsx src/screens/analytics/index.ts
git commit -m "feat: register ReportBuilder, ReportPreview, Brief screens in navigation"
```

---

### Task 5: ReportTemplateRow Molecule

**Files:**
- Create: `src/components/molecules/ReportTemplateRow/ReportTemplateRow.tsx`
- Create: `src/components/molecules/ReportTemplateRow/index.ts`
- Modify: `src/components/molecules/index.ts`

- [ ] **Step 1: Create the component**

```typescript
// src/components/molecules/ReportTemplateRow/ReportTemplateRow.tsx
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';

interface ReportTemplateRowProps {
  icon: string;
  name: string;
  description: string;
  onPress: () => void;
}

export const ReportTemplateRow: React.FC<ReportTemplateRowProps> = ({
  icon,
  name,
  description,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${description}`}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.systemGray6 },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${colors.systemBlue}20` },
        ]}
      >
        <Icon name={icon as any} size={20} color={colors.systemBlue} />
      </View>
      <View style={styles.content}>
        <Text variant="body" style={{ color: colors.label }}>
          {name}
        </Text>
        <Text variant="footnote" color="secondaryLabel" numberOfLines={2}>
          {description}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.tertiaryLabel} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.75,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
});
```

- [ ] **Step 2: Create barrel export**

```typescript
// src/components/molecules/ReportTemplateRow/index.ts
export { ReportTemplateRow } from './ReportTemplateRow';
```

- [ ] **Step 3: Add to molecules barrel**

Add to `src/components/molecules/index.ts`:
```typescript
export { ReportTemplateRow } from './ReportTemplateRow';
```

- [ ] **Step 4: Verify types compile**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/molecules/ReportTemplateRow/ src/components/molecules/index.ts
git commit -m "feat: add ReportTemplateRow molecule for reports hub"
```

---

### Task 6: SavedReportRow Molecule

**Files:**
- Create: `src/components/molecules/SavedReportRow/SavedReportRow.tsx`
- Create: `src/components/molecules/SavedReportRow/index.ts`
- Modify: `src/components/molecules/index.ts`

- [ ] **Step 1: Create the component**

```typescript
// src/components/molecules/SavedReportRow/SavedReportRow.tsx
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import {
  SwipeableRow,
  createSwipeActions,
} from '@components/molecules/SwipeableRow';
import { useTheme } from '@hooks/useTheme';
import { REPORT_TEMPLATES } from '@/types/report';
import type { ReportTemplate } from '@/types/report';

interface SavedReportRowProps {
  name: string;
  template: ReportTemplate;
  lastGeneratedAt?: string;
  onPress: () => void;
  onDelete: () => void;
}

const TEMPLATE_BADGE_COLORS: Record<ReportTemplate, string> = {
  'security-summary': '#EF4444',
  'activity-report': '#F59E0B',
  'signal-analysis': '#3B82F6',
};

export const SavedReportRow: React.FC<SavedReportRowProps> = ({
  name,
  template,
  lastGeneratedAt,
  onPress,
  onDelete,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const badgeColor = TEMPLATE_BADGE_COLORS[template];
  const templateName = REPORT_TEMPLATES[template].name;
  const swipeActions = createSwipeActions(colors);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formattedDate = lastGeneratedAt
    ? new Date(lastGeneratedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Never generated';

  return (
    <SwipeableRow rightActions={[swipeActions.delete(onDelete)]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${templateName}, ${formattedDate}`}
        accessibilityHint="Delete action available"
        style={({ pressed }) => [
          styles.container,
          { backgroundColor: colors.systemGray6 },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text variant="body" style={{ color: colors.label, flex: 1 }}>
              {name}
            </Text>
            <View
              style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}
            >
              <Text
                variant="caption2"
                style={{ color: badgeColor, fontSize: 10 }}
              >
                {templateName}
              </Text>
            </View>
          </View>
          <Text variant="footnote" color="secondaryLabel">
            {formattedDate}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.tertiaryLabel} />
      </Pressable>
    </SwipeableRow>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.75,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
```

- [ ] **Step 2: Create barrel export**

```typescript
// src/components/molecules/SavedReportRow/index.ts
export { SavedReportRow } from './SavedReportRow';
```

- [ ] **Step 3: Add to molecules barrel**

Add to `src/components/molecules/index.ts`:
```typescript
export { SavedReportRow } from './SavedReportRow';
```

- [ ] **Step 4: Verify types compile**

```bash
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/components/molecules/SavedReportRow/ src/components/molecules/index.ts
git commit -m "feat: add SavedReportRow molecule with template badge"
```

---

### Task 7: FindingCard and BriefSummaryCard Molecules

**Files:**
- Create: `src/components/molecules/FindingCard/FindingCard.tsx`
- Create: `src/components/molecules/FindingCard/index.ts`
- Create: `src/components/molecules/BriefSummaryCard/BriefSummaryCard.tsx`
- Create: `src/components/molecules/BriefSummaryCard/index.ts`
- Modify: `src/components/molecules/index.ts`

- [ ] **Step 1: Create FindingCard**

```typescript
// src/components/molecules/FindingCard/FindingCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';
import type { Finding } from '@/types/report';

interface FindingCardProps {
  finding: Finding;
}

const SEVERITY_COLORS: Record<Finding['severity'], string> = {
  critical: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const dotColor = SEVERITY_COLORS[finding.severity];

  return (
    <View
      style={[styles.card, { backgroundColor: colors.systemGray6, borderColor: colors.separator }]}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text variant="subheadline" weight="semibold" style={{ color: colors.label, flex: 1 }}>
          {finding.title}
        </Text>
      </View>
      <Text variant="footnote" color="secondaryLabel" style={styles.description}>
        {finding.description}
      </Text>
      {finding.metric && (
        <View style={[styles.metricContainer, { backgroundColor: `${dotColor}10` }]}>
          <Text variant="caption1" style={{ color: dotColor }}>
            {finding.metric}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  description: {
    marginLeft: 18,
  },
  metricContainer: {
    marginLeft: 18,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});
```

- [ ] **Step 2: Create FindingCard barrel**

```typescript
// src/components/molecules/FindingCard/index.ts
export { FindingCard } from './FindingCard';
```

- [ ] **Step 3: Create BriefSummaryCard**

```typescript
// src/components/molecules/BriefSummaryCard/BriefSummaryCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';

interface BriefSummaryCardProps {
  summary: string;
}

export const BriefSummaryCard: React.FC<BriefSummaryCardProps> = ({
  summary,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.systemGray6, borderColor: colors.separator },
      ]}
    >
      <View style={styles.header}>
        <Icon
          name="sparkles-outline"
          size={18}
          color={colors.systemIndigo}
        />
        <Text
          variant="caption1"
          tactical
          color="secondaryLabel"
        >
          EXECUTIVE SUMMARY
        </Text>
      </View>
      <Text
        variant="body"
        style={{ color: colors.label, lineHeight: 22 }}
      >
        {summary}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
```

- [ ] **Step 4: Create BriefSummaryCard barrel**

```typescript
// src/components/molecules/BriefSummaryCard/index.ts
export { BriefSummaryCard } from './BriefSummaryCard';
```

- [ ] **Step 5: Add both to molecules barrel**

Add to `src/components/molecules/index.ts`:
```typescript
export { FindingCard } from './FindingCard';
export { BriefSummaryCard } from './BriefSummaryCard';
```

- [ ] **Step 6: Verify types compile**

```bash
npm run type-check
```

- [ ] **Step 7: Commit**

```bash
git add src/components/molecules/FindingCard/ src/components/molecules/BriefSummaryCard/ src/components/molecules/index.ts
git commit -m "feat: add FindingCard and BriefSummaryCard molecules for intelligence brief"
```

---

### Task 8: ReportSection Molecule

**Files:**
- Create: `src/components/molecules/ReportSection/ReportSection.tsx`
- Create: `src/components/molecules/ReportSection/index.ts`
- Modify: `src/components/molecules/index.ts`

- [ ] **Step 1: Create the component**

```typescript
// src/components/molecules/ReportSection/ReportSection.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';

interface ReportSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  title,
  subtitle,
  children,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="headline" weight="semibold" style={{ color: colors.label }}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="footnote" color="secondaryLabel">
            {subtitle}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.content,
          { backgroundColor: colors.systemGray6, borderColor: colors.separator },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  header: {
    gap: 2,
  },
  content: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
});
```

- [ ] **Step 2: Create barrel export**

```typescript
// src/components/molecules/ReportSection/index.ts
export { ReportSection } from './ReportSection';
```

- [ ] **Step 3: Add to molecules barrel**

Add to `src/components/molecules/index.ts`:
```typescript
export { ReportSection } from './ReportSection';
```

- [ ] **Step 4: Commit**

```bash
git add src/components/molecules/ReportSection/ src/components/molecules/index.ts
git commit -m "feat: add ReportSection molecule for report content layout"
```

---

### Task 9: ReportsScreen Hub (Replace Placeholder)

**Files:**
- Modify: `src/screens/analytics/ReportsScreen.tsx`
- Create: `__tests__/screens/analytics/ReportsScreen.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/screens/analytics/ReportsScreen.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReportsScreen } from '@screens/analytics/ReportsScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

// Mock Redux
const mockSavedReports: any[] = [];
jest.mock('@store/index', () => ({
  useAppSelector: (selector: any) =>
    selector({ savedReports: { reports: mockSavedReports } }),
  useAppDispatch: () => jest.fn(),
}));

// Mock theme
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#000',
        label: '#FFF',
        secondaryLabel: '#999',
        tertiaryLabel: '#666',
        systemGray6: '#1C1C1E',
        separator: '#333',
        systemBlue: '#0A84FF',
        systemIndigo: '#5E5CE6',
        brandAccent: '#6B6B4E',
      },
    },
  }),
}));

describe('ReportsScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the three template rows', () => {
    const { getByText } = render(
      <ReportsScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />
    );
    expect(getByText('Security Summary')).toBeTruthy();
    expect(getByText('Activity Report')).toBeTruthy();
    expect(getByText('Signal Analysis')).toBeTruthy();
  });

  it('renders the intelligence brief row', () => {
    const { getByText } = render(
      <ReportsScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />
    );
    expect(getByText('Intelligence Brief')).toBeTruthy();
  });

  it('shows empty state when no saved reports', () => {
    const { getByText } = render(
      <ReportsScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />
    );
    expect(getByText(/No saved reports yet/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/analytics/ReportsScreen.test.tsx --no-coverage
```

Expected: FAIL — the current placeholder doesn't render template rows.

- [ ] **Step 3: Implement the hub screen**

Replace the entire contents of `src/screens/analytics/ReportsScreen.tsx`:

```typescript
// src/screens/analytics/ReportsScreen.tsx
import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import {
  GroupedListSection,
  GroupedListRow,
  ReportTemplateRow,
  SavedReportRow,
} from '@components/molecules';
import { ScreenLayout } from '@components/templates';
import { useTheme } from '@hooks/useTheme';
import { useAppSelector, useAppDispatch } from '@store/index';
import { deleteSavedReport } from '@store/slices/savedReportsSlice';
import { REPORT_TEMPLATES } from '@/types/report';
import type { ReportTemplate } from '@/types/report';
import type { SavedReportsState } from '@store/slices/savedReportsSlice';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  AnalyticsStackParamList,
  MoreStackParamList,
} from '@navigation/types';

type ReportsScreenProps =
  | NativeStackScreenProps<AnalyticsStackParamList, 'Reports'>
  | NativeStackScreenProps<MoreStackParamList, 'Reports'>;

export const ReportsScreen = ({ navigation }: ReportsScreenProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const dispatch = useAppDispatch();
  const savedReports = useAppSelector(
    state => state.savedReports.reports
  );
  const lastBriefGeneratedAt = useAppSelector(
    state => (state.savedReports as SavedReportsState).lastBriefGeneratedAt
  );

  const navigateTo = (screen: string, params?: object) => {
    (navigation as any).navigate(screen, params);
  };

  const handleTemplatePress = (template: ReportTemplate) => {
    navigateTo('ReportBuilder', { template });
  };

  const handleSavedReportPress = (savedReportId: string) => {
    const saved = savedReports.find(r => r.id === savedReportId);
    if (saved) {
      navigateTo('ReportBuilder', {
        template: saved.config.template,
        savedReportId,
      });
    }
  };

  const handleDeleteSavedReport = (id: string, name: string) => {
    Alert.alert('Delete Report', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          dispatch(deleteSavedReport(id));
        },
      },
    ]);
  };

  return (
    <ScreenLayout
      header={{
        title: 'Reports',
        largeTitle: true,
        showBack: true,
      }}
      scrollable
    >
      <View style={styles.container}>
        <GroupedListSection title="INTELLIGENCE">
          <GroupedListRow
            icon="sparkles-outline"
            iconColor={colors.systemIndigo}
            title="Intelligence Brief"
            subtitle={
              lastBriefGeneratedAt
                ? `Last generated ${new Date(lastBriefGeneratedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                : 'Generate an AI-powered security briefing'
            }
            showChevron
            onPress={() => navigateTo('Brief')}
          />
        </GroupedListSection>

        <GroupedListSection title="REPORT TEMPLATES">
          {(
            Object.entries(REPORT_TEMPLATES) as [
              ReportTemplate,
              (typeof REPORT_TEMPLATES)[ReportTemplate],
            ][]
          ).map(([key, tmpl]) => (
            <ReportTemplateRow
              key={key}
              icon={tmpl.icon}
              name={tmpl.name}
              description={tmpl.description}
              onPress={() => handleTemplatePress(key)}
            />
          ))}
        </GroupedListSection>

        <GroupedListSection title="SAVED REPORTS">
          {savedReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon
                name="document-outline"
                size={24}
                color={colors.tertiaryLabel}
              />
              <Text
                variant="footnote"
                color="secondaryLabel"
                style={styles.emptyText}
              >
                No saved reports yet. Generate a report and save it for
                quick access.
              </Text>
            </View>
          ) : (
            savedReports.map(report => (
              <SavedReportRow
                key={report.id}
                name={report.name}
                template={report.config.template}
                lastGeneratedAt={report.lastGeneratedAt}
                onPress={() => handleSavedReportPress(report.id)}
                onDelete={() =>
                  handleDeleteSavedReport(report.id, report.name)
                }
              />
            ))
          )}
        </GroupedListSection>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/analytics/ReportsScreen.test.tsx --no-coverage
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Verify types compile**

```bash
npm run type-check
```

- [ ] **Step 6: Commit**

```bash
git add src/screens/analytics/ReportsScreen.tsx __tests__/screens/analytics/ReportsScreen.test.tsx
git commit -m "feat: replace Reports placeholder with hub screen (templates, saved, brief)"
```

---

### Task 10: ReportBuilderScreen

**Files:**
- Modify: `src/screens/analytics/ReportBuilderScreen.tsx`

- [ ] **Step 1: Implement the full builder screen**

Replace the placeholder `src/screens/analytics/ReportBuilderScreen.tsx`:

```typescript
// src/screens/analytics/ReportBuilderScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Pressable,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { Button } from '@components/atoms/Button';
import { FilterChip, GroupedListSection } from '@components/molecules';
import { ScreenLayout } from '@components/templates';
import { useTheme } from '@hooks/useTheme';
import { useDevices } from '@hooks/useDevices';
import { useAppSelector, useAppDispatch } from '@store/index';
import {
  addSavedReport,
  updateSavedReport,
} from '@store/slices/savedReportsSlice';
import {
  REPORT_TEMPLATES,
  type ReportConfig,
  type ReportTemplate,
  type SavedReport,
} from '@/types/report';
import type { ThreatLevel, DetectionType } from '@/types/alert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  AnalyticsStackParamList,
  MoreStackParamList,
} from '@navigation/types';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'day', label: '24h' },
  { key: 'week', label: '7d' },
  { key: 'month', label: '30d' },
  { key: 'year', label: '1y' },
];

const ALL_THREAT_LEVELS: ThreatLevel[] = [
  'critical',
  'high',
  'medium',
  'low',
];
const ALL_DETECTION_TYPES: DetectionType[] = [
  'cellular',
  'wifi',
  'bluetooth',
];

const THREAT_COLORS: Record<ThreatLevel, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#22C55E',
};

const DETECTION_COLORS: Record<DetectionType, string> = {
  cellular: '#EF4444',
  wifi: '#3B82F6',
  bluetooth: '#8B5CF6',
};

type BuilderScreenProps =
  | NativeStackScreenProps<AnalyticsStackParamList, 'ReportBuilder'>
  | NativeStackScreenProps<MoreStackParamList, 'ReportBuilder'>;

export const ReportBuilderScreen = ({
  navigation,
  route,
}: BuilderScreenProps) => {
  const { template, savedReportId } = route.params;
  const { theme } = useTheme();
  const colors = theme.colors;
  const dispatch = useAppDispatch();
  const { data: devices = [] } = useDevices();
  const initializedDevices = useRef(false);

  const savedReport = useAppSelector(state =>
    savedReportId
      ? state.savedReports.reports.find(
          (r: SavedReport) => r.id === savedReportId
        )
      : undefined
  );

  const [period, setPeriod] = useState<Period>(
    savedReport?.config.period || 'week'
  );
  const [threatLevels, setThreatLevels] = useState<ThreatLevel[]>(
    savedReport?.config.threatLevels || [...ALL_THREAT_LEVELS]
  );
  const [detectionTypes, setDetectionTypes] = useState<DetectionType[]>(
    savedReport?.config.detectionTypes || [...ALL_DETECTION_TYPES]
  );
  const [deviceIds, setDeviceIds] = useState<string[]>(
    savedReport?.config.deviceIds || []
  );

  // Select all devices by default once they load (new reports only)
  useEffect(() => {
    if (
      devices.length > 0 &&
      !initializedDevices.current &&
      !savedReportId
    ) {
      initializedDevices.current = true;
      setDeviceIds(devices.map(d => d.id));
    }
  }, [devices, savedReportId]);

  const templateInfo = REPORT_TEMPLATES[template];

  const toggleThreatLevel = (level: ThreatLevel) => {
    setThreatLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const toggleDetectionType = (type: DetectionType) => {
    setDetectionTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleDevice = (id: string) => {
    setDeviceIds(prev =>
      prev.includes(id)
        ? prev.filter(d => d !== id)
        : [...prev, id]
    );
  };

  const buildConfig = (): ReportConfig => ({
    template,
    period,
    threatLevels,
    detectionTypes,
    deviceIds,
  });

  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (navigation as any).navigate('ReportPreview', {
      config: buildConfig(),
      savedReportId,
    });
  };

  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState(
    savedReport?.name || ''
  );

  const handleSave = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Save Report',
        'Enter a name for this report configuration:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (name?: string) => {
              if (!name?.trim()) return;
              doSave(name.trim());
            },
          },
        ],
        'plain-text',
        savedReport?.name || ''
      );
    } else {
      setSaveNameInput(savedReport?.name || '');
      setSaveModalVisible(true);
    }
  };

  const doSave = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (savedReportId && savedReport) {
      dispatch(
        updateSavedReport({
          id: savedReportId,
          name,
          config: buildConfig(),
        })
      );
    } else {
      dispatch(
        addSavedReport({
          id: `report-${Date.now()}`,
          name,
          config: buildConfig(),
          createdAt: new Date().toISOString(),
        })
      );
    }
  };

  return (
    <ScreenLayout
      header={{
        title: templateInfo.name,
        showBack: true,
        rightActions: (
          <Button buttonStyle="plain" onPress={handleSave}>
            Save
          </Button>
        ),
      }}
      scrollable
    >
      <View style={styles.container}>
        {/* Period selector */}
        <View
          style={[
            styles.periodContainer,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          {PERIOD_OPTIONS.map(p => {
            const isSelected = period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPeriod(p.key);
                }}
                style={[
                  styles.periodButton,
                  isSelected && {
                    backgroundColor:
                      colors.brandAccent || colors.primary,
                  },
                ]}
              >
                <Text
                  variant="subheadline"
                  weight={isSelected ? 'semibold' : 'regular'}
                  style={{
                    color: isSelected ? '#FFFFFF' : colors.label,
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Threat Levels */}
        <GroupedListSection title="THREAT LEVELS">
          <View style={styles.chipRow}>
            {ALL_THREAT_LEVELS.map(level => (
              <FilterChip
                key={level}
                label={level.charAt(0).toUpperCase() + level.slice(1)}
                count={0}
                color={THREAT_COLORS[level]}
                isSelected={threatLevels.includes(level)}
                onPress={() => toggleThreatLevel(level)}
              />
            ))}
          </View>
        </GroupedListSection>

        {/* Detection Types */}
        <GroupedListSection title="DETECTION TYPES">
          <View style={styles.chipRow}>
            {ALL_DETECTION_TYPES.map(type => (
              <FilterChip
                key={type}
                label={type.charAt(0).toUpperCase() + type.slice(1)}
                count={0}
                color={DETECTION_COLORS[type]}
                isSelected={detectionTypes.includes(type)}
                onPress={() => toggleDetectionType(type)}
              />
            ))}
          </View>
        </GroupedListSection>

        {/* Devices */}
        <GroupedListSection title="SENSORS">
          {devices.map(device => {
            const isSelected = deviceIds.includes(device.id);
            return (
              <Pressable
                key={device.id}
                onPress={() => {
                  Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Light
                  );
                  toggleDevice(device.id);
                }}
                style={[
                  styles.deviceRow,
                  { backgroundColor: colors.systemGray6 },
                ]}
              >
                <Icon
                  name={
                    isSelected
                      ? 'checkbox'
                      : ('square-outline' as any)
                  }
                  size={22}
                  color={
                    isSelected
                      ? colors.brandAccent || colors.primary
                      : colors.tertiaryLabel
                  }
                />
                <Text variant="body" style={{ color: colors.label }}>
                  {device.name}
                </Text>
              </Pressable>
            );
          })}
        </GroupedListSection>

        {/* Generate button */}
        <Button
          onPress={handleGenerate}
          leftIcon={
            <Icon
              name="document-text-outline"
              size={20}
              color="#FFFFFF"
            />
          }
          style={styles.generateButton}
        >
          Generate Report
        </Button>
      </View>

      {/* Android save modal (Alert.prompt is iOS-only) */}
      {Platform.OS !== 'ios' && (
        <Modal
          visible={saveModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSaveModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.systemGray6 },
              ]}
            >
              <Text variant="headline" weight="semibold" style={{ color: colors.label }}>
                Save Report
              </Text>
              <TextInput
                value={saveNameInput}
                onChangeText={setSaveNameInput}
                placeholder="Report name"
                placeholderTextColor={colors.tertiaryLabel}
                style={[
                  styles.modalInput,
                  {
                    color: colors.label,
                    borderColor: colors.separator,
                    backgroundColor: colors.background,
                  },
                ]}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <Button
                  buttonStyle="plain"
                  onPress={() => setSaveModalVisible(false)}
                >
                  Cancel
                </Button>
                <Button
                  onPress={() => {
                    if (saveNameInput.trim()) {
                      doSave(saveNameInput.trim());
                      setSaveModalVisible(false);
                    }
                  }}
                >
                  Save
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 18,
  },
  periodContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  generateButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    borderRadius: 14,
    padding: 20,
    gap: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
```

- [ ] **Step 2: Verify types compile**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/analytics/ReportBuilderScreen.tsx
git commit -m "feat: implement ReportBuilderScreen with period, filters, and save"
```

---

### Task 11: Report Template Organisms

**Files:**
- Create: `src/components/organisms/reports/SecuritySummaryReport.tsx`
- Create: `src/components/organisms/reports/ActivityReportReport.tsx`
- Create: `src/components/organisms/reports/SignalAnalysisReport.tsx`
- Create: `src/components/organisms/reports/index.ts`
- Modify: `src/components/organisms/index.ts`

- [ ] **Step 1: Create SecuritySummaryReport**

```typescript
// src/components/organisms/reports/SecuritySummaryReport.tsx
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text } from '@components/atoms/Text';
import { StatCard, ReportSection } from '@components/molecules';
import { useTheme } from '@hooks/useTheme';
import type { AnalyticsData } from '@/types/alert';
import type { AnalyticsComparisonResponse } from '@/hooks/useAnalytics';
import type { ReportConfig } from '@/types/report';

interface SecuritySummaryReportProps {
  analytics: AnalyticsData;
  comparison?: AnalyticsComparisonResponse | null;
  config: ReportConfig;
}

export const SecuritySummaryReport: React.FC<SecuritySummaryReportProps> = ({
  analytics,
  comparison,
  config,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 96;

  const threatData = analytics.threatLevelDistribution
    .filter(d => config.threatLevels.includes(d.level as any))
    .map(d => ({
      value: d.count,
      label: d.level.slice(0, 4),
      frontColor:
        d.level === 'critical'
          ? '#EF4444'
          : d.level === 'high'
            ? '#F59E0B'
            : d.level === 'medium'
              ? '#3B82F6'
              : '#22C55E',
    }));

  const detectionData = analytics.detectionTypeDistribution
    .filter(d => config.detectionTypes.includes(d.type as any))
    .map(d => ({
      value: d.count,
      label: d.type.slice(0, 4),
      frontColor:
        d.type === 'cellular'
          ? '#EF4444'
          : d.type === 'wifi'
            ? '#3B82F6'
            : '#8B5CF6',
    }));

  const pctChange = comparison?.percentageChange?.totalDetections;
  const changeObj = pctChange != null
    ? {
        value: `${pctChange > 0 ? '+' : ''}${Math.round(pctChange)}%`,
        trend: (pctChange > 0 ? 'negative' : pctChange < 0 ? 'positive' : 'neutral') as 'positive' | 'negative' | 'neutral',
      }
    : undefined;

  return (
    <View style={styles.container}>
      <ReportSection title="Property-Wide Metrics">
        <View style={styles.statGrid}>
          <StatCard
            title="Detections"
            value={String(analytics.totalAlerts)}
            change={changeObj}
            style={styles.statCard}
          />
          <StatCard
            title="Unique Devices"
            value={String(analytics.uniqueDevices)}
            style={styles.statCard}
          />
          <StatCard
            title="Avg Confidence"
            value={`${Math.round(analytics.avgConfidence)}%`}
            style={styles.statCard}
          />
          <StatCard
            title="Closest Approach"
            value={`${Math.round(analytics.closestApproachMeters)}m`}
            style={styles.statCard}
          />
        </View>
      </ReportSection>

      {threatData.length > 0 && (
        <ReportSection title="Threat Level Distribution">
          <BarChart
            data={threatData}
            width={chartWidth}
            barWidth={32}
            spacing={16}
            noOfSections={4}
            barBorderRadius={4}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.separator}
            yAxisTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
          />
        </ReportSection>
      )}

      {detectionData.length > 0 && (
        <ReportSection title="Detection Types">
          <BarChart
            data={detectionData}
            width={chartWidth}
            barWidth={40}
            spacing={24}
            noOfSections={4}
            barBorderRadius={4}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.separator}
            yAxisTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
          />
        </ReportSection>
      )}

      {analytics.topDetectedDevices.length > 0 && (
        <ReportSection title="Top Detected Devices">
          {analytics.topDetectedDevices.slice(0, 5).map((device, i) => (
            <View key={device.fingerprintHash} style={styles.deviceRow}>
              <Text variant="caption1" tactical color="secondaryLabel">
                {i + 1}
              </Text>
              <Text variant="body" style={{ color: colors.label, flex: 1 }}>
                {device.fingerprintHash.slice(0, 12)}...
              </Text>
              <Text variant="caption1" tactical color="secondaryLabel">
                {device.count} visits
              </Text>
            </View>
          ))}
        </ReportSection>
      )}

      {analytics.deviceDistribution.length > 0 && (
        <ReportSection title="Detections by Sensor" subtitle="Filtered by selected sensors">
          {analytics.deviceDistribution
            .filter(d => config.deviceIds.includes(d.deviceId))
            .map(d => (
              <View key={d.deviceId} style={styles.deviceRow}>
                <Text variant="body" style={{ color: colors.label, flex: 1 }}>
                  {d.deviceId}
                </Text>
                <Text variant="caption1" tactical color="secondaryLabel">
                  {d.count} detections
                </Text>
              </View>
            ))}
        </ReportSection>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    minWidth: '47%',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
});
```

- [ ] **Step 2: Create ActivityReportReport**

```typescript
// src/components/organisms/reports/ActivityReportReport.tsx
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { StatCard, ReportSection } from '@components/molecules';
import { useTheme } from '@hooks/useTheme';
import type { AnalyticsData } from '@/types/alert';
import type { ReportConfig } from '@/types/report';

interface ActivityReportReportProps {
  analytics: AnalyticsData;
  config: ReportConfig;
}

export const ActivityReportReport: React.FC<ActivityReportReportProps> = ({
  analytics,
  config,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 96;

  const hourlyData = (analytics.hourlyDistribution || []).map(d => ({
    value: d.count,
    label: d.hour % 6 === 0 ? `${d.hour}` : '',
    frontColor:
      d.hour >= 22 || d.hour < 6 ? '#8B5CF6' : colors.brandAccent || colors.primary,
  }));

  const dailyTrendData = analytics.dailyTrend.map(d => ({
    value: d.count,
    label: '',
  }));

  const dayOfWeekData = (analytics.dayOfWeekDistribution || []).map(d => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      value: d.count,
      label: days[d.day] || '',
      frontColor: colors.brandAccent || colors.primary,
    };
  });

  const nightPct = analytics.nighttimeActivity.percentOfTotal;
  const nightCount = analytics.nighttimeActivity.count;

  return (
    <View style={styles.container}>
      <ReportSection title="Daily Trend">
        {dailyTrendData.length > 0 && (
          <BarChart
            data={dailyTrendData}
            width={chartWidth}
            barWidth={Math.max(4, chartWidth / dailyTrendData.length - 4)}
            spacing={2}
            noOfSections={4}
            barBorderRadius={2}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.separator}
            yAxisTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
            frontColor={colors.brandAccent || colors.primary}
          />
        )}
      </ReportSection>

      {hourlyData.length > 0 && (
        <ReportSection title="Hourly Distribution" subtitle="Purple = nighttime (10 PM-6 AM)">
          <BarChart
            data={hourlyData}
            width={chartWidth}
            barWidth={Math.max(4, chartWidth / 24 - 4)}
            spacing={2}
            noOfSections={4}
            barBorderRadius={2}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.separator}
            yAxisTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.secondaryLabel, fontSize: 9 }}
          />
        </ReportSection>
      )}

      {dayOfWeekData.length > 0 && (
        <ReportSection title="Day of Week">
          <BarChart
            data={dayOfWeekData}
            width={chartWidth}
            barWidth={32}
            spacing={12}
            noOfSections={4}
            barBorderRadius={4}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.separator}
            yAxisTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
          />
        </ReportSection>
      )}

      <ReportSection title="Nighttime Activity">
        <View style={styles.statGrid}>
          <StatCard title="Nighttime %" value={`${nightPct}%`} style={styles.statCard} />
          <StatCard title="Night Detections" value={String(nightCount)} style={styles.statCard} />
        </View>
      </ReportSection>

      {analytics.perSensorTrend.length > 0 && (
        <ReportSection title="Activity by Sensor" subtitle="Filtered by selected sensors">
          {analytics.perSensorTrend
            .slice(-7)
            .map(day => {
              const filteredSensors = day.sensors.filter(s =>
                config.deviceIds.includes(s.deviceId)
              );
              if (filteredSensors.length === 0) return null;
              return (
                <View key={day.date} style={styles.sensorDay}>
                  <StatCard
                    title={day.date}
                    value={String(
                      filteredSensors.reduce((sum, s) => sum + s.count, 0)
                    )}
                    style={styles.statCard}
                  />
                </View>
              );
            })
            .filter(Boolean)}
        </ReportSection>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    minWidth: '47%',
  },
  sensorDay: {
    flexDirection: 'row',
  },
});
```

- [ ] **Step 3: Create SignalAnalysisReport**

```typescript
// src/components/organisms/reports/SignalAnalysisReport.tsx
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text } from '@components/atoms/Text';
import { StatCard, ReportSection } from '@components/molecules';
import { ModalityCard } from '@components/molecules/ModalityCard/ModalityCard';
import { useTheme } from '@hooks/useTheme';
import type { AnalyticsData } from '@/types/alert';
import type { ReportConfig } from '@/types/report';

interface SignalAnalysisReportProps {
  analytics: AnalyticsData;
  config: ReportConfig;
}

export const SignalAnalysisReport: React.FC<SignalAnalysisReportProps> = ({
  analytics,
  config,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 96;

  const rssiData = analytics.rssiDistribution.map(d => ({
    value: d.count,
    label: `${d.bucketMin}`,
    frontColor: colors.brandAccent || colors.primary,
  }));

  const proximityData = analytics.proximityZoneDistribution.map(d => {
    const zoneColors: Record<string, string> = {
      immediate: '#EF4444',
      near: '#F59E0B',
      far: '#3B82F6',
      extreme: '#22C55E',
    };
    return {
      value: d.count,
      label: d.zone.slice(0, 4),
      frontColor: zoneColors[d.zone] || colors.primary,
    };
  });

  const { wifi, ble, cellular } = analytics.modalityBreakdown;
  const { crossModalStats } = analytics;

  return (
    <View style={styles.container}>
      <ReportSection title="Signal Strength (RSSI)">
        <View style={styles.statGrid}>
          <StatCard title="Median RSSI" value={`${analytics.medianRssi} dBm`} style={styles.statCard} />
          <StatCard title="Peak RSSI" value={`${analytics.peakRssi} dBm`} style={styles.statCard} />
        </View>
        {rssiData.length > 0 && (
          <BarChart
            data={rssiData}
            width={chartWidth}
            barWidth={Math.max(8, chartWidth / rssiData.length - 8)}
            spacing={4}
            noOfSections={4}
            barBorderRadius={3}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.separator}
            yAxisTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.secondaryLabel, fontSize: 8 }}
          />
        )}
      </ReportSection>

      {proximityData.length > 0 && (
        <ReportSection title="Proximity Zones">
          <BarChart
            data={proximityData}
            width={chartWidth}
            barWidth={40}
            spacing={20}
            noOfSections={4}
            barBorderRadius={4}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.separator}
            yAxisTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
          />
        </ReportSection>
      )}

      <ReportSection title="Modality Breakdown">
        <View style={styles.modalityCards}>
          {config.detectionTypes.includes('wifi') && (
            <ModalityCard
              title="WiFi"
              icon="wifi-outline"
              color="#3B82F6"
              count={wifi.count}
              metrics={[
                { label: 'Channels Active', value: String(wifi.channelsActive) },
                { label: 'Probe Requests', value: `${wifi.probeRequestPercent}%` },
              ]}
            />
          )}
          {config.detectionTypes.includes('bluetooth') && (
            <ModalityCard
              title="Bluetooth"
              icon="bluetooth-outline"
              color="#8B5CF6"
              count={ble.count}
              metrics={[
                { label: 'Phones', value: `${ble.phonePercent}%` },
                { label: 'Apple', value: `${ble.applePercent}%` },
                { label: 'Beacons', value: `${ble.beaconPercent}%` },
              ]}
            />
          )}
          {config.detectionTypes.includes('cellular') && (
            <ModalityCard
              title="Cellular"
              icon="cellular-outline"
              color="#EF4444"
              count={cellular.count}
              metrics={[
                { label: 'Peak dBm', value: String(cellular.avgPeakDbm) },
                { label: 'Burst Duration', value: `${cellular.avgBurstDurationMs}ms` },
                { label: 'Noise Floor', value: `${cellular.avgNoiseFloorDbm} dBm` },
              ]}
            />
          )}
        </View>
      </ReportSection>

      <ReportSection title="Cross-Modal Correlation">
        <View style={styles.statGrid}>
          <StatCard title="WiFi↔BLE Links" value={String(crossModalStats.wifiBleLinks)} style={styles.statCard} />
          <StatCard title="Link Confidence" value={`${Math.round(crossModalStats.avgLinkConfidence)}%`} style={styles.statCard} />
          <StatCard title="Phantom Merges" value={String(crossModalStats.phantomMerges)} style={styles.statCard} />
        </View>
      </ReportSection>

      {analytics.rssiTrend.length > 0 && (
        <ReportSection title="Signal Strength Trend">
          <Text variant="footnote" color="secondaryLabel" style={{ marginBottom: 8 }}>
            Average RSSI by modality over time (lower = weaker)
          </Text>
          {analytics.rssiTrend.slice(-7).map(point => (
            <View key={point.date} style={styles.trendRow}>
              <Text variant="caption1" tactical color="secondaryLabel" style={{ width: 60 }}>
                {point.date.slice(5)}
              </Text>
              {config.detectionTypes.includes('wifi') && (
                <Text variant="caption1" style={{ color: '#3B82F6', width: 70 }}>
                  WiFi: {point.wifiAvgRssi ?? '—'}
                </Text>
              )}
              {config.detectionTypes.includes('bluetooth') && (
                <Text variant="caption1" style={{ color: '#8B5CF6', width: 70 }}>
                  BLE: {point.bleAvgRssi ?? '—'}
                </Text>
              )}
              {config.detectionTypes.includes('cellular') && (
                <Text variant="caption1" style={{ color: '#EF4444', width: 70 }}>
                  Cell: {point.cellularAvgRssi ?? '—'}
                </Text>
              )}
            </View>
          ))}
        </ReportSection>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    minWidth: '47%',
  },
  modalityCards: {
    gap: 12,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
});
```

- [ ] **Step 4: Create reports barrel export**

```typescript
// src/components/organisms/reports/index.ts
export { SecuritySummaryReport } from './SecuritySummaryReport';
export { ActivityReportReport } from './ActivityReportReport';
export { SignalAnalysisReport } from './SignalAnalysisReport';
```

- [ ] **Step 5: Add to organisms barrel**

Add to `src/components/organisms/index.ts`:
```typescript
export * from './reports';
```

- [ ] **Step 6: Verify types compile**

```bash
npm run type-check
```

- [ ] **Step 7: Commit**

```bash
git add src/components/organisms/reports/ src/components/organisms/index.ts
git commit -m "feat: add SecuritySummary, ActivityReport, SignalAnalysis report organisms"
```

---

### Task 12: Report Export Service (TDD)

**Files:**
- Create: `src/services/reportExport.ts`
- Create: `__tests__/services/reportExport.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/services/reportExport.test.ts
import { buildCsvString, buildPdfHtml, getReportFilename } from '@services/reportExport';
import { mockAnalyticsData } from '@/mocks/data';
import type { ReportConfig } from '@/types/report';

const baseConfig: ReportConfig = {
  template: 'security-summary',
  period: 'week',
  threatLevels: ['critical', 'high', 'medium', 'low'],
  detectionTypes: ['cellular', 'wifi', 'bluetooth'],
  deviceIds: ['dev-1'],
};

describe('reportExport', () => {
  describe('getReportFilename', () => {
    it('generates correct filename for security-summary PDF', () => {
      const name = getReportFilename(baseConfig, 'pdf');
      expect(name).toMatch(/^TrailSense_SecuritySummary_7d_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('generates correct filename for activity-report CSV', () => {
      const config = { ...baseConfig, template: 'activity-report' as const };
      const name = getReportFilename(config, 'csv');
      expect(name).toMatch(/^TrailSense_ActivityReport_7d_\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });

  describe('buildCsvString', () => {
    it('returns a string with header row', () => {
      const csv = buildCsvString(mockAnalyticsData, baseConfig);
      expect(csv).toContain('date,');
      expect(csv.split('\n').length).toBeGreaterThan(1);
    });

    it('uses different columns for signal-analysis', () => {
      const config = { ...baseConfig, template: 'signal-analysis' as const };
      const csv = buildCsvString(mockAnalyticsData, config);
      expect(csv).toContain('rssi_median');
    });
  });

  describe('buildPdfHtml', () => {
    it('returns valid HTML for security-summary', () => {
      const html = buildPdfHtml(mockAnalyticsData, baseConfig);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Security Summary');
      expect(html).toContain('Threat Levels');
      expect(html).toContain('Detections by Sensor');
    });

    it('returns template-specific HTML for activity-report', () => {
      const config = { ...baseConfig, template: 'activity-report' as const };
      const html = buildPdfHtml(mockAnalyticsData, config);
      expect(html).toContain('Activity Report');
      expect(html).toContain('Daily Trend');
      expect(html).toContain('Nighttime Activity');
    });

    it('returns template-specific HTML for signal-analysis', () => {
      const config = { ...baseConfig, template: 'signal-analysis' as const };
      const html = buildPdfHtml(mockAnalyticsData, config);
      expect(html).toContain('Signal Analysis');
      expect(html).toContain('RSSI Distribution');
      expect(html).toContain('Modality Breakdown');
    });

    it('filters modality sections by detectionTypes', () => {
      const config = {
        ...baseConfig,
        template: 'signal-analysis' as const,
        detectionTypes: ['wifi' as const],
      };
      const html = buildPdfHtml(mockAnalyticsData, config);
      expect(html).toContain('WiFi');
      expect(html).not.toContain('<h3>Bluetooth</h3>');
      expect(html).not.toContain('<h3>Cellular</h3>');
    });

    it('activity PDF includes day of week section', () => {
      const config = { ...baseConfig, template: 'activity-report' as const };
      const html = buildPdfHtml(mockAnalyticsData, config);
      expect(html).toContain('Day of Week');
    });

    it('signal PDF includes phantom merges and signal trend', () => {
      const config = { ...baseConfig, template: 'signal-analysis' as const };
      const html = buildPdfHtml(mockAnalyticsData, config);
      expect(html).toContain('Phantom Merges');
      expect(html).toContain('Signal Strength Trend');
    });

    it('security PDF includes per-sensor section', () => {
      const html = buildPdfHtml(mockAnalyticsData, baseConfig);
      expect(html).toContain('Detections by Sensor');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/services/reportExport.test.ts --no-coverage
```

Expected: FAIL — cannot resolve `@services/reportExport`.

- [ ] **Step 3: Implement the export service**

```typescript
// src/services/reportExport.ts
import type { AnalyticsData } from '@/types/alert';
import type { ReportConfig, ReportTemplate } from '@/types/report';
import { REPORT_TEMPLATES } from '@/types/report';

const PERIOD_LABELS: Record<string, string> = {
  day: '24h',
  week: '7d',
  month: '30d',
  year: '1y',
  custom: 'custom',
};

const TEMPLATE_FILENAME: Record<ReportTemplate, string> = {
  'security-summary': 'SecuritySummary',
  'activity-report': 'ActivityReport',
  'signal-analysis': 'SignalAnalysis',
};

export function getReportFilename(
  config: ReportConfig,
  format: 'pdf' | 'csv'
): string {
  const date = new Date().toISOString().slice(0, 10);
  const period = PERIOD_LABELS[config.period] || config.period;
  return `TrailSense_${TEMPLATE_FILENAME[config.template]}_${period}_${date}.${format}`;
}

export function buildCsvString(
  analytics: AnalyticsData,
  config: ReportConfig
): string {
  switch (config.template) {
    case 'security-summary':
      return buildSecuritySummaryCsv(analytics, config);
    case 'activity-report':
      return buildActivityReportCsv(analytics, config);
    case 'signal-analysis':
      return buildSignalAnalysisCsv(analytics, config);
  }
}

function buildSecuritySummaryCsv(
  analytics: AnalyticsData,
  config: ReportConfig
): string {
  const rows: string[] = [
    'date,total_detections,unique_devices,avg_confidence,closest_approach_m',
    `${analytics.startDate},${analytics.totalAlerts},${analytics.uniqueDevices},${Math.round(analytics.avgConfidence)},${Math.round(analytics.closestApproachMeters)}`,
    '',
    'threat_level,count',
    ...analytics.threatLevelDistribution
      .filter(d => config.threatLevels.includes(d.level as any))
      .map(d => `${d.level},${d.count}`),
    '',
    'detection_type,count',
    ...analytics.detectionTypeDistribution
      .filter(d => config.detectionTypes.includes(d.type as any))
      .map(d => `${d.type},${d.count}`),
  ];
  return rows.join('\n');
}

function buildActivityReportCsv(
  analytics: AnalyticsData,
  config: ReportConfig
): string {
  const rows: string[] = [
    'date,count',
    ...analytics.dailyTrend.map(d => `${d.date},${d.count}`),
    '',
    'hour,count',
    ...(analytics.hourlyDistribution || []).map(
      d => `${d.hour},${d.count}`
    ),
    '',
    'day_of_week,count',
    ...(analytics.dayOfWeekDistribution || []).map(
      d => `${d.day},${d.count}`
    ),
    '',
    'nighttime_count,nighttime_percent',
    `${analytics.nighttimeActivity.count},${analytics.nighttimeActivity.percentOfTotal}`,
  ];

  if (analytics.perSensorTrend.length > 0) {
    rows.push('', 'date,device_id,device_name,count');
    analytics.perSensorTrend.forEach(day => {
      day.sensors
        .filter(s => config.deviceIds.includes(s.deviceId))
        .forEach(s => {
          rows.push(`${day.date},${s.deviceId},${s.deviceName},${s.count}`);
        });
    });
  }

  return rows.join('\n');
}

function buildSignalAnalysisCsv(
  analytics: AnalyticsData,
  config: ReportConfig
): string {
  const rows: string[] = [
    'rssi_median,rssi_peak',
    `${analytics.medianRssi},${analytics.peakRssi}`,
    '',
    'rssi_bucket_min,rssi_bucket_max,count',
    ...analytics.rssiDistribution.map(
      d => `${d.bucketMin},${d.bucketMax},${d.count}`
    ),
    '',
    'proximity_zone,count',
    ...analytics.proximityZoneDistribution.map(
      d => `${d.zone},${d.count}`
    ),
    '',
    'confidence_tier,count',
    ...analytics.confidenceDistribution.map(
      d => `${d.tier},${d.count}`
    ),
  ];

  // Modality breakdown filtered by selected detection types
  rows.push('', 'modality,count,metric_1,metric_2');
  if (config.detectionTypes.includes('wifi')) {
    const w = analytics.modalityBreakdown.wifi;
    rows.push(`wifi,${w.count},channels_active:${w.channelsActive},probe_request_pct:${w.probeRequestPercent}`);
  }
  if (config.detectionTypes.includes('bluetooth')) {
    const b = analytics.modalityBreakdown.ble;
    rows.push(`bluetooth,${b.count},phone_pct:${b.phonePercent},apple_pct:${b.applePercent}`);
  }
  if (config.detectionTypes.includes('cellular')) {
    const c = analytics.modalityBreakdown.cellular;
    rows.push(`cellular,${c.count},peak_dbm:${c.avgPeakDbm},burst_ms:${c.avgBurstDurationMs}`);
  }

  // Signal strength trend filtered by detection types
  if (analytics.rssiTrend.length > 0) {
    const trendHeaders = ['date'];
    if (config.detectionTypes.includes('wifi')) trendHeaders.push('wifi_avg_rssi');
    if (config.detectionTypes.includes('bluetooth')) trendHeaders.push('ble_avg_rssi');
    if (config.detectionTypes.includes('cellular')) trendHeaders.push('cellular_avg_rssi');
    rows.push('', trendHeaders.join(','));
    analytics.rssiTrend.forEach(point => {
      const values = [point.date];
      if (config.detectionTypes.includes('wifi')) values.push(String(point.wifiAvgRssi ?? ''));
      if (config.detectionTypes.includes('bluetooth')) values.push(String(point.bleAvgRssi ?? ''));
      if (config.detectionTypes.includes('cellular')) values.push(String(point.cellularAvgRssi ?? ''));
      rows.push(values.join(','));
    });
  }

  return rows.join('\n');
}

const PDF_STYLES = `
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #1a1a1a; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 24px; color: #555; }
  .subtitle { color: #888; font-size: 13px; margin-bottom: 20px; }
  .metrics { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
  .metric { background: #f5f5f5; border-radius: 8px; padding: 12px 16px; min-width: 120px; }
  .metric-value { font-size: 20px; font-weight: 600; }
  .metric-label { font-size: 11px; color: #888; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 13px; }
  .section-label { font-size: 10px; color: #aaa; text-transform: uppercase; margin-top: 4px; }
`;

function pdfWrap(title: string, period: string, analytics: AnalyticsData, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${PDF_STYLES}</style></head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">Period: ${period} · ${analytics.startDate} to ${analytics.endDate}</div>
  ${body}
</body></html>`;
}

export function buildPdfHtml(
  analytics: AnalyticsData,
  config: ReportConfig
): string {
  const templateInfo = REPORT_TEMPLATES[config.template];
  const period = PERIOD_LABELS[config.period] || config.period;

  switch (config.template) {
    case 'security-summary':
      return buildSecuritySummaryPdf(analytics, config, templateInfo.name, period);
    case 'activity-report':
      return buildActivityReportPdf(analytics, config, templateInfo.name, period);
    case 'signal-analysis':
      return buildSignalAnalysisPdf(analytics, config, templateInfo.name, period);
  }
}

function buildSecuritySummaryPdf(
  analytics: AnalyticsData,
  config: ReportConfig,
  title: string,
  period: string
): string {
  const threatRows = analytics.threatLevelDistribution
    .filter(d => config.threatLevels.includes(d.level as any))
    .map(d => `<tr><td>${d.level}</td><td style="text-align:right">${d.count}</td></tr>`)
    .join('');

  const detectionRows = analytics.detectionTypeDistribution
    .filter(d => config.detectionTypes.includes(d.type as any))
    .map(d => `<tr><td>${d.type}</td><td style="text-align:right">${d.count}</td></tr>`)
    .join('');

  const deviceRows = analytics.deviceDistribution
    .filter(d => config.deviceIds.includes(d.deviceId))
    .map(d => `<tr><td>${d.deviceId}</td><td style="text-align:right">${d.count}</td></tr>`)
    .join('');

  const topDeviceRows = analytics.topDetectedDevices.slice(0, 5)
    .map((d, i) => `<tr><td>${i + 1}</td><td>${d.fingerprintHash.slice(0, 12)}...</td><td style="text-align:right">${d.count} visits</td></tr>`)
    .join('');

  return pdfWrap(title, period, analytics, `
    <div class="section-label">Property-Wide Metrics</div>
    <div class="metrics">
      <div class="metric"><div class="metric-value">${analytics.totalAlerts}</div><div class="metric-label">Detections</div></div>
      <div class="metric"><div class="metric-value">${analytics.uniqueDevices}</div><div class="metric-label">Unique Devices</div></div>
      <div class="metric"><div class="metric-value">${Math.round(analytics.avgConfidence)}%</div><div class="metric-label">Avg Confidence</div></div>
      <div class="metric"><div class="metric-value">${Math.round(analytics.closestApproachMeters)}m</div><div class="metric-label">Closest Approach</div></div>
    </div>
    <h2>Threat Levels</h2><table>${threatRows}</table>
    <h2>Detection Types</h2><table>${detectionRows}</table>
    <h2>Top Detected Devices</h2><table>${topDeviceRows}</table>
    ${deviceRows ? `<h2>Detections by Sensor</h2><div class="section-label">Filtered by selected sensors</div><table>${deviceRows}</table>` : ''}
  `);
}

function buildActivityReportPdf(
  analytics: AnalyticsData,
  config: ReportConfig,
  title: string,
  period: string
): string {
  const dailyRows = analytics.dailyTrend
    .map(d => `<tr><td>${d.date}</td><td style="text-align:right">${d.count}</td></tr>`)
    .join('');

  const hourlyRows = (analytics.hourlyDistribution || [])
    .map(d => `<tr><td>${d.hour}:00</td><td style="text-align:right">${d.count}</td></tr>`)
    .join('');

  const sensorRows = analytics.perSensorTrend.slice(-7).flatMap(day =>
    day.sensors
      .filter(s => config.deviceIds.includes(s.deviceId))
      .map(s => `<tr><td>${day.date}</td><td>${s.deviceName}</td><td style="text-align:right">${s.count}</td></tr>`)
  ).join('');

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayOfWeekRows = (analytics.dayOfWeekDistribution || [])
    .map(d => `<tr><td>${dayNames[d.day] || d.day}</td><td style="text-align:right">${d.count}</td></tr>`)
    .join('');

  return pdfWrap(title, period, analytics, `
    <h2>Daily Trend</h2><table>${dailyRows}</table>
    <h2>Hourly Distribution</h2><table>${hourlyRows}</table>
    ${dayOfWeekRows ? `<h2>Day of Week</h2><table>${dayOfWeekRows}</table>` : ''}
    <h2>Nighttime Activity</h2>
    <div class="metrics">
      <div class="metric"><div class="metric-value">${analytics.nighttimeActivity.percentOfTotal}%</div><div class="metric-label">Nighttime</div></div>
      <div class="metric"><div class="metric-value">${analytics.nighttimeActivity.count}</div><div class="metric-label">Night Detections</div></div>
    </div>
    ${sensorRows ? `<h2>Activity by Sensor</h2><div class="section-label">Filtered by selected sensors</div><table>${sensorRows}</table>` : ''}
  `);
}

function buildSignalAnalysisPdf(
  analytics: AnalyticsData,
  config: ReportConfig,
  title: string,
  period: string
): string {
  const rssiRows = analytics.rssiDistribution
    .map(d => `<tr><td>${d.bucketMin} to ${d.bucketMax} dBm</td><td style="text-align:right">${d.count}</td></tr>`)
    .join('');

  const proximityRows = analytics.proximityZoneDistribution
    .map(d => `<tr><td>${d.zone}</td><td style="text-align:right">${d.count}</td></tr>`)
    .join('');

  const modalitySections: string[] = [];
  if (config.detectionTypes.includes('wifi')) {
    const w = analytics.modalityBreakdown.wifi;
    modalitySections.push(`<h3>WiFi</h3><p>${w.count} detections · ${w.channelsActive} channels · ${w.probeRequestPercent}% probe requests</p>`);
  }
  if (config.detectionTypes.includes('bluetooth')) {
    const b = analytics.modalityBreakdown.ble;
    modalitySections.push(`<h3>Bluetooth</h3><p>${b.count} detections · ${b.phonePercent}% phones · ${b.applePercent}% Apple · ${b.beaconPercent}% beacons</p>`);
  }
  if (config.detectionTypes.includes('cellular')) {
    const c = analytics.modalityBreakdown.cellular;
    modalitySections.push(`<h3>Cellular</h3><p>${c.count} detections · ${c.avgPeakDbm} dBm peak · ${c.avgBurstDurationMs}ms burst</p>`);
  }

  // Signal strength trend table filtered by detection types
  const trendHeaders = ['Date'];
  if (config.detectionTypes.includes('wifi')) trendHeaders.push('WiFi RSSI');
  if (config.detectionTypes.includes('bluetooth')) trendHeaders.push('BLE RSSI');
  if (config.detectionTypes.includes('cellular')) trendHeaders.push('Cellular RSSI');
  const trendHeaderRow = `<tr>${trendHeaders.map(h => `<td><strong>${h}</strong></td>`).join('')}</tr>`;
  const trendDataRows = analytics.rssiTrend.map(point => {
    const cells = [`<td>${point.date}</td>`];
    if (config.detectionTypes.includes('wifi')) cells.push(`<td style="text-align:right">${point.wifiAvgRssi ?? '—'}</td>`);
    if (config.detectionTypes.includes('bluetooth')) cells.push(`<td style="text-align:right">${point.bleAvgRssi ?? '—'}</td>`);
    if (config.detectionTypes.includes('cellular')) cells.push(`<td style="text-align:right">${point.cellularAvgRssi ?? '—'}</td>`);
    return `<tr>${cells.join('')}</tr>`;
  }).join('');

  return pdfWrap(title, period, analytics, `
    <div class="metrics">
      <div class="metric"><div class="metric-value">${analytics.medianRssi} dBm</div><div class="metric-label">Median RSSI</div></div>
      <div class="metric"><div class="metric-value">${analytics.peakRssi} dBm</div><div class="metric-label">Peak RSSI</div></div>
    </div>
    <h2>RSSI Distribution</h2><table>${rssiRows}</table>
    <h2>Proximity Zones</h2><table>${proximityRows}</table>
    <h2>Modality Breakdown</h2>${modalitySections.join('')}
    <h2>Cross-Modal Correlation</h2>
    <div class="metrics">
      <div class="metric"><div class="metric-value">${analytics.crossModalStats.wifiBleLinks}</div><div class="metric-label">WiFi↔BLE Links</div></div>
      <div class="metric"><div class="metric-value">${Math.round(analytics.crossModalStats.avgLinkConfidence)}%</div><div class="metric-label">Link Confidence</div></div>
      <div class="metric"><div class="metric-value">${analytics.crossModalStats.phantomMerges}</div><div class="metric-label">Phantom Merges</div></div>
    </div>
    ${trendDataRows ? `<h2>Signal Strength Trend</h2><table>${trendHeaderRow}${trendDataRows}</table>` : ''}
  `);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/services/reportExport.test.ts --no-coverage
```

Expected: All 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/reportExport.ts __tests__/services/reportExport.test.ts
git commit -m "feat: add report export service (PDF HTML builder, CSV builder, filename generator)"
```

---

### Task 13: ReportPreviewScreen

**Files:**
- Modify: `src/screens/analytics/ReportPreviewScreen.tsx`

- [ ] **Step 1: Implement the full preview screen**

Replace the placeholder `src/screens/analytics/ReportPreviewScreen.tsx`:

```typescript
// src/screens/analytics/ReportPreviewScreen.tsx
import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, ActionSheetIOS, Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { Text } from '@components/atoms/Text';
import { useAnalytics, useComparison } from '@hooks/useAnalytics';
import { useTheme } from '@hooks/useTheme';
import { useAppDispatch } from '@store/index';
import { updateLastGenerated } from '@store/slices/savedReportsSlice';
import { REPORT_TEMPLATES } from '@/types/report';
import {
  SecuritySummaryReport,
  ActivityReportReport,
  SignalAnalysisReport,
} from '@components/organisms/reports';
import {
  buildPdfHtml,
  buildCsvString,
  getReportFilename,
} from '@services/reportExport';
import RNFS from 'react-native-fs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  AnalyticsStackParamList,
  MoreStackParamList,
} from '@navigation/types';

type PreviewScreenProps =
  | NativeStackScreenProps<AnalyticsStackParamList, 'ReportPreview'>
  | NativeStackScreenProps<MoreStackParamList, 'ReportPreview'>;

export const ReportPreviewScreen = ({
  route,
}: PreviewScreenProps) => {
  const { config, savedReportId } = route.params;
  const { theme } = useTheme();
  const colors = theme.colors;
  const dispatch = useAppDispatch();
  const templateInfo = REPORT_TEMPLATES[config.template];

  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useAnalytics({ period: config.period });

  const { data: comparison } = useComparison({
    period:
      config.period === 'year'
        ? 'month'
        : config.period,
    enabled: config.period !== 'year',
  });

  // Update lastGeneratedAt for saved reports
  useEffect(() => {
    if (analytics && savedReportId) {
      dispatch(
        updateLastGenerated({
          id: savedReportId,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, [analytics, savedReportId, dispatch]);

  const handleExport = useCallback(async () => {
    if (!analytics) return;

    const options = ['Share as PDF', 'Share as CSV', 'Cancel'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        async (index: number) => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (index === 0) await sharePdf();
          else if (index === 1) await shareCsv();
        }
      );
    } else {
      Alert.alert('Export Report', 'Choose export format', [
        { text: 'Share as PDF', onPress: sharePdf },
        { text: 'Share as CSV', onPress: shareCsv },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }

    async function sharePdf() {
      const html = buildPdfHtml(analytics!, config);
      const { uri } = await Print.printToFileAsync({ html });
      const filename = getReportFilename(config, 'pdf');
      const dest = `${RNFS.CachesDirectoryPath}/${filename}`;
      await RNFS.moveFile(uri, dest);
      await Sharing.shareAsync(dest, { mimeType: 'application/pdf' });
    }

    async function shareCsv() {
      const csv = buildCsvString(analytics!, config);
      const filename = getReportFilename(config, 'csv');
      const path = `${RNFS.CachesDirectoryPath}/${filename}`;
      await RNFS.writeFile(path, csv, 'utf8');
      await Sharing.shareAsync(path, { mimeType: 'text/csv' });
    }
  }, [analytics, config]);

  if (isLoading) return <LoadingState />;
  if (isError || !analytics) {
    return (
      <ErrorState
        message="Failed to load report data"
        onRetry={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          refetch();
        }}
      />
    );
  }

  return (
    <ScreenLayout
      header={{
        title: templateInfo.name,
        showBack: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={handleExport}
            leftIcon={
              <Icon
                name="share-outline"
                size={20}
                color={colors.systemBlue}
              />
            }
          >
            Export
          </Button>
        ),
      }}
      scrollable
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="title2" weight="bold" style={{ color: colors.label }}>
            {templateInfo.name}
          </Text>
          <Text variant="footnote" color="secondaryLabel">
            {analytics.startDate} — {analytics.endDate}
          </Text>
        </View>

        {config.template === 'security-summary' && (
          <SecuritySummaryReport
            analytics={analytics}
            comparison={comparison}
            config={config}
          />
        )}
        {config.template === 'activity-report' && (
          <ActivityReportReport analytics={analytics} config={config} />
        )}
        {config.template === 'signal-analysis' && (
          <SignalAnalysisReport analytics={analytics} config={config} />
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 18,
  },
  header: {
    gap: 4,
  },
});
```

- [ ] **Step 2: Verify types compile**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/analytics/ReportPreviewScreen.tsx
git commit -m "feat: implement ReportPreviewScreen with template rendering and export"
```

---

### Task 14: BriefTemplate (LLM Prompt)

**Files:**
- Create: `src/services/llm/templates/BriefTemplate.ts`
- Modify: `src/services/llm/templates/index.ts`

- [ ] **Step 1: Create BriefTemplate**

```typescript
// src/services/llm/templates/BriefTemplate.ts
import { PromptTemplate } from './PromptTemplate';
import type { Message } from '@/types/llm';
import type { AnalyticsData } from '@/types/alert';

interface BriefContext {
  analytics: AnalyticsData;
  comparisonAnalytics?: AnalyticsData | null;
}

const SYSTEM_PROMPT = `You are a security analyst for a rural property intrusion detection system called TrailSense. You produce concise intelligence briefs based on sensor analytics data.

Your brief MUST have exactly two sections:

1. EXECUTIVE SUMMARY: 2-3 short paragraphs covering:
   - Overall threat posture for the period
   - Notable changes vs the previous period (if comparison data available)
   - Key patterns observed

2. KEY FINDINGS: A JSON array of findings, each with:
   - "title": short finding name
   - "description": 1-2 sentence explanation
   - "severity": "info" | "warning" | "critical"
   - "metric": optional supporting metric string

Format your response EXACTLY as:
SUMMARY:
[your paragraphs here]

FINDINGS:
[{"title":"...","description":"...","severity":"...","metric":"..."}]

ONLY state facts from the DATA section. Never guess or fabricate numbers.`;

export class BriefTemplate extends PromptTemplate {
  constructor() {
    super(SYSTEM_PROMPT);
  }

  buildPrompt(context: BriefContext): Message[] {
    const { analytics, comparisonAnalytics } = context;

    const dataSection = this.truncateText(
      JSON.stringify(
        {
          period: analytics.period,
          startDate: analytics.startDate,
          endDate: analytics.endDate,
          totalAlerts: analytics.totalAlerts,
          uniqueDevices: analytics.uniqueDevices,
          avgConfidence: analytics.avgConfidence,
          closestApproachMeters: analytics.closestApproachMeters,
          threatLevelDistribution: analytics.threatLevelDistribution,
          detectionTypeDistribution: analytics.detectionTypeDistribution,
          nighttimeActivity: {
            count: analytics.nighttimeActivity.count,
            percentOfTotal: analytics.nighttimeActivity.percentOfTotal,
          },
          topDetectedDevices: analytics.topDetectedDevices.slice(0, 5),
          ...(comparisonAnalytics && {
            comparison: {
              totalAlerts: comparisonAnalytics.totalAlerts,
              uniqueDevices: comparisonAnalytics.uniqueDevices,
              avgConfidence: comparisonAnalytics.avgConfidence,
            },
          }),
        },
        null,
        2
      ),
      1500
    );

    const userPrompt = `Generate an intelligence brief for this property security data.

DATA:
${dataSection}

Respond with SUMMARY: followed by paragraphs, then FINDINGS: followed by the JSON array.`;

    return this.buildFullPrompt(userPrompt);
  }
}
```

- [ ] **Step 2: Add to templates barrel**

Add to `src/services/llm/templates/index.ts`:
```typescript
export { BriefTemplate } from './BriefTemplate';
```

- [ ] **Step 3: Wire generateBrief into LLMService**

In `src/services/llm/LLMService.ts`, add imports at the top:
```typescript
import { BriefTemplate } from './templates';
import type { Finding } from '@/types/report';
import type { AnalyticsData } from '@/types/alert';
```

Add a new template instance in the class:
```typescript
private briefTemplate = new BriefTemplate();
```

Add the `generateBrief` method (after the existing `chat` method, before `generate`):
```typescript
  /**
   * Generate intelligence brief from analytics data
   */
  async generateBrief(context: {
    analytics: AnalyticsData;
    comparisonAnalytics?: AnalyticsData | null;
  }): Promise<{ summary: string; findings: Finding[] }> {
    try {
      llmLogger.info('Generating intelligence brief');

      const messages = this.briefTemplate.buildPrompt(context);

      const response = await this.generate({
        messages,
        context,
        options: {
          maxTokens: 1024,
          temperature: 0.3,
        },
      });

      return this.parseBriefResponse(response.text);
    } catch (error) {
      llmLogger.error('Failed to generate brief', error);
      throw error;
    }
  }

  /**
   * Parse brief response from LLM into structured format
   */
  private parseBriefResponse(text: string): {
    summary: string;
    findings: Finding[];
  } {
    let summary = '';
    let findings: Finding[] = [];

    const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)(?=FINDINGS:|$)/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

    const findingsMatch = text.match(/FINDINGS:\s*(\[[\s\S]*\])/i);
    if (findingsMatch) {
      try {
        findings = JSON.parse(findingsMatch[1]);
      } catch {
        llmLogger.warn('Failed to parse findings JSON, using empty array');
      }
    }

    if (!summary) {
      summary = text.trim();
    }

    return { summary, findings };
  }
```

- [ ] **Step 4: Verify types compile**

```bash
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/services/llm/templates/BriefTemplate.ts src/services/llm/templates/index.ts src/services/llm/LLMService.ts
git commit -m "feat: add BriefTemplate and generateBrief() to LLMService"
```

---

### Task 15: BriefScreen

**Files:**
- Modify: `src/screens/analytics/BriefScreen.tsx`

- [ ] **Step 1: Implement the full brief screen**

Replace the placeholder `src/screens/analytics/BriefScreen.tsx`:

```typescript
// src/screens/analytics/BriefScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import RNFS from 'react-native-fs';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { Button } from '@components/atoms/Button';
import {
  BriefSummaryCard,
  FindingCard,
} from '@components/molecules';
import {
  ScreenLayout,
  LoadingState,
} from '@components/templates';
import { useTheme } from '@hooks/useTheme';
import { useAnalytics, useComparison } from '@hooks/useAnalytics';
import { useDevices } from '@hooks/useDevices';
import { useAppDispatch } from '@store/index';
import { setLastBriefGeneratedAt } from '@store/slices/savedReportsSlice';
import { generateInsights } from '@services/analyticsInsights';
import { llmService } from '@services/llm';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import type { Finding, IntelligenceBrief } from '@/types/report';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  AnalyticsStackParamList,
  MoreStackParamList,
} from '@navigation/types';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'day', label: '24h' },
  { key: 'week', label: '7d' },
  { key: 'month', label: '30d' },
  { key: 'year', label: '1y' },
];

type BriefScreenProps =
  | NativeStackScreenProps<AnalyticsStackParamList, 'Brief'>
  | NativeStackScreenProps<MoreStackParamList, 'Brief'>;

export const BriefScreen = (_props: BriefScreenProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const dispatch = useAppDispatch();
  const [period, setPeriod] = useState<Period>('week');
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: analytics } = useAnalytics({ period });
  const { data: comparison } = useComparison({
    period: period === 'year' ? 'month' : period,
    enabled: period !== 'year',
  });
  const { data: devices = [] } = useDevices();

  const buildDeterministicBrief = useCallback((): IntelligenceBrief => {
    const insights = generateInsights(analytics!, comparison, devices);
    const findings: Finding[] = insights.map(insight => ({
      title: insight.title,
      description: insight.subtitle,
      severity: insight.severity,
    }));

    const totalAlerts = analytics!.totalAlerts;
    const uniqueDevices = analytics!.uniqueDevices;
    const confidence = Math.round(analytics!.avgConfidence);
    const nightPct = analytics!.nighttimeActivity.percentOfTotal;
    const threatDist = analytics!.threatLevelDistribution;
    const criticalCount =
      threatDist.find(d => d.level === 'critical')?.count || 0;
    const highCount =
      threatDist.find(d => d.level === 'high')?.count || 0;

    let summary = `During this period, TrailSense sensors recorded ${totalAlerts} total detections from ${uniqueDevices} unique devices with an average detection confidence of ${confidence}%.`;

    if (criticalCount > 0 || highCount > 0) {
      summary += ` Of these, ${criticalCount} were classified as critical and ${highCount} as high threat.`;
    }

    if (nightPct > 20) {
      summary += `\n\nNotably, ${nightPct}% of all detections occurred during nighttime hours (10 PM - 6 AM), with ${analytics!.nighttimeActivity.count} after-dark detections recorded. This elevated nighttime activity warrants attention.`;
    }

    if (comparison?.current && comparison?.comparison) {
      const prevTotal = comparison.comparison.totalAlerts;
      const pct =
        prevTotal > 0
          ? Math.round(((totalAlerts - prevTotal) / prevTotal) * 100)
          : 0;
      summary += `\n\nCompared to the previous period, detection volume ${totalAlerts >= prevTotal ? 'increased' : 'decreased'} by ${Math.abs(pct)}% (${prevTotal} → ${totalAlerts}).`;
    }

    return {
      summary,
      findings,
      generatedAt: new Date().toISOString(),
      period,
    };
  }, [analytics, comparison, devices, period]);

  const handleGenerate = useCallback(async () => {
    if (!analytics) return;
    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (FEATURE_FLAGS.LLM_ENABLED) {
        // LLM path: generate brief via LLMService
        const result = await llmService.generateBrief({
          analytics,
          comparisonAnalytics: comparison?.comparison,
        });
        const generatedAt = new Date().toISOString();
        setBrief({
          summary: result.summary,
          findings: result.findings,
          generatedAt,
          period,
        });
        dispatch(setLastBriefGeneratedAt(generatedAt));
      } else {
        // Deterministic fallback: structured summary from analytics data
        const fallback = buildDeterministicBrief();
        setBrief(fallback);
        dispatch(setLastBriefGeneratedAt(fallback.generatedAt));
      }
    } catch {
      // On LLM failure, fall back to deterministic brief
      const fallback = buildDeterministicBrief();
      setBrief(fallback);
      dispatch(setLastBriefGeneratedAt(fallback.generatedAt));
    } finally {
      setGenerating(false);
    }
  }, [analytics, comparison, devices, period, buildDeterministicBrief]);

  const handleExport = useCallback(async () => {
    if (!brief) return;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, Helvetica, sans-serif; padding: 24px; color: #1a1a1a; }
  h1 { font-size: 22px; }
  .subtitle { color: #888; font-size: 13px; margin-bottom: 20px; }
  .summary { line-height: 1.6; margin-bottom: 24px; }
  .finding { padding: 12px; margin-bottom: 8px; border-left: 3px solid #ccc; background: #f9f9f9; border-radius: 4px; }
  .finding.critical { border-color: #EF4444; }
  .finding.warning { border-color: #F59E0B; }
  .finding.info { border-color: #3B82F6; }
  .finding h3 { margin: 0 0 4px; font-size: 14px; }
  .finding p { margin: 0; font-size: 13px; color: #555; }
  .metric { font-size: 12px; color: #888; margin-top: 4px; }
</style>
</head><body>
  <h1>Intelligence Brief</h1>
  <div class="subtitle">Period: ${brief.period} · Generated: ${new Date(brief.generatedAt).toLocaleDateString()}</div>
  <h2>Executive Summary</h2>
  <div class="summary">${brief.summary.replace(/\n/g, '<br>')}</div>
  <h2>Key Findings</h2>
  ${brief.findings.map(f => `<div class="finding ${f.severity}"><h3>${f.title}</h3><p>${f.description}</p>${f.metric ? `<div class="metric">${f.metric}</div>` : ''}</div>`).join('')}
</body></html>`;

    const options = ['Share as PDF', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 1 },
        async (index: number) => {
          if (index === 0) {
            const { uri } = await Print.printToFileAsync({ html });
            const filename = `TrailSense_Brief_${brief.period}_${new Date().toISOString().slice(0, 10)}.pdf`;
            const dest = `${RNFS.CachesDirectoryPath}/${filename}`;
            await RNFS.moveFile(uri, dest);
            await Sharing.shareAsync(dest, { mimeType: 'application/pdf' });
          }
        }
      );
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      const filename = `TrailSense_Brief_${brief.period}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const dest = `${RNFS.CachesDirectoryPath}/${filename}`;
      await RNFS.moveFile(uri, dest);
      await Sharing.shareAsync(dest, { mimeType: 'application/pdf' });
    }
  }, [brief]);

  return (
    <ScreenLayout
      header={{
        title: 'Intelligence Brief',
        showBack: true,
        rightActions: brief ? (
          <Button
            buttonStyle="plain"
            onPress={handleExport}
            leftIcon={
              <Icon
                name="share-outline"
                size={20}
                color={colors.systemBlue}
              />
            }
          >
            Export
          </Button>
        ) : undefined,
      }}
      scrollable
    >
      <View style={styles.container}>
        {/* Period selector */}
        <View
          style={[
            styles.periodContainer,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          {PERIOD_OPTIONS.map(p => {
            const isSelected = period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPeriod(p.key);
                  setBrief(null);
                }}
                style={[
                  styles.periodButton,
                  isSelected && {
                    backgroundColor:
                      colors.brandAccent || colors.primary,
                  },
                ]}
              >
                <Text
                  variant="subheadline"
                  weight={isSelected ? 'semibold' : 'regular'}
                  style={{
                    color: isSelected ? '#FFFFFF' : colors.label,
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Generate button */}
        {!brief && !generating && (
          <Button
            onPress={handleGenerate}
            disabled={!analytics}
            leftIcon={
              <Icon
                name="sparkles-outline"
                size={20}
                color="#FFFFFF"
              />
            }
          >
            Generate Brief
          </Button>
        )}

        {/* Loading state */}
        {generating && (
          <View style={styles.loadingContainer}>
            <LoadingState />
            <Text
              variant="footnote"
              color="secondaryLabel"
              style={styles.loadingText}
            >
              Analyzing property data...
            </Text>
          </View>
        )}

        {/* Brief content */}
        {brief && (
          <View style={styles.briefContent}>
            <BriefSummaryCard summary={brief.summary} />

            {brief.findings.length > 0 && (
              <View style={styles.findingsSection}>
                <Text
                  variant="caption1"
                  tactical
                  color="secondaryLabel"
                  style={styles.findingsTitle}
                >
                  KEY FINDINGS
                </Text>
                {brief.findings.map((finding, i) => (
                  <FindingCard key={i} finding={finding} />
                ))}
              </View>
            )}

            <Text
              variant="caption2"
              color="tertiaryLabel"
              style={styles.generatedAt}
            >
              Generated{' '}
              {new Date(brief.generatedAt).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 18,
  },
  periodContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
  },
  briefContent: {
    gap: 18,
  },
  findingsSection: {
    gap: 10,
  },
  findingsTitle: {
    marginLeft: 4,
  },
  generatedAt: {
    textAlign: 'center',
    marginTop: 8,
  },
});
```

- [ ] **Step 2: Verify types compile**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/analytics/BriefScreen.tsx
git commit -m "feat: implement BriefScreen with analytics-driven intelligence brief"
```

---

### Task 16: Final Integration and Verification

**Files:**
- All files from previous tasks

- [ ] **Step 1: Run full type check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 2: Run full test suite**

```bash
npm test -- --no-coverage
```

Expected: All tests pass, including new savedReportsSlice, reportExport, and ReportsScreen tests.

- [ ] **Step 3: Run lint**

```bash
npm run lint:fix
```

Expected: No errors (auto-fixes applied).

- [ ] **Step 4: Run format**

```bash
npm run format
```

- [ ] **Step 5: Commit any lint/format fixes**

```bash
git add -A
git commit -m "chore: lint and format reports feature files"
```

- [ ] **Step 6: Verify app starts**

```bash
npm start
```

Expected: Expo dev server starts without errors. Navigate to More → Analytics → Reports to verify the hub loads.

- [ ] **Step 7: Final commit if any remaining changes**

```bash
git status
```

If any unstaged changes remain, stage and commit them.

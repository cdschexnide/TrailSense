# Phase 7: Charts & Data Visualization

**Duration:** 8-10 hours
**Status:** ⬜ Not Started

## Overview

This phase implements iOS-styled charts using React Native Chart Kit for the Analytics screens. Charts will match Apple Health app patterns with clean, minimal styling.

**Note:** This phase can run parallel with Phases 4-5, but must be complete before Phase 6 Analytics screens.

## Prerequisites

- [x] Phase 1 complete (design system)
- [ ] Reference Apple Health app for chart styling
- [ ] Understand data formats for charts

## Tasks

### 7.1 Install Dependencies

**Terminal:**

- [ ] **Install React Native Chart Kit:**
  ```bash
  npm install react-native-chart-kit
  ```

- [ ] **Install react-native-svg** (if not already installed):
  ```bash
  npm install react-native-svg
  ```

- [ ] **Verify installation:**
  ```bash
  npm run type-check
  ```

---

### 7.2 Create Chart Wrapper Component

**File:** `src/components/organisms/charts/ChartWrapper.tsx` (NEW)

- [ ] **Create reusable chart wrapper with iOS styling:**
  ```typescript
  import React from 'react';
  import { View, StyleSheet, Dimensions } from 'react-native';
  import { useTheme } from '@theme/index';
  import { Text } from '@components/atoms';

  interface ChartWrapperProps {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    style?: ViewStyle;
  }

  export const ChartWrapper: React.FC<ChartWrapperProps> = ({
    title,
    subtitle,
    children,
    style,
  }) => {
    const { colors } = useTheme();

    return (
      <View style={[styles.container, style]}>
        {title && (
          <View style={styles.header}>
            <Text variant="headline" color="label">
              {title}
            </Text>
            {subtitle && (
              <Text variant="footnote" color="secondaryLabel">
                {subtitle}
              </Text>
            )}
          </View>
        )}
        <View style={styles.chartContainer}>{children}</View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
    },
    header: {
      marginBottom: 16,
    },
    chartContainer: {
      alignItems: 'center',
    },
  });
  ```

- [ ] Export from index file

---

### 7.3 Create Line Chart Component

**File:** `src/components/organisms/charts/IOSLineChart.tsx` (NEW)

- [ ] **Create iOS-styled line chart:**
  ```typescript
  import React from 'react';
  import { Dimensions } from 'react-native';
  import { LineChart } from 'react-native-chart-kit';
  import { useTheme } from '@theme/index';

  interface IOSLineChartProps {
    data: {
      labels: string[];
      datasets: Array<{
        data: number[];
        color?: (opacity: number) => string;
        strokeWidth?: number;
      }>;
    };
    height?: number;
    showGrid?: boolean;
    showLabels?: boolean;
  }

  export const IOSLineChart: React.FC<IOSLineChartProps> = ({
    data,
    height = 220,
    showGrid = true,
    showLabels = true,
  }) => {
    const { colors, isDarkMode } = useTheme();
    const screenWidth = Dimensions.get('window').width - 40; // Account for padding

    const chartConfig = {
      backgroundColor: colors.secondarySystemGroupedBackground,
      backgroundGradientFrom: colors.secondarySystemGroupedBackground,
      backgroundGradientTo: colors.secondarySystemGroupedBackground,
      decimalPlaces: 0,
      color: (opacity = 1) => colors.systemBlue,
      labelColor: (opacity = 1) => colors.secondaryLabel,
      style: {
        borderRadius: 12,
      },
      propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: colors.systemBlue,
        fill: colors.systemBackground,
      },
      propsForBackgroundLines: {
        strokeDasharray: '', // Solid lines, not dashed
        stroke: colors.separator,
        strokeWidth: 1,
      },
    };

    return (
      <LineChart
        data={data}
        width={screenWidth}
        height={height}
        chartConfig={chartConfig}
        bezier // Smooth curves (iOS style)
        withDots={true}
        withInnerLines={showGrid}
        withOuterLines={false}
        withVerticalLabels={showLabels}
        withHorizontalLabels={showLabels}
        style={{
          borderRadius: 12,
        }}
      />
    );
  };
  ```

- [ ] Export from index file

---

### 7.4 Create Bar Chart Component

**File:** `src/components/organisms/charts/IOSBarChart.tsx` (NEW)

- [ ] **Create iOS-styled bar chart:**
  ```typescript
  import React from 'react';
  import { Dimensions } from 'react-native';
  import { BarChart } from 'react-native-chart-kit';
  import { useTheme } from '@theme/index';

  interface IOSBarChartProps {
    data: {
      labels: string[];
      datasets: Array<{
        data: number[];
      }>;
    };
    height?: number;
    showGrid?: boolean;
    showLabels?: boolean;
    fromZero?: boolean;
  }

  export const IOSBarChart: React.FC<IOSBarChartProps> = ({
    data,
    height = 220,
    showGrid = true,
    showLabels = true,
    fromZero = true,
  }) => {
    const { colors } = useTheme();
    const screenWidth = Dimensions.get('window').width - 40;

    const chartConfig = {
      backgroundColor: colors.secondarySystemGroupedBackground,
      backgroundGradientFrom: colors.secondarySystemGroupedBackground,
      backgroundGradientTo: colors.secondarySystemGroupedBackground,
      decimalPlaces: 0,
      color: (opacity = 1) => colors.systemBlue,
      labelColor: (opacity = 1) => colors.secondaryLabel,
      barPercentage: 0.7, // Bar width (0.7 = 70% of available space)
      propsForBackgroundLines: {
        stroke: colors.separator,
        strokeWidth: 1,
      },
    };

    return (
      <BarChart
        data={data}
        width={screenWidth}
        height={height}
        chartConfig={chartConfig}
        fromZero={fromZero}
        withInnerLines={showGrid}
        withHorizontalLabels={showLabels}
        withVerticalLabels={showLabels}
        style={{
          borderRadius: 12,
        }}
        showBarTops={false} // Cleaner look
      />
    );
  };
  ```

- [ ] Export from index file

---

### 7.5 Create Pie Chart Component

**File:** `src/components/organisms/charts/IOSPieChart.tsx` (NEW)

- [ ] **Create iOS-styled pie chart:**
  ```typescript
  import React from 'react';
  import { Dimensions } from 'react-native';
  import { PieChart } from 'react-native-chart-kit';
  import { useTheme } from '@theme/index';

  interface IOSPieChartProps {
    data: Array<{
      name: string;
      population: number;
      color: string;
      legendFontColor?: string;
      legendFontSize?: number;
    }>;
    height?: number;
    showLegend?: boolean;
  }

  export const IOSPieChart: React.FC<IOSPieChartProps> = ({
    data,
    height = 220,
    showLegend = true,
  }) => {
    const { colors } = useTheme();
    const screenWidth = Dimensions.get('window').width - 40;

    // Apply theme colors to legend if not specified
    const themedData = data.map(item => ({
      ...item,
      legendFontColor: item.legendFontColor || colors.secondaryLabel,
      legendFontSize: item.legendFontSize || 12,
    }));

    const chartConfig = {
      color: (opacity = 1) => colors.systemBlue,
    };

    return (
      <PieChart
        data={themedData}
        width={screenWidth}
        height={height}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute={false} // Show percentages
        hasLegend={showLegend}
        style={{
          borderRadius: 12,
        }}
      />
    );
  };
  ```

- [ ] Export from index file

---

### 7.6 Create Chart Index File

**File:** `src/components/organisms/charts/index.ts` (NEW)

- [ ] **Export all chart components:**
  ```typescript
  export { ChartWrapper } from './ChartWrapper';
  export { IOSLineChart } from './IOSLineChart';
  export { IOSBarChart } from './IOSBarChart';
  export { IOSPieChart } from './IOSPieChart';
  ```

---

### 7.7 Prepare Chart Data Utilities

**File:** `src/utils/chartDataUtils.ts` (NEW)

- [ ] **Create data transformation utilities:**
  ```typescript
  import { Alert, AnalyticsData } from '@types';
  import { format, parseISO } from 'date-fns';

  /**
   * Transform analytics data for line chart (detections over time)
   */
  export const prepareDetectionsOverTimeData = (
    analytics: AnalyticsData
  ) => {
    return {
      labels: analytics.dailyDetections.map(d =>
        format(parseISO(d.date), 'MM/dd')
      ),
      datasets: [
        {
          data: analytics.dailyDetections.map(d => d.count),
        },
      ],
    };
  };

  /**
   * Transform detection types for pie chart
   */
  export const prepareDetectionTypesData = (
    analytics: AnalyticsData,
    colors: any
  ) => {
    return [
      {
        name: 'Cellular',
        population: analytics.cellularCount,
        color: colors.systemPurple,
      },
      {
        name: 'WiFi',
        population: analytics.wifiCount,
        color: colors.systemBlue,
      },
      {
        name: 'Bluetooth',
        population: analytics.bluetoothCount,
        color: colors.systemTeal,
      },
    ];
  };

  /**
   * Transform hourly distribution for bar chart
   */
  export const prepareHourlyDistributionData = (
    analytics: AnalyticsData
  ) => {
    // Show only peak hours for better readability
    const peakHours = analytics.hourlyDistribution.slice(6, 22); // 6am to 10pm

    return {
      labels: peakHours.map(h => `${h.hour}h`),
      datasets: [
        {
          data: peakHours.map(h => h.count),
        },
      ],
    };
  };

  /**
   * Transform threat levels for pie chart
   */
  export const prepareThreatLevelsData = (
    analytics: AnalyticsData,
    colors: any
  ) => {
    return [
      {
        name: 'Critical',
        population: analytics.criticalCount || 0,
        color: colors.systemRed,
      },
      {
        name: 'High',
        population: analytics.highCount || 0,
        color: colors.systemOrange,
      },
      {
        name: 'Medium',
        population: analytics.mediumCount || 0,
        color: colors.systemYellow,
      },
      {
        name: 'Low',
        population: analytics.lowCount || 0,
        color: colors.systemGreen,
      },
    ];
  };
  ```

- [ ] Export from utils index

---

## Integration with DashboardScreen

This will be completed in Phase 6, but document the integration pattern:

**File:** `src/screens/analytics/DashboardScreen.tsx`

- [ ] **Example integration:**
  ```typescript
  import {
    IOSLineChart,
    IOSBarChart,
    IOSPieChart,
    ChartWrapper,
  } from '@components/organisms/charts';
  import {
    prepareDetectionsOverTimeData,
    prepareDetectionTypesData,
    prepareHourlyDistributionData,
    prepareThreatLevelsData,
  } from '@utils/chartDataUtils';

  // In component:
  const detectionsData = prepareDetectionsOverTimeData(analyticsData);
  const typesData = prepareDetectionTypesData(analyticsData, colors);
  const hourlyData = prepareHourlyDistributionData(analyticsData);
  const threatData = prepareThreatLevelsData(analyticsData, colors);

  // Render:
  <ChartCard title="Detections Over Time">
    <IOSLineChart data={detectionsData} />
  </ChartCard>

  <ChartCard title="Detection Types">
    <IOSPieChart data={typesData} />
  </ChartCard>

  <ChartCard title="Peak Hours">
    <IOSBarChart data={hourlyData} />
  </ChartCard>

  <ChartCard title="Threat Levels">
    <IOSPieChart data={threatData} />
  </ChartCard>
  ```

---

## Testing Checklist

- [ ] **Component Testing:**
  - [ ] ChartWrapper renders correctly
  - [ ] IOSLineChart renders with sample data
  - [ ] IOSBarChart renders with sample data
  - [ ] IOSPieChart renders with sample data

- [ ] **Data Testing:**
  - [ ] Data transformation utilities work correctly
  - [ ] Charts handle empty data gracefully
  - [ ] Charts handle single data point
  - [ ] Charts handle large datasets

- [ ] **Visual Testing:**
  - [ ] Charts match iOS styling
  - [ ] Colors use theme semantic colors
  - [ ] Charts adapt to light mode
  - [ ] Charts adapt to dark mode
  - [ ] Typography matches iOS
  - [ ] Spacing is consistent

- [ ] **Performance Testing:**
  - [ ] Charts render smoothly
  - [ ] No lag when switching modes
  - [ ] No memory leaks

- [ ] **Integration Testing:**
  - [ ] Charts integrate with DashboardScreen
  - [ ] Charts display real analytics data
  - [ ] Charts update when period changes

- [ ] **Build Testing:**
  ```bash
  npm run type-check
  npm run lint
  npm start
  ```

---

## Success Criteria

- ✅ React Native Chart Kit installed
- ✅ All chart components created (Line, Bar, Pie)
- ✅ ChartWrapper component created
- ✅ Data transformation utilities created
- ✅ Charts use iOS styling
- ✅ Charts use theme semantic colors
- ✅ Charts work in light and dark modes
- ✅ Charts render smoothly
- ✅ Ready for integration in Phase 6
- ✅ No TypeScript errors
- ✅ No linting errors

## Commit Messages

```bash
git commit -m "feat: install React Native Chart Kit for iOS-styled charts"

git commit -m "feat: create ChartWrapper component

- Reusable wrapper for all charts
- iOS-styled header and container
- Theme-aware styling"

git commit -m "feat: create iOS-styled chart components

- IOSLineChart with smooth bezier curves
- IOSBarChart with proper spacing
- IOSPieChart with theme-aware colors
- All use semantic colors from theme
- Match Apple Health chart patterns"

git commit -m "feat: add chart data transformation utilities

- prepareDetectionsOverTimeData
- prepareDetectionTypesData
- prepareHourlyDistributionData
- prepareThreatLevelsData"
```

---

**Status:** ⬜ Not Started → ⬜ In Progress → ✅ Complete

**Next Phase:** Complete Phase 6 Analytics screens integration, then `08-interactions-polish.md`

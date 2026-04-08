import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ChartCard } from '@components/molecules/ChartCard';
import { useTheme } from '@hooks/useTheme';

// Container padding (16px each side) + card padding (16px each side) = 64px
const CHART_H_PADDING = 64;

interface SeriesPoint {
  label: string;
  value: number | null;
}

interface MultiLineChartProps {
  title: string;
  subtitle?: string;
  invertYAxis?: boolean;
  series: Array<{
    color: string;
    data: SeriesPoint[];
    dashArray?: number[];
  }>;
}

const normalizePoint = (point: SeriesPoint) => ({
  value: point.value ?? 0,
  label: point.label,
});

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  title,
  subtitle,
  invertYAxis = false,
  series,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - CHART_H_PADDING;
  const [first, second, third] = series;

  const transform = (point: SeriesPoint) => ({
    value: invertYAxis ? -(point.value ?? 0) : (point.value ?? 0),
    label: point.label,
  });

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <View>
        <LineChart
          data={first?.data.map(transform) ?? []}
          data2={second?.data.map(transform) ?? []}
          data3={third?.data.map(transform) ?? []}
          color1={first?.color}
          color2={second?.color}
          color3={third?.color}
          strokeDashArray2={second?.dashArray}
          strokeDashArray3={third?.dashArray}
          curved
          hideDataPoints
          hideDataPoints1
          hideDataPoints2
          disableScroll
          spacing={34}
          initialSpacing={10}
          endSpacing={10}
          height={180}
          yAxisColor={colors.separator}
          xAxisColor={colors.separator}
          rulesColor={colors.separator}
          yAxisTextStyle={{ color: colors.secondaryLabel, fontSize: 11 }}
          xAxisLabelTextStyle={{ color: colors.secondaryLabel, fontSize: 10 }}
          noOfSections={4}
          width={chartWidth}
          formatYLabel={invertYAxis ? (v: string) => `-${v}` : undefined}
        />
      </View>
    </ChartCard>
  );
};

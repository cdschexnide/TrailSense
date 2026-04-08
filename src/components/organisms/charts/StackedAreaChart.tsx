import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ChartCard } from '@components/molecules/ChartCard';
import { useTheme } from '@hooks/useTheme';

const CHART_H_PADDING = 64;

interface TimelinePoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface StackedAreaChartProps {
  title: string;
  subtitle?: string;
  data: TimelinePoint[];
  labels: string[];
}

export const StackedAreaChart: React.FC<StackedAreaChartProps> = ({
  title,
  subtitle,
  data,
  labels,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - CHART_H_PADDING;
  const sums = data.map(item => {
    const low = item.low;
    const medium = low + item.medium;
    const high = medium + item.high;
    return {
      low,
      medium,
      high,
      critical: high + item.critical,
    };
  });

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <View>
        <LineChart
          data={sums.map((item, index) => ({ value: item.low, label: labels[index] }))}
          data2={sums.map(item => ({ value: item.medium }))}
          data3={sums.map(item => ({ value: item.high }))}
          data4={sums.map(item => ({ value: item.critical }))}
          areaChart
          areaChart2
          areaChart3
          areaChart4
          color1={colors.threat.low}
          color2={colors.threat.medium}
          color3={colors.threat.high}
          color4={colors.threat.critical}
          startFillColor1={colors.threat.low}
          endFillColor1={colors.threat.low}
          startFillColor2={colors.threat.medium}
          endFillColor2={colors.threat.medium}
          startFillColor3={colors.threat.high}
          endFillColor3={colors.threat.high}
          startFillColor4={colors.threat.critical}
          endFillColor4={colors.threat.critical}
          startOpacity1={0.18}
          endOpacity1={0.02}
          startOpacity2={0.14}
          endOpacity2={0.02}
          startOpacity3={0.14}
          endOpacity3={0.02}
          startOpacity4={0.18}
          endOpacity4={0.02}
          hideDataPoints
          hideDataPoints1
          hideDataPoints2
          hideDataPoints3
          disableScroll
          spacing={36}
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
        />
      </View>
    </ChartCard>
  );
};

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
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width - 40; // Account for padding

  const chartConfig = {
    backgroundColor: theme.colors.secondarySystemGroupedBackground,
    backgroundGradientFrom: theme.colors.secondarySystemGroupedBackground,
    backgroundGradientTo: theme.colors.secondarySystemGroupedBackground,
    decimalPlaces: 0,
    color: () => theme.colors.systemBlue,
    labelColor: () => theme.colors.secondaryLabel,
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.systemBlue,
      fill: theme.colors.systemBackground,
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // Solid lines, not dashed
      stroke: theme.colors.separator,
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

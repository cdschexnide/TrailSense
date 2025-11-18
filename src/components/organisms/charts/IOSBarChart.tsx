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
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width - 40;

  const chartConfig = {
    backgroundColor: theme.colors.secondarySystemGroupedBackground,
    backgroundGradientFrom: theme.colors.secondarySystemGroupedBackground,
    backgroundGradientTo: theme.colors.secondarySystemGroupedBackground,
    decimalPlaces: 0,
    color: () => theme.colors.systemBlue,
    labelColor: () => theme.colors.secondaryLabel,
    barPercentage: 0.7, // Bar width (0.7 = 70% of available space)
    propsForBackgroundLines: {
      stroke: theme.colors.separator,
      strokeWidth: 1,
    },
  };

  return (
    <BarChart
      data={data}
      width={screenWidth}
      height={height}
      yAxisLabel=""
      yAxisSuffix=""
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

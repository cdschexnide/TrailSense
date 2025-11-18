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
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width - 40;

  // Apply theme colors to legend if not specified
  const themedData = data.map(item => ({
    ...item,
    legendFontColor: item.legendFontColor || theme.colors.secondaryLabel,
    legendFontSize: item.legendFontSize || 12,
  }));

  const chartConfig = {
    color: () => theme.colors.systemBlue,
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

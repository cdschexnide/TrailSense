import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@components/atoms/Text';
import { ChartCard } from '@components/molecules/ChartCard';
import { useTheme } from '@hooks/useTheme';

interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  count: number;
  date: string;
}

interface ActivityHeatmapProps {
  title?: string;
  subtitle?: string;
  data: HeatmapCell[];
  period?: 'day' | 'week' | 'month' | 'year';
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  title = 'Activity Heatmap',
  subtitle,
  data,
  period = 'week',
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Period-aware grid computation
  const { blocks, rowLabels, colCount } = React.useMemo(() => {
    if (period === 'day') {
      // Single row, 24 columns (one per hour)
      const row = Array.from({ length: 24 }, (_, hour) => {
        const count = data
          .filter(item => item.hour === hour)
          .reduce((sum, item) => sum + item.count, 0);
        return { dayOfWeek: 0, hourStart: hour, count };
      });
      return { blocks: [row], rowLabels: ['Today'], colCount: 24 };
    }

    if (period === 'year') {
      // 7 rows (days) × 12 columns (months)
      const grid = Array.from({ length: 7 }, (_, dayOfWeek) =>
        Array.from({ length: 12 }, (_, month) => {
          const count = data
            .filter(item => {
              const m = parseInt(item.date.slice(5, 7), 10) - 1;
              return item.dayOfWeek === dayOfWeek && m === month;
            })
            .reduce((sum, item) => sum + item.count, 0);
          return { dayOfWeek, hourStart: month, count };
        })
      );
      return { blocks: grid, rowLabels: DAYS, colCount: 12 };
    }

    // Default: 7 rows × 12 columns (2-hour blocks)
    const grid = Array.from({ length: 7 }, (_, dayOfWeek) =>
      Array.from({ length: 12 }, (_, block) => {
        const hourStart = block * 2;
        const count = data
          .filter(
            item =>
              item.dayOfWeek === dayOfWeek &&
              item.hour >= hourStart &&
              item.hour < hourStart + 2
          )
          .reduce((sum, item) => sum + item.count, 0);
        return { dayOfWeek, hourStart, count };
      })
    );
    return { blocks: grid, rowLabels: DAYS, colCount: 12 };
  }, [data, period]);

  const maxCount = Math.max(...blocks.flat().map(b => b.count), 1);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <View style={styles.wrapper} testID="activity-heatmap">
        <View style={styles.row}>
          <View style={styles.dayLabels}>
            {rowLabels.map(label => (
              <Text
                key={label}
                variant="caption2"
                color="secondaryLabel"
                style={styles.dayText}
              >
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {blocks.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map(block => {
                  const opacity =
                    block.count === 0 ? 0.08 : 0.15 + block.count / maxCount;
                  return (
                    <View
                      key={`${block.dayOfWeek}-${block.hourStart}`}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: `rgba(245, 158, 11, ${Math.min(opacity, 1)})`,
                          borderColor: colors.separator,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
        <View style={styles.legend}>
          <Text variant="caption2" color="secondaryLabel">
            Less
          </Text>
          <View style={[styles.legendBar, { borderColor: colors.separator }]}>
            {[0.1, 0.25, 0.45, 0.7, 1].map(step => (
              <View
                key={step}
                style={[
                  styles.legendSwatch,
                  { backgroundColor: `rgba(245, 158, 11, ${step})` },
                ]}
              />
            ))}
          </View>
          <Text variant="caption2" color="secondaryLabel">
            More
          </Text>
        </View>
      </View>
    </ChartCard>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  dayLabels: {
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  dayText: {
    height: 16,
  },
  grid: {
    flex: 1,
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 5,
    borderWidth: 1,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  legendBar: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  legendSwatch: {
    flex: 1,
    height: 8,
  },
});

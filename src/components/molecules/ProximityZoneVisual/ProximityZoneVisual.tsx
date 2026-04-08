import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@components/atoms/Text';
import { useTheme } from '@hooks/useTheme';

type Zone = 'immediate' | 'near' | 'far' | 'extreme';

interface ZoneDatum {
  zone: Zone;
  count: number;
}

interface ProximityZoneVisualProps {
  zones: ZoneDatum[];
}

const ZONE_META: Record<
  Zone,
  { label: string; color: string; range: string; size: number }
> = {
  immediate: { label: 'Immediate', color: '#ef4444', range: '<5m', size: 90 },
  near: { label: 'Near', color: '#f59e0b', range: '5-15m', size: 142 },
  far: { label: 'Far', color: '#fbbf24', range: '15-50m', size: 194 },
  extreme: { label: 'Extreme', color: '#4ade80', range: '>50m', size: 246 },
};

export const ProximityZoneVisual: React.FC<ProximityZoneVisualProps> = ({
  zones,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const orderedZones: Zone[] = ['extreme', 'far', 'near', 'immediate'];

  return (
    <View style={styles.container}>
      <View style={styles.visual} testID="proximity-zone-visual">
        {orderedZones.map(zone => {
          const meta = ZONE_META[zone];
          return (
            <View
              key={zone}
              testID={`zone-${zone}`}
              style={[
                styles.ring,
                {
                  width: meta.size,
                  height: meta.size * 0.62,
                  borderColor: `${meta.color}99`,
                  backgroundColor: `${meta.color}10`,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.legend}>
        {zones.map(({ zone, count }) => {
          const meta = ZONE_META[zone];
          return (
            <View
              key={zone}
              style={[
                styles.legendCard,
                {
                  backgroundColor: colors.secondarySystemGroupedBackground,
                  borderColor: `${meta.color}44`,
                },
              ]}
            >
              <View style={[styles.legendDot, { backgroundColor: meta.color }]} />
              <Text variant="subheadline" weight="semibold">
                {meta.label}
              </Text>
              <Text variant="headline">{count}</Text>
              <Text variant="caption1" color="secondaryLabel">
                {meta.range}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 18,
    width: '100%',
  },
  visual: {
    width: '100%',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 999,
  },
  legend: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  legendCard: {
    width: '47%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
});

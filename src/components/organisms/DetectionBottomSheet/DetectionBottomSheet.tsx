import React, { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Icon } from '@components/atoms/Icon';
import type { DeduplicatedPosition } from '@hooks/useAllPositions';
import {
  SIGNAL_COLORS,
  SIGNAL_ICONS,
  SIGNAL_LABELS,
} from '@constants/signals';

interface DetectionBottomSheetProps {
  position: DeduplicatedPosition | null;
  sensorNames: string[];
  onClose: () => void;
}

export const DetectionBottomSheet = forwardRef<
  BottomSheet,
  DetectionBottomSheetProps
>(({ position, sensorNames, onClose }, ref) => {
  const snapPoints = useMemo(() => [300], []);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  if (!position) {
    return null;
  }

  const color = SIGNAL_COLORS[position.signalType] ?? '#8E8E93';
  const iconName = SIGNAL_ICONS[position.signalType] ?? 'ellipse';
  const label = SIGNAL_LABELS[position.signalType] ?? position.signalType;
  const timeStr = new Date(position.updatedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <BottomSheet
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.signalBadge, { backgroundColor: color }]}>
            <Icon name={iconName} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{label} Device</Text>
            <Text style={styles.fingerprint}>{position.fingerprintHash}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Confidence</Text>
            <Text style={styles.statValue}>{position.confidence}%</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statValue}>
              {position.accuracyMeters.toFixed(0)}m
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Last Seen</Text>
            <Text style={styles.statValue}>{timeStr}</Text>
          </View>
        </View>

        {sensorNames.length > 0 ? (
          <View style={styles.sensorRow}>
            <Icon name="radio-outline" size={16} color="#a8a898" />
            <Text style={styles.sensorText}>
              Detected by {sensorNames.join(', ')}
            </Text>
          </View>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#1a1a14',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#48483e',
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  signalBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#e8e8e0',
    fontSize: 17,
    fontWeight: '600',
  },
  fingerprint: {
    color: '#a8a898',
    fontSize: 13,
    fontFamily: 'Menlo',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#222218',
    borderRadius: 12,
    padding: 16,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: '#8a887a',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#e8e8e0',
    fontSize: 17,
    fontWeight: '600',
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  sensorText: {
    color: '#a8a898',
    fontSize: 14,
  },
});

DetectionBottomSheet.displayName = 'DetectionBottomSheet';

export default DetectionBottomSheet;

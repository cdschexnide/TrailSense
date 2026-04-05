import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms/Text';
import type { DeviceStatusData } from '@/types/cardData';
import {
  tacticalColors as c,
  tacticalTypography as t,
  tacticalSpacing as s,
} from '@/constants/tacticalTheme';
import { BriefingContainer } from './BriefingContainer';

interface DeviceStatusCardProps {
  data: DeviceStatusData;
  assessment: string;
  assessmentUnavailable?: boolean;
  onCopy?: () => void;
  onFeedback?: (positive: boolean) => void;
}

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({
  data,
  assessment,
  assessmentUnavailable,
  onCopy,
  onFeedback,
}) => {
  if (data.devices.length === 0) {
    return (
      <BriefingContainer
        label="DEVICE STATUS"
        assessment={assessment}
        assessmentUnavailable={assessmentUnavailable}
        onCopy={onCopy}
        onFeedback={onFeedback}
      >
        <Text style={styles.emptyText}>No sensors configured</Text>
      </BriefingContainer>
    );
  }

  return (
    <BriefingContainer
      label="DEVICE STATUS"
      assessment={assessment}
      assessmentUnavailable={assessmentUnavailable}
      onCopy={onCopy}
      onFeedback={onFeedback}
    >
      <View style={styles.grid}>
        {data.devices.map(device => {
          const battery = device.batteryPercent ?? device.battery;
          const alerts = device.alertCount ?? data.alertCounts[device.id] ?? 0;
          return (
            <View key={device.id} style={styles.tile}>
              <View style={styles.nameRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: device.online
                        ? c.accentSuccess
                        : c.accentDanger,
                    },
                  ]}
                />
                <Text style={styles.deviceName}>
                  {device.name.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.deviceDetail}>
                {device.online ? '' : 'OFFLINE · '}
                BAT {battery ?? '?'}% · {alerts} alerts
              </Text>
            </View>
          );
        })}
      </View>
    </BriefingContainer>
  );
};

const styles = StyleSheet.create({
  emptyText: {
    ...t.body,
    color: c.textTertiary,
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tile: {
    width: '48%' as any,
    backgroundColor: c.surfaceDark,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: s.innerCardRadius,
    padding: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deviceName: {
    ...t.deviceName,
    color: c.textPrimary,
  },
  deviceDetail: {
    ...t.dataValue,
    color: c.textTertiary,
  },
});

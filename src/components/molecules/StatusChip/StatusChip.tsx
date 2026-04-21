import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusChipProps {
  count: number;
}

export const StatusChip: React.FC<StatusChipProps> = ({ count }) => {
  const label =
    count === 0
      ? 'No active detections'
      : `${count} device${count === 1 ? '' : 's'} detected`;

  return (
    <View style={styles.container}>
      <View
        style={[styles.dot, count > 0 ? styles.dotActive : styles.dotIdle]}
      />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 18, 16, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(42, 42, 26, 0.6)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#fbbf24',
  },
  dotIdle: {
    backgroundColor: '#4ade80',
  },
  text: {
    color: '#a8a898',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default StatusChip;

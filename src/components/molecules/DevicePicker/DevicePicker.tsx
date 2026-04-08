import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon, Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';
import { isDeviceOnline } from '@utils/dateUtils';
import type { Device } from '@/types/device';

interface DevicePickerProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  topOffset?: number;
}

export const DevicePicker: React.FC<DevicePickerProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  isOpen,
  onClose,
  topOffset,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  if (!isOpen) {
    return null;
  }

  const handleSelect = (deviceId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDevice(deviceId);
    onClose();
  };

  return (
    <>
      <Pressable
        testID="picker-backdrop"
        style={styles.backdrop}
        onPress={onClose}
      />

      <View
        style={[styles.overlay, topOffset != null && { paddingTop: topOffset }]}
      >
        <View style={[styles.panel, { borderColor: colors.separator }]}>
          {devices.map(device => {
            const isSelected = device.id === selectedDeviceId;
            const isOnline = isDeviceOnline(device.lastSeen);

            return (
              <Pressable
                key={device.id}
                style={[
                  styles.row,
                  { borderBottomColor: colors.separator },
                  isSelected && styles.rowSelected,
                ]}
                onPress={() => handleSelect(device.id)}
              >
                <View
                  style={[
                    styles.selectionAccent,
                    isSelected && { backgroundColor: colors.systemBlue },
                  ]}
                />
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isOnline
                        ? colors.systemGreen
                        : colors.systemRed,
                    },
                  ]}
                />
                <Text
                  variant="subheadline"
                  weight={isSelected ? 'semibold' : 'regular'}
                  color={isOnline ? 'label' : 'secondaryLabel'}
                  style={styles.deviceName}
                >
                  {device.name}
                </Text>
                {!isOnline ? (
                  <Text variant="caption2" weight="semibold" color="systemRed">
                    OFFLINE
                  </Text>
                ) : null}
                {isSelected ? (
                  <Icon name="checkmark" size={16} color="systemBlue" />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 16,
    paddingTop: 140,
  },
  panel: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  rowSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  selectionAccent: {
    alignSelf: 'stretch',
    width: 3,
    backgroundColor: 'transparent',
    marginRight: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  deviceName: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 12,
  },
});

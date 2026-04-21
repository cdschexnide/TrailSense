import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Icon } from '@components/atoms/Icon';
import { useUpdateDevice } from '@hooks/api/useDevices';
import type { DeduplicatedPosition } from '@hooks/useAllPositions';
import { Device } from '@/types/device';
import { SIGNAL_COLORS } from '@constants/signals';

interface DeviceBottomSheetProps {
  device: Device | null;
  positions: DeduplicatedPosition[];
  onClose: () => void;
}

export const DeviceBottomSheet = forwardRef<
  BottomSheet,
  DeviceBottomSheetProps
>(({ device, positions, onClose }, ref) => {
  const snapPoints = useMemo(() => [360], []);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const updateDevice = useUpdateDevice();

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        setIsRenaming(false);
        onClose();
      }
    },
    [onClose]
  );

  const handleRename = useCallback(() => {
    if (!device || !nameInput.trim()) {
      return;
    }

    updateDevice.mutate({
      id: device.id,
      updates: { name: nameInput.trim() },
    });
    setIsRenaming(false);
  }, [device, nameInput, updateDevice]);

  const startRename = useCallback(() => {
    if (!device) {
      return;
    }

    setNameInput(device.name);
    setIsRenaming(true);
  }, [device]);

  if (!device) {
    return null;
  }

  const batteryPercent = device.batteryPercent ?? device.battery;
  const batteryColor =
    (batteryPercent ?? 0) > 50
      ? '#4ade80'
      : (batteryPercent ?? 0) > 20
        ? '#f59e0b'
        : '#ef4444';

  const lastSeen = device.lastSeen
    ? new Date(device.lastSeen).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

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
          <View
            style={[
              styles.statusDot,
              { backgroundColor: device.online ? '#4ade80' : '#8a887a' },
            ]}
          />
          <View style={styles.headerText}>
            {isRenaming ? (
              <View style={styles.renameRow}>
                <TextInput
                  style={styles.renameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  selectTextOnFocus
                  onSubmitEditing={handleRename}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleRename}>
                  <Icon name="checkmark" size={20} color="#4ade80" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={startRename} style={styles.nameRow}>
                <Text style={styles.title}>{device.name}</Text>
                <Icon name="pencil" size={14} color="#8a887a" />
              </TouchableOpacity>
            )}
            <Text style={styles.status}>
              {device.online ? 'Online' : 'Offline'} · Last seen {lastSeen}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon name="battery-half" size={16} color={batteryColor} />
            <Text style={styles.statValue}>
              {batteryPercent != null ? `${batteryPercent}%` : '--'}
            </Text>
          </View>
          <View style={styles.stat}>
            <Icon name="radio-outline" size={16} color="#a8a898" />
            <Text style={styles.statValue}>
              {device.signalStrength ?? '--'}
            </Text>
          </View>
          <View style={styles.stat}>
            <Icon name="scan-outline" size={16} color="#fbbf24" />
            <Text style={styles.statValue}>{positions.length} detected</Text>
          </View>
        </View>

        {positions.length > 0 ? (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>Detected Devices</Text>
            {positions.slice(0, 10).map(item => (
              <View key={item.id} style={styles.listItem}>
                <View
                  style={[
                    styles.signalDot,
                    {
                      backgroundColor:
                        SIGNAL_COLORS[item.signalType] ?? '#8E8E93',
                    },
                  ]}
                />
                <Text style={styles.listHash} numberOfLines={1}>
                  {item.fingerprintHash}
                </Text>
                <Text style={styles.listConf}>{item.confidence}%</Text>
              </View>
            ))}
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
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#e8e8e0',
    fontSize: 17,
    fontWeight: '600',
  },
  status: {
    color: '#a8a898',
    fontSize: 13,
    marginTop: 2,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  renameInput: {
    flex: 1,
    color: '#e8e8e0',
    fontSize: 17,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
    paddingBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#222218',
    borderRadius: 12,
    padding: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: '#e8e8e0',
    fontSize: 15,
    fontWeight: '500',
  },
  listSection: {
    gap: 8,
  },
  listTitle: {
    color: '#8a887a',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a1a',
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listHash: {
    flex: 1,
    color: '#a8a898',
    fontSize: 13,
    fontFamily: 'Menlo',
  },
  listConf: {
    color: '#e8e8e0',
    fontSize: 13,
    fontWeight: '500',
  },
});

DeviceBottomSheet.displayName = 'DeviceBottomSheet';

export default DeviceBottomSheet;

import React, { useMemo } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import type { Device } from '@/types/device';
import {
  tacticalColors as c,
  tacticalTypography as t,
} from '@/constants/tacticalTheme';

interface MiniMapProps {
  devices: Device[];
  highlightDeviceId?: string;
}

const MAP_HEIGHT = 120;
const MAP_PADDING = 16;
const DOT_SIZE = 10;

/**
 * Simple GPS-based mini-map using RN Views.
 * Plots device positions relative to the centroid of all devices.
 * Falls back gracefully when devices lack coordinates.
 */
export const MiniMap: React.FC<MiniMapProps> = ({
  devices,
  highlightDeviceId,
}) => {
  const devicesWithCoords = useMemo(
    () =>
      devices.filter(
        d =>
          d.latitude !== undefined &&
          d.longitude !== undefined &&
          Number.isFinite(d.latitude) &&
          Number.isFinite(d.longitude)
      ),
    [devices]
  );

  const layout = useMemo(() => {
    if (devicesWithCoords.length === 0) return null;

    const lats = devicesWithCoords.map(d => d.latitude!);
    const lngs = devicesWithCoords.map(d => d.longitude!);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Compute span with minimum to prevent division by zero
    const latSpan = Math.max(Math.max(...lats) - Math.min(...lats), 0.002);
    const lngSpan = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.002);

    return { centerLat, centerLng, latSpan, lngSpan };
  }, [devicesWithCoords]);

  if (!layout) {
    return (
      <View style={styles.container}>
        <View style={styles.grid} />
        <RNText style={styles.noDataText}>No GPS data available</RNText>
      </View>
    );
  }

  const toXY = (lat: number, lng: number, width: number) => {
    const usableWidth = width - MAP_PADDING * 2;
    const usableHeight = MAP_HEIGHT - MAP_PADDING * 2;
    const x =
      MAP_PADDING +
      ((lng - layout.centerLng) / layout.lngSpan + 0.5) * usableWidth;
    const y =
      MAP_PADDING +
      (0.5 - (lat - layout.centerLat) / layout.latSpan) * usableHeight;
    return { x, y };
  };

  return (
    <View style={styles.container} onLayout={() => {}}>
      <View style={styles.grid} />
      {devicesWithCoords.map(device => {
        const isHighlighted = device.id === highlightDeviceId;
        // Use fixed width estimate since onLayout is async
        const pos = toXY(device.latitude!, device.longitude!, 340);
        return (
          <View key={device.id}>
            <View
              style={[
                styles.dot,
                {
                  left: pos.x - DOT_SIZE / 2,
                  top: pos.y - DOT_SIZE / 2,
                  backgroundColor: isHighlighted
                    ? c.accentDanger
                    : c.accentPrimary,
                  shadowColor: isHighlighted ? c.accentDanger : c.accentPrimary,
                },
              ]}
            />
            {isHighlighted && (
              <>
                <View
                  style={[
                    styles.ring,
                    {
                      left: pos.x - 15,
                      top: pos.y - 15,
                      width: 30,
                      height: 30,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.ring,
                    {
                      left: pos.x - 25,
                      top: pos.y - 25,
                      width: 50,
                      height: 50,
                      borderColor: 'rgba(239,68,68,0.15)',
                    },
                  ]}
                />
              </>
            )}
            <RNText
              style={[styles.label, { left: pos.x + 7, top: pos.y - 5 }]}
              numberOfLines={1}
            >
              {device.name.split(' ')[0].toUpperCase()}
            </RNText>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: MAP_HEIGHT,
    backgroundColor: '#0d120d',
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    // Grid effect via stacked borders
    borderWidth: 0,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 999,
  },
  label: {
    position: 'absolute',
    fontFamily: t.mono,
    fontSize: 8,
    color: c.textTertiary,
  },
  noDataText: {
    ...t.body,
    color: c.textTertiary,
    textAlign: 'center',
    marginTop: MAP_HEIGHT / 2 - 8,
    fontStyle: 'italic',
  },
});

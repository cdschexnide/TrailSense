import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { websocketService } from '@api/websocket';
import { RadarDisplay } from '@components/organisms';
import { estimateDistance, calculateAngleFromMAC } from '@utils/rssiUtils';
import { Alert, Detection } from '@types';

export const LiveRadarScreen = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [range, setRange] = useState(800); // feet

  useEffect(() => {
    const handleAlert = (alert: Alert) => {
      const newDetection: Detection = {
        id: alert.id,
        distance: estimateDistance(alert.rssi),
        angle: calculateAngleFromMAC(alert.macAddress),
        threatLevel: alert.threatLevel,
        type: alert.detectionType,
        timestamp: alert.timestamp,
      };

      setDetections((prev) => {
        // Keep only last 50 detections for performance
        const updated = [...prev, newDetection];
        return updated.slice(-50);
      });

      // Auto-remove detection after 30 seconds
      setTimeout(() => {
        setDetections((prev) => prev.filter((d) => d.id !== alert.id));
      }, 30000);
    };

    websocketService.on('alert', handleAlert);
    return () => websocketService.off('alert', handleAlert);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Radar</Text>
        <Text style={styles.subtitle}>
          {detections.length} active detection{detections.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.radarContainer}>
        <RadarDisplay detections={detections} range={range} />
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#FF0000' }]} />
          <Text style={styles.legendText}>Critical</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#FF6B00' }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#FFB800' }]} />
          <Text style={styles.legendText}>Medium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#00C853' }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});

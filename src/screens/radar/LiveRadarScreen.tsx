import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { websocketService } from '@api/websocket';
import { RadarDisplay } from '@components/organisms';
import { Text } from '@components/atoms/Text';
import { Card } from '@components/atoms';
import { Button } from '@components/atoms/Button';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout } from '@components/templates';
import { estimateDistance, calculateAngleFromMAC } from '@utils/rssiUtils';
import { Alert, Detection } from '@types';

export const LiveRadarScreen = ({ navigation }: any) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [maxRange] = useState(800); // feet
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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

      setDetections(prev => {
        // Keep only last 50 detections for performance
        const updated = [...prev, newDetection];
        return updated.slice(-50);
      });

      setLastUpdate(new Date());

      // Auto-remove detection after 30 seconds
      setTimeout(() => {
        setDetections(prev => prev.filter(d => d.id !== alert.id));
      }, 30000);
    };

    websocketService.on('alert', handleAlert);
    return () => websocketService.off('alert', handleAlert);
  }, []);

  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    return `${Math.floor(seconds / 60)} minutes ago`;
  };

  return (
    <ScreenLayout
      header={{
        title: 'Live Radar',
        largeTitle: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={() => navigation.navigate('RadarSettings')}
            leftIcon={
              <Icon name="settings-outline" size={22} color="systemBlue" />
            }
          >
            Settings
          </Button>
        ),
      }}
      scrollable={false}
    >
      <ScrollView>
        {/* Summary Card */}
        <Card variant="grouped" style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <Text variant="title2" color="label">
              {detections.length} Active Detection
              {detections.length !== 1 ? 's' : ''}
            </Text>
            <Text variant="footnote" color="secondaryLabel">
              Last updated: {formatRelativeTime(lastUpdate)}
            </Text>
          </View>
        </Card>

        {/* Radar */}
        <RadarDisplay
          detections={detections}
          maxRange={maxRange}
          showSweep={true}
          style={styles.radar}
        />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    margin: 20,
  },
  summaryContent: {
    padding: 16,
  },
  radar: {
    margin: 20,
  },
});

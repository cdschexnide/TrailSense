/**
 * AlertDetailScreen - REDESIGNED with Tabs
 *
 * iOS Settings-style alert detail view with:
 * - DetailHero with status dot and metrics
 * - TabSegment: Signal | Location | History
 * - FloatingActionBar with Mark Reviewed primary
 * - Grouped sections for tab content
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform, Linking, ScrollView } from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Button } from '@components/atoms/Button';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import {
  GroupedListSection,
  GroupedListRow,
  DetailHero,
  TabSegment,
  FloatingActionBar,
} from '@components/molecules';
import { AlertsStackParamList } from '@navigation/types';
import { useAlert } from '@hooks/api/useAlerts';
import { useDevices } from '@hooks/api/useDevices';
import { formatTime } from '@utils/dateUtils';
import { getThreatColor, interpretAccuracy } from '@utils/visualEffects';
import { useTheme } from '@hooks/useTheme';
import { ThreatLevel } from '@types';

type AlertDetailRouteProp = RouteProp<AlertsStackParamList, 'AlertDetail'>;

const openInMaps = (latitude: number, longitude: number) => {
  const url = Platform.select({
    ios: `maps://app?daddr=${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  if (url) {
    Linking.openURL(url);
  }
};

const getPriorityLabel = (threatLevel: ThreatLevel): string => {
  switch (threatLevel) {
    case 'critical':
      return 'Critical Priority';
    case 'high':
      return 'High Priority';
    case 'medium':
      return 'Medium Priority';
    case 'low':
      return 'Low Priority';
    default:
      return 'Priority';
  }
};

const capitalizeDetectionType = (type: string): string => {
  if (type === 'wifi') return 'WiFi';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Tab configuration
const TABS = [
  { key: 'signal', label: 'Signal' },
  { key: 'location', label: 'Location' },
  { key: 'history', label: 'History' },
];

export const AlertDetailScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const colors = theme.colors;
  const route = useRoute<AlertDetailRouteProp>();
  const { alertId } = route.params;
  const { data: alert, isLoading, error } = useAlert(alertId);
  const { data: devices } = useDevices();

  // Tab state
  const [selectedTab, setSelectedTab] = useState('signal');

  // Get device name from deviceId
  const deviceName = devices?.find((d: any) => d.id === alert?.deviceId)?.name;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load alert" />;
  if (!alert) return <ErrorState message="Alert not found" />;

  const handleMarkReviewed = async () => {
    console.log('Marking alert as reviewed:', alertId);
  };

  const priorityLabel = getPriorityLabel(alert.threatLevel);
  const timeLabel = formatTime(alert.timestamp);
  const threatColor = getThreatColor(alert.threatLevel);
  const accuracy = interpretAccuracy(alert.accuracyMeters);

  // Build metrics for DetailHero
  const heroMetrics = [
    `${alert.confidence}%`,
    accuracy.label,
    deviceName || alert.deviceId,
  ];

  // Render Signal tab content
  const renderSignalTab = () => (
    <>
      {/* SIGNAL Section */}
      <GroupedListSection title="Signal Strength">
        <GroupedListRow
          icon="cellular"
          iconColor={colors.systemBlue}
          title="Confidence"
          value={`${alert.confidence}%`}
        />
        <GroupedListRow
          icon="radio-outline"
          iconColor={colors.systemGreen}
          title="Estimated Accuracy"
          value={`~${alert.accuracyMeters.toFixed(1)}m`}
        />
        <GroupedListRow
          icon="locate-outline"
          iconColor={colors.systemOrange}
          title="Proximity"
          value={accuracy.label}
        />
      </GroupedListSection>

      {/* Device Fingerprint Section */}
      <GroupedListSection title="Device Fingerprint">
        <GroupedListRow
          icon="qr-code-outline"
          iconColor={colors.systemPurple}
          title="Fingerprint ID"
          value={alert.fingerprintHash}
        />
        <GroupedListRow
          icon="finger-print-outline"
          iconColor={colors.systemIndigo}
          title="Detection Type"
          value={capitalizeDetectionType(alert.detectionType)}
        />
        <GroupedListRow
          icon="analytics-outline"
          iconColor={colors.systemBlue}
          title="Open fingerprint"
          subtitle="View visits, patterns, and actions"
          showChevron
          onPress={() =>
            (navigation as any).navigate('DeviceFingerprint', {
              fingerprintHash: alert.fingerprintHash,
            })
          }
        />
      </GroupedListSection>

      {/* Summary Details Section (if from summary source) */}
      {alert.metadata?.source === 'summary' && (
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          <View style={styles.summaryHeader}>
            <Icon name="layers-outline" size={20} color={colors.systemIndigo} />
            <Text
              variant="headline"
              weight="semibold"
              color="label"
              style={{ marginLeft: 8 }}
            >
              Detection Summary
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            {alert.metadata.signalCount && (
              <View style={styles.summaryItem}>
                <Text
                  variant="caption1"
                  style={{ color: colors.secondaryLabel }}
                >
                  Detections
                </Text>
                <Text variant="title3" weight="semibold" color="label">
                  {alert.metadata.signalCount}x
                </Text>
              </View>
            )}

            {alert.metadata.windowDuration && (
              <View style={styles.summaryItem}>
                <Text
                  variant="caption1"
                  style={{ color: colors.secondaryLabel }}
                >
                  Window
                </Text>
                <Text variant="title3" weight="semibold" color="label">
                  {alert.metadata.windowDuration}s
                </Text>
              </View>
            )}

            {alert.metadata.distance && (
              <View style={styles.summaryItem}>
                <Text
                  variant="caption1"
                  style={{ color: colors.secondaryLabel }}
                >
                  Distance
                </Text>
                <Text variant="title3" weight="semibold" color="label">
                  {alert.metadata.distance.toFixed(1)}m
                </Text>
              </View>
            )}

            {alert.metadata.measurementCount && (
              <View style={styles.summaryItem}>
                <Text
                  variant="caption1"
                  style={{ color: colors.secondaryLabel }}
                >
                  Measurements
                </Text>
                <Text variant="title3" weight="semibold" color="label">
                  {alert.metadata.measurementCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* AI Summary Section - Commented out until feature is ready */}
      {/* {FEATURE_FLAGS.LLM_ALERT_SUMMARIES &&
        (Platform.OS === 'android' || Platform.OS === 'ios') && (
          <View style={styles.aiSection}>
            {!summary && !isGeneratingSummary && !summaryError && (
              <Button
                buttonStyle="tinted"
                role="default"
                onPress={generateSummary}
                leftIcon={<Text style={styles.sparkle}>✨</Text>}
              >
                Explain with AI
              </Button>
            )}

            <AlertSummaryCard
              summary={summary}
              isLoading={isGeneratingSummary}
              error={summaryError}
              onRegenerate={regenerateSummary}
              onFeedback={handleFeedback}
            />
          </View>
        )} */}
    </>
  );

  // Render Location tab content
  const renderLocationTab = () => (
    <>
      {/* Triangulated Position Section */}
      {alert.metadata?.triangulatedPosition && (
        <View style={styles.sectionContainer}>
          <View style={styles.positionHeader}>
            <Icon name="navigate" size={20} color={colors.systemGreen} />
            <Text
              variant="headline"
              weight="semibold"
              color="label"
              style={{ marginLeft: 8 }}
            >
              Estimated Device Location
            </Text>
          </View>

          <View
            style={[
              styles.miniMapContainer,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
          >
            <MapView
              style={styles.miniMap}
              initialRegion={{
                latitude: alert.metadata.triangulatedPosition.latitude,
                longitude: alert.metadata.triangulatedPosition.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Circle
                center={{
                  latitude: alert.metadata.triangulatedPosition.latitude,
                  longitude: alert.metadata.triangulatedPosition.longitude,
                }}
                radius={alert.metadata.triangulatedPosition.accuracyMeters}
                fillColor={`${colors.systemGreen}20`}
                strokeColor={colors.systemGreen}
                strokeWidth={2}
              />
              <Marker
                coordinate={{
                  latitude: alert.metadata.triangulatedPosition.latitude,
                  longitude: alert.metadata.triangulatedPosition.longitude,
                }}
              />
            </MapView>

            <View style={styles.positionDetails}>
              <View style={styles.positionRow}>
                <Text variant="caption1" style={{ color: '#FFFFFF99' }}>
                  Accuracy
                </Text>
                <Text
                  variant="subheadline"
                  weight="semibold"
                  style={{ color: '#FFFFFF' }}
                >
                  +/-
                  {alert.metadata.triangulatedPosition.accuracyMeters.toFixed(
                    1
                  )}
                  m
                </Text>
              </View>
              <View style={styles.positionRow}>
                <Text variant="caption1" style={{ color: '#FFFFFF99' }}>
                  Confidence
                </Text>
                <Text
                  variant="subheadline"
                  weight="semibold"
                  style={{ color: '#FFFFFF' }}
                >
                  {alert.metadata.triangulatedPosition.confidence}%
                </Text>
              </View>
            </View>
          </View>

          <Button
            buttonStyle="tinted"
            role="default"
            onPress={() =>
              openInMaps(
                alert.metadata!.triangulatedPosition!.latitude,
                alert.metadata!.triangulatedPosition!.longitude
              )
            }
            leftIcon={
              <Icon name="open-outline" size={18} color={colors.systemBlue} />
            }
          >
            Open in Maps
          </Button>
        </View>
      )}

      {/* GPS Location Section */}
      {alert.location && (
        <GroupedListSection title="GPS Coordinates">
          <GroupedListRow
            icon="location-outline"
            iconColor={colors.systemGreen}
            title="Coordinates"
            value={`${alert.location.latitude.toFixed(4)}, ${alert.location.longitude.toFixed(4)}`}
          />
          <GroupedListRow
            icon="map-outline"
            iconColor={colors.systemBlue}
            title="View on Map"
            showChevron
            onPress={() =>
              openInMaps(alert.location!.latitude, alert.location!.longitude)
            }
          />
        </GroupedListSection>
      )}

      {/* SOURCE DEVICE Section */}
      <GroupedListSection title="Source Device">
        <GroupedListRow
          icon="hardware-chip-outline"
          iconColor={colors.systemTeal}
          title={deviceName || alert.deviceId}
          showChevron
          onPress={() =>
            (navigation as any).navigate('DevicesTab', {
              screen: 'DeviceDetail',
              params: { deviceId: alert.deviceId },
            })
          }
        />
      </GroupedListSection>
    </>
  );

  // Render History tab content
  const renderHistoryTab = () => (
    <>
      {/* Detection Timeline Section */}
      <GroupedListSection title="Detection Timeline">
        <GroupedListRow
          icon="time-outline"
          iconColor={colors.systemBlue}
          title="First Seen"
          value={formatTime(alert.timestamp)}
        />
        <GroupedListRow
          icon="timer-outline"
          iconColor={colors.systemGreen}
          title="Last Seen"
          value={formatTime(alert.timestamp)}
        />
        {alert.metadata?.signalCount && (
          <GroupedListRow
            icon="repeat-outline"
            iconColor={colors.systemOrange}
            title="Times Seen"
            value={`${alert.metadata.signalCount}x`}
          />
        )}
      </GroupedListSection>

      {/* Recent Sightings Section */}
      <GroupedListSection title="Recent Sightings">
        <GroupedListRow
          icon="calendar-outline"
          iconColor={colors.systemIndigo}
          title="Today"
          value={formatTime(alert.timestamp)}
        />
        {/* Additional sightings would be listed here from alert history data */}
      </GroupedListSection>

      {/* Alert Status Section */}
      <GroupedListSection title="Status">
        <GroupedListRow
          icon={alert.isReviewed ? 'checkmark-circle' : 'ellipse-outline'}
          iconColor={
            alert.isReviewed ? colors.systemGreen : colors.secondaryLabel
          }
          title="Reviewed"
          value={alert.isReviewed ? 'Yes' : 'No'}
        />
      </GroupedListSection>
    </>
  );

  // Render tab content based on selected tab
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'signal':
        return renderSignalTab();
      case 'location':
        return renderLocationTab();
      case 'history':
        return renderHistoryTab();
      default:
        return renderSignalTab();
    }
  };

  return (
    <ScreenLayout
      header={{
        title: `${capitalizeDetectionType(alert.detectionType)} Detection`,
        subtitle: `${priorityLabel} · ${timeLabel}`,
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Detail Hero with status dot and metrics */}
        <DetailHero
          statusColor={threatColor}
          title={`${capitalizeDetectionType(alert.detectionType)} Detection`}
          subtitle={`${priorityLabel} · ${timeLabel}`}
          metrics={heroMetrics}
        />

        {/* Tab Segment */}
        <View style={styles.tabContainer}>
          <TabSegment
            tabs={TABS}
            selectedKey={selectedTab}
            onSelect={setSelectedTab}
          />
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Floating Action Bar */}
      <FloatingActionBar
        primaryAction={{
          label: 'Mark Reviewed',
          icon: 'checkmark-circle',
          onPress: handleMarkReviewed,
        }}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for floating action bar
  },
  tabContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  // AI Summary section
  aiSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  sparkle: {
    fontSize: 16,
  },
  // Summary card (for aggregate alerts)
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    minWidth: '45%',
    flex: 1,
  },
  // Triangulated position section
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  miniMapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  miniMap: {
    height: 180,
  },
  positionDetails: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 8,
  },
  positionRow: {
    alignItems: 'center',
  },
});

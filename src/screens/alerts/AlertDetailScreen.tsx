/**
 * AlertDetailScreen - REDESIGNED
 *
 * iOS Settings-style alert detail view with:
 * - Detection type as screen title
 * - Grouped sections: Signal, Location, Source, Actions
 * - Uses GroupedListSection/GroupedListRow components
 * - Clean, native iOS appearance
 */

import React from 'react';
import { View, StyleSheet, Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Button } from '@components/atoms/Button';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { GroupedListSection, GroupedListRow } from '@components/molecules';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AlertsStackParamList } from '@navigation/types';
import { useAlert } from '@hooks/api/useAlerts';
import { formatTime } from '@utils/dateUtils';
import { useAlertSummary } from '@/hooks/useAlertSummary';
import { AlertSummaryCard } from '@/components/organisms/AlertSummaryCard';
import { FEATURE_FLAGS } from '@/config/featureFlags';
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

const getProximityLabel = (rssi: number): string => {
  if (rssi > -60) return 'Strong';
  if (rssi > -70) return 'Moderate';
  return 'Weak';
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

export const AlertDetailScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const colors = theme.colors;
  const route = useRoute<AlertDetailRouteProp>();
  const { alertId } = route.params;
  const { data: alert, isLoading, error } = useAlert(alertId);

  // LLM Alert Summary Hook
  const {
    summary,
    isLoading: isGeneratingSummary,
    error: summaryError,
    generate: generateSummary,
    regenerate: regenerateSummary,
  } = useAlertSummary(alert);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load alert" />;
  if (!alert) return <ErrorState message="Alert not found" />;

  const handleMarkReviewed = async () => {
    console.log('Marking alert as reviewed:', alertId);
  };

  const handleMarkFalsePositive = async () => {
    console.log('Marking alert as false positive:', alertId);
  };

  const handleDelete = async () => {
    console.log('Deleting alert:', alertId);
    navigation.goBack();
  };

  const handleFeedback = (positive: boolean) => {
    console.log('LLM feedback:', {
      alertId: alert.id,
      feedback: positive ? 'positive' : 'negative',
      threatLevel: alert.threatLevel,
    });
  };

  const priorityLabel = getPriorityLabel(alert.threatLevel);
  const timeLabel = formatTime(alert.timestamp);

  return (
    <ScreenLayout
      header={{
        title: `${alert.detectionType} Detection`,
        subtitle: `${priorityLabel} · ${timeLabel}`,
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable
    >
      {/* SIGNAL Section */}
      <GroupedListSection title="Signal">
        <GroupedListRow
          icon="cellular"
          iconColor={colors.systemBlue}
          title="Signal Strength"
          value={`${alert.rssi} dBm`}
        />
        <GroupedListRow
          icon="radio-outline"
          iconColor={colors.systemGreen}
          title="Proximity"
          value={getProximityLabel(alert.rssi)}
        />
        {alert.macAddress && (
          <GroupedListRow
            icon="qr-code-outline"
            iconColor={colors.systemPurple}
            title="MAC Address"
            value={alert.macAddress}
          />
        )}
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
                <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
                  Detections
                </Text>
                <Text variant="title3" weight="semibold" color="label">
                  {alert.metadata.signalCount}x
                </Text>
              </View>
            )}

            {alert.metadata.windowDuration && (
              <View style={styles.summaryItem}>
                <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
                  Window
                </Text>
                <Text variant="title3" weight="semibold" color="label">
                  {alert.metadata.windowDuration}s
                </Text>
              </View>
            )}

            {alert.metadata.distance && (
              <View style={styles.summaryItem}>
                <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
                  Distance
                </Text>
                <Text variant="title3" weight="semibold" color="label">
                  {alert.metadata.distance.toFixed(1)}m
                </Text>
              </View>
            )}

            {alert.metadata.burstCount && (
              <View style={styles.summaryItem}>
                <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
                  Bursts
                </Text>
                <Text variant="title3" weight="semibold" color="label">
                  {alert.metadata.burstCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

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
                  +/-{alert.metadata.triangulatedPosition.accuracyMeters.toFixed(1)}m
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

      {/* AI Summary Section */}
      {FEATURE_FLAGS.LLM_ALERT_SUMMARIES &&
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
        )}

      {/* LOCATION Section */}
      {alert.location && (
        <GroupedListSection title="Location">
          <GroupedListRow
            icon="location-outline"
            iconColor={colors.systemGreen}
            title="GPS Coordinates"
            value={`${alert.location.latitude.toFixed(2)}, ${alert.location.longitude.toFixed(2)}`}
          />
          <GroupedListRow
            icon="map-outline"
            iconColor={colors.systemBlue}
            title="View on Map"
            showChevron
            onPress={() => openInMaps(alert.location!.latitude, alert.location!.longitude)}
          />
        </GroupedListSection>
      )}

      {/* SOURCE DEVICE Section */}
      <GroupedListSection title="Source Device">
        <GroupedListRow
          icon="hardware-chip-outline"
          iconColor={colors.systemTeal}
          title={alert.deviceId}
          showChevron
          onPress={() =>
            (navigation as any).navigate('DevicesTab', {
              screen: 'DeviceDetail',
              params: { deviceId: alert.deviceId },
            })
          }
        />
      </GroupedListSection>

      {/* ACTIONS Section */}
      <GroupedListSection title="Actions">
        {!alert.isReviewed && (
          <GroupedListRow
            icon="checkmark-circle"
            iconColor={colors.systemGreen}
            title="Mark Reviewed"
            onPress={handleMarkReviewed}
          />
        )}
        {!alert.isFalsePositive && (
          <GroupedListRow
            icon="flag-outline"
            iconColor={colors.systemOrange}
            title="Mark as False Positive"
            onPress={handleMarkFalsePositive}
          />
        )}
        <GroupedListRow
          icon="trash-outline"
          iconColor={colors.systemRed}
          title="Delete Alert"
          destructive
          onPress={handleDelete}
        />
      </GroupedListSection>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
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

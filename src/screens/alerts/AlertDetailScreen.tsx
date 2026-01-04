/**
 * AlertDetailScreen - REDESIGNED
 *
 * Enhanced alert detail view with:
 * - Threat level banner with color indicator
 * - Improved card-based layout
 * - Better visual hierarchy
 * - AI summary integration
 */

import React from 'react';
import { View, StyleSheet, Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Button } from '@components/atoms/Button';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { ListRow } from '@components/molecules/ListRow';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AlertsStackParamList } from '@navigation/types';
import { useAlert } from '@hooks/api/useAlerts';
import { formatTimestamp } from '@utils/dateUtils';
import { useAlertSummary } from '@/hooks/useAlertSummary';
import { AlertSummaryCard } from '@/components/organisms/AlertSummaryCard';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useTheme } from '@hooks/useTheme';
import { getThreatColor } from '@utils/visualEffects';
import { ThreatLevel } from '@types';

type AlertDetailRouteProp = RouteProp<AlertsStackParamList, 'AlertDetail'>;

const THREAT_ICONS: Record<ThreatLevel, string> = {
  critical: 'alert-circle',
  high: 'warning',
  medium: 'information-circle',
  low: 'checkmark-circle',
};

const DETECTION_ICONS: Record<string, string> = {
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  cellular: 'cellular',
  default: 'radio',
};

const openInMaps = (latitude: number, longitude: number) => {
  const url = Platform.select({
    ios: `maps://app?daddr=${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  if (url) {
    Linking.openURL(url);
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

  const threatColor = getThreatColor(alert.threatLevel);
  const detectionIcon =
    DETECTION_ICONS[alert.detectionType.toLowerCase()] ||
    DETECTION_ICONS.default;

  const handleMarkReviewed = async () => {
    console.log('Marking alert as reviewed:', alertId);
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

  return (
    <ScreenLayout
      header={{
        title: 'Alert Details',
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable
    >
      {/* Threat Level Banner */}
      <View style={[styles.threatBanner, { backgroundColor: `${threatColor}15` }]}>
        <View style={[styles.threatIconContainer, { backgroundColor: threatColor }]}>
          <Icon
            name={THREAT_ICONS[alert.threatLevel] as any}
            size={28}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.threatInfo}>
          <Text variant="caption1" style={{ color: colors.secondaryLabel }}>
            THREAT LEVEL
          </Text>
          <Text
            variant="title2"
            weight="bold"
            style={{ color: threatColor, textTransform: 'capitalize' }}
          >
            {alert.threatLevel}
          </Text>
        </View>
        <View style={styles.timestampContainer}>
          <Text variant="caption2" style={{ color: colors.tertiaryLabel }}>
            {formatTimestamp(alert.timestamp)}
          </Text>
        </View>
      </View>

      {/* Detection Type Card */}
      <View
        style={[
          styles.detectionCard,
          { backgroundColor: colors.secondarySystemBackground },
        ]}
      >
        <View
          style={[
            styles.detectionIconContainer,
            { backgroundColor: colors.systemBlue + '20' },
          ]}
        >
          <Icon name={detectionIcon as any} size={32} color={colors.systemBlue} />
        </View>
        <View style={styles.detectionInfo}>
          <Text variant="headline" weight="semibold" color="label">
            {alert.detectionType} Detection
          </Text>
          <View style={styles.signalRow}>
            <Icon name="cellular" size={14} color={colors.secondaryLabel} />
            <Text variant="subheadline" style={{ color: colors.secondaryLabel }}>
              {alert.rssi} dBm
            </Text>
            <View
              style={[
                styles.signalBadge,
                {
                  backgroundColor:
                    alert.rssi > -60
                      ? colors.systemGreen + '20'
                      : alert.rssi > -70
                        ? colors.systemYellow + '20'
                        : colors.systemOrange + '20',
                },
              ]}
            >
              <Text
                variant="caption2"
                weight="semibold"
                style={{
                  color:
                    alert.rssi > -60
                      ? colors.systemGreen
                      : alert.rssi > -70
                        ? colors.systemYellow
                        : colors.systemOrange,
                }}
              >
                {alert.rssi > -60 ? 'Strong' : alert.rssi > -70 ? 'Moderate' : 'Weak'}
              </Text>
            </View>
          </View>
          {alert.macAddress && (
            <Text
              variant="caption1"
              style={{ color: colors.tertiaryLabel, marginTop: 4 }}
            >
              MAC: {alert.macAddress}
            </Text>
          )}
        </View>
      </View>

      {/* Summary Details Section */}
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
                alert.metadata.triangulatedPosition.latitude,
                alert.metadata.triangulatedPosition.longitude
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

      {/* Device Information */}
      <ListSection header="DEVICE" style={styles.section}>
        <ListRow
          title="Source Device"
          rightText={alert.deviceId}
          leftIcon={<Icon name="hardware-chip-outline" size={20} color={colors.systemBlue} />}
          onPress={() =>
            navigation.navigate('Devices', {
              screen: 'DeviceDetail',
              params: { id: alert.deviceId },
            })
          }
          accessoryType="disclosureIndicator"
        />
        {alert.location && (
          <ListRow
            title="Location"
            rightText={`${alert.location.latitude.toFixed(4)}, ${alert.location.longitude.toFixed(4)}`}
            leftIcon={<Icon name="location-outline" size={20} color={colors.systemGreen} />}
            accessoryType="none"
          />
        )}
      </ListSection>

      {/* Status */}
      <ListSection header="STATUS" style={styles.section}>
        <ListRow
          title="Reviewed"
          leftIcon={
            <Icon
              name={alert.isReviewed ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={alert.isReviewed ? colors.systemGreen : colors.tertiaryLabel}
            />
          }
          rightText={alert.isReviewed ? 'Yes' : 'No'}
          accessoryType="none"
        />
        <ListRow
          title="False Positive"
          leftIcon={
            <Icon
              name={alert.isFalsePositive ? 'close-circle' : 'ellipse-outline'}
              size={20}
              color={alert.isFalsePositive ? colors.systemOrange : colors.tertiaryLabel}
            />
          }
          rightText={alert.isFalsePositive ? 'Yes' : 'No'}
          accessoryType="none"
        />
      </ListSection>

      {/* Actions */}
      <View style={styles.actions}>
        {!alert.isReviewed && (
          <Button
            buttonStyle="filled"
            role="default"
            onPress={handleMarkReviewed}
            leftIcon={<Icon name="checkmark-circle" size={20} color="#FFFFFF" />}
          >
            Mark as Reviewed
          </Button>
        )}
        <Button
          buttonStyle="tinted"
          role="destructive"
          onPress={handleDelete}
          leftIcon={<Icon name="trash-outline" size={20} color={colors.systemRed} />}
        >
          Delete Alert
        </Button>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  threatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  threatIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threatInfo: {
    flex: 1,
    marginLeft: 16,
  },
  timestampContainer: {
    alignItems: 'flex-end',
  },
  detectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  detectionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  signalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  sparkle: {
    fontSize: 16,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
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
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  miniMapContainer: {
    borderRadius: 16,
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
  actions: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
});

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from '@components/atoms';
import { FingerprintPeekProps } from '@/types/replay';

export const FingerprintPeek: React.FC<FingerprintPeekProps> = ({
  macAddress,
  onViewProfile,
  onDismiss,
}) => {
  const shortMac = macAddress ? macAddress.substring(0, 8) : '—';

  return (
    <>
      <Pressable
        testID="peek-backdrop"
        style={styles.backdrop}
        onPress={onDismiss}
      />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text variant="title2" weight="bold" color="white">
              ?
            </Text>
          </View>

          <View style={styles.headerText}>
            <Text variant="headline" weight="semibold" color="white">
              Unknown Device
            </Text>
            <Text variant="caption1" color="secondaryLabel">
              {shortMac}
            </Text>
          </View>
        </View>

        <View style={styles.badges}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text variant="caption2" color="secondaryLabel">
              New
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.profileButton,
            !macAddress && styles.profileButtonDisabled,
          ]}
          onPress={() => onViewProfile(macAddress)}
          disabled={!macAddress}
        >
          <Text variant="subheadline" weight="semibold" color="systemBlue">
            View Full Profile
          </Text>
          <Icon name="chevron-forward" size={16} color="systemBlue" />
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B84A42',
  },
  profileButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 120, 246, 0.12)',
  },
  profileButtonDisabled: {
    opacity: 0.5,
  },
});

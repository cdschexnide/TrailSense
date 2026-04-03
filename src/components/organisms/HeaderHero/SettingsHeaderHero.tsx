/**
 * SettingsHeaderHero - Premium user profile card
 *
 * Features:
 * - User avatar with gradient ring
 * - Account info display
 * - Quick action buttons
 * - Premium badge styling
 */

import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  initials?: string;
}

interface SettingsHeaderHeroProps {
  user: User;
  onProfilePress: () => void;
}

export const SettingsHeaderHero: React.FC<SettingsHeaderHeroProps> = ({
  user,
  onProfilePress,
}) => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onProfilePress();
  };

  // Generate initials from name
  const initials =
    user.initials ||
    user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(28, 28, 30, 0.9)', 'rgba(44, 44, 46, 0.7)']
              : ['rgba(255, 255, 255, 0.95)', 'rgba(242, 242, 247, 0.9)']
          }
          style={styles.card}
        >
          {/* Avatar section */}
          <View style={styles.avatarSection}>
            {/* Gradient ring around avatar */}
            <LinearGradient
              colors={['#BF5AF2', '#5856D6', '#007AFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View
                style={[
                  styles.avatarInner,
                  {
                    backgroundColor: isDark
                      ? colors.secondarySystemBackground
                      : colors.systemBackground,
                  },
                ]}
              >
                {user.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <LinearGradient
                    colors={['#5856D6', '#BF5AF2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarPlaceholder}
                  >
                    <Text
                      variant="title2"
                      style={{ color: '#FFFFFF', fontWeight: '600' }}
                    >
                      {initials}
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* User info */}
          <View style={styles.userInfo}>
            <Text variant="headline" color="label" style={styles.userName}>
              {user.name}
            </Text>
            <Text
              variant="subheadline"
              color="secondaryLabel"
              style={styles.userEmail}
            >
              {user.email}
            </Text>
          </View>

          {/* Chevron */}
          <View style={styles.chevronContainer}>
            <Icon
              name="chevron-forward"
              size={20}
              color={colors.tertiaryLabel}
            />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarSection: {
    marginRight: 14,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
  },
  userEmail: {
    marginTop: 2,
  },
  chevronContainer: {
    marginLeft: 8,
  },
});

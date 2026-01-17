/**
 * Header Component - Apple Native Style
 *
 * Clean, minimal header with:
 * - Animated collapsible large title (iOS style)
 * - Plain text/icon actions (no pill background)
 * - No accent stripes
 * - Frosted glass background on scroll
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ViewStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface HeaderProps {
  // Navigation
  showBack?: boolean;
  backTitle?: string;
  onBackPress?: () => void;

  // Title
  title: string;
  subtitle?: string;
  largeTitle?: boolean;

  // Actions
  rightActions?: React.ReactNode;

  // Animation
  scrollY?: Animated.Value;

  // Style
  style?: ViewStyle;
  testID?: string;
}

// Animation constants
const SCROLL_THRESHOLD = 50;
const NAV_BAR_HEIGHT = 44;

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  backTitle = 'Back',
  onBackPress,
  title,
  subtitle,
  largeTitle = false,
  rightActions,
  scrollY,
  style,
  testID,
}) => {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors;

  // Animated values derived from scrollY
  const scrollAnimations = scrollY
    ? {
        // Large title opacity: fully visible at 0, fades out by SCROLL_THRESHOLD
        largeTitleOpacity: scrollY.interpolate({
          inputRange: [0, SCROLL_THRESHOLD],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        }),
        // Large title translation: slides up as user scrolls
        largeTitleTranslateY: scrollY.interpolate({
          inputRange: [0, SCROLL_THRESHOLD],
          outputRange: [0, -10],
          extrapolate: 'clamp',
        }),
        // Large title scale: slightly shrinks as user scrolls
        largeTitleScale: scrollY.interpolate({
          inputRange: [0, SCROLL_THRESHOLD],
          outputRange: [1, 0.95],
          extrapolate: 'clamp',
        }),
        // Nav bar title opacity: hidden at 0, appears by SCROLL_THRESHOLD
        navTitleOpacity: scrollY.interpolate({
          inputRange: [0, SCROLL_THRESHOLD * 0.8, SCROLL_THRESHOLD],
          outputRange: [0, 0, 1],
          extrapolate: 'clamp',
        }),
        // Blur intensity: none at 0, full at SCROLL_THRESHOLD
        blurOpacity: scrollY.interpolate({
          inputRange: [0, SCROLL_THRESHOLD * 0.5],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        // Border opacity: appears on scroll
        borderOpacity: scrollY.interpolate({
          inputRange: [0, SCROLL_THRESHOLD],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      }
    : null;

  // Render the navigation bar (compact header)
  const renderNavBar = () => (
    <View style={styles.navBar}>
      {/* Back button */}
      {showBack && (
        <Pressable
          onPress={onBackPress}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <View style={styles.backButtonContent}>
            <Icon
              name="chevron-back"
              size={24}
              color={colors.systemBlue}
            />
            <Text
              variant="body"
              style={{
                color: colors.systemBlue,
                marginLeft: -2,
              }}
            >
              {backTitle}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Center title - shown when scrolled or not using large title */}
      <View style={styles.titleContainer}>
        {scrollAnimations && largeTitle ? (
          <Animated.View
            style={{
              opacity: scrollAnimations.navTitleOpacity,
              transform: [
                {
                  translateY: scrollAnimations.navTitleOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            }}
          >
            <Text
              variant="headline"
              color="label"
              style={styles.navTitle}
              numberOfLines={1}
            >
              {title}
            </Text>
          </Animated.View>
        ) : !largeTitle ? (
          <>
            <Text
              variant="headline"
              color="label"
              style={styles.navTitle}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                variant="caption1"
                color="secondaryLabel"
                style={styles.navSubtitle}
              >
                {subtitle}
              </Text>
            )}
          </>
        ) : null}
      </View>

      {/* Right actions - plain, no pill background */}
      {rightActions && (
        <View style={styles.rightActionsContainer}>
          {rightActions}
        </View>
      )}
    </View>
  );

  // Render large title section
  const renderLargeTitle = () => {
    if (!largeTitle) return null;

    const titleContent = (
      <View style={styles.largeTitleContent}>
        {/* Title row */}
        <View style={styles.largeTitleRow}>
          <View style={styles.largeTitleTextContainer}>
            <Text
              variant="largeTitle"
              color="label"
              style={styles.largeTitle}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                variant="subheadline"
                color="secondaryLabel"
                style={styles.largeTitleSubtitle}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </View>
    );

    if (scrollAnimations) {
      return (
        <Animated.View
          style={[
            styles.largeTitleContainer,
            {
              opacity: scrollAnimations.largeTitleOpacity,
              transform: [
                { translateY: scrollAnimations.largeTitleTranslateY },
                { scale: scrollAnimations.largeTitleScale },
              ],
            },
          ]}
        >
          {titleContent}
        </Animated.View>
      );
    }

    return <View style={styles.largeTitleContainer}>{titleContent}</View>;
  };

  // Main render
  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Frosted background layer - appears on scroll */}
      {scrollAnimations && largeTitle && (
        <Animated.View
          style={[
            styles.blurContainer,
            { opacity: scrollAnimations.blurOpacity },
          ]}
          pointerEvents="none"
        >
          {/* Semi-transparent frosted glass effect */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(0, 0, 0, 0.85)'
                  : 'rgba(255, 255, 255, 0.92)',
              },
            ]}
          />
          {/* Subtle gradient overlay for depth */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(28, 28, 30, 0.8)', 'rgba(0, 0, 0, 0.6)']
                : ['rgba(255, 255, 255, 0.9)', 'rgba(242, 242, 247, 0.8)']
            }
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Static background for non-scrolling headers */}
      {(!scrollAnimations || !largeTitle) && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.systemBackground },
          ]}
        />
      )}

      {/* Navigation bar */}
      {renderNavBar()}

      {/* Large title section */}
      {renderLargeTitle()}

      {/* Bottom border - animates in on scroll */}
      {scrollAnimations ? (
        <Animated.View
          style={[
            styles.border,
            {
              backgroundColor: colors.separator,
              opacity: scrollAnimations.borderOpacity,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.border,
            { backgroundColor: colors.separator },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 100,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  navBar: {
    height: NAV_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    marginLeft: -8,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    textAlign: 'center',
    fontWeight: '600',
  },
  navSubtitle: {
    marginTop: 1,
    textAlign: 'center',
  },
  rightActionsContainer: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  largeTitleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  largeTitleContent: {
    gap: 2,
  },
  largeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  largeTitleTextContainer: {
    flex: 1,
  },
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  largeTitleSubtitle: {
    marginTop: 2,
  },
  border: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});

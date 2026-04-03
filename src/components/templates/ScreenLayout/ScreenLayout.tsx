/**
 * ScreenLayout Component - Production Grade
 *
 * Master layout wrapper providing:
 * - Consistent header with scroll-linked animations
 * - Safe area handling
 * - Keyboard avoiding behavior
 * - Scrollable and non-scrollable variants
 * - Screen variant styling support
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@components/organisms/Header';
import { useTheme } from '@hooks/useTheme';

interface ScreenLayoutProps {
  children: React.ReactNode;
  header?: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBackPress?: () => void;
    rightActions?: React.ReactNode;
    largeTitle?: boolean;
  };
  // Legacy props for backward compatibility
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  headerRightAction?: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
  // Callback for scroll events
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  // Whether to use animated scroll handling
  animatedHeader?: boolean;
  // Custom header component to render instead of default
  customHeader?: React.ReactNode;
  // Content to render below header but above scrollable content
  stickyHeader?: React.ReactNode;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  header,
  // Legacy props
  title,
  subtitle,
  showHeader = false,
  showBack = false,
  onBackPress,
  headerRightAction,
  scrollable = true,
  keyboardAvoiding = false,
  style,
  contentStyle,
  testID,
  onScroll,
  animatedHeader = true,
  customHeader,
  stickyHeader,
}) => {
  const { theme, colorScheme } = useTheme();
  const { colors } = theme;
  const isDark = colorScheme === 'dark';

  // Animated scroll value for header animations
  const scrollY = useRef(new Animated.Value(0)).current;

  // Use new header prop or fall back to legacy props
  const headerConfig =
    header ||
    (showHeader && title
      ? {
          title,
          subtitle,
          showBack,
          onBackPress,
          rightActions: headerRightAction,
        }
      : undefined);

  const hasLargeTitle = headerConfig?.largeTitle;

  // Handle scroll events
  const handleScroll = useCallback(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: false,
      listener: onScroll,
    }),
    [scrollY, onScroll]
  );

  // Main content wrapper
  const content = (
    <View
      style={[
        styles.content,
        {
          backgroundColor: colors.systemBackground,
        },
        !scrollable && styles.contentNonScrollable,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  // Scrollable content with animated scroll tracking
  const wrappedContent = scrollable ? (
    <Animated.ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      scrollEventThrottle={16}
      onScroll={hasLargeTitle && animatedHeader ? handleScroll : onScroll}
      // Pull-to-refresh needs content inset adjustment on iOS
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
    >
      {content}
    </Animated.ScrollView>
  ) : (
    content
  );

  // Keyboard avoiding wrapper
  const keyboardAvoidingContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerConfig ? 100 : 0}
    >
      {wrappedContent}
    </KeyboardAvoidingView>
  ) : (
    wrappedContent
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.systemBackground },
        style,
      ]}
      edges={['top', 'left', 'right', 'bottom']}
      testID={testID}
    >
      {/* Status bar styling */}
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.systemBackground}
      />

      {/* Custom header or default header */}
      {customHeader ||
        (headerConfig && (
          <Header
            title={headerConfig.title}
            subtitle={headerConfig.subtitle}
            showBack={headerConfig.showBack}
            onBackPress={headerConfig.onBackPress}
            rightActions={headerConfig.rightActions}
            largeTitle={hasLargeTitle}
            scrollY={hasLargeTitle && animatedHeader ? scrollY : undefined}
          />
        ))}

      {/* Sticky header content (e.g., search bars, filters) */}
      {stickyHeader && <View style={styles.stickyHeader}>{stickyHeader}</View>}

      {/* Main content */}
      {keyboardAvoidingContent}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  contentNonScrollable: {
    paddingHorizontal: 0,
  },
  stickyHeader: {
    zIndex: 50,
  },
});

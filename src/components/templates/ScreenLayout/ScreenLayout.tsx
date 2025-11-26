import React, { useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@components/organisms';
import { Text } from '@components/atoms';
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
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Use new header prop or fall back to legacy props
  const headerConfig = header || (showHeader && title ? {
    title,
    subtitle,
    showBack,
    onBackPress,
    rightActions: headerRightAction,
  } : undefined);

  const hasLargeTitle = headerConfig?.largeTitle;

  const content = (
    <View
      style={[
        styles.content,
        {
          backgroundColor: colors.systemBackground,
        },
        !scrollable && { paddingHorizontal: 0 },
        contentStyle,
      ]}
    >
      {hasLargeTitle && headerConfig && (
        <View style={styles.largeTitleContainer}>
          <Text variant="largeTitle" weight="bold" style={styles.largeTitle}>
            {headerConfig.title}
          </Text>
        </View>
      )}
      {children}
    </View>
  );

  const wrappedContent = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
      onScroll={hasLargeTitle ? Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      ) : undefined}
      scrollEventThrottle={hasLargeTitle ? 16 : undefined}
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

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
      style={[styles.container, { backgroundColor: colors.systemBackground }, style]}
      edges={['left', 'right', 'bottom']}
      testID={testID}
    >
      {headerConfig && (
        <Header
          title={hasLargeTitle ? '' : headerConfig.title}
          subtitle={headerConfig.subtitle}
          showBack={headerConfig.showBack}
          onBackPress={headerConfig.onBackPress}
          rightActions={headerConfig.rightActions}
        />
      )}
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
  largeTitleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  largeTitle: {
    // Large title styling handled by Text component
  },
});

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@components/organisms';
import { useTheme } from '@hooks/useTheme';

interface ScreenLayoutProps {
  children: React.ReactNode;
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

  const content = (
    <View
      style={[
        styles.content,
        {
          backgroundColor: colors.background,
          paddingHorizontal: theme.spacing.base,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const wrappedContent = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
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
      keyboardVerticalOffset={showHeader ? 100 : 0}
    >
      {wrappedContent}
    </KeyboardAvoidingView>
  ) : (
    wrappedContent
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }, style]}
      edges={['left', 'right', 'bottom']}
      testID={testID}
    >
      {showHeader && title && (
        <Header
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          onBackPress={onBackPress}
          rightAction={headerRightAction}
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
});

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@hooks/useTheme';
import { Text } from '@components/atoms/Text';
import { ThreatLevel } from '@constants/colors';

export type CardTier = 'briefing' | 'data' | 'surface';

interface CardProps {
  children: React.ReactNode;
  tier?: CardTier;
  variant?: 'default' | 'grouped';
  headerLabel?: string;
  severity?: ThreatLevel;
  onPress?: () => void;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const SEVERITY_COLORS: Record<ThreatLevel, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#fbbf24',
  low: '#4ade80',
};

const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export const Card: React.FC<CardProps> = ({
  children,
  tier,
  variant = 'default',
  headerLabel,
  severity,
  onPress,
  loading = false,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors, shadows } = theme;

  const getCardStyle = (): ViewStyle => {
    if (tier === 'briefing') {
      return {
        backgroundColor: colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.separator,
        overflow: 'hidden',
      };
    }

    if (tier === 'data') {
      return {
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.separator,
      };
    }

    if (tier === 'surface') {
      return {
        backgroundColor: colors.systemGray6,
        borderRadius: 10,
        padding: 16,
      };
    }

    return {
      backgroundColor:
        variant === 'grouped'
          ? colors.secondarySystemGroupedBackground
          : colors.surface,
      borderRadius: 12,
      padding: 16,
      ...(variant === 'default' ? shadows.sm : {}),
    };
  };

  const cardStyle = getCardStyle();

  const handlePress = async () => {
    if (!onPress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (loading) {
    return (
      <View style={[cardStyle, styles.loadingContainer, style]} testID={testID}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const renderContent = () => (
    <>
      {tier === 'briefing' && headerLabel ? (
        <View
          style={[
            styles.briefingHeader,
            {
              backgroundColor: colors.systemGray6,
              borderBottomColor: colors.separator,
            },
          ]}
          testID="card-header-container"
        >
          <View
            style={[styles.accentBar, { backgroundColor: colors.primary }]}
            testID={testID ? `${testID}-accent-bar` : 'card-accent-bar'}
          />
          <Text
            style={[styles.headerLabelText, { color: colors.primary }]}
            testID={testID ? `${testID}-header-label` : 'card-header-label'}
          >
            {headerLabel}
          </Text>
        </View>
      ) : null}

      {tier === 'data' && severity ? (
        <View
          style={[
            styles.severityBorder,
            { backgroundColor: SEVERITY_COLORS[severity] },
          ]}
          testID={testID ? `${testID}-severity-border` : 'card-severity-border'}
        />
      ) : null}

      <View
        style={
          tier === 'briefing'
            ? styles.briefingBody
            : tier === 'data' && severity
              ? styles.dataBodyWithSeverity
              : undefined
        }
      >
        {children}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [cardStyle, pressed && { opacity: 0.7 }, style]}
        testID={testID}
        accessibilityRole="button"
      >
        {renderContent()}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  accentBar: {
    width: 3,
    height: 14,
    borderRadius: 1,
    marginRight: 8,
  },
  headerLabelText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  briefingBody: {
    padding: 10,
  },
  severityBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  dataBodyWithSeverity: {
    paddingLeft: 6,
  },
});

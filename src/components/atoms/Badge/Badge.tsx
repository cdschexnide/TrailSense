import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '../Text/Text';
import { useTheme } from '@hooks/useTheme';

type BadgeVariant =
  | 'threat-low'
  | 'threat-medium'
  | 'threat-high'
  | 'threat-critical'
  | 'detection-cellular'
  | 'detection-wifi'
  | 'detection-bluetooth'
  | 'detection-multi'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

type BadgeSize = 'sm' | 'base' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  testID?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'base',
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'threat-low':
        return colors.threat.low;
      case 'threat-medium':
        return colors.threat.medium;
      case 'threat-high':
        return colors.threat.high;
      case 'threat-critical':
        return colors.threat.critical;
      case 'detection-cellular':
        return colors.detection.cellular;
      case 'detection-wifi':
        return colors.detection.wifi;
      case 'detection-bluetooth':
        return colors.detection.bluetooth;
      case 'detection-multi':
        return colors.detection.multi;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.info;
      case 'neutral':
      default:
        return colors.surfaceVariant;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: theme.spacing.xs + 2,
          paddingVertical: theme.spacing.xs / 2,
        };
      case 'base':
        return {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        };
      case 'lg':
        return {
          paddingHorizontal: theme.spacing.sm + 4,
          paddingVertical: theme.spacing.xs + 2,
        };
    }
  };

  const getTextVariant = (): 'caption' | 'bodySmall' | 'body' => {
    switch (size) {
      case 'sm':
        return 'caption';
      case 'base':
        return 'bodySmall';
      case 'lg':
        return 'body';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: theme.borderRadius.sm,
        },
        getSizeStyle(),
        style,
      ]}
      testID={testID}
    >
      <Text variant={getTextVariant()} color="inverse">
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  ImageSourcePropType,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@hooks/useTheme';
import { Text } from '@components/atoms/Text/Text';
import { Icon } from '@components/atoms/Icon/Icon';

type AccessoryType =
  | 'none'
  | 'disclosureIndicator'
  | 'detailButton'
  | 'checkmark'
  | 'detailDisclosureButton';

interface ListRowProps {
  // Content
  title: string;
  subtitle?: string;

  // Left side
  leftIcon?: React.ReactNode;
  leftImage?: ImageSourcePropType;

  // Right side
  rightText?: string;
  accessoryType?: AccessoryType;

  // Interaction
  onPress?: () => void;
  onAccessoryPress?: () => void;

  // State
  disabled?: boolean;

  // Style
  style?: ViewStyle;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  leftIcon,
  leftImage,
  rightText,
  accessoryType = 'none',
  onPress,
  onAccessoryPress,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Event handlers with haptics
  const handlePress = async () => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const handleAccessoryPress = async () => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAccessoryPress?.();
  };

  const renderAccessory = () => {
    switch (accessoryType) {
      case 'disclosureIndicator':
        return (
          <Icon
            name="chevron-forward"
            size={20}
            color={colors.tertiaryLabel}
          />
        );
      case 'detailButton':
        return (
          <Pressable
            onPress={handleAccessoryPress}
            hitSlop={8}
            disabled={disabled}
          >
            <Icon
              name="information-circle-outline"
              size={22}
              color={colors.systemBlue}
            />
          </Pressable>
        );
      case 'checkmark':
        return (
          <Icon name="checkmark" size={22} color={colors.systemBlue} />
        );
      case 'detailDisclosureButton':
        return (
          <View style={styles.detailDisclosureContainer}>
            <Pressable
              onPress={handleAccessoryPress}
              hitSlop={8}
              disabled={disabled}
            >
              <Icon
                name="information-circle-outline"
                size={22}
                color={colors.systemBlue}
              />
            </Pressable>
            <Icon
              name="chevron-forward"
              size={20}
              color={colors.tertiaryLabel}
              style={styles.chevronSpacing}
            />
          </View>
        );
      case 'none':
      default:
        return null;
    }
  };

  const content = (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: colors.separator,
          backgroundColor: 'transparent',
          minHeight: subtitle ? 60 : 44,
        },
        style,
      ]}
    >
      {/* Left icon or image */}
      {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
      {leftImage && (
        <Image
          source={leftImage}
          style={[
            styles.leftImage,
            { backgroundColor: colors.systemGray5 },
          ]}
        />
      )}

      {/* Title and subtitle */}
      <View style={styles.textContainer}>
        <Text variant="body" color="label">
          {title}
        </Text>
        {subtitle && (
          <Text variant="footnote" color="secondaryLabel" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right text */}
      {rightText && (
        <Text
          variant="body"
          color="tertiaryLabel"
          style={styles.rightText}
        >
          {rightText}
        </Text>
      )}

      {/* Accessory */}
      {renderAccessory()}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          pressed && { backgroundColor: colors.systemGray5 },
        ]}
        disabled={disabled}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftIconContainer: {
    width: 29,
    height: 29,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftImage: {
    width: 29,
    height: 29,
    marginRight: 12,
    borderRadius: 6,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 2,
  },
  rightText: {
    marginRight: 8,
  },
  detailDisclosureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronSpacing: {
    marginLeft: 4,
  },
});

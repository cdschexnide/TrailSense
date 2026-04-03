import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, Animated } from 'react-native';
import {
  ParamListBase,
  useNavigation,
  NavigationProp,
} from '@react-navigation/native';
import { Text, Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface HeaderProps {
  showBack?: boolean;
  backTitle?: string;
  onBackPress?: () => void;
  title: string;
  subtitle?: string;
  largeTitle?: boolean;
  rightActions?: React.ReactNode;
  scrollY?: Animated.Value;
  style?: ViewStyle;
  testID?: string;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  backTitle = 'Back',
  onBackPress,
  title,
  subtitle,
  rightActions,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const colors = theme.colors;

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.systemBackground,
          borderBottomColor: colors.separator,
        },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.topRow}>
        <View style={styles.leftSlot}>
          {showBack ? (
            <Pressable
              onPress={handleBackPress}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon name="chevron-back" size={20} color="systemBlue" />
              <Text variant="caption1" tactical color="systemBlue">
                {backTitle}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.titleContainer}>
          <Text variant="caption1" tactical color="label" style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              variant="caption2"
              color="secondaryLabel"
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightSlot}>{rightActions}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  leftSlot: {
    minWidth: 84,
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    minWidth: 84,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    textAlign: 'center',
  },
});

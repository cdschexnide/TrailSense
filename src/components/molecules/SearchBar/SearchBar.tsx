import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ViewStyle,
  Animated,
  Keyboard,
} from 'react-native';
import { Icon } from '@components/atoms';
import { Text } from '@components/atoms/Text/Text';
import { useTheme } from '@hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
  debounceMs?: number;
  style?: ViewStyle;
  testID?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
  showCancelButton = false,
  onCancel,
  debounceMs = 300,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const cancelButtonWidth = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== value) {
        onChangeText(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
    // Intentionally excluding onChangeText and value from deps
    // to implement debounce properly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalValue, debounceMs]);

  useEffect(() => {
    if (showCancelButton && isFocused) {
      Animated.timing(cancelButtonWidth, {
        toValue: 60,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(cancelButtonWidth, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isFocused, showCancelButton, cancelButtonWidth]);

  const handleClear = () => {
    setInternalValue('');
    onChangeText('');
  };

  const handleCancel = () => {
    setInternalValue('');
    onChangeText('');
    setIsFocused(false);
    Keyboard.dismiss();
    onCancel?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.systemGray5,
          },
        ]}
        testID={testID}
      >
        <View style={styles.iconLeft}>
          <Icon name="search" size={18} color={colors.secondaryLabel} />
        </View>

        <TextInput
          value={internalValue}
          onChangeText={setInternalValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.tertiaryLabel}
          style={[
            styles.input,
            {
              color: colors.label,
              fontFamily: theme.typography.fonts.regular,
              fontSize: 17, // Body text size
            },
          ]}
        />

        {internalValue.length > 0 && (
          <Pressable onPress={handleClear} style={styles.iconRight} hitSlop={8}>
            <Icon name="close-circle" size={18} color={colors.secondaryLabel} />
          </Pressable>
        )}
      </View>

      {showCancelButton && (
        <Animated.View style={{ width: cancelButtonWidth, overflow: 'hidden' }}>
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <Text variant="body" color="systemBlue">
              Cancel
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 36,
    borderRadius: 10,
  },
  iconLeft: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  iconRight: {
    marginLeft: 4,
  },
  cancelButton: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 36,
  },
});

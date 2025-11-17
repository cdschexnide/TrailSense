import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Icon } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
  testID?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  debounceMs = 300,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const [internalValue, setInternalValue] = useState(value);

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

  const handleClear = () => {
    setInternalValue('');
    onChangeText('');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
      testID={testID}
    >
      <View style={styles.iconLeft}>
        <Icon name="search-outline" size="sm" color={colors.text.secondary} />
      </View>

      <TextInput
        value={internalValue}
        onChangeText={setInternalValue}
        placeholder={placeholder}
        placeholderTextColor={colors.text.disabled}
        style={[
          styles.input,
          {
            color: colors.text.primary,
            fontFamily: theme.typography.fonts.regular,
            fontSize: theme.typography.sizes.base,
          },
        ]}
      />

      {internalValue.length > 0 && (
        <Pressable onPress={handleClear} style={styles.iconRight}>
          <Icon name="close-circle" size="sm" color={colors.text.secondary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  iconLeft: {
    marginRight: 8,
  },
  input: {
    flex: 1,
  },
  iconRight: {
    marginLeft: 8,
  },
});

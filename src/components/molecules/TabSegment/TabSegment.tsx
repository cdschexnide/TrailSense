/**
 * TabSegment Component
 *
 * iOS-style segmented control for switching between tabs in detail screens.
 * Tesla/Rivian dashboard aesthetic with smooth selection states.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface Tab {
  key: string;
  label: string;
}

interface TabSegmentProps {
  tabs: Tab[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export const TabSegment: React.FC<TabSegmentProps> = ({
  tabs,
  selectedKey,
  onSelect,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handleSelect = async (key: string) => {
    if (key !== selectedKey) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(key);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.separator,
        },
      ]}
    >
      {tabs.map(tab => {
        const isSelected = tab.key === selectedKey;

        return (
          <Pressable
            key={tab.key}
            onPress={() => handleSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.tab,
              isSelected && [
                styles.selectedTab,
                {
                  backgroundColor: colors.primary,
                },
              ],
            ]}
          >
            <Text
              variant="caption1"
              tactical
              weight={isSelected ? 'bold' : 'regular'}
              style={{ color: isSelected ? '#111210' : colors.tertiaryLabel }}
              align="center"
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default TabSegment;

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
      style={[styles.container, { backgroundColor: colors.tertiarySystemFill }]}
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
                  backgroundColor: colors.secondarySystemBackground,
                },
              ],
            ]}
          >
            <Text
              variant="subheadline"
              weight={isSelected ? 'semibold' : 'regular'}
              color={isSelected ? 'label' : 'secondaryLabel'}
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
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default TabSegment;

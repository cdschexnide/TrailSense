/**
 * GroupedListSection Component
 *
 * iOS Settings-style grouped list section.
 * Includes section header, rounded container, and inset separators.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

interface GroupedListSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

export const GroupedListSection: React.FC<GroupedListSectionProps> = ({
  title,
  footer,
  children,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Filter out null/undefined children and add separators
  const childArray = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.section}>
      {title && (
        <Text
          variant="footnote"
          color="secondaryLabel"
          style={styles.sectionTitle}
        >
          {title.toUpperCase()}
        </Text>
      )}
      <View
        style={[
          styles.container,
          { backgroundColor: colors.secondarySystemGroupedBackground },
        ]}
      >
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < childArray.length - 1 && (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.separator },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
      {footer && (
        <Text
          variant="footnote"
          color="secondaryLabel"
          style={styles.sectionFooter}
        >
          {footer}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginLeft: 16,
    marginBottom: 8,
  },
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52, // Inset separator
  },
  sectionFooter: {
    marginLeft: 16,
    marginTop: 8,
    marginRight: 16,
  },
});

export default GroupedListSection;

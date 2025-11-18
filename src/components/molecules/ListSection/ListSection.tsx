import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { Text } from '@components/atoms/Text/Text';

interface ListSectionProps {
  children: React.ReactNode;
  header?: string;
  footer?: string;
  style?: ViewStyle;
}

export const ListSection: React.FC<ListSectionProps> = ({
  children,
  header,
  footer,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Convert children to array to add separators
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={style}>
      {/* Header */}
      {header && (
        <Text
          variant="footnote"
          color="secondaryLabel"
          style={styles.header}
        >
          {header.toUpperCase()}
        </Text>
      )}

      {/* Container with rounded corners */}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.secondarySystemGroupedBackground,
          },
        ]}
      >
        {childrenArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {/* Add separator between rows (not after the last one) */}
            {index < childrenArray.length - 1 && (
              <View
                style={[
                  styles.separator,
                  {
                    backgroundColor: colors.separator,
                    marginLeft: 16, // Inset separator to align with title text
                  },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Footer */}
      {footer && (
        <Text
          variant="footnote"
          color="secondaryLabel"
          style={styles.footer}
        >
          {footer}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
});

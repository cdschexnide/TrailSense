import React from 'react';
import { ViewStyle } from 'react-native';
import { ListRow } from '@components/molecules/ListRow';

/**
 * @deprecated Use ListRow component instead for better iOS design patterns
 * This component is maintained for backward compatibility
 */
interface ListItemProps {
  title: string;
  subtitle?: string;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * @deprecated Use ListRow component instead for better iOS design patterns
 * This component now wraps ListRow internally for backward compatibility
 */
export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftAccessory,
  onPress,
  disabled = false,
  style,
}) => {
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      leftIcon={leftAccessory}
      accessoryType="none"
      onPress={onPress}
      disabled={disabled}
      style={style}
    />
  );
};

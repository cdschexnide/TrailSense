import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';

type IconName = keyof typeof Ionicons.glyphMap;
type IconSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';

interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: string;
  testID?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'base',
  color,
  testID,
}) => {
  const { theme } = useTheme();

  const getSizeValue = (): number => {
    switch (size) {
      case 'xs':
        return 12;
      case 'sm':
        return 16;
      case 'base':
        return 24;
      case 'lg':
        return 32;
      case 'xl':
        return 40;
      case '2xl':
        return 48;
    }
  };

  return (
    <Ionicons
      name={name}
      size={getSizeValue()}
      color={color || theme.colors.text.primary}
      testID={testID}
    />
  );
};

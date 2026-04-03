import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@constants/index';
import { TacticalTextStyles } from '@constants/typography';
import { Theme } from './types';

export const darkTheme: Theme = {
  colors: Colors.dark,
  typography: Typography,
  tacticalTypography: TacticalTextStyles,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  colorScheme: 'dark',
};

import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@constants/index';
import { TacticalTextStyles } from '@constants/typography';

export type ColorScheme = 'dark';

export interface Theme {
  colors: typeof Colors.dark;
  typography: typeof Typography;
  tacticalTypography: typeof TacticalTextStyles;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  colorScheme: ColorScheme;
}

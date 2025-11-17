import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@constants/index';

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  colors: typeof Colors.light;
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  colorScheme: ColorScheme;
}

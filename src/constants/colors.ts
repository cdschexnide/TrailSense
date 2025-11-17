export const Colors = {
  light: {
    // Primary Brand Colors
    primary: {
      50: '#E8F5E9',
      100: '#C8E6C9',
      200: '#A5D6A7',
      300: '#81C784',
      400: '#66BB6A',
      500: '#4CAF50', // Main brand color
      600: '#43A047',
      700: '#388E3C',
      800: '#2E7D32',
      900: '#1B5E20',
    },

    // Threat Level Colors
    threat: {
      low: '#4CAF50', // Green - Normal detection
      medium: '#FF9800', // Orange - Suspicious
      high: '#FF5722', // Red-Orange - Likely threat
      critical: '#F44336', // Red - Confirmed threat
    },

    // Detection Type Colors
    detection: {
      cellular: '#9C27B0', // Purple - Cellular uplink
      wifi: '#2196F3', // Blue - WiFi
      bluetooth: '#00BCD4', // Cyan - Bluetooth
      multi: '#673AB7', // Deep Purple - Multi-band
    },

    // Semantic Colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',

    // Neutral Colors
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceVariant: '#E0E0E0',

    // Text Colors
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
      inverse: '#FFFFFF',
    },

    // Border & Divider
    border: '#E0E0E0',
    divider: '#EEEEEE',

    // Status Colors
    online: '#4CAF50',
    offline: '#9E9E9E',
    battery: {
      full: '#4CAF50',
      medium: '#FF9800',
      low: '#F44336',
    },
  },

  dark: {
    // Primary Brand Colors (adjusted for dark mode)
    primary: {
      50: '#1B5E20',
      100: '#2E7D32',
      200: '#388E3C',
      300: '#43A047',
      400: '#4CAF50',
      500: '#66BB6A', // Lighter for dark bg
      600: '#81C784',
      700: '#A5D6A7',
      800: '#C8E6C9',
      900: '#E8F5E9',
    },

    // Threat Level Colors (adjusted for dark mode)
    threat: {
      low: '#66BB6A',
      medium: '#FFB74D',
      high: '#FF7043',
      critical: '#EF5350',
    },

    // Detection Type Colors
    detection: {
      cellular: '#BA68C8',
      wifi: '#64B5F6',
      bluetooth: '#4DD0E1',
      multi: '#9575CD',
    },

    // Semantic Colors
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    info: '#64B5F6',

    // Neutral Colors
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',

    // Text Colors
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      disabled: '#666666',
      inverse: '#212121',
    },

    // Border & Divider
    border: '#2C2C2C',
    divider: '#333333',

    // Status Colors
    online: '#66BB6A',
    offline: '#757575',
    battery: {
      full: '#66BB6A',
      medium: '#FFB74D',
      low: '#EF5350',
    },
  },
};

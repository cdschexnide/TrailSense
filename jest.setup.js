jest.mock(
  '@react-native-async-storage/async-storage',
  () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const createIcon = name =>
    function MockIcon(props) {
      return React.createElement(Text, props, name);
    };

  return {
    Ionicons: createIcon('Ionicons'),
    MaterialIcons: createIcon('MaterialIcons'),
    MaterialCommunityIcons: createIcon('MaterialCommunityIcons'),
    FontAwesome: createIcon('FontAwesome'),
    Feather: createIcon('Feather'),
    AntDesign: createIcon('AntDesign'),
    Entypo: createIcon('Entypo'),
  };
});

if (typeof global.requestAnimationFrame !== 'function') {
  global.requestAnimationFrame = callback => setTimeout(() => callback(0), 16);
}

if (typeof global.cancelAnimationFrame !== 'function') {
  global.cancelAnimationFrame = id => clearTimeout(id);
}

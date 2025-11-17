module.exports = function (api) {
  api.cache(true);

  const plugins = [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@services': './src/services',
          '@store': './src/store',
          '@api': './src/api',
          '@types': './src/types',
          '@constants': './src/constants',
          '@theme': './src/theme',
          '@assets': './assets',
        },
      },
    ],
  ];

  // Only add reanimated plugin when not in test environment
  if (process.env.NODE_ENV !== 'test') {
    plugins.push('react-native-reanimated/plugin');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};

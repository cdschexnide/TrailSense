const baseConfig = require('./app.json');

module.exports = () => {
  const mapboxDownloadToken =
    process.env.EXPO_PUBLIC_MAPBOX_DOWNLOAD_TOKEN ||
    process.env.MAPBOX_DOWNLOAD_TOKEN ||
    process.env.RNMAPBOX_DOWNLOAD_TOKEN ||
    '';

  const plugins = (baseConfig.expo.plugins || []).map(plugin => {
    if (Array.isArray(plugin) && plugin[0] === '@rnmapbox/maps') {
      return [
        plugin[0],
        {
          ...plugin[1],
          RNMapboxMapsDownloadToken: mapboxDownloadToken,
        },
      ];
    }

    return plugin;
  });

  return {
    ...baseConfig,
    expo: {
      ...baseConfig.expo,
      plugins,
    },
  };
};

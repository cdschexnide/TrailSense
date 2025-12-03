const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin that fixes the Firebase messaging notification color
 * manifest merger conflict by adding tools:replace to the meta-data element.
 */
const withFirebaseNotificationFix = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // Ensure xmlns:tools is present
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Find the application element
    const application = manifest.application?.[0];
    if (!application) {
      return config;
    }

    // Find or create meta-data array
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // Find the Firebase notification color meta-data and add tools:replace
    const metaDataArray = application['meta-data'];
    for (const metaData of metaDataArray) {
      if (
        metaData.$['android:name'] ===
        'com.google.firebase.messaging.default_notification_color'
      ) {
        metaData.$['tools:replace'] = 'android:resource';
      }
    }

    return config;
  });
};

module.exports = withFirebaseNotificationFix;

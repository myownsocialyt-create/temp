/**
 * Local Expo config plugin.
 *
 * The Expo bare-minimum Android template ships with a set of "OPTIONAL
 * PERMISSIONS" (VIBRATE, READ/WRITE_EXTERNAL_STORAGE) that a word game does
 * not need. This plugin removes them from the release manifest so the Play
 * Store listing stays clean.
 */
const { withAndroidManifest } = require('expo/config-plugins');

const REMOVE_PERMISSIONS = [
  'android.permission.VIBRATE',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.SYSTEM_ALERT_WINDOW', // still added for debug builds via app/src/debug/AndroidManifest.xml
];

function withCleanPermissions(config) {
  return withAndroidManifest(config, (cfg) => {
    const root = cfg.modResults;
    // Expo's parsed manifest is wrapped: { manifest: { ...attrs, 'uses-permission': [...] } }
    const manifest = root.manifest ?? root;
    let perms = manifest['uses-permission'];
    if (perms && !Array.isArray(perms)) perms = [perms];
    if (Array.isArray(perms)) {
      manifest['uses-permission'] = perms.filter((item) => {
        const name = item && item.$ && item.$['android:name'];
        return !REMOVE_PERMISSIONS.includes(name);
      });
    }
    return cfg;
  });
}

module.exports = withCleanPermissions;

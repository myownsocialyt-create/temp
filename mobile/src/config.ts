/**
 * Central app configuration.
 *
 * These are TEST values on purpose (the app is a template / starter).
 * Before publishing to Google Play, replace them with your own:
 *   - package name  -> mobile/app.json -> expo.android.package (+ re-run `npx expo prebuild -p android`)
 *   - AdMob IDs     -> here AND mobile/app.json (react-native-google-mobile-ads plugin `androidAppId`)
 *
 * The AdMob IDs below are Google's official public TEST unit IDs:
 * https://developers.google.com/admob/android/test-ads
 */
export const APP_NAME = 'Word Search King';

export const ADMOB = {
  /** Google TEST AdMob App ID (Android) — ca-app-pub-3940256099942544~3347511713 */
  appId: 'ca-app-pub-3940256099942544~3347511713',
  /** Google TEST interstitial unit ID */
  interstitialUnitId: 'ca-app-pub-3940256099942544/1033173712',
  /** Google TEST rewarded unit ID */
  rewardedUnitId: 'ca-app-pub-3940256099942544/5224354917',
};

/** Interstitial frequency cap: show every Nth eligible trigger… */
export const INTERSTITIAL_EVERY_N_TRIGGERS = 2;
/** …and never more often than this interval. */
export const INTERSTITIAL_MIN_INTERVAL_MS = 60_000;

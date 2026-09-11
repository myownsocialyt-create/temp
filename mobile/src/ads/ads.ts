/**
 * AdMob integration via react-native-google-mobile-ads (Android).
 *
 * Uses Google's public TEST AdMob unit IDs — replace them in src/config.ts
 * (and the app id in app.json) before releasing to production.
 *
 * Interstitial frequency cap (per spec): the ad is shown only on every 2nd
 * eligible trigger AND at least 60 seconds after the previous show.
 * Rewarded ads are used to grant extra hints.
 *
 * The library is loaded LAZILY and defensively: its JS entry calls
 * TurboModuleRegistry.getEnforcing('RNGoogleMobileAdsModule') at import
 * time, which throws if the native module is unavailable — a static
 * import would crash the whole app on open. We require() it inside a
 * try/catch instead and simply run without ads if it is unavailable;
 * gameplay never depends on ads.
 */
import type { InterstitialAd, RewardedAd } from 'react-native-google-mobile-ads';

import {
  ADMOB,
  INTERSTITIAL_EVERY_N_TRIGGERS,
  INTERSTITIAL_MIN_INTERVAL_MS,
} from '../config';

type Rngma = typeof import('react-native-google-mobile-ads');

let rngma: Rngma | null = null;
let rngmaAttempted = false;

/** Loads react-native-google-mobile-ads once; returns null if unavailable. */
function getRngma(): Rngma | null {
  if (!rngmaAttempted) {
    rngmaAttempted = true;
    try {
      // Intentionally a runtime require() so a missing native module
      // degrades gracefully instead of crashing the app at startup.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      rngma = require('react-native-google-mobile-ads') as Rngma;
    } catch {
      rngma = null;
    }
  }
  return rngma;
}

let interstitial: InterstitialAd | null = null;
let rewarded: RewardedAd | null = null;

let adsInitialized = false;
let eligibleTriggers = 0;
let lastShownAt = 0;
let rewardEarned = false;

function scheduleInterstitialReload(delayMs: number): void {
  if (!interstitial) return;
  setTimeout(() => {
    try {
      interstitial?.load();
    } catch {
      // ignore
    }
  }, delayMs);
}

function scheduleRewardedReload(delayMs: number): void {
  if (!rewarded) return;
  setTimeout(() => {
    try {
      rewarded?.load();
    } catch {
      // ignore
    }
  }, delayMs);
}

/** Initializes the AdMob SDK and starts preloading ads. Called once at startup. */
export function initAds(): void {
  if (adsInitialized) return;
  adsInitialized = true;

  const ads = getRngma();
  if (!ads) return; // Ads unavailable in this environment — game continues without them.

  try {
    ads.MobileAds()
      .initialize()
      .catch(() => {
        // Offline or no ad service — the game must keep working without ads.
      });

    interstitial = ads.InterstitialAd.createForAdRequest(ADMOB.interstitialUnitId);
    interstitial.addAdEventListener(ads.AdEventType.ERROR, () => {
      scheduleInterstitialReload(60_000);
    });
    interstitial.addAdEventListener(ads.AdEventType.CLOSED, () => {
      try {
        interstitial?.load();
      } catch {
        // ignore
      }
    });
    interstitial.load();

    rewarded = ads.RewardedAd.createForAdRequest(ADMOB.rewardedUnitId);
    rewarded.addAdEventListener(ads.AdEventType.ERROR, () => {
      scheduleRewardedReload(60_000);
    });
    rewarded.addAdEventListener(ads.AdEventType.CLOSED, () => {
      try {
        rewarded?.load();
      } catch {
        // ignore
      }
    });
    rewarded.addAdEventListener(ads.RewardedAdEventType.EARNED_REWARD, () => {
      rewardEarned = true;
    });
    rewarded.load();
  } catch {
    // Ads are best-effort; never let them break the game.
    interstitial = null;
    rewarded = null;
  }
}

/**
 * Records an eligible interstitial trigger and shows the ad when the
 * frequency cap allows it (every 2nd trigger, >= 60s since last show).
 */
export function maybeShowInterstitial(): void {
  eligibleTriggers += 1;
  if (eligibleTriggers % INTERSTITIAL_EVERY_N_TRIGGERS !== 0) return;
  const now = Date.now();
  if (now - lastShownAt < INTERSTITIAL_MIN_INTERVAL_MS) return;
  if (interstitial && interstitial.loaded) {
    lastShownAt = now;
    try {
      interstitial.show().catch(() => {});
    } catch {
      // ignore
    }
  }
}

/** Whether a rewarded ad is loaded and ready to show. */
export function isRewardedReady(): boolean {
  return !!rewarded && rewarded.loaded;
}

/**
 * Shows a rewarded ad. Resolves true if the user earned the reward
 * (watched the ad to the end), false otherwise.
 */
export async function showRewardedAd(): Promise<boolean> {
  const ad = rewarded;
  if (!ad || !ad.loaded) return false;
  rewardEarned = false;
  try {
    await ad.show();
  } catch {
    return false;
  }
  return rewardEarned;
}

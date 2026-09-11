/**
 * AdMob integration via react-native-google-mobile-ads (Android).
 *
 * Uses Google's public TEST AdMob unit IDs — replace them in src/config.ts
 * (and the app id in app.json) before releasing to production.
 *
 * Interstitial frequency cap (per spec): the ad is shown only on every 2nd
 * eligible trigger AND at least 60 seconds after the previous show.
 * Rewarded ads are used to grant extra hints.
 */
import {
  AdEventType,
  InterstitialAd,
  MobileAds,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

import {
  ADMOB,
  INTERSTITIAL_EVERY_N_TRIGGERS,
  INTERSTITIAL_MIN_INTERVAL_MS,
} from '../config';

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

  MobileAds()
    .initialize()
    .catch(() => {
      // Offline or no ad service — the game must keep working without ads.
    });

  interstitial = InterstitialAd.createForAdRequest(ADMOB.interstitialUnitId);
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    scheduleInterstitialReload(60_000);
  });
  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    try {
      interstitial?.load();
    } catch {
      // ignore
    }
  });
  interstitial.load();

  rewarded = RewardedAd.createForAdRequest(ADMOB.rewardedUnitId);
  rewarded.addAdEventListener(AdEventType.ERROR, () => {
    scheduleRewardedReload(60_000);
  });
  rewarded.addAdEventListener(AdEventType.CLOSED, () => {
    try {
      rewarded?.load();
    } catch {
      // ignore
    }
  });
  rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    rewardEarned = true;
  });
  rewarded.load();
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

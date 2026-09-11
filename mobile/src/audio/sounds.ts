/**
 * Sound effects via expo-av.
 *
 * All sound files are tiny, royalty-free (synthesized for this project),
 * self-hosted .mp3 files (total < 500 KB) so gameplay audio works fully offline.
 */
import { Audio } from 'expo-av';

import correct from '../../assets/sounds/correct.mp3';
import coin from '../../assets/sounds/coin.mp3';
import fanfare from '../../assets/sounds/fanfare.mp3';
import gameover from '../../assets/sounds/gameover.mp3';
import swoosh from '../../assets/sounds/swoosh.mp3';
import tap from '../../assets/sounds/tap.mp3';
import tick from '../../assets/sounds/tick.mp3';
import wrong from '../../assets/sounds/wrong.mp3';

export type SoundName =
  | 'tap'
  | 'correct'
  | 'wrong'
  | 'fanfare'
  | 'tick'
  | 'swoosh'
  | 'coin'
  | 'gameover';

const FILES: Record<SoundName, number> = {
  tap,
  correct,
  wrong,
  fanfare,
  tick,
  swoosh,
  coin,
  gameover,
};

const VOLUMES: Record<SoundName, number> = {
  tap: 0.55,
  correct: 0.9,
  wrong: 0.6,
  fanfare: 1,
  tick: 0.35,
  swoosh: 0.4,
  coin: 0.9,
  gameover: 0.9,
};

const sounds: Partial<Record<SoundName, Audio.Sound>> = {};
let preloadStarted = false;

/** Preloads all sound effects (called once at app startup). */
export async function preloadSounds(): Promise<void> {
  if (preloadStarted) return;
  preloadStarted = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  } catch {
    // Audio mode is best-effort.
  }
  await Promise.all(
    (Object.keys(FILES) as SoundName[]).map(async (name) => {
      try {
        const { sound } = await Audio.Sound.createAsync(FILES[name]);
        sounds[name] = sound;
      } catch {
        // Never let audio issues break gameplay.
      }
    }),
  );
}

/** Plays a sound effect. Safe to call anywhere; failures are ignored. */
export async function playSound(name: SoundName): Promise<void> {
  const sound = sounds[name];
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(VOLUMES[name]);
    await sound.playAsync();
  } catch {
    // ignore
  }
}

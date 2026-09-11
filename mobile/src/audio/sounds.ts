/**
 * Sound effects via expo-audio (SDK 57's supported audio package — the
 * legacy expo-av native library is ABI-incompatible with RN 0.86).
 *
 * All sound files are tiny, royalty-free (synthesized for this project),
 * self-hosted .mp3 files (total < 500 KB) so gameplay audio works fully offline.
 */
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

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

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let preloadStarted = false;

/** Preloads all sound effects (called once at app startup). */
export async function preloadSounds(): Promise<void> {
  if (preloadStarted) return;
  preloadStarted = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
    });
  } catch {
    // Audio mode is best-effort.
  }
  await Promise.all(
    (Object.keys(FILES) as SoundName[]).map(async (name) => {
      try {
        players[name] = createAudioPlayer(FILES[name]);
      } catch {
        // Never let audio issues break gameplay.
      }
    }),
  );
}

/** Plays a sound effect. Safe to call anywhere; failures are ignored. */
export async function playSound(name: SoundName): Promise<void> {
  const player = players[name];
  if (!player) return;
  try {
    player.volume = VOLUMES[name];
    await player.seekTo(0);
  } catch {
    // ignore
  }
  try {
    player.play();
  } catch {
    // ignore
  }
}

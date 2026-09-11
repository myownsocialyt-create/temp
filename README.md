# 👑 Word Search King

A polished, fully offline **word-search puzzle game** for Android, built with **React Native + Expo (SDK 57)**.

Players pick a category, then find hidden words in a letter grid by dragging a finger across connected letters — with two game modes, a coins economy, hints, bonus words, sound effects and AdMob ads (test IDs included).

> All game logic runs client-side. **No network is required for gameplay.**

---

## ✨ Features

| Area | Details |
| --- | --- |
| 🐾 Categories | 15 categories (Animals, Food, Sports, Countries, Colors, Fruits, Space, Ocean Life, Music, Movies, Nature, Technology, Jobs, Clothing, Vegetables) |
| 🔢 Grid sizes | `12×12` if ≥16 words or longest word ≥10 chars · `10×10` if ≥12 words or longest ≥7 chars · else `8×8`. Words placed in **all 8 directions** |
| 🧘 Classic Mode | No time limit — timer counts **up** from 0:00 |
| ⏱️ Time Mode | 2:00 countdown; timer pill turns red (`bg-red-500/30` / `text-red-300`) under 30s with tick sounds |
| ⭐ Scoring | +10 per puzzle word · +5 per bonus word · Time Mode completion bonus: `timeLeft × 2` |
| ✨ Bonus words | 2,000+ curated common 3–4 letter English words in a `Set` (O(1) lookup) — any find that's in the dictionary but not the puzzle list scores +5 |
| 💡 Hints | 3 per puzzle: flashes a random unfound word's cells yellow (3 pulses / 1.5 s), count shown as a red badge; **rewarded ad** grants +2 extra hints |
| 🪙 Coins | Start with 300 · +50 per completed level · persisted in **AsyncStorage** |
| 🔓 Progression | Level 0 (Animals) always unlocked; level *i* unlocked **iff** category *i−1* is completed (persisted) |
| 🎨 Word colors | 18 highlight colors cycled per found word at 35% opacity |
| 🔊 Sound | 8 synthesized royalty-free MP3s (tap, chime, buzz, fanfare, tick, swoosh, coin, game-over) — ~54 KB total |
| 📺 AdMob | Interstitial (every 2nd eligible trigger, ≥60 s apart) + Rewarded, via `react-native-google-mobile-ads` |
| 🖥️ Screens | Home · Category Select · Mode Select · Game · Results (expo-router) |

## 📱 Tech stack

- **React Native 0.86 / Expo SDK 57**, TypeScript, expo-router (file-based routing)
- `react-native-gesture-handler` — pan gestures for word selection
- `expo-av` — sound playback
- `react-native-google-mobile-ads` — AdMob interstitial + rewarded ads
- `@react-native-async-storage/async-storage` — coins / completed-levels persistence
- **NestJS** backend with a single health endpoint (`GET /health → { "status": "ok" }`) — no auth, no leaderboard, no cloud sync

## 📁 Repository layout

```
├── .github/workflows/android-build.yml   # CI: typecheck + tests + APK/AAB build
├── mobile/                               # Expo app (Android native project committed)
│   ├── app/                              # expo-router screens (5 screens)
│   ├── src/
│   │   ├── ads/                          # AdMob manager (frequency-capped)
│   │   ├── audio/                        # Sound manager (expo-av)
│   │   ├── components/                   # Shared UI components
│   │   ├── data/                         # 15 categories + bonus-word dictionary
│   │   ├── game/                         # Puzzle engine, colors, constants
│   │   ├── state/                        # GameContext (coins, unlocks)
│   │   └── theme.ts                      # Light theme palette
│   ├── android/                          # Prebuilt native project (committed)
│   ├── assets/                           # Icons, splash, sound effects
│   └── plugins/                          # Local Expo config plugin
├── backend/                              # Minimal NestJS service (/health)
└── tools/                                # Asset generators + engine tests
```

## 🚀 Quick start

```bash
# Mobile app
cd mobile
npm install
npm start                 # Expo dev server (or: npm run android)

# Backend (optional — the game is fully offline)
cd backend
npm install
npm run start:prod        # http://localhost:3000/health
```

## 🤖 CI — APK + AAB for Google Play

`.github/workflows/android-build.yml` runs on every push/PR:

1. **quality** job — TypeScript typecheck, puzzle-engine stress tests (15 categories × 120 runs), backend build + live `/health` smoke test.
2. **android** job — Gradle release build producing:
   - `WordSearchKing-v1.0.0.apk` (install directly on a device)
   - `WordSearchKing-v1.0.0.aab` (upload to Google Play Console)

Both artifacts are attached to every successful run under **Actions → build → Artifacts**.

## 🔧 Before you publish to Google Play

The project currently uses **placeholder/test values** everywhere. Replace:

| What | Where | Current (test) value |
| --- | --- | --- |
| App name | `mobile/app.json` → `expo.name` | `Word Search King` |
| Package name | `mobile/app.json` → `expo.android.package`, then re-run `npx expo prebuild -p android --clean` (or edit `android/app/build.gradle` `applicationId`) | `com.wordsearchking.game` |
| AdMob App ID | `mobile/app.json` → `react-native-google-mobile-ads` plugin `androidAppId` **and** `mobile/android/app/src/main/AndroidManifest.xml` meta-data `com.google.android.gms.ads.APPLICATION_ID` | `ca-app-pub-3940256099942544~3347511713` |
| Interstitial unit ID | `mobile/src/config.ts` | `ca-app-pub-3940256099942544/1033173712` |
| Rewarded unit ID | `mobile/src/config.ts` | `ca-app-pub-3940256099942544/5224354917` |
| Version | `mobile/app.json` → `expo.version` + `expo.android.versionCode` | `1.0.0` / `1` |

> The AdMob IDs above are **Google's official public TEST IDs** — ads render in every install, so replace them before release. 🚨 **Never ship an app to Play with the App ID `~3347511713` missing/replaced incorrectly — a wrong APPLICATION_ID crashes the app at launch.**

### Signing keystore

CI signs releases with `mobile/android/app/wordsearchking.keystore` (checked in, password `wordsearchking`, alias `wordsearchking`, PKCS12). It's a **placeholder** so builds work out of the box — for production:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore wordsearchking.keystore \
  -alias wordsearchking -keyalg RSA -keysize 2048 -validity 10000
```

Replace the file and the `WSK_UPLOAD_*` values in `mobile/android/gradle.properties`. Keep the keystore safe — Play updates must be signed with the same key (or use [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)).

### Upload checklist

1. Replace package name, AdMob IDs, keystore (above).
2. Run the workflow, download the `.aab`.
3. Create the app in [Play Console](https://play.google.com/console), upload the AAB to internal testing, fill the listing, and roll out.

## 🧪 Tests & tooling

```bash
cd tools
npm run test:engine   # puzzle engine stress tests (all categories, all placements)
npm run sounds        # regenerate the 8 sound effects (synthesized, royalty-free)
npm run icons         # regenerate icon/splash assets from tools/icon-master.png
```

## 🎮 How to play

1. Tap **PLAY**, choose a category, choose Classic or Time Mode.
2. Drag your finger across connected letters (horizontal, vertical or diagonal — forwards or backwards) to select a word.
3. Release to submit: puzzle words score +10, hidden bonus English words score +5.
4. Stuck? Tap 💡 for a hint (3 per puzzle, more via rewarded ad).
5. Find all words to complete the level, earn +50 🪙, and unlock the next category.

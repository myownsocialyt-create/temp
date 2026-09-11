import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { isRewardedReady, showRewardedAd } from '../src/ads/ads';
import { playSound } from '../src/audio/sounds';
import { CoinPill, Pill } from '../src/components/ui';
import { BONUS_WORDS } from '../src/data/bonusWords';
import { categoryById } from '../src/data/categories';
import { Cell, Puzzle, generatePuzzle } from '../src/game/engine';
import {
  COINS_PER_LEVEL,
  HINTS_PER_PUZZLE,
  HINTS_PER_REWARDED_AD,
  POINTS_PER_BONUS_WORD,
  POINTS_PER_WORD,
  TIME_BONUS_MULTIPLIER,
  TIME_MODE_SECONDS,
  TIME_WARNING_SECONDS,
} from '../src/game/constants';
import { wordColorFor } from '../src/game/wordColors';
import { useGame } from '../src/state/GameContext';
import { COLORS } from '../src/theme';

type Mode = 'classic' | 'time';

const cellKey = (c: Cell) => `${c.row}-${c.col}`;

/** All 8 unit directions used to snap a drag to a straight line. */
const DIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GameScreen() {
  const router = useRouter();
  const { categoryId, mode: modeParam } = useLocalSearchParams<{ categoryId?: string; mode?: string }>();
  const { category } = categoryById(categoryId);
  const mode: Mode = modeParam === 'time' ? 'time' : 'classic';
  const { coins, addCoins, markLevelCompleted } = useGame();

  // ----- puzzle state -------------------------------------------------------
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(category.words));
  const size = puzzle.size;
  const total = puzzle.placements.length;

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [bonusWords, setBonusWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(HINTS_PER_PUZZLE);
  const [elapsed, setElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_MODE_SECONDS);
  const [finished, setFinished] = useState<null | 'win' | 'lose'>(null);
  const [selection, setSelection] = useState<Cell[]>([]);
  const [hintCells, setHintCells] = useState<Cell[]>([]);
  const [hintWord, setHintWord] = useState<string | null>(null);
  const [wrongCells, setWrongCells] = useState<Cell[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [rewardedReady, setRewardedReady] = useState(false);

  // ----- refs (source of truth for event handlers) --------------------------
  const foundRef = useRef<Set<string>>(new Set());
  const bonusRef = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const elapsedRef = useRef(0);
  const timeLeftRef = useRef(TIME_MODE_SECONDS);
  const finishedRef = useRef(false);
  const hintWordRef = useRef<string | null>(null);
  const dragRef = useRef<{ start: Cell; cells: Cell[] } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hintFlash = useRef(new Animated.Value(0)).current;
  const wrongFlash = useRef(new Animated.Value(0)).current;
  const overlayScale = useRef(new Animated.Value(0)).current;

  const puzzleWordSet = useMemo(() => new Set(category.words), [category]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1500);
  };

  // ----- game end ------------------------------------------------------------
  const endGame = (win: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(win ? 'win' : 'lose');

    const timeBonus = win && mode === 'time' ? timeLeftRef.current * TIME_BONUS_MULTIPLIER : 0;
    if (win) {
      scoreRef.current += timeBonus;
      setScore(scoreRef.current);
      playSound('fanfare');
      addCoins(COINS_PER_LEVEL);
      markLevelCompleted(category.id);
    } else {
      playSound('gameover');
    }
    overlayScale.setValue(0);
    Animated.spring(overlayScale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();

    const timeTaken = mode === 'time' ? TIME_MODE_SECONDS - timeLeftRef.current : elapsedRef.current;
    const finalScore = scoreRef.current;
    const wordsFound = foundRef.current.size;
    const bonusCount = bonusRef.current.size;
    setTimeout(() => {
      router.replace({
        pathname: '/results',
        params: {
          categoryId: category.id,
          mode,
          completed: win ? '1' : '0',
          score: String(finalScore),
          wordsFound: String(wordsFound),
          wordsTotal: String(total),
          bonusCount: String(bonusCount),
          bonusPoints: String(bonusCount * POINTS_PER_BONUS_WORD),
          timeBonus: String(timeBonus),
          timeTaken: String(timeTaken),
        },
      });
    }, 1700);
  };
  const endGameRef = useRef(endGame);
  endGameRef.current = endGame;

  // ----- timer ---------------------------------------------------------------
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      if (finishedRef.current) return;
      if (mode === 'classic') {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      } else {
        const next = Math.max(0, timeLeftRef.current - 1);
        timeLeftRef.current = next;
        setTimeLeft(next);
        if (next > 0 && next < TIME_WARNING_SECONDS) playSound('tick');
        if (next === 0) endGameRef.current(false);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [mode, finished]);

  // ----- rewarded ad readiness ----------------------------------------------
  useEffect(() => {
    setRewardedReady(isRewardedReady());
    const id = setInterval(() => setRewardedReady(isRewardedReady()), 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // ----- selection logic -----------------------------------------------------
  const { width: windowWidth } = useWindowDimensions();
  const gap = 3;
  const cardPadding = 10;
  const gridOuter = Math.min(windowWidth - 24, 480);
  const gridInner = gridOuter - cardPadding * 2;
  const cellSize = Math.max(
    14,
    Math.floor((gridInner - gap * (size - 1)) / size),
  );
  const pitch = cellSize + gap;
  const cellFontSize = Math.max(11, Math.floor(cellSize * 0.5));

  const cellAt = (x: number, y: number): Cell | null => {
    const col = Math.floor(x / pitch);
    const row = Math.floor(y / pitch);
    if (row < 0 || row >= size || col < 0 || col >= size) return null;
    return { row, col };
  };

  /** Extends the selection from the start cell toward the current cell, snapped
   *  to one of the 8 straight directions. */
  const extendSelection = (start: Cell, current: Cell): Cell[] => {
    const dr = current.row - start.row;
    const dc = current.col - start.col;
    if (dr === 0 && dc === 0) return [start];

    let bestDir = DIRS[0];
    let bestDot = -Infinity;
    for (const d of DIRS) {
      const dot = d[0] * dr + d[1] * dc; // both are unit-ish vectors
      if (dot > bestDot) {
        bestDot = dot;
        bestDir = d;
      }
    }
    const [sr, sc] = bestDir;
    const len = Math.max(1, Math.round(sr * dr + sc * dc));
    const cells: Cell[] = [];
    for (let i = 0; i <= len; i++) {
      const r = start.row + sr * i;
      const c = start.col + sc * i;
      if (r < 0 || r >= size || c < 0 || c >= size) break;
      cells.push({ row: r, col: c });
    }
    return cells;
  };

  const evaluate = (cells: Cell[]) => {
    if (cells.length < 2) return;
    const letters = cells.map((c) => puzzle.grid[c.row][c.col]).join('');
    const reversed = [...letters].reverse().join('');

    // 1) Puzzle word?
    const placement = puzzle.placements.find((p) => p.word === letters || p.word === reversed);
    if (placement) {
      if (foundRef.current.has(placement.word)) return; // already found — no-op
      foundRef.current.add(placement.word);
      setFoundWords((prev) => [...prev, placement.word]);
      scoreRef.current += POINTS_PER_WORD;
      setScore(scoreRef.current);
      playSound('correct');
      if (hintWordRef.current === placement.word) {
        hintWordRef.current = null;
        setHintCells([]);
        setHintWord(null);
      }
      if (foundRef.current.size >= total) endGameRef.current(true);
      return;
    }

    // 2) Bonus word? (>= 3 letters, in the dictionary, NOT in the puzzle list)
    for (const candidate of [letters, reversed]) {
      if (
        candidate.length >= 3 &&
        BONUS_WORDS.has(candidate) &&
        !puzzleWordSet.has(candidate) &&
        !bonusRef.current.has(candidate)
      ) {
        bonusRef.current.add(candidate);
        setBonusWords((prev) => [...prev, candidate]);
        scoreRef.current += POINTS_PER_BONUS_WORD;
        setScore(scoreRef.current);
        playSound('coin');
        showToast(`✨ Bonus word: ${candidate} +5`);
        return;
      }
    }

    // 3) Wrong selection.
    playSound('wrong');
    setWrongCells(cells);
    wrongFlash.setValue(1);
    Animated.timing(wrongFlash, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    setTimeout(() => setWrongCells([]), 440);
  };

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      if (finishedRef.current) return;
      const cell = cellAt(e.x, e.y);
      if (!cell) return;
      dragRef.current = { start: cell, cells: [cell] };
      setSelection([cell]);
    })
    .onChange((e) => {
      const drag = dragRef.current;
      if (!drag || finishedRef.current) return;
      const cell = cellAt(e.x, e.y);
      if (!cell) return;
      const cells = extendSelection(drag.start, cell);
      if (cells.length !== drag.cells.length) {
        const grew = cells.length > drag.cells.length;
        drag.cells = cells;
        if (grew) playSound('swoosh');
        setSelection(cells);
      }
    })
    .onFinalize(() => {
      const drag = dragRef.current;
      dragRef.current = null;
      setSelection([]);
      if (drag) evaluate(drag.cells);
    });

  // ----- hints ----------------------------------------------------------------
  const onHint = () => {
    if (hints <= 0 || finished) return;
    playSound('tap');
    const unfound = puzzle.placements.filter((p) => !foundRef.current.has(p.word));
    if (unfound.length === 0) return;
    const pick = unfound[Math.floor(Math.random() * unfound.length)];
    setHints((h) => h - 1);
    setHintCells(pick.cells);
    setHintWord(pick.word);
    hintWordRef.current = pick.word;
    // Flash: 3 pulses over 1.5 seconds (250ms in / 250ms out each).
    hintFlash.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(hintFlash, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(hintFlash, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    ).start();
  };

  const onWatchAdForHints = async () => {
    playSound('tap');
    const earned = await showRewardedAd();
    if (earned) {
      setHints((h) => h + HINTS_PER_REWARDED_AD);
      showToast(`💡 +${HINTS_PER_REWARDED_AD} hints earned!`);
    }
  };

  const onBack = () => {
    playSound('tap');
    if (finishedRef.current) {
      router.back();
      return;
    }
    Alert.alert('Quit puzzle?', 'Your progress on this puzzle will be lost.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  // ----- derived render data ---------------------------------------------------
  const selectionSet = useMemo(() => new Set(selection.map(cellKey)), [selection]);
  const hintSet = useMemo(() => new Set(hintCells.map(cellKey)), [hintCells]);
  const wrongSet = useMemo(() => new Set(wrongCells.map(cellKey)), [wrongCells]);

  const cellFoundColors = useMemo(() => {
    const map: string[][][] = puzzle.grid.map((row) => row.map(() => [] as string[]));
    foundWords.forEach((word, idx) => {
      const placement = puzzle.placements.find((p) => p.word === word);
      if (!placement) return;
      const color = wordColorFor(idx);
      placement.cells.forEach((cell) => {
        map[cell.row][cell.col].push(color.bg);
      });
    });
    return map;
  }, [foundWords, puzzle]);

  const timerLabel = mode === 'classic' ? formatTime(elapsed) : formatTime(timeLeft);
  const timerDanger = mode === 'time' && timeLeft < TIME_WARNING_SECONDS && timeLeft > 0;

  const renderCell = (row: number, col: number) => {
    const key = `${row}-${col}`;
    const found = cellFoundColors[row][col];
    const isSelected = selectionSet.has(key);
    const isHinted = hintSet.has(key);
    const isWrong = wrongSet.has(key);
    return (
      <View
        key={key}
        style={{
          width: cellSize,
          height: cellSize,
          marginRight: col < size - 1 ? gap : 0,
          marginBottom: row < size - 1 ? gap : 0,
          borderRadius: Math.max(4, cellSize * 0.22),
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: 'rgba(26, 26, 26, 0.05)',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {found.map((c, i) => (
          <View key={`f${i}`} style={[StyleSheet.absoluteFill, { backgroundColor: c }]} />
        ))}
        {isHinted ? (
          <>
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(250, 204, 21, 0.20)' }]}
            />
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(250, 204, 21, 0.55)', opacity: hintFlash },
              ]}
            />
          </>
        ) : null}
        {isSelected ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(47, 128, 237, 0.35)' }]} />
        ) : null}
        {isWrong ? (
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.redSoft, opacity: wrongFlash }]}
          />
        ) : null}
        <Text
          style={{
            fontSize: cellFontSize,
            fontWeight: isSelected ? '900' : '700',
            color: COLORS.text,
          }}
        >
          {puzzle.grid[row][col]}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} android_disableSound style={styles.backButton} hitSlop={12}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {category.emoji} {category.name}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'classic' ? 'Classic' : 'Time Mode'} • find {total} words
            </Text>
          </View>
          <CoinPill coins={coins} />
        </View>

        {/* Stat pills */}
        <View style={styles.pillsRow}>
          <Pill emoji="⭐" label={String(score)} testID="score-pill" />
          <Pill
            emoji={mode === 'classic' ? '⏱️' : timerDanger ? '⏰' : '⏱️'}
            label={timerLabel}
            backgroundColor={timerDanger ? COLORS.redSoft : COLORS.white}
            textColor={timerDanger ? COLORS.red300 : COLORS.text}
            style={{ minWidth: 86, justifyContent: 'center' }}
          />
          <Pill emoji="✨" label={String(bonusWords.length)} />
          <View>
            <Pressable
              onPress={onHint}
              disabled={hints <= 0 || !!finished}
              android_disableSound
              style={({ pressed }) => [
                styles.hintButton,
                (hints <= 0 || !!finished) && styles.hintDisabled,
                pressed && hints > 0 && { transform: [{ scale: 0.94 }] },
              ]}
              hitSlop={8}
            >
              <Text style={{ fontSize: 20 }}>💡</Text>
            </Pressable>
            {hints > 0 ? (
              <View style={styles.hintBadge}>
                <Text style={styles.hintBadgeText}>{hints}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Grid */}
        <View style={[styles.gridCard, { width: gridOuter }]}>
          <View style={{ width: gridInner, borderRadius: 14, overflow: 'hidden' }}>
            <GestureDetector gesture={panGesture}>
              <View
                style={{
                  width: size * cellSize + (size - 1) * gap,
                  height: size * cellSize + (size - 1) * gap,
                }}
              >
                {puzzle.grid.map((_, row) => (
                  <View key={`r${row}`} style={{ flexDirection: 'row' }}>
                    {puzzle.grid[row].map((_, col) => renderCell(row, col))}
                  </View>
                ))}
              </View>
            </GestureDetector>
          </View>
        </View>

        {/* Word list */}
        <ScrollView style={styles.wordList} contentContainerStyle={styles.wordListContent}>
          <View style={styles.wordChips}>
            {puzzle.placements.map((p) => {
              const foundIdx = foundWords.indexOf(p.word);
              const isFound = foundIdx >= 0;
              const isHinted = hintWord === p.word && !isFound;
              const color = isFound ? wordColorFor(foundIdx) : null;
              return (
                <View
                  key={p.word}
                  style={[
                    styles.wordChip,
                    isFound && styles.wordChipFound,
                    isHinted && styles.wordChipHinted,
                    color ? { borderColor: color.base } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.wordChipText,
                      isFound && { color: COLORS.foundGray, textDecorationLine: 'line-through' },
                    ]}
                  >
                    {p.word}
                  </Text>
                </View>
              );
            })}
          </View>
          {bonusWords.length > 0 ? (
            <Text style={styles.bonusSummary}>
              ✨ Bonus words found: {bonusWords.join(', ')}
            </Text>
          ) : null}
        </ScrollView>

        {/* Rewarded hints */}
        {hints === 0 && !finished ? (
          <Pressable
            onPress={onWatchAdForHints}
            disabled={!rewardedReady}
            android_disableSound
            style={({ pressed }) => [
              styles.rewardButton,
              !rewardedReady && { opacity: 0.5 },
              pressed && rewardedReady && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.rewardButtonText}>
              {rewardedReady ? '▶ Watch an ad for +2 hints' : 'Loading ad…'}
            </Text>
          </Pressable>
        ) : null}

        {/* Toast */}
        {toast ? (
          <View style={styles.toastWrap} pointerEvents="none">
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          </View>
        ) : null}

        {/* Win / lose overlay */}
        {finished ? (
          <View style={styles.overlay} pointerEvents="none">
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: overlayScale }] }}>
              <Text style={{ fontSize: 68, marginBottom: 8 }}>
                {finished === 'win' ? '🎉' : '⏰'}
              </Text>
              <Text style={styles.overlayTitle}>
                {finished === 'win' ? 'Level Complete!' : "Time's Up!"}
              </Text>
              <Text style={styles.overlaySub}>
                {finished === 'win'
                  ? `🪙 +${COINS_PER_LEVEL} coins`
                  : `${foundWords.length} of ${total} words found`}
              </Text>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '700',
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSoft,
    marginTop: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  hintButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hintDisabled: {
    backgroundColor: COLORS.foundGray,
  },
  hintBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  hintBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  gridCard: {
    alignSelf: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  wordList: {
    flex: 1,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  wordListContent: {
    paddingBottom: 8,
  },
  wordChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  wordChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wordChipFound: {
    backgroundColor: '#eeeeF2',
  },
  wordChipHinted: {
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
    borderWidth: 2,
  },
  wordChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.4,
  },
  bonusSummary: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSoft,
  },
  rewardButton: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  rewardButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  toastWrap: {
    position: 'absolute',
    bottom: 76,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: COLORS.text,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  toastText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 240, 243, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.text,
  },
  overlaySub: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSoft,
    marginTop: 8,
  },
});

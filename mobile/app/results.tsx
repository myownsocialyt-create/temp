import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { maybeShowInterstitial } from '../src/ads/ads';
import { playSound } from '../src/audio/sounds';
import { BigButton, CoinPill } from '../src/components/ui';
import { CATEGORIES, categoryById } from '../src/data/categories';
import { COINS_PER_LEVEL } from '../src/game/constants';
import { WORD_COLORS, wordColorFor } from '../src/game/wordColors';
import { useGame } from '../src/state/GameContext';
import { COLORS } from '../src/theme';

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Simple confetti burst (no dependencies — plain RN Animated). */
function Confetti() {
  const { height } = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 500,
        duration: 1600 + Math.random() * 1200,
        rotate: Math.random() * 360,
        color: wordColorFor(i).base,
        size: 8 + Math.random() * 6,
        drift: -40 + Math.random() * 80,
      })),
    [],
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} {...p} fallHeight={height} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  left,
  delay,
  duration,
  rotate,
  color,
  size,
  drift,
  fallHeight,
}: {
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
  size: number;
  drift: number;
  fallHeight: number;
}) {
  const y = useRef(new Animated.Value(-30)).current;
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(y, {
      toValue: fallHeight + 40,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
    Animated.timing(x, {
      toValue: drift,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [y, x, drift, duration, delay, fallHeight]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${left}%`,
        width: size,
        height: size * 0.6,
        borderRadius: 2,
        backgroundColor: color,
        transform: [{ translateY: y }, { translateX: x }, { rotate: `${rotate}deg` }],
        opacity: 0.9,
      }}
    />
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const p = useLocalSearchParams<{
    categoryId?: string;
    mode?: string;
    completed?: string;
    score?: string;
    wordsFound?: string;
    wordsTotal?: string;
    bonusCount?: string;
    bonusPoints?: string;
    timeBonus?: string;
    timeTaken?: string;
  }>();

  const { category, index } = categoryById(p.categoryId);
  const mode = p.mode === 'time' ? 'time' : 'classic';
  const completed = p.completed === '1';
  const score = Number(p.score ?? 0) || 0;
  const wordsFound = Number(p.wordsFound ?? 0) || 0;
  const wordsTotal = Number(p.wordsTotal ?? 0) || 0;
  const bonusCount = Number(p.bonusCount ?? 0) || 0;
  const bonusPoints = Number(p.bonusPoints ?? 0) || 0;
  const timeBonus = Number(p.timeBonus ?? 0) || 0;
  const timeTaken = Number(p.timeTaken ?? 0) || 0;

  const { coins } = useGame();
  const nextCategory = index + 1 < CATEGORIES.length ? CATEGORIES[index + 1] : null;
  const canPlayNext = completed && !!nextCategory;

  // Entering the results screen is an eligible interstitial trigger.
  useEffect(() => {
    maybeShowInterstitial();
  }, []);

  const playAgain = () => {
    playSound('tap');
    maybeShowInterstitial();
    router.replace({ pathname: '/game', params: { categoryId: category.id, mode } });
  };

  const nextLevel = () => {
    if (!nextCategory) return;
    playSound('tap');
    router.replace({ pathname: '/game', params: { categoryId: nextCategory.id, mode } });
  };

  const goHome = () => {
    playSound('tap');
    maybeShowInterstitial();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {completed ? <Confetti /> : null}

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        <CoinPill coins={coins} />
      </View>

      <View style={styles.content}>
        <Text style={styles.trophy}>{completed ? '🏆' : '⏰'}</Text>
        <Text style={styles.title}>
          {completed ? 'Level Complete!' : "Time's Up!"}
        </Text>
        <Text style={styles.subtitle}>
          {category.emoji} {category.name} • {mode === 'classic' ? 'Classic' : 'Time Mode'}
        </Text>

        {/* Score circle */}
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        {/* Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakRow}>
            <Text style={styles.breakLabel}>Words found</Text>
            <Text style={[styles.breakValue, wordsFound === wordsTotal && { color: COLORS.green }]}>
              {wordsFound} / {wordsTotal}
            </Text>
          </View>
          <View style={styles.breakDivider} />
          <View style={styles.breakRow}>
            <Text style={styles.breakLabel}>Bonus words ✨</Text>
            <Text style={styles.breakValue}>
              {bonusCount} (+{bonusPoints} pts)
            </Text>
          </View>
          <View style={styles.breakDivider} />
          {mode === 'time' ? (
            <>
              <View style={styles.breakRow}>
                <Text style={styles.breakLabel}>Time bonus ⚡</Text>
                <Text style={styles.breakValue}>+{timeBonus} pts</Text>
              </View>
              <View style={styles.breakDivider} />
            </>
          ) : null}
          <View style={styles.breakRow}>
            <Text style={styles.breakLabel}>Time taken</Text>
            <Text style={styles.breakValue}>{formatTime(timeTaken)}</Text>
          </View>
          <View style={styles.breakDivider} />
          <View style={styles.breakRow}>
            <Text style={styles.breakLabel}>Coins earned</Text>
            <Text style={[styles.breakValue, { color: completed ? COLORS.orange : COLORS.textSoft }]}>
              {completed ? `🪙 +${COINS_PER_LEVEL}` : '—'}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <BigButton title="Play Again" emoji="🔁" onPress={playAgain} backgroundColor={COLORS.blue} />
          {canPlayNext && nextCategory ? (
            <BigButton
              title={`Next: ${nextCategory.name}`}
              emoji={nextCategory.emoji}
              onPress={nextLevel}
              backgroundColor={COLORS.green}
            />
          ) : null}
          <BigButton
            title="Home"
            emoji="🏠"
            onPress={goHome}
            backgroundColor="#e7e7ee"
            textColor={COLORS.text}
          />
        </View>
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
    paddingTop: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  trophy: {
    fontSize: 64,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSoft,
    marginTop: 4,
    marginBottom: 18,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.card,
    borderWidth: 4,
    borderColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    color: COLORS.textSoft,
  },
  scoreValue: {
    fontSize: 44,
    fontWeight: '900',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  breakdownCard: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 6,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  breakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  breakLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  breakValue: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  breakDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  buttons: {
    alignSelf: 'stretch',
    marginTop: 22,
    gap: 10,
    marginBottom: 8,
  },
});

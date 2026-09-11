import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playSound } from '../src/audio/sounds';
import { CoinPill } from '../src/components/ui';
import { categoryById } from '../src/data/categories';
import { useGame } from '../src/state/GameContext';
import { COLORS } from '../src/theme';

export default function ModeScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const { category, index } = categoryById(categoryId);
  const { coins, ready } = useGame();

  const start = (mode: 'classic' | 'time') => {
    playSound('tap');
    router.push({ pathname: '/game', params: { categoryId: category.id, mode } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => {
            playSound('tap');
            router.back();
          }}
          android_disableSound
          style={styles.backButton}
          hitSlop={12}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {category.emoji} {category.name}
          </Text>
          <Text style={styles.subtitle}>Level {index + 1} — pick a game mode</Text>
        </View>
        {ready ? <CoinPill coins={coins} /> : null}
      </View>

      <View style={styles.content}>
        <Pressable
          android_disableSound
          onPress={() => start('classic')}
          style={({ pressed }) => [styles.modeCard, pressed && { transform: [{ scale: 0.98 }] }]}
        >
          <Text style={styles.modeEmoji}>🧘</Text>
          <Text style={[styles.modeTitle, { color: COLORS.blue }]}>Classic</Text>
          <Text style={styles.modeDesc}>
            No time limit. Solve the puzzle at your own pace — the timer counts up from 0:00.
          </Text>
          <View style={[styles.modeTag, { backgroundColor: COLORS.blueSoft }]}>
            <Text style={[styles.modeTagText, { color: COLORS.blue }]}>♾️ Relaxed</Text>
          </View>
        </Pressable>

        <Pressable
          android_disableSound
          onPress={() => start('time')}
          style={({ pressed }) => [
            styles.modeCard,
            { borderColor: 'rgba(255, 140, 26, 0.35)' },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={styles.modeEmoji}>⏱️</Text>
          <Text style={[styles.modeTitle, { color: COLORS.orange }]}>Time Mode</Text>
          <Text style={styles.modeDesc}>
            2:00 countdown. Find all the words before time runs out and earn a time bonus.
          </Text>
          <View style={[styles.modeTag, { backgroundColor: COLORS.orangeSoft }]}>
            <Text style={[styles.modeTagText, { color: COLORS.orange }]}>⚡ Fast &amp; furious</Text>
          </View>
        </Pressable>

        <View style={styles.hintCard}>
          <Text style={styles.hintText}>
            💡 3 hints per puzzle • ⭐ +10 per word • ✨ +5 per bonus word • 🪙 +50 per completed level
          </Text>
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
    paddingTop: 10,
    paddingBottom: 14,
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
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSoft,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47, 128, 237, 0.35)',
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  modeEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  modeDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSoft,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  modeTag: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 14,
  },
  modeTagText: {
    fontSize: 13,
    fontWeight: '800',
  },
  hintCard: {
    backgroundColor: COLORS.pinkSoft,
    borderRadius: 18,
    padding: 14,
    marginTop: 4,
  },
  hintText: {
    color: COLORS.pink,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
  },
});

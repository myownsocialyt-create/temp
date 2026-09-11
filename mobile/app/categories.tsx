import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playSound } from '../src/audio/sounds';
import { CoinPill } from '../src/components/ui';
import { CATEGORIES } from '../src/data/categories';
import { useGame } from '../src/state/GameContext';
import { COLORS } from '../src/theme';

export default function CategoriesScreen() {
  const router = useRouter();
  const { coins, ready, isLevelUnlocked, isLevelCompleted } = useGame();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const onPressCategory = (index: number) => {
    if (!isLevelUnlocked(index)) {
      playSound('wrong');
      const prev = CATEGORIES[index - 1];
      showToast(`🔒 Complete “${prev.name}” to unlock`);
      return;
    }
    playSound('tap');
    router.push({ pathname: '/mode', params: { categoryId: CATEGORIES[index].id } });
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
          <Text style={styles.title}>Choose a Category</Text>
          <Text style={styles.subtitle}>Complete a level to unlock the next one</Text>
        </View>
        {ready ? <CoinPill coins={coins} /> : null}
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const unlocked = isLevelUnlocked(index);
          const completed = isLevelCompleted(item.id);
          return (
            <Pressable
              android_disableSound
              onPress={() => onPressCategory(index)}
              style={({ pressed }) => [
                styles.card,
                !unlocked && styles.lockedCard,
                pressed && unlocked && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.emoji}>{unlocked ? item.emoji : '🔒'}</Text>
              <Text style={[styles.name, !unlocked && styles.lockedName]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text
                style={[
                  styles.status,
                  completed && { color: COLORS.green, fontWeight: '800' },
                  !unlocked && { color: COLORS.textSoft },
                ]}
                numberOfLines={1}
              >
                {completed ? '✓ Completed' : unlocked ? `${item.words.length} words` : 'Locked'}
              </Text>
              {completed ? <View style={styles.completedDot} /> : null}
            </Pressable>
          );
        }}
      />

      {toast ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
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
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSoft,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  card: {
    width: '48.5%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lockedCard: {
    backgroundColor: '#e9e9ee',
    opacity: 0.75,
  },
  emoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  lockedName: {
    color: COLORS.textSoft,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSoft,
    marginTop: 4,
  },
  completedDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
  },
  toastWrap: {
    position: 'absolute',
    bottom: 28,
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
});

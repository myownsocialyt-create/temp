import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playSound } from '../src/audio/sounds';
import { BigButton, CoinPill, LetterTile } from '../src/components/ui';
import { useGame } from '../src/state/GameContext';
import { COLORS } from '../src/theme';

/** Decorative floating letter tiles in the background. */
function FloatingTiles() {
  const tiles = [
    { letter: 'W', left: 18, top: 90, delay: 0, colorIndex: 1 },
    { letter: 'S', left: 320, top: 120, delay: 400, colorIndex: 4 },
    { letter: 'K', left: 40, top: 420, delay: 800, colorIndex: 2 },
    { letter: 'Q', left: 330, top: 460, delay: 200, colorIndex: 8 },
    { letter: 'Z', left: 200, top: 60, delay: 600, colorIndex: 13 },
    { letter: 'A', left: 20, top: 260, delay: 1000, colorIndex: 5 },
    { letter: 'M', left: 345, top: 300, delay: 300, colorIndex: 11 },
    { letter: 'F', left: 70, top: 560, delay: 500, colorIndex: 15 },
  ];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {tiles.map((t) => (
        <FloatingTile key={t.letter + t.top} {...t} />
      ))}
    </View>
  );
}

function FloatingTile({
  letter,
  left,
  top,
  delay,
  colorIndex,
}: {
  letter: string;
  left: number;
  top: number;
  delay: number;
  colorIndex: number;
}) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(y, {
          toValue: 10,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const timer = setTimeout(() => anim.start(), delay);
    return () => {
      clearTimeout(timer);
      anim.stop();
    };
  }, [y, delay]);
  return (
    <Animated.View style={{ position: 'absolute', left, top, opacity: 0.5, transform: [{ translateY: y }] }}>
      <LetterTile letter={letter} colorIndex={colorIndex} size={34} />
    </Animated.View>
  );
}

/** Pulsing PLAY button (per spec: animated Play button). */
function PlayButton({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.06,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }], alignSelf: 'stretch' }}>
      <Pressable
        onPress={onPress}
        android_disableSound
        style={({ pressed }) => [
          styles.playButton,
          pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 },
        ]}
      >
        <Text style={styles.playEmoji}>▶</Text>
        <Text style={styles.playText}>PLAY</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { coins, ready } = useGame();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        {ready ? <CoinPill coins={coins} /> : null}
      </View>

      <FloatingTiles />

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Text style={styles.crown}>👑</Text>
          <View style={styles.logoRow}>
            {'WORD'.split('').map((l, i) => (
              <LetterTile key={`w${i}`} letter={l} colorIndex={i} size={44} />
            ))}
          </View>
          <View style={styles.logoRow}>
            {'SEARCH'.split('').map((l, i) => (
              <LetterTile key={`s${i}`} letter={l} colorIndex={i + 4} size={44} />
            ))}
          </View>
          <View style={[styles.logoRow, { marginTop: 6 }]}>
            {'KING'.split('').map((l, i) => (
              <LetterTile key={`k${i}`} letter={l} colorIndex={i + 10} size={56} />
            ))}
          </View>
        </View>

        <Text style={styles.tagline}>Find hidden words in the letter grid</Text>
        <Text style={styles.subTagline}>
          🧭 15 categories &nbsp;•&nbsp; ⏱️ 2 game modes &nbsp;•&nbsp; 💡 hints &nbsp;•&nbsp; 🪙 coins
        </Text>

        <View style={styles.playWrap}>
          <PlayButton
            onPress={() => {
              playSound('tap');
              router.push('/categories');
            }}
          />
        </View>
      </View>

      <Text style={styles.footer}>Works offline • v1.0.0</Text>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
  },
  crown: {
    fontSize: 56,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textSoft,
    textAlign: 'center',
  },
  subTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSoft,
    marginTop: 8,
    marginBottom: 36,
    textAlign: 'center',
  },
  playWrap: {
    alignSelf: 'stretch',
    maxWidth: 320,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue,
    borderRadius: 22,
    paddingVertical: 18,
    shadowColor: '#2f80ed',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  playEmoji: {
    color: '#ffffff',
    fontSize: 20,
    marginRight: 10,
  },
  playText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: 6,
  },
});

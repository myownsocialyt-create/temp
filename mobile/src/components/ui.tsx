import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { COLORS } from '../theme';
import { WORD_COLORS } from '../game/wordColors';

/** Small rounded pill with an emoji + value, used for coins/score/timer. */
export function Pill({
  emoji,
  label,
  backgroundColor = COLORS.white,
  textColor = COLORS.text,
  style,
  testID,
}: {
  emoji?: string;
  label: string;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  testID?: string;
}) {
  return (
    <View testID={testID} style={[styles.pill, { backgroundColor }, style]}>
      {emoji ? <Text style={styles.pillEmoji}>{emoji}</Text> : null}
      <Text style={[styles.pillText, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function CoinPill({ coins }: { coins: number }) {
  return <Pill emoji="🪙" label={String(coins)} testID="coin-pill" />;
}

type BigButtonProps = {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
  emoji?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
};

/** Big rounded CTA button with a subtle press animation. */
export function BigButton({
  title,
  onPress,
  backgroundColor = COLORS.blue,
  textColor = '#ffffff',
  emoji,
  style,
  textStyle,
  disabled = false,
}: BigButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_disableSound
      style={({ pressed }) => [
        styles.bigButton,
        { backgroundColor: disabled ? COLORS.foundGray : backgroundColor },
        pressed && !disabled && { transform: [{ scale: 0.97 }], opacity: 0.92 },
        style,
      ]}
    >
      {emoji ? <Text style={styles.bigButtonEmoji}>{emoji}</Text> : null}
      <Text style={[styles.bigButtonText, { color: disabled ? '#ffffff' : textColor }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}

/** One rounded letter tile (used by the logo lockup). */
export function LetterTile({
  letter,
  colorIndex,
  size = 44,
}: {
  letter: string;
  colorIndex: number;
  size?: number;
}) {
  const color = WORD_COLORS[colorIndex % WORD_COLORS.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        backgroundColor: color.bg,
        borderWidth: 1,
        borderColor: 'rgba(26, 26, 26, 0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: size * 0.06,
        marginVertical: size * 0.06,
      }}
    >
      <Text
        style={{
          fontSize: size * 0.52,
          fontWeight: '800',
          color: COLORS.text,
          letterSpacing: 0,
        }}
      >
        {letter}
      </Text>
    </View>
  );
}

/** Stylized "WORD SEARCH KING" logo made of letter tiles + a crown. */
export function LogoLockup() {
  const row = (word: string, offset: number, tileSize: number) => (
    <View style={styles.logoRow} key={word}>
      {word.split('').map((letter, i) => (
        <LetterTile key={`${word}-${i}`} letter={letter} colorIndex={i + offset} size={tileSize} />
      ))}
    </View>
  );
  return (
    <View style={styles.logoWrap}>
      <Text style={styles.logoCrown}>👑</Text>
      {row('WORD', 0, 42)}
      {row('SEARCH', 4, 42)}
      {row('KING', 10, 54)}
    </View>
  );
}

/** Card container with soft shadow used across screens. */
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pillEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  bigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  bigButtonEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  bigButtonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoCrown: {
    fontSize: 52,
    marginBottom: 6,
  },
});

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initAds } from '../src/ads/ads';
import { preloadSounds } from '../src/audio/sounds';
import { GameProvider } from '../src/state/GameContext';
import { COLORS } from '../src/theme';

export default function RootLayout() {
  useEffect(() => {
    // Sound effects + AdMob init are best-effort; the game is fully playable offline.
    preloadSounds();
    initAds();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaProvider>
        <GameProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="game" options={{ gestureEnabled: false }} />
          </Stack>
        </GameProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '../data/categories';
import { COINS_START } from '../game/constants';

const COINS_KEY = 'wsk:coins';
const COMPLETED_KEY = 'wsk:completedLevels';

type GameContextValue = {
  /** True once persisted state has been loaded from AsyncStorage. */
  ready: boolean;
  coins: number;
  completedLevels: Record<string, boolean>;
  /** Level 0 is always unlocked; level i is unlocked iff CATEGORIES[i-1] is completed. */
  isLevelUnlocked: (index: number) => boolean;
  isLevelCompleted: (id: string) => boolean;
  addCoins: (amount: number) => void;
  markLevelCompleted: (id: string) => void;
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [coins, setCoins] = useState(COINS_START);
  const [completedLevels, setCompletedLevels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [coinsRaw, completedRaw] = await AsyncStorage.multiGet([COINS_KEY, COMPLETED_KEY]);
        const storedCoins = Number(coinsRaw?.[0]?.[1]);
        if (mounted) {
          if (Number.isFinite(storedCoins) && coinsRaw?.[0]?.[1] != null) {
            setCoins(storedCoins);
          }
          if (completedRaw?.[0]?.[1]) {
            try {
              const parsed = JSON.parse(completedRaw[0][1]);
              if (parsed && typeof parsed === 'object') setCompletedLevels(parsed);
            } catch {
              // ignore malformed data
            }
          }
        }
      } catch {
        // Offline-first: fall back to defaults if storage is unavailable.
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addCoins = useCallback((amount: number) => {
    setCoins((prev) => {
      const next = prev + amount;
      AsyncStorage.setItem(COINS_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const markLevelCompleted = useCallback((id: string) => {
    setCompletedLevels((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: true };
      AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isLevelUnlocked = useCallback(
    (index: number) => {
      if (index <= 0) return true; // Level 0 (Animals) is always unlocked.
      const prev = CATEGORIES[index - 1];
      return !!prev && !!completedLevels[prev.id];
    },
    [completedLevels],
  );

  const isLevelCompleted = useCallback((id: string) => !!completedLevels[id], [completedLevels]);

  const value = useMemo(
    () => ({
      ready,
      coins,
      completedLevels,
      isLevelUnlocked,
      isLevelCompleted,
      addCoins,
      markLevelCompleted,
    }),
    [ready, coins, completedLevels, isLevelUnlocked, isLevelCompleted, addCoins, markLevelCompleted],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within <GameProvider>');
  return ctx;
}

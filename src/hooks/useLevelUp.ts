import { useState, useEffect, useRef, useCallback } from 'react';
import { calculateUserLevel } from '@/lib/levelSystem';

interface LevelUpData {
  previousLevel: number;
  newLevel: number;
  levelName: string;
  levelIcon: string;
  levelColor: string;
}

export const useLevelUp = (totalXP: number) => {
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const previousLevelRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const userLevel = calculateUserLevel(totalXP);
    const currentLevel = userLevel.currentLevel.level;

    // Skip the first render to avoid false positives
    if (!isInitializedRef.current) {
      previousLevelRef.current = currentLevel;
      isInitializedRef.current = true;
      return;
    }

    // Check if level increased
    if (previousLevelRef.current !== null && currentLevel > previousLevelRef.current) {
      setLevelUpData({
        previousLevel: previousLevelRef.current,
        newLevel: currentLevel,
        levelName: userLevel.currentLevel.name,
        levelIcon: userLevel.currentLevel.icon,
        levelColor: userLevel.currentLevel.color,
      });
    }

    previousLevelRef.current = currentLevel;
  }, [totalXP]);

  const clearLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  return {
    levelUpData,
    hasLeveledUp: levelUpData !== null,
    clearLevelUp,
  };
};

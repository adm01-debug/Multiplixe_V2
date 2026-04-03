import { describe, it, expect } from "vitest";
import { calculateUserLevel, LEVELS } from "@/lib/levelSystem";

describe("Level System - Comprehensive", () => {
  it("should have exactly 10 levels", () => {
    expect(LEVELS.length).toBe(10);
  });

  it("should start at level 1 with 0 XP", () => {
    expect(LEVELS[0].level).toBe(1);
    expect(LEVELS[0].minXP).toBe(0);
  });

  it("should end at level 10 with Infinity maxXP", () => {
    expect(LEVELS[9].level).toBe(10);
    expect(LEVELS[9].maxXP).toBe(Infinity);
  });

  it("should have contiguous XP ranges with no gaps", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXP).toBe(LEVELS[i - 1].maxXP);
    }
  });

  it("should have unique level names", () => {
    const names = LEVELS.map((l) => l.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("should have unique level icons", () => {
    const icons = LEVELS.map((l) => l.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it("should return level 1 for 0 XP", () => {
    const result = calculateUserLevel(0);
    expect(result.currentLevel.level).toBe(1);
    expect(result.progressPercentage).toBe(0);
  });

  it("should return level 1 for 50 XP", () => {
    const result = calculateUserLevel(50);
    expect(result.currentLevel.level).toBe(1);
    expect(result.progressPercentage).toBe(50);
  });

  it("should return level 2 for exactly 100 XP", () => {
    const result = calculateUserLevel(100);
    expect(result.currentLevel.level).toBe(2);
  });

  it("should return level 10 for very high XP", () => {
    const result = calculateUserLevel(999999);
    expect(result.currentLevel.level).toBe(10);
    expect(result.nextLevel).toBeNull();
    expect(result.progressPercentage).toBe(100);
  });

  it("should handle negative XP gracefully", () => {
    const result = calculateUserLevel(-100);
    expect(result.currentLevel.level).toBe(1);
  });

  it("should calculate correct XP in current level", () => {
    const result = calculateUserLevel(150);
    expect(result.currentLevel.level).toBe(2);
    expect(result.xpInCurrentLevel).toBe(50);
  });

  it("should calculate correct XP needed for next level", () => {
    const result = calculateUserLevel(100);
    expect(result.xpNeededForNextLevel).toBe(150); // 250 - 100
  });

  it("every level should have a gradient defined", () => {
    LEVELS.forEach((level) => {
      expect(level.gradient).toBeTruthy();
      expect(level.gradient).toContain("from-");
    });
  });

  it("every level should have a color defined", () => {
    LEVELS.forEach((level) => {
      expect(level.color).toBeTruthy();
      expect(level.color).toContain("text-");
    });
  });

  // Boundary tests for each level transition
  LEVELS.slice(1).forEach((level) => {
    it(`should transition to level ${level.level} at exactly ${level.minXP} XP`, () => {
      const result = calculateUserLevel(level.minXP);
      expect(result.currentLevel.level).toBe(level.level);
    });

    it(`should be level ${level.level - 1} at ${level.minXP - 1} XP`, () => {
      const result = calculateUserLevel(level.minXP - 1);
      expect(result.currentLevel.level).toBe(level.level - 1);
    });
  });
});

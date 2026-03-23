import { describe, it, expect } from "vitest";
import { calculateUserLevel, LEVELS } from "@/lib/levelSystem";

describe("Level System", () => {
  describe("LEVELS configuration", () => {
    it("should have 10 levels", () => {
      expect(LEVELS).toHaveLength(10);
    });

    it("should have ascending minXP values", () => {
      for (let i = 1; i < LEVELS.length; i++) {
        expect(LEVELS[i].minXP).toBeGreaterThan(LEVELS[i - 1].minXP);
      }
    });

    it("should have no gaps between level ranges", () => {
      for (let i = 0; i < LEVELS.length - 1; i++) {
        expect(LEVELS[i].maxXP).toBe(LEVELS[i + 1].minXP);
      }
    });

    it("level 10 should have Infinity maxXP", () => {
      expect(LEVELS[9].maxXP).toBe(Infinity);
    });

    it("each level should have required properties", () => {
      LEVELS.forEach((level) => {
        expect(level).toHaveProperty("level");
        expect(level).toHaveProperty("name");
        expect(level).toHaveProperty("minXP");
        expect(level).toHaveProperty("maxXP");
        expect(level).toHaveProperty("icon");
        expect(level).toHaveProperty("color");
        expect(level).toHaveProperty("gradient");
      });
    });
  });

  describe("calculateUserLevel", () => {
    it("should return level 1 for 0 XP", () => {
      const result = calculateUserLevel(0);
      expect(result.currentLevel.level).toBe(1);
      expect(result.currentXP).toBe(0);
      expect(result.progressPercentage).toBe(0);
    });

    it("should return level 1 for 50 XP", () => {
      const result = calculateUserLevel(50);
      expect(result.currentLevel.level).toBe(1);
      expect(result.xpInCurrentLevel).toBe(50);
      expect(result.progressPercentage).toBe(50);
    });

    it("should return level 2 for exactly 100 XP", () => {
      const result = calculateUserLevel(100);
      expect(result.currentLevel.level).toBe(2);
      expect(result.xpInCurrentLevel).toBe(0);
    });

    it("should return level 5 for 1000 XP", () => {
      const result = calculateUserLevel(1000);
      expect(result.currentLevel.level).toBe(5);
      expect(result.currentLevel.name).toBe("Experiente");
    });

    it("should return level 10 for 5200 XP", () => {
      const result = calculateUserLevel(5200);
      expect(result.currentLevel.level).toBe(10);
      expect(result.nextLevel).toBeNull();
      expect(result.progressPercentage).toBe(100);
    });

    it("should return level 10 for very high XP", () => {
      const result = calculateUserLevel(999999);
      expect(result.currentLevel.level).toBe(10);
      expect(result.currentLevel.name).toBe("Lenda");
    });

    it("should calculate correct progress percentage mid-level", () => {
      // Level 3: minXP=250, Level 4: minXP=500 -> range=250
      const result = calculateUserLevel(375); // 125/250 = 50%
      expect(result.currentLevel.level).toBe(3);
      expect(result.progressPercentage).toBeCloseTo(50);
    });

    it("should have nextLevel for levels 1-9", () => {
      for (let xp = 0; xp < 5200; xp += 500) {
        const result = calculateUserLevel(xp);
        if (result.currentLevel.level < 10) {
          expect(result.nextLevel).not.toBeNull();
        }
      }
    });

    it("should handle negative XP gracefully", () => {
      const result = calculateUserLevel(-100);
      expect(result.currentLevel.level).toBe(1);
    });

    it("should handle boundary values for each level", () => {
      LEVELS.forEach((level) => {
        const result = calculateUserLevel(level.minXP);
        expect(result.currentLevel.level).toBe(level.level);
      });
    });
  });
});

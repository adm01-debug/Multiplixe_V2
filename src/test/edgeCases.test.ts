import { describe, it, expect } from "vitest";

describe("Data Edge Cases", () => {
  describe("Number formatting", () => {
    it("should format XP values correctly", () => {
      expect((1234).toLocaleString()).toMatch(/1[.,]234/);
      expect((0).toLocaleString()).toBe("0");
      expect((999999).toLocaleString()).toMatch(/999[.,]999/);
    });

    it("should handle percentage calculations safely", () => {
      // Division by zero
      const safeDivide = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);
      expect(safeDivide(50, 100)).toBe(50);
      expect(safeDivide(0, 0)).toBe(0);
      expect(safeDivide(100, 100)).toBe(100);
      expect(safeDivide(1, 3)).toBe(33);
    });
  });

  describe("Date handling", () => {
    it("should handle ISO date strings", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January = 0
    });

    it("should handle invalid dates", () => {
      const date = new Date("invalid");
      expect(isNaN(date.getTime())).toBe(true);
    });
  });

  describe("Array operations safety", () => {
    it("should handle empty arrays for reduce", () => {
      const arr: number[] = [];
      const sum = arr.reduce((a, b) => a + b, 0);
      expect(sum).toBe(0);
    });

    it("should handle empty arrays for sort", () => {
      const arr: number[] = [];
      expect(arr.sort()).toEqual([]);
    });

    it("should handle undefined in filter", () => {
      const arr = [1, undefined, 2, null, 3];
      expect(arr.filter(Boolean)).toEqual([1, 2, 3]);
    });

    it("should handle slice with out-of-bounds", () => {
      const arr = [1, 2, 3];
      expect(arr.slice(0, 100)).toEqual([1, 2, 3]);
      expect(arr.slice(5)).toEqual([]);
    });
  });

  describe("String operations safety", () => {
    it("should handle charAt on empty string", () => {
      expect("".charAt(0)).toBe("");
    });

    it("should handle toUpperCase on empty string", () => {
      expect("".toUpperCase()).toBe("");
    });

    it("should handle null/undefined coalescing for display names", () => {
      const name = null;
      expect(name ?? "Usuário").toBe("Usuário");
    });
  });
});

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const readFile = (filePath: string) =>
  fs.readFileSync(path.resolve(__dirname, "../../", filePath), "utf-8");

describe("Performance - Mouse Parallax Throttling", () => {
  const heroCode = readFile("src/components/landing/HeroSection.tsx");

  it("should use requestAnimationFrame for mouse tracking", () => {
    expect(heroCode).toContain("requestAnimationFrame");
  });

  it("should use passive event listener for mousemove", () => {
    expect(heroCode).toContain("passive: true");
  });

  it("should clean up event listener on unmount", () => {
    expect(heroCode).toContain("removeEventListener");
  });
});

describe("Performance - useEffect Cleanup", () => {
  const heroCode = readFile("src/components/landing/HeroSection.tsx");

  it("should clean up word rotation interval", () => {
    expect(heroCode).toContain("clearInterval");
  });

  it("should clean up timers properly (return function)", () => {
    const cleanupCount = (heroCode.match(/return \(\) =>/g) || []).length;
    expect(cleanupCount).toBeGreaterThanOrEqual(2);
  });
});

describe("Performance - Lazy Loading & Code Splitting", () => {
  const appCode = readFile("src/App.tsx");

  it("should use React.lazy for route-level code splitting", () => {
    expect(appCode).toContain("lazy(");
  });

  it("should have Suspense boundary for lazy routes", () => {
    expect(appCode).toContain("Suspense");
  });
});

describe("Performance - CountUp Animation", () => {
  const countUpCode = readFile("src/components/landing/hero/CountUp.tsx");

  it("should use requestAnimationFrame for smooth animation", () => {
    expect(countUpCode).toContain("requestAnimationFrame");
  });

  it("should use easing function for natural feel", () => {
    expect(countUpCode).toMatch(/easeOut|Math\.pow/);
  });

  it("should cleanup timeout on unmount", () => {
    expect(countUpCode).toContain("clearTimeout");
  });
});

describe("Performance - Image Optimization", () => {
  it("LazyImage component should exist", () => {
    const exists = fs.existsSync(
      path.resolve(__dirname, "../../src/components/LazyImage.tsx")
    );
    expect(exists).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const fileExists = (filePath: string) =>
  fs.existsSync(path.resolve(__dirname, "../../", filePath));

const readFile = (filePath: string) =>
  fs.readFileSync(path.resolve(__dirname, "../../", filePath), "utf-8");

describe("Component Architecture - Hero Refactoring", () => {
  it("HeroBackground module should exist", () => {
    expect(fileExists("src/components/landing/hero/HeroBackground.tsx")).toBe(true);
  });

  it("HeroFloatingElements module should exist", () => {
    expect(fileExists("src/components/landing/hero/HeroFloatingElements.tsx")).toBe(true);
  });

  it("HeroStats module should exist", () => {
    expect(fileExists("src/components/landing/hero/HeroStats.tsx")).toBe(true);
  });

  it("CountUp module should exist", () => {
    expect(fileExists("src/components/landing/hero/CountUp.tsx")).toBe(true);
  });

  it("HeroSection should import sub-modules", () => {
    const heroCode = readFile("src/components/landing/HeroSection.tsx");
    expect(heroCode).toContain("import HeroBackground");
    expect(heroCode).toContain("import HeroFloatingElements");
    expect(heroCode).toContain("import HeroStats");
    expect(heroCode).toContain("import HeroCard");
  });

  it("HeroSection should NOT contain inline HeroBackground code", () => {
    const heroCode = readFile("src/components/landing/HeroSection.tsx");
    // Should not define HeroBackground inline
    expect(heroCode).not.toContain("const HeroBackground =");
  });
});

describe("Component Architecture - Memoization", () => {
  it("HeroStats should be wrapped in React.memo", () => {
    const code = readFile("src/components/landing/hero/HeroStats.tsx");
    expect(code).toContain("memo(");
    expect(code).toContain('displayName = "HeroStats"');
  });

  it("CountUp should be wrapped in React.memo", () => {
    const code = readFile("src/components/landing/hero/CountUp.tsx");
    expect(code).toContain("memo(");
    expect(code).toContain('displayName = "CountUp"');
  });

  it("CourseCard should be wrapped in React.memo", () => {
    const code = readFile("src/components/catalog/CourseCard.tsx");
    expect(code).toContain("memo(");
  });

  it("LearningPathCard should be wrapped in React.memo", () => {
    const code = readFile("src/components/learning-paths/LearningPathCard.tsx");
    expect(code).toContain("memo(");
  });
});

describe("Component Architecture - Separation of Concerns", () => {
  it("HeroBackground should accept bgY and mousePosition props", () => {
    const code = readFile("src/components/landing/hero/HeroBackground.tsx");
    expect(code).toContain("bgY");
    expect(code).toContain("mousePosition");
    expect(code).toContain("gridOpacity");
  });

  it("HeroFloatingElements should accept floating motion values", () => {
    const code = readFile("src/components/landing/hero/HeroFloatingElements.tsx");
    expect(code).toContain("floatingY1");
    expect(code).toContain("floatingY2");
    expect(code).toContain("floatingY3");
  });

  it("HeroStats should be self-contained with its own data", () => {
    const code = readFile("src/components/landing/hero/HeroStats.tsx");
    expect(code).toContain("const stats =");
    expect(code).toContain("Cursos disponíveis");
  });
});

describe("Component Architecture - Edge Functions", () => {
  const edgeFunctions = [
    "supabase/functions/generate-certificate/index.ts",
    "supabase/functions/detect-new-device/index.ts",
    "supabase/functions/send-security-alert/index.ts",
    "supabase/functions/approve-password-reset/index.ts",
        "supabase/functions/admin-user-actions/index.ts",
    "supabase/functions/cleanup-security-logs/index.ts",
  ];

  edgeFunctions.forEach((fn) => {
    it(`${fn} should exist`, () => {
      expect(fileExists(fn)).toBe(true);
    });

    it(`${fn} should have CORS headers`, () => {
      const code = readFile(fn);
      expect(code).toContain("Access-Control-Allow-Origin");
      expect(code).toContain("Access-Control-Allow-Headers");
    });

    it(`${fn} should handle OPTIONS preflight`, () => {
      const code = readFile(fn);
      expect(code).toContain("OPTIONS");
    });

    it(`${fn} should use consistent Supabase SDK version`, () => {
      const code = readFile(fn);
      expect(code).toContain("@supabase/supabase-js@2");
    });
  });
});

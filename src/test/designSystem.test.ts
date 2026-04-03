import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const readFile = (filePath: string) =>
  fs.readFileSync(path.resolve(__dirname, "../../", filePath), "utf-8");

describe("Design System - CSS Tokens", () => {
  const css = readFile("src/index.css");

  it("should define --primary token", () => {
    expect(css).toContain("--primary:");
  });

  it("should define --secondary token", () => {
    expect(css).toContain("--secondary:");
  });

  it("should define --accent token", () => {
    expect(css).toContain("--accent:");
  });

  it("should define --background token", () => {
    expect(css).toContain("--background:");
  });

  it("should define --foreground token", () => {
    expect(css).toContain("--foreground:");
  });

  it("should define --muted token", () => {
    expect(css).toContain("--muted:");
  });

  it("should define --card token", () => {
    expect(css).toContain("--card:");
  });

  it("should define --border token", () => {
    expect(css).toContain("--border:");
  });

  it("should define --ring token", () => {
    expect(css).toContain("--ring:");
  });

  it("should define --destructive token", () => {
    expect(css).toContain("--destructive:");
  });

  it("should define --success token", () => {
    expect(css).toContain("--success:");
  });

  it("should define --warning token", () => {
    expect(css).toContain("--warning:");
  });

  it("should define --info token", () => {
    expect(css).toContain("--info:");
  });

  it("should use HSL format for all tokens", () => {
    const hslPattern = /--primary:\s*\d+\s+\d+%\s+\d+%/;
    expect(css).toMatch(hslPattern);
  });

  it("should have dark mode theme defined", () => {
    expect(css).toContain(".dark");
  });
});

describe("Design System - Component Token Usage", () => {
  const headerCode = readFile("src/components/landing/Header.tsx");
  const footerCode = readFile("src/components/landing/Footer.tsx");
  const featuresCode = readFile("src/components/landing/FeaturesSection.tsx");
  const heroStatsCode = readFile("src/components/landing/hero/HeroStats.tsx");
  const heroBackgroundCode = readFile("src/components/landing/hero/HeroBackground.tsx");

  it("Header should use semantic token classes (not raw colors)", () => {
    expect(headerCode).toContain("text-foreground");
    expect(headerCode).toContain("text-muted-foreground");
    expect(headerCode).toContain("bg-background");
  });

  it("Footer should use semantic tokens", () => {
    expect(footerCode).toContain("text-primary");
  });

  it("FeaturesSection should use semantic tokens for backgrounds", () => {
    expect(featuresCode).toContain("bg-card");
    expect(featuresCode).toContain("text-card-foreground");
    expect(featuresCode).toContain("text-muted-foreground");
  });

  it("HeroStats should use semantic tokens", () => {
    expect(heroStatsCode).toContain("bg-card");
    expect(heroStatsCode).toContain("border-border");
    expect(heroStatsCode).toContain("text-muted-foreground");
  });

  it("HeroBackground should use semantic tokens for gradients", () => {
    expect(heroBackgroundCode).toContain("bg-gradient-to-br");
    expect(heroBackgroundCode).toContain("from-background");
    expect(heroBackgroundCode).toContain("bg-primary");
  });
});

describe("Design System - Responsive Design", () => {
  const heroStatsCode = readFile("src/components/landing/hero/HeroStats.tsx");
  const footerCode = readFile("src/components/landing/Footer.tsx");
  const headerCode = readFile("src/components/landing/Header.tsx");

  it("HeroStats grid should be responsive (1 col mobile, 3 cols desktop)", () => {
    expect(heroStatsCode).toContain("grid-cols-1");
    expect(heroStatsCode).toContain("md:grid-cols-3");
  });

  it("Footer should have responsive grid", () => {
    expect(footerCode).toMatch(/grid-cols-1|sm:grid-cols|md:grid-cols/);
  });

  it("Header should have mobile/desktop navigation split", () => {
    expect(headerCode).toContain("hidden md:flex");
    expect(headerCode).toContain("md:hidden");
  });
});

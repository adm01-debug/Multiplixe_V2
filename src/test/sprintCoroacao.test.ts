import { describe, it, expect } from "vitest";
import { SHORTCUTS_LIST } from "@/hooks/useGlobalShortcuts";

describe("Sprint Coroação — sanidade final", () => {
  it("SHORTCUTS_LIST tem ao menos 10 atalhos documentados", () => {
    expect(SHORTCUTS_LIST.length).toBeGreaterThanOrEqual(10);
  });

  it("todo label é descritivo (>4 chars)", () => {
    SHORTCUTS_LIST.forEach((s) => expect(s.label.length).toBeGreaterThan(4));
  });

  it("metas de qualidade — locale storage key estável", async () => {
    const { setLocale } = await import("@/lib/i18n");
    setLocale("pt-BR");
    expect(localStorage.getItem("app.locale")).toBe("pt-BR");
  });

  it("metas de qualidade — toda navegação tem prefixo g", () => {
    const navShortcuts = SHORTCUTS_LIST.filter((s) => s.label.startsWith("Ir para"));
    navShortcuts.forEach((s) => expect(s.keys.startsWith("g ")).toBe(true));
  });
});

import { describe, it, expect } from "vitest";
import { SHORTCUTS_LIST } from "@/hooks/useGlobalShortcuts";

describe("Atalhos globais expandidos", () => {
  const keys = SHORTCUTS_LIST.map((s) => s.keys);

  it("inclui navegação principal (g d, g c, g t, g p, g v, g r)", () => {
    ["g d", "g c", "g t", "g p", "g v", "g r"].forEach((k) => {
      expect(keys).toContain(k);
    });
  });

  it("inclui atalho de novo comentário (n)", () => {
    expect(keys).toContain("n");
  });

  it("inclui atalho de ajuda (?)", () => {
    expect(keys).toContain("?");
  });

  it("todo atalho tem label não vazio", () => {
    SHORTCUTS_LIST.forEach((s) => {
      expect(s.label.length).toBeGreaterThan(0);
    });
  });

  it("não tem atalhos duplicados", () => {
    expect(new Set(keys).size).toBe(keys.length);
  });
});

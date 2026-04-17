import { describe, it, expect } from "vitest";
import { SHORTCUTS_LIST } from "@/hooks/useGlobalShortcuts";

describe("Sprint Perfeição — sanity checks", () => {
  it("SHORTCUTS_LIST exposes the expected navigation keys", () => {
    const keys = SHORTCUTS_LIST.map((s) => s.keys);
    expect(keys).toContain("g d");
    expect(keys).toContain("g c");
    expect(keys).toContain("g p");
    expect(keys).toContain("g v");
    expect(keys).toContain("g o");
    expect(keys).toContain("g a");
    expect(keys).toContain("?");
  });

  it("SHORTCUTS_LIST entries have label and keys", () => {
    for (const entry of SHORTCUTS_LIST) {
      expect(entry.keys.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("manifest shortcuts include the 5 main routes", async () => {
    const manifest = await import("../../public/manifest.json");
    const urls = (manifest.default.shortcuts ?? []).map((s: { url: string }) => s.url);
    expect(urls).toEqual(
      expect.arrayContaining(["/dashboard", "/catalogo", "/playbooks", "/onboarding", "/avaliacoes"])
    );
  });
});

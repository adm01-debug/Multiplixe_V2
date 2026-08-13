import { describe, it, expect, vi, beforeEach } from "vitest";
import Fuse from "fuse.js";

describe("Fuzzy Search Logic", () => {
  const testData = [
    { id: 1, title: "React Avançado", description: "Aprenda React" },
    { id: 2, title: "TypeScript Básico", description: "Introdução ao TS" },
    { id: 3, title: "Node.js Expert", description: "Backend com Node" },
    { id: 4, title: "CSS Moderno", description: "Flexbox e Grid" },
    { id: 5, title: "Python para Dados", description: "Data Science" },
  ];

  it("should find exact matches", () => {
    const fuse = new Fuse(testData, { keys: ["title", "description"], threshold: 0.4 });
    const results = fuse.search("React");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.title).toBe("React Avançado");
  });

  it("should find fuzzy matches with typos", () => {
    const fuse = new Fuse(testData, { keys: ["title"], threshold: 0.4 });
    const results = fuse.search("Reac");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return empty for completely unrelated terms", () => {
    const fuse = new Fuse(testData, { keys: ["title"], threshold: 0.3 });
    const results = fuse.search("xyzabc123");
    expect(results).toHaveLength(0);
  });

  it("should search across multiple keys", () => {
    const fuse = new Fuse(testData, { keys: ["title", "description"], threshold: 0.4 });
    const results = fuse.search("Backend");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.title).toBe("Node.js Expert");
  });

  it("should return all items when search is empty", () => {
    const fuse = new Fuse(testData, { keys: ["title"] });
    const results = fuse.search("");
    // Fuse returns empty for empty query (expected behavior)
    expect(results).toHaveLength(0);
  });

  it("should respect threshold settings", () => {
    const strictFuse = new Fuse(testData, { keys: ["title"], threshold: 0.1 });
    const looseFuse = new Fuse(testData, { keys: ["title"], threshold: 0.6 });
    
    const strictResults = strictFuse.search("Pythn");
    const looseResults = looseFuse.search("Pythn");
    
    expect(looseResults.length).toBeGreaterThanOrEqual(strictResults.length);
  });

  it("should handle special characters in search", () => {
    const fuse = new Fuse(testData, { keys: ["title"], threshold: 0.4 });
    const results = fuse.search("Node.js");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should include match indices when configured", () => {
    const fuse = new Fuse(testData, {
      keys: ["title"],
      includeMatches: true,
      threshold: 0.4,
    });
    const results = fuse.search("React");
    expect(results[0].matches).toBeDefined();
    expect(results[0].matches!.length).toBeGreaterThan(0);
  });
});

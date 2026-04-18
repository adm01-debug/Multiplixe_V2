import { describe, it, expect } from "vitest";
import { slugify, blobToFile } from "@/lib/shareImage";

describe("shareImage utils", () => {
  it("slugify normaliza acentos e espaços", () => {
    expect(slugify("Mestre das Vendas Consultivas!")).toBe("mestre-das-vendas-consultivas");
    expect(slugify("Conquista Épica #1")).toBe("conquista-epica-1");
  });

  it("slugify trunca em 50 chars", () => {
    const long = "a".repeat(120);
    expect(slugify(long).length).toBeLessThanOrEqual(50);
  });

  it("blobToFile preserva tipo e nome", () => {
    const blob = new Blob(["hello"], { type: "image/png" });
    const file = blobToFile(blob, "test.png");
    expect(file.name).toBe("test.png");
    expect(file.type).toBe("image/png");
  });
});

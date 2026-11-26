import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LazyImage from "@/components/LazyImage";
import { buildImageSrcSet } from "@/lib/imageSrcSet";

const unsplash = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800";

describe("buildImageSrcSet", () => {
  it("gera variantes de largura para CDN que aceita parametro de largura", () => {
    const srcSet = buildImageSrcSet(unsplash);
    expect(srcSet).toBeDefined();
    const entries = srcSet!.split(", ");
    expect(entries.map((entry) => entry.split(" ")[1])).toEqual(["320w", "480w", "640w"]);
    expect(entries[0]).toContain("w=320");
  });

  it("nao gera srcset quando a URL nao expoe parametro de largura", () => {
    expect(buildImageSrcSet("https://example.com/foto.jpg")).toBeUndefined();
    expect(buildImageSrcSet("/local.jpg")).toBeUndefined();
  });

  it("ignora entradas vazias e data URLs", () => {
    expect(buildImageSrcSet(undefined)).toBeUndefined();
    expect(buildImageSrcSet("data:image/png;base64,AAA")).toBeUndefined();
  });

  it("reconhece o parametro width de outros CDNs", () => {
    const srcSet = buildImageSrcSet("https://cdn.example.com/a.jpg?width=640");
    expect(srcSet).toContain("width=320");
    expect(srcSet!.split(", ")).toHaveLength(3);
  });
});

describe("LazyImage com srcset responsivo", () => {
  it("aplica srcSet e sizes derivados da largura", () => {
    render(<LazyImage src={unsplash} alt="Curso de vendas" width={640} height={400} eager />);
    const img = screen.getByAltText("Curso de vendas");
    expect(img.getAttribute("srcset")).toContain("w=640");
    expect(img).toHaveAttribute("sizes", "(min-width: 768px) 640px, 100vw");
  });

  it("respeita srcSet e sizes informados manualmente", () => {
    render(
      <LazyImage
        src={unsplash}
        alt="Curso manual"
        srcSet="/a-1x.jpg 1x, /a-2x.jpg 2x"
        sizes="50vw"
        eager
      />,
    );
    const img = screen.getByAltText("Curso manual");
    expect(img).toHaveAttribute("srcset", "/a-1x.jpg 1x, /a-2x.jpg 2x");
    expect(img).toHaveAttribute("sizes", "50vw");
  });

  it("nao cria srcset quando a URL nao suporta redimensionamento", () => {
    render(<LazyImage src="/foto.jpg" alt="Sem cdn" eager />);
    expect(screen.getByAltText("Sem cdn")).not.toHaveAttribute("srcset");
  });
});
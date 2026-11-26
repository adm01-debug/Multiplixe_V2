import { beforeEach, beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { PALETAS, PALETA_PADRAO, aplicarPaleta, normalizarPaleta, paletaPorId, aplicarPaletaSalva, CHAVE_PREFERENCIAS } from "@/lib/themePresets";
import ThemeCustomizer from "@/components/ui/ThemeCustomizer";

const sucesso = vi.fn();
vi.mock("sonner", () => ({ toast: { success: (...a: unknown[]) => sucesso(...a), error: vi.fn() } }));

vi.mock("@/hooks/useAuth", () => {
  const sessao = { user: { id: "user-1" }, loading: false, signOut: vi.fn() };
  return { useAuth: () => sessao, useOptionalAuth: () => sessao };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
    }),
  },
}));

const css = fs.readFileSync(path.join(process.cwd(), "src/index.css"), "utf8");
const RAIZ = document.documentElement;

function bloco(seletor: string): Record<string, string> {
  const marca = seletor + " {";
  const inicio = css.indexOf(marca);
  if (inicio < 0) throw new Error("bloco ausente em src/index.css: " + seletor);
  const corpo = css.slice(inicio + marca.length, css.indexOf("}", inicio));
  const vars: Record<string, string> = {};
  for (const linha of corpo.split(/\r?\n/)) {
    const m = linha.match(/^\s*--([a-z0-9-]+):\s*(.+);$/);
    if (m) vars[m[1]] = m[2].trim();
  }
  return vars;
}

const CAMPOS: [keyof (typeof PALETAS)[number]["claro"], string][] = [
  ["primary", "primary"],
  ["primaryHover", "primary-hover"],
  ["primaryForeground", "primary-foreground"],
  ["secondary", "secondary"],
  ["secondaryForeground", "secondary-foreground"],
  ["accent", "accent"],
  ["accentForeground", "accent-foreground"],
  ["ring", "ring"],
];

beforeEach(() => {
  localStorage.clear();
  RAIZ.removeAttribute("data-accent");
  sucesso.mockClear();
});

describe("catalogo de paletas", () => {
  it("tem as cinco paletas com ids unicos e a padrao em primeiro", () => {
    expect(PALETAS).toHaveLength(5);
    expect(new Set(PALETAS.map((p) => p.id)).size).toBe(5);
    expect(PALETAS[0].id).toBe(PALETA_PADRAO);
  });

  it("so aceita ids conhecidos e converte o id antigo da primeira versao", () => {
    expect(normalizarPaleta("ocean")).toBe("ocean");
    expect(normalizarPaleta("default")).toBe(PALETA_PADRAO);
    expect(normalizarPaleta("")).toBe(PALETA_PADRAO);
    expect(normalizarPaleta(null)).toBe(PALETA_PADRAO);
    expect(normalizarPaleta(undefined)).toBe(PALETA_PADRAO);
    expect(normalizarPaleta("inexistente")).toBe(PALETA_PADRAO);
    expect(normalizarPaleta("__proto__")).toBe(PALETA_PADRAO);
  });

  it("devolve a paleta padrao para id invalido", () => {
    expect(paletaPorId("floresta").id).toBe(PALETA_PADRAO);
    expect(paletaPorId("gold").id).toBe("gold");
  });

  it("escreve a paleta no html e devolve o id efetivo", () => {
    expect(aplicarPaleta("forest")).toBe("forest");
    expect(RAIZ.getAttribute("data-accent")).toBe("forest");
    expect(aplicarPaleta("nao-existe")).toBe(PALETA_PADRAO);
    expect(RAIZ.getAttribute("data-accent")).toBe(PALETA_PADRAO);
  });

  it("toda paleta tem texto, gradiente e os oito tokens nos dois modos", () => {
    for (const paleta of PALETAS) {
      expect(paleta.nome).toMatch(/^theme\./);
      expect(paleta.descricao).toMatch(/^theme\./);
      expect(paleta.gradiente).toMatch(/^from-\w+-500 to-\w+-500$/);
      for (const modo of [paleta.claro, paleta.escuro]) {
        for (const [campo] of CAMPOS) {
          expect(modo[campo], `${paleta.id}.${String(campo)}`).toMatch(/^\d+ \d+% \d+%$/);
        }
      }
    }
  });
});

describe("CSS das paletas", () => {
  it("a paleta padrao espelha :root e .dark", () => {
    const padrao = paletaPorId(PALETA_PADRAO);
    const claro = bloco(":root");
    const escuro = bloco(".dark");
    for (const [campo, variavel] of CAMPOS) {
      expect(padrao.claro[campo], `claro:--${variavel}`).toBe(claro[variavel]);
      expect(padrao.escuro[campo], `escuro:--${variavel}`).toBe(escuro[variavel]);
    }
  });

  it.each(PALETAS.filter((p) => p.id !== PALETA_PADRAO).map((p) => [p.id, p] as const))(
    "a paleta %s tem bloco no tema claro e no escuro",
    (id, paleta) => {
      const claro = bloco(`:root[data-accent="${id}"]`);
      const escuro = bloco(`.dark[data-accent="${id}"]`);
      for (const [campo, variavel] of CAMPOS) {
        expect(claro[variavel], `claro:--${variavel}`).toBe(paleta.claro[campo]);
        expect(escuro[variavel], `escuro:--${variavel}`).toBe(paleta.escuro[campo]);
      }
      expect(claro["sidebar-primary"]).toBe(paleta.claro.primary);
      expect(escuro["sidebar-primary"]).toBe(paleta.escuro.primary);
      expect(claro["gradient-primary"]).toContain(paleta.claro.primary);
      expect(escuro["gradient-primary"]).toContain(paleta.escuro.primary);
    }
  );
});

describe("ThemeCustomizer", () => {
  beforeAll(() => {
    for (const [nome, valor] of [
      ["hasPointerCapture", () => false],
      ["setPointerCapture", () => {}],
      ["releasePointerCapture", () => {}],
      ["scrollIntoView", () => {}],
    ] as const) {
      Object.defineProperty(HTMLElement.prototype, nome, { value: valor, configurable: true });
    }
  });

  const abrir = async () => {
    render(<ThemeCustomizer />);
    fireEvent.click(screen.getByRole("button", { name: "Personalizar cores" }));
    return screen.findByText("Roxo Neon");
  };

  it("lista as paletas ao abrir", async () => {
    await abrir();
    for (const nome of ["Roxo Neon", "Oceano", "Floresta", "Pôr do Sol", "Dourado"]) {
      expect(screen.getByText(nome)).toBeInTheDocument();
    }
  });

  it("aplica e persiste a paleta escolhida", async () => {
    await abrir();
    fireEvent.click(screen.getByText("Floresta"));
    await waitFor(() => expect(RAIZ.getAttribute("data-accent")).toBe("forest"));
    const salvo = JSON.parse(localStorage.getItem("user-preferences") || "{}");
    expect(salvo.accentColor).toBe("forest");
    expect(sucesso).toHaveBeenCalledWith("Paleta aplicada");
    expect(screen.getByText("Floresta").closest("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("nao reaplica a paleta ja ativa", async () => {
    await abrir();
    fireEvent.click(screen.getByText("Roxo Neon"));
    expect(sucesso).not.toHaveBeenCalled();
  });

  it("restaura a paleta padrao pelo botao de reset", async () => {
    localStorage.setItem("user-preferences", JSON.stringify({ accentColor: "sunset" }));
    RAIZ.setAttribute("data-accent", "sunset");
    await abrir();
    const reset = screen.getByRole("button", { name: /Voltar ao padrão/ });
    expect(reset).toBeEnabled();
    fireEvent.click(reset);
    await waitFor(() => expect(RAIZ.getAttribute("data-accent")).toBe(PALETA_PADRAO));
    expect(sucesso).toHaveBeenCalledWith("Paleta padrão restaurada");
  });
});

describe("boot da paleta salva", () => {
  afterEach(() => {
    localStorage.clear();
    RAIZ.removeAttribute("data-accent");
  });

  it("aplica a paleta salva antes do React montar", () => {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ accentColor: "gold" }));
    expect(aplicarPaletaSalva()).toBe("gold");
    expect(RAIZ.getAttribute("data-accent")).toBe("gold");
  });

  it("cai na paleta padrao quando nao ha nada salvo", () => {
    expect(aplicarPaletaSalva()).toBe(PALETA_PADRAO);
    expect(RAIZ.getAttribute("data-accent")).toBe(PALETA_PADRAO);
  });

  it("ignora preferencias ilegiveis ou de paleta inexistente", () => {
    localStorage.setItem(CHAVE_PREFERENCIAS, "{quebrado");
    expect(aplicarPaletaSalva()).toBe(PALETA_PADRAO);
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ accentColor: "rosa-choque" }));
    expect(aplicarPaletaSalva()).toBe(PALETA_PADRAO);
  });
});

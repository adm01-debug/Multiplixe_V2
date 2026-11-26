import { describe, it, expect } from "vitest";
import { PALETAS } from "@/lib/themePresets";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(process.cwd(), "src/index.css"), "utf8");

function block(selector: string): Record<string, string> {
  const match = css.match(new RegExp(selector.replace(".", "\\.") + "\\s*\\{([\\s\\S]*?)\\}"));
  if (!match) throw new Error(`bloco ${selector} nao encontrado em src/index.css`);
  const vars: Record<string, string> = {};
  const re = /--([a-z0-9-]+):\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(match[1]))) {
    if (/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(m[2].trim())) vars[m[1]] = m[2].trim();
  }
  return vars;
}

function hslToRgb(hsl: string): [number, number, number] {
  const [h, sRaw, lRaw] = hsl.split(/\s+/).map((p) => parseFloat(p.replace("%", "")));
  const s = sRaw / 100;
  const l = lRaw / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  return [rgb[0] + m, rgb[1] + m, rgb[2] + m];
}

function luminance(hsl: string): number {
  const [r, g, b] = hslToRgb(hsl).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const light = block(":root");
const dark = block(".dark");

function check(theme: Record<string, string>, name: string, fg: string, bg: string, min: number) {
  const a = theme[fg];
  const b = theme[bg];
  expect(a, `variavel --${fg} ausente`).toBeTruthy();
  expect(b, `variavel --${bg} ausente`).toBeTruthy();
  const ratio = contrast(a, b);
  expect(ratio, `${name}: --${fg} sobre --${bg} = ${ratio.toFixed(2)} (minimo ${min})`).toBeGreaterThanOrEqual(min);
}

/** Pares texto/fundo exigidos pelo WCAG 2.2 AA (1.4.3) e por componentes de UI (1.4.11). */
const TEXT: [string, string, number][] = [
  ["foreground", "background", 4.5],
  ["foreground", "card", 4.5],
  ["foreground", "surface", 4.5],
  ["foreground", "muted", 4.5],
  ["muted-foreground", "background", 4.5],
  ["muted-foreground", "card", 4.5],
  ["muted-foreground", "surface", 4.5],
  ["muted-foreground", "muted", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["primary-foreground", "primary-hover", 4.5],
  ["secondary-foreground", "secondary", 4.5],
  ["accent-foreground", "accent", 4.5],
  ["destructive-foreground", "destructive", 4.5],
  ["success-foreground", "success", 4.5],
  ["warning-foreground", "warning", 4.5],
  ["info-foreground", "info", 4.5],
  ["sidebar-primary-foreground", "sidebar-primary", 4.5],
  ["sidebar-accent-foreground", "sidebar-accent", 4.5],
  ["sidebar-foreground", "sidebar-background", 4.5],
];

/** Cores de estado e de marca usadas como texto (text-primary, text-destructive, text-warning...). */
const AS_TEXT: [string, string, number][] = [
  ["primary", "background", 4.5],
  ["primary", "card", 4.5],
  ["secondary", "background", 4.5],
  ["destructive", "card", 4.5],
  ["success", "card", 4.5],
  ["warning", "card", 4.5],
  ["info", "card", 4.5],
];

/** Bordas que identificam componentes e o anel de foco precisam de 3:1 (1.4.11). */
const UI: [string, string, number][] = [
  ["input", "background", 3],
  ["input", "card", 3],
  ["ring", "background", 3],
  ["ring", "card", 3],
];

describe.each([
  ["tema claro", light],
  ["tema escuro", dark],
])("%s atende contraste WCAG AA", (_name, theme) => {
  it("texto sobre fundo (4.5:1)", () => {
    for (const [fg, bg, min] of TEXT) check(theme, "texto", fg, bg, min);
  });

  it("cores de estado usadas como texto (4.5:1)", () => {
    for (const [fg, bg, min] of AS_TEXT) check(theme, "cor como texto", fg, bg, min);
  });

  it("bordas de componente e anel de foco (3:1)", () => {
    for (const [fg, bg, min] of UI) check(theme, "componente ui", fg, bg, min);
  });
});

/** Tokens da paleta no mesmo nome usado no CSS, para reaproveitar as checagens acima. */
function tokensDaPaleta(paleta: (typeof PALETAS)[number]["claro"]): Record<string, string> {
  return {
    primary: paleta.primary,
    "primary-hover": paleta.primaryHover,
    "primary-foreground": paleta.primaryForeground,
    secondary: paleta.secondary,
    "secondary-foreground": paleta.secondaryForeground,
    accent: paleta.accent,
    "accent-foreground": paleta.accentForeground,
    ring: paleta.ring,
    "sidebar-primary": paleta.primary,
    "sidebar-primary-foreground": paleta.primaryForeground,
  };
}

describe.each(PALETAS.map((p) => [p.id, p] as const))(
  "paleta %s mantem contraste WCAG AA",
  (nome, paleta) => {
    it("tema claro", () => {
      const tema = { ...light, ...tokensDaPaleta(paleta.claro) };
      for (const [fg, bg, min] of [...TEXT, ...AS_TEXT, ...UI]) check(tema, `paleta ${nome}`, fg, bg, min);
    });

    it("tema escuro", () => {
      const tema = { ...dark, ...tokensDaPaleta(paleta.escuro) };
      for (const [fg, bg, min] of [...TEXT, ...AS_TEXT, ...UI]) check(tema, `paleta ${nome}`, fg, bg, min);
    });
  }
);

/** Pontos de `--gradient-*` de um bloco de paleta, no formato hsl do proprio CSS. */
function pontosDoGradiente(seletorPaleta: string, variavel: string): string[] {
  const re = new RegExp(seletorPaleta.replace(/[[\]]/g, "\\$&") + "\\s*{([\\s\\S]*?)}");
  const alvo = css.match(re);
  expect(alvo, `${seletorPaleta} ausente em src/index.css`).toBeTruthy();
  const linha = alvo![1].match(new RegExp(variavel + ":\\s*([^;]+);"));
  expect(linha, `${variavel} ausente em ${seletorPaleta}`).toBeTruthy();
  return [...linha![1].matchAll(/hsl\((\d+) (\d+)% (\d+)%\)/g)].map((m) => `${m[1]} ${m[2]}% ${m[3]}%`);
}

const BRANCO = "0 0% 100%";

describe("gradientes das paletas com texto branco (.btn-gradient)", () => {
  it.each(["ocean", "forest", "sunset", "gold"])(
    "paleta %s: todo ponto do gradiente claro suporta texto branco (AA)",
    (paleta) => {
      for (const variavel of ["--gradient-primary", "--gradient-secondary"]) {
        const pontos = pontosDoGradiente(`:root[data-accent="${paleta}"]`, variavel);
        expect(pontos.length, `${paleta} ${variavel} sem pontos`).toBeGreaterThan(1);
        for (const ponto of pontos) {
          const ratio = contrast(BRANCO, ponto);
          expect(
            ratio,
            `${paleta} ${variavel} hsl(${ponto}) com texto branco = ${ratio.toFixed(2)} (minimo 4.5)`
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  );
});

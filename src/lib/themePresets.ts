import type { DictPath } from "@/lib/i18n";

/** Cores de uma paleta em um modo (claro ou escuro), no formato `H S% L%`. */
export interface TokensPaleta {
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  ring: string;
}

export interface PaletaTema {
  id: string;
  nome: DictPath;
  descricao: DictPath;
  /** Classes do preview (precisam existir literalmente para o Tailwind gerar). */
  gradiente: string;
  claro: TokensPaleta;
  escuro: TokensPaleta;
}

/**
 * Paleta original da plataforma. Nao tem bloco proprio em `src/index.css`:
 * os valores abaixo sao os mesmos de `:root` / `.dark`.
 */
export const PALETA_PADRAO = "violet";

export const PALETAS: PaletaTema[] = [
  {
    id: "violet",
    nome: "theme.presetViolet",
    descricao: "theme.presetVioletDesc",
    gradiente: "from-purple-500 to-pink-500",
    claro: {
      primary: "270 91% 60%",
      primaryHover: "270 91% 54%",
      primaryForeground: "0 0% 100%",
      secondary: "330 81% 47%",
      secondaryForeground: "0 0% 100%",
      accent: "180 100% 50%",
      accentForeground: "222 47% 11%",
      ring: "270 91% 65%",
    },
    escuro: {
      primary: "270 100% 70%",
      primaryHover: "270 100% 75%",
      primaryForeground: "250 30% 6%",
      secondary: "320 100% 65%",
      secondaryForeground: "250 30% 6%",
      accent: "180 100% 60%",
      accentForeground: "0 0% 5%",
      ring: "270 100% 70%",
    },
  },
  {
    id: "ocean",
    nome: "theme.presetOcean",
    descricao: "theme.presetOceanDesc",
    gradiente: "from-cyan-500 to-blue-500",
    claro: {
      primary: "200 91% 35%",
      primaryHover: "200 91% 29%",
      primaryForeground: "0 0% 100%",
      secondary: "180 82% 26%",
      secondaryForeground: "0 0% 100%",
      accent: "186 100% 36%",
      accentForeground: "222 47% 11%",
      ring: "200 91% 40%",
    },
    escuro: {
      primary: "200 100% 62%",
      primaryHover: "200 100% 68%",
      primaryForeground: "250 30% 6%",
      secondary: "180 100% 55%",
      secondaryForeground: "250 30% 6%",
      accent: "186 100% 60%",
      accentForeground: "0 0% 5%",
      ring: "200 100% 62%",
    },
  },
  {
    id: "forest",
    nome: "theme.presetForest",
    descricao: "theme.presetForestDesc",
    gradiente: "from-emerald-500 to-green-500",
    claro: {
      primary: "152 72% 28%",
      primaryHover: "152 72% 23%",
      primaryForeground: "0 0% 100%",
      secondary: "120 55% 30%",
      secondaryForeground: "0 0% 100%",
      accent: "140 70% 30%",
      accentForeground: "0 0% 100%",
      ring: "152 72% 34%",
    },
    escuro: {
      primary: "150 80% 55%",
      primaryHover: "150 80% 62%",
      primaryForeground: "160 40% 6%",
      secondary: "120 70% 55%",
      secondaryForeground: "160 40% 6%",
      accent: "140 85% 60%",
      accentForeground: "0 0% 5%",
      ring: "150 80% 55%",
    },
  },
  {
    id: "sunset",
    nome: "theme.presetSunset",
    descricao: "theme.presetSunsetDesc",
    gradiente: "from-orange-500 to-red-500",
    claro: {
      primary: "20 88% 40%",
      primaryHover: "20 88% 34%",
      primaryForeground: "0 0% 100%",
      secondary: "355 75% 38%",
      secondaryForeground: "0 0% 100%",
      accent: "35 92% 38%",
      accentForeground: "20 60% 8%",
      ring: "20 88% 42%",
    },
    escuro: {
      primary: "24 100% 60%",
      primaryHover: "24 100% 67%",
      primaryForeground: "20 60% 6%",
      secondary: "355 100% 65%",
      secondaryForeground: "20 60% 6%",
      accent: "38 100% 62%",
      accentForeground: "0 0% 5%",
      ring: "24 100% 60%",
    },
  },
  {
    id: "gold",
    nome: "theme.presetGold",
    descricao: "theme.presetGoldDesc",
    gradiente: "from-amber-500 to-yellow-500",
    claro: {
      primary: "38 92% 31%",
      primaryHover: "38 92% 25%",
      primaryForeground: "0 0% 100%",
      secondary: "28 80% 33%",
      secondaryForeground: "0 0% 100%",
      accent: "45 93% 38%",
      accentForeground: "40 60% 8%",
      ring: "38 92% 34%",
    },
    escuro: {
      primary: "45 100% 58%",
      primaryHover: "45 100% 65%",
      primaryForeground: "40 60% 6%",
      secondary: "30 100% 60%",
      secondaryForeground: "40 60% 6%",
      accent: "48 100% 62%",
      accentForeground: "0 0% 5%",
      ring: "45 100% 58%",
    },
  },
];

const IDS = new Set(PALETAS.map((p) => p.id));

/**
 * Aceita apenas ids conhecidos. `"default"` era o id gravado pela primeira
 * versao do personalizador (localStorage `theme-preset`).
 */
export function normalizarPaleta(id?: string | null): string {
  if (!id) return PALETA_PADRAO;
  const alvo = id === "default" ? PALETA_PADRAO : id;
  return IDS.has(alvo) ? alvo : PALETA_PADRAO;
}

/** Chave onde as preferencias do usuario ficam salvas no navegador. */
export const CHAVE_PREFERENCIAS = "user-preferences";

/** Aplica a paleta salva no navegador. Usada no boot, antes do React montar. */
export function aplicarPaletaSalva(): string {
  let salvo: unknown;
  try {
    const bruto = localStorage.getItem(CHAVE_PREFERENCIAS);
    if (bruto) salvo = (JSON.parse(bruto) as { accentColor?: unknown }).accentColor;
  } catch {
    // preferencias ilegiveis: cai na paleta padrao
  }
  return aplicarPaleta(typeof salvo === "string" ? salvo : null);
}
export function paletaPorId(id?: string | null): PaletaTema {
  const alvo = normalizarPaleta(id);
  return PALETAS.find((p) => p.id === alvo) ?? PALETAS[0];
}

/** Escreve a paleta no `<html>` (o CSS de `src/index.css` reage a `data-accent`). */
export function aplicarPaleta(id?: string | null): string {
  const alvo = normalizarPaleta(id);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-accent", alvo);
  }
  return alvo;
}
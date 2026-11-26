import { useEffect, useState } from "react";

export type Locale = "pt-BR" | "en" | "es";

const STORAGE_KEY = "app.locale";

const dict = {
  "pt-BR": {
    nav: {
      dashboard: "Dashboard",
      catalog: "Catálogo",
      paths: "Trilhas",
      flashcards: "Flashcards",
      playbooks: "Playbooks",
      videos: "Vídeos",
      ranking: "Ranking",
      profile: "Perfil",
      onboarding: "Onboarding",
      assessments: "Avaliações",
      logout: "Sair",
    },
    dashboard: {
      welcome: "Bem-vindo",
      keepGoing: "Continue de onde parou",
      recommendedForYou: "Recomendado para você",
    },
    common: {
      search: "Buscar",
      loading: "Carregando...",
      empty: "Nada por aqui ainda",
      save: "Salvar",
      cancel: "Cancelar",
      delete: "Excluir",
      confirm: "Confirmar",
      language: "Idioma",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      catalog: "Catalog",
      paths: "Paths",
      flashcards: "Flashcards",
      playbooks: "Playbooks",
      videos: "Videos",
      ranking: "Ranking",
      profile: "Profile",
      onboarding: "Onboarding",
      assessments: "Assessments",
      logout: "Sign out",
    },
    dashboard: {
      welcome: "Welcome",
      keepGoing: "Pick up where you left off",
      recommendedForYou: "Recommended for you",
    },
    common: {
      search: "Search",
      loading: "Loading...",
      empty: "Nothing here yet",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      confirm: "Confirm",
      language: "Language",
    },
  },
  es: {
    nav: {
      dashboard: "Panel",
      catalog: "Catálogo",
      paths: "Rutas",
      flashcards: "Tarjetas",
      playbooks: "Playbooks",
      videos: "Vídeos",
      ranking: "Ranking",
      profile: "Perfil",
      onboarding: "Onboarding",
      assessments: "Evaluaciones",
      logout: "Salir",
    },
    dashboard: {
      welcome: "Bienvenido",
      keepGoing: "Continúa donde lo dejaste",
      recommendedForYou: "Recomendado para ti",
    },
    common: {
      search: "Buscar",
      loading: "Cargando...",
      empty: "Nada por aquí todavía",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      confirm: "Confirmar",
      language: "Idioma",
    },
  },
} as const;

export type Dict = typeof dict["pt-BR"];
export type DictPath =
  | `nav.${keyof Dict["nav"]}`
  | `dashboard.${keyof Dict["dashboard"]}`
  | `common.${keyof Dict["common"]}`;

const listeners = new Set<(l: Locale) => void>();
let currentLocale: Locale = (typeof window !== "undefined"
  ? (localStorage.getItem(STORAGE_KEY) as Locale | null)
  : null) || "pt-BR";

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, locale);
  listeners.forEach((l) => l(locale));
}

function resolve(locale: Locale, path: DictPath): string {
  const [section, key] = path.split(".") as [keyof Dict, string];
  const sectionDict = dict[locale][section] as Record<string, string>;
  return sectionDict?.[key] ?? path;
}

export function t(path: DictPath, locale: Locale = currentLocale): string {
  return resolve(locale, path);
}

export function useT() {
  const [locale, setLocaleState] = useState<Locale>(currentLocale);
  useEffect(() => {
    const handler = (l: Locale) => setLocaleState(l);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);
  return {
    locale,
    setLocale,
    t: (path: DictPath) => resolve(locale, path),
  };
}

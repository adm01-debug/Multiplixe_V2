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
      store: "Loja",
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
    store: {
      powerups: "Power-ups",
      powerupLoadError: "Não foi possível carregar seus power-ups agora.",
      retry: "Tentar novamente",
      boostTitle: "Impulsionador de XP",
      boostActive: "Todo XP ganho agora já sai multiplicado.",
      boostInactive: "Compre um impulsionador na loja e ative aqui para acelerar seu XP.",
      boostBadge: "Ativo",
      powerupsLoading: "Carregando seus power-ups...",
      powerupsEmptyTitle: "Nenhum power-up na mochila",
      powerupsEmptyDescription: "Compre impulsionadores e blindagens na aba Loja. Eles ficam guardados aqui até serem usados.",
      durationLabel: "Duração",
      freezeAutomatic: "Cobre automaticamente o primeiro dia perdido da sua sequência.",
      activateNow: "Ativar agora",
      boostAlreadyActive: "Já existe um ativo",
      freezeNoActivation: "Não precisa ativar: é usada sozinha quando você perde um dia.",
      powerupActivateError: "Não foi possível ativar o power-up. Tente novamente.",
      freezeSaved: "Sua Blindagem de Sequência salvou a sequência: você manteve {n} dias.",
    },
    chapters: {
      title: "Capítulos",
      now: "Assistindo",
      jumpTo: "Ir para",
      adminTitle: "Capítulos do vídeo",
      adminEmpty: "Sem capítulos. Adicione para o aluno pular direto ao assunto.",
      add: "Adicionar capítulo",
      namePlaceholder: "Ex.: Introdução",
      startLabel: "Início (segundos)",
      remove: "Remover capítulo",
      afterEnd: "Há capítulo marcado depois do fim do vídeo. Confira o tempo de início.",
      duplicateStart: "Dois capítulos começam no mesmo segundo. Ajuste o início para não perder nenhum.",
    },
    theme: {
      title: "Aparência",
      subtitle: "Escolha a paleta de cores que combina com você.",
      customize: "Personalizar cores",
      applied: "Paleta aplicada",
      reset: "Voltar ao padrão",
      resetDone: "Paleta padrão restaurada",
      current: "Em uso",
      presetViolet: "Roxo Neon",
      presetVioletDesc: "Violeta com rosa e ciano: a identidade original.",
      presetOcean: "Oceano",
      presetOceanDesc: "Azul e ciano, mais calmo para ler por horas.",
      presetForest: "Floresta",
      presetForestDesc: "Verde esmeralda, menos fadiga visual.",
      presetSunset: "Pôr do Sol",
      presetSunsetDesc: "Laranja e vermelho, mais energia na tela.",
      presetGold: "Dourado",
      presetGoldDesc: "Âmbar com toque de conquista.",
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
      store: "Store",
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
    store: {
      powerups: "Power-ups",
      powerupLoadError: "We could not load your power-ups right now.",
      retry: "Try again",
      boostTitle: "XP Booster",
      boostActive: "Every XP you earn now is already multiplied.",
      boostInactive: "Buy a booster in the store and activate it here to speed up your XP.",
      boostBadge: "Active",
      powerupsLoading: "Loading your power-ups...",
      powerupsEmptyTitle: "No power-ups in your backpack",
      powerupsEmptyDescription: "Buy boosters and shields in the Store tab. They wait here until you use them.",
      durationLabel: "Duration",
      freezeAutomatic: "Automatically covers the first missed day of your streak.",
      activateNow: "Activate now",
      boostAlreadyActive: "One is already active",
      freezeNoActivation: "No activation needed: it is used on its own when you miss a day.",
      powerupActivateError: "We could not activate the power-up. Please try again.",
      freezeSaved: "Your Streak Shield saved your streak: you kept {n} days.",
    },
    chapters: {
      title: "Chapters",
      now: "Watching",
      jumpTo: "Go to",
      adminTitle: "Video chapters",
      adminEmpty: "No chapters yet. Add them so learners can jump straight to the topic.",
      add: "Add chapter",
      namePlaceholder: "e.g. Introduction",
      startLabel: "Start (seconds)",
      remove: "Remove chapter",
      afterEnd: "A chapter starts after the end of the video. Check the start time.",
      duplicateStart: "Two chapters start at the same second. Adjust the start time so none is lost.",
    },
    theme: {
      title: "Appearance",
      subtitle: "Pick the color palette that suits you.",
      customize: "Customize colors",
      applied: "Palette applied",
      reset: "Back to default",
      resetDone: "Default palette restored",
      current: "In use",
      presetViolet: "Neon Purple",
      presetVioletDesc: "Purple with pink and cyan: the original identity.",
      presetOcean: "Ocean",
      presetOceanDesc: "Blue and cyan, calmer for long reading.",
      presetForest: "Forest",
      presetForestDesc: "Emerald green, easier on the eyes.",
      presetSunset: "Sunset",
      presetSunsetDesc: "Orange and red, more energy on screen.",
      presetGold: "Gold",
      presetGoldDesc: "Amber with a sense of achievement.",
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
      store: "Tienda",
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
    store: {
      powerups: "Power-ups",
      powerupLoadError: "No fue posible cargar tus power-ups ahora.",
      retry: "Intentar de nuevo",
      boostTitle: "Impulsor de XP",
      boostActive: "Todo el XP que ganas ahora ya sale multiplicado.",
      boostInactive: "Compra un impulsor en la tienda y actívalo aquí para acelerar tu XP.",
      boostBadge: "Activo",
      powerupsLoading: "Cargando tus power-ups...",
      powerupsEmptyTitle: "Ningún power-up en la mochila",
      powerupsEmptyDescription: "Compra impulsores y escudos en la pestaña Tienda. Se guardan aquí hasta que los uses.",
      durationLabel: "Duración",
      freezeAutomatic: "Cubre automáticamente el primer día perdido de tu racha.",
      activateNow: "Activar ahora",
      boostAlreadyActive: "Ya hay uno activo",
      freezeNoActivation: "No necesita activación: se usa sola cuando pierdes un día.",
      powerupActivateError: "No fue posible activar el power-up. Inténtalo de nuevo.",
      freezeSaved: "Tu Escudo de Racha salvó la racha: mantuviste {n} días.",
    },
    chapters: {
      title: "Capítulos",
      now: "Viendo",
      jumpTo: "Ir a",
      adminTitle: "Capítulos del video",
      adminEmpty: "Sin capítulos. Agrégalos para que el alumno vaya directo al tema.",
      add: "Añadir capítulo",
      namePlaceholder: "Ej.: Introducción",
      startLabel: "Inicio (segundos)",
      remove: "Eliminar capítulo",
      afterEnd: "Hay un capítulo marcado después del final del video. Revisa el tiempo de inicio.",
      duplicateStart: "Dos capítulos empiezan en el mismo segundo. Ajusta el inicio para no perder ninguno.",
    },
    theme: {
      title: "Apariencia",
      subtitle: "Elige la paleta de colores que va contigo.",
      customize: "Personalizar colores",
      applied: "Paleta aplicada",
      reset: "Volver al estándar",
      resetDone: "Paleta estándar restaurada",
      current: "En uso",
      presetViolet: "Morado Neón",
      presetVioletDesc: "Morado con rosa y cian: la identidad original.",
      presetOcean: "Océano",
      presetOceanDesc: "Azul y cian, más tranquilo para leer por horas.",
      presetForest: "Bosque",
      presetForestDesc: "Verde esmeralda, menos fatiga visual.",
      presetSunset: "Atardecer",
      presetSunsetDesc: "Naranja y rojo, más energía en pantalla.",
      presetGold: "Dorado",
      presetGoldDesc: "Ámbar con toque de logro.",
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
  | `store.${keyof Dict["store"]}`
  | `chapters.${keyof Dict["chapters"]}`
  | `theme.${keyof Dict["theme"]}`
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

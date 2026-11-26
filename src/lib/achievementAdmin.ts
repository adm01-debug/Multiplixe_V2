import type { Database } from "@/integrations/supabase/types";

export type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"];
export type AchievementInsert = Database["public"]["Tables"]["achievements"]["Insert"];
export type AchievementUpdate = Database["public"]["Tables"]["achievements"]["Update"];

// Gradientes literais: o Tailwind so compila as classes que aparecem no codigo,
// por isso a lista vive aqui e nao pode ser montada dinamicamente.
export const ACHIEVEMENT_GRADIENTS = [
  "from-amber-500 to-orange-500",
  "from-amber-500 to-yellow-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-green-500 to-emerald-500",
  "from-indigo-500 to-purple-500",
  "from-orange-500 to-red-500",
  "from-orange-500 to-yellow-500",
  "from-purple-500 to-pink-500",
  "from-red-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-rose-500 to-red-500",
  "from-teal-500 to-cyan-500",
  "from-yellow-500 to-amber-500",
  "from-yellow-500 to-green-500",
] as const;

export const ACHIEVEMENT_ICONS = ["🏆", "🥇", "🎯", "🚀", "⭐", "🔥", "💡", "📚", "🎓", "⚡", "🏅", "🌟"] as const;

export const ACHIEVEMENT_CATEGORIES = [
  { value: "learning", label: "Aprendizado" },
  { value: "focus", label: "Foco" },
  { value: "level", label: "Nível" },
  { value: "xp", label: "XP" },
] as const;

// Espelha exatamente os tipos tratados por public.check_and_award_achievements(uuid).
export const ACHIEVEMENT_REQUIREMENTS = [
  { value: "lessons_completed", label: "Aulas concluídas" },
    { value: "courses_completed", label: "Cursos concluídos" },
    { value: "current_level", label: "Nível atual" },
  { value: "total_xp", label: "XP total" },
    { value: "pomodoro_sessions", label: "Sessões de foco concluídas" },
    { value: "streak_days", label: "Dias seguidos de estudo" },
    { value: "category_courses_completed", label: "Cursos concluídos na categoria" },
] as const;

export const SUPPORTED_REQUIREMENT_TYPES: string[] = ACHIEVEMENT_REQUIREMENTS.map((r) => r.value);

export interface AchievementDraft {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: string;
  requirement_type: string;
  requirement_value: string;
  requirement_category: string;
  gradient: string;
  is_secret: boolean;
}

export const emptyAchievementDraft = (): AchievementDraft => ({
  slug: "",
  name: "",
  description: "",
  icon: "🏆",
  category: "learning",
  xp_reward: "50",
  requirement_type: "lessons_completed",
  requirement_value: "1",
  requirement_category: "",
  gradient: ACHIEVEMENT_GRADIENTS[0],
  is_secret: false,
});

export const draftFromAchievement = (row: AchievementRow): AchievementDraft => ({
  slug: row.slug,
  name: row.name,
  description: row.description,
  icon: row.icon,
  category: row.category,
  xp_reward: String(row.xp_reward),
  requirement_type: row.requirement_type,
  requirement_value: String(row.requirement_value),
  requirement_category: row.requirement_category ?? "",
  gradient: row.gradient ?? ACHIEVEMENT_GRADIENTS[0],
  is_secret: row.is_secret ?? false,
});

export const slugifyAchievement = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

export const labelForRequirement = (type: string, value: number, category?: string | null): string => {
  const found = ACHIEVEMENT_REQUIREMENTS.find((r) => r.value === type);
  const base = found?.label ?? type;
  const suffix = type === "category_courses_completed" && category ? ` (${category})` : "";
  return `${base}${suffix} ≥ ${value}`;
};

const toInt = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
};

export const validateAchievementDraft = (draft: AchievementDraft): string[] => {
  const errors: string[] = [];
  if (draft.name.trim().length < 3) errors.push("Nome precisa de pelo menos 3 caracteres.");
  if (!/^[a-z0-9][a-z0-9-]{2,49}$/.test(draft.slug.trim())) {
    errors.push("Identificador (slug) deve ter de 3 a 50 caracteres, apenas letras minúsculas, números e hífen.");
  }
      if (draft.description.trim().length < 10) errors.push("Descrição precisa de pelo menos 10 caracteres.");
      if (!draft.icon.trim()) errors.push("Escolha um ícone.");

  const xp = toInt(draft.xp_reward);
  if (xp === null || xp > 10000) errors.push("XP deve ser um numero inteiro entre 0 e 10000.");

  const value = toInt(draft.requirement_value);
  if (value === null || value < 1 || value > 100000) errors.push("Valor do requisito deve ser um inteiro entre 1 e 100000.");

  if (!SUPPORTED_REQUIREMENT_TYPES.includes(draft.requirement_type)) {
    errors.push("Tipo de requisito sem concessão automática; escolha um dos tipos listados.");
  }
    if (draft.requirement_type === "category_courses_completed" && draft.requirement_category.trim().length < 2) {
      errors.push("Informe a categoria usada na contagem (ex.: Vendas).");
    }
  if (!ACHIEVEMENT_CATEGORIES.some((c) => c.value === draft.category)) errors.push("Categoria invalida.");
  if (!ACHIEVEMENT_GRADIENTS.some((g) => g === draft.gradient)) errors.push("Gradiente invalido.");

  return errors;
};

export const buildAchievementPayload = (
  draft: AchievementDraft,
): { payload: AchievementInsert | null; errors: string[] } => {
  const errors = validateAchievementDraft(draft);
  if (errors.length > 0) return { payload: null, errors };

  return {
    payload: {
      slug: draft.slug.trim(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      icon: draft.icon.trim(),
      category: draft.category,
      xp_reward: Number(draft.xp_reward),
      requirement_type: draft.requirement_type,
      requirement_value: Number(draft.requirement_value),
            requirement_category:
              draft.requirement_type === "category_courses_completed" ? draft.requirement_category.trim() : null,
      gradient: draft.gradient,
            is_secret: draft.is_secret,
    },
    errors,
  };
};
import type { Tables } from "@/integrations/supabase/types";

/**
 * Tipos de dominio do front, derivados do schema do Supabase (REF-004).
 *
 * Derivar do schema (em vez de escrever a mao) faz o TypeScript apontar a tela que quebraria
 * quando uma coluna muda de nome, de tipo ou de nulidade. Tipo que descreve so a tela (ex.: estado
 * visual de progresso) continua declarado no componente que o usa.
 */

export type Categoria = Pick<
  Tables<"categories">,
  "id" | "name" | "slug" | "description" | "icon" | "color"
>;

export type CursoMinimo = Pick<Tables<"courses">, "id" | "title" | "slug">;

/** Curso como as telas de listagem usam (sem created_at/updated_at/instructor_avatar). */
export type CursoResumo = Pick<
  Tables<"courses">,
  | "id"
  | "title"
  | "slug"
  | "description"
  | "thumbnail_url"
  | "video_preview_url"
  | "duration_minutes"
  | "level"
  | "instructor_name"
  | "total_lessons"
  | "is_featured"
  | "category_id"
>;

/** Curso com a categoria do join (`courses` + `categories`). */
export type CursoComCategoria = CursoResumo & { categories: Categoria | null };

export type Aula = Pick<
  Tables<"lessons">,
  | "id"
  | "title"
  | "description"
  | "video_url"
  | "duration_seconds"
  | "order_index"
  | "is_free"
  | "course_id"
>;

/** Aula com capitulos e transcricao — o que a tela de edicao e o player carregam juntos. */
export type AulaComConteudo = Aula & {
  chapters?: Tables<"lessons">["chapters"];
  transcript?: string | null;
};

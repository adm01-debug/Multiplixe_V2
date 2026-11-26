import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminAchievementsTab from "@/components/admin/AdminAchievementsTab";
import {
  buildAchievementPayload,
  emptyAchievementDraft,
  labelForRequirement,
  slugifyAchievement,
  validateAchievementDraft,
} from "@/lib/achievementAdmin";

interface DbCall {
  op: "insert" | "update" | "delete";
  table: string;
  payload?: unknown;
  patch?: unknown;
  column?: string;
  value?: string;
}

interface Builder {
  select: () => Builder;
  order: () => Promise<{ data: unknown; error: unknown }>;
  then: (resolve: (value: unknown) => unknown) => unknown;
  insert: (payload: unknown) => Promise<{ data: null; error: unknown }>;
  update: (patch: unknown) => { eq: (column: string, value: string) => Promise<{ data: null; error: unknown }> };
  delete: () => { eq: (column: string, value: string) => Promise<{ data: null; error: unknown }> };
}

const { calls, toastSuccess, toastError, state } = vi.hoisted(() => ({
  calls: [] as DbCall[],
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  state: {
    rows: [] as unknown[],
    unlocks: [] as unknown[],
    insertError: null as null | { code?: string; message?: string },
    updateError: null as null | { code?: string; message?: string },
  },
}));

vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: toastError } }));

vi.mock("@/integrations/supabase/client", () => {
  const make = (table: string) => {
    const result = () =>
      table === "achievements" ? { data: state.rows, error: null } : { data: state.unlocks, error: null };
    const builder = {} as Builder;
    builder.select = () => builder;
    builder.order = async () => result();
    builder.then = (resolve: (value: unknown) => unknown) => resolve(result());
    builder.insert = async (payload: unknown) => {
      calls.push({ op: "insert", table, payload });
      return { data: null, error: state.insertError };
    };
    builder.update = (patch: unknown) => ({
      eq: async (column: string, value: string) => {
        calls.push({ op: "update", table, patch, column, value });
        return { data: null, error: state.updateError };
      },
    });
    builder.delete = () => ({
      eq: async (column: string, value: string) => {
        calls.push({ op: "delete", table, column, value });
        return { data: null, error: null };
      },
    });
    return builder;
  };
  return { supabase: { from: (table: string) => make(table) } };
});

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "ach-1",
  slug: "primeira-aula",
  name: "Primeira Aula",
  description: "Conclua sua primeira aula na plataforma",
  icon: "🏆",
  category: "learning",
  xp_reward: 50,
  requirement_type: "lessons_completed",
  requirement_value: 1,
  gradient: "from-amber-500 to-orange-500",
  created_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  calls.length = 0;
  state.rows = [row(), row({ id: "ach-2", slug: "dez-aulas", name: "Dez Aulas", requirement_value: 10, xp_reward: 100 })];
  state.unlocks = [{ achievement_id: "ach-1" }, { achievement_id: "ach-1" }, { achievement_id: "ach-2" }];
  state.insertError = null;
  state.updateError = null;
  toastSuccess.mockClear();
  toastError.mockClear();
});

describe("achievementAdmin helpers", () => {
  it("gera slug estável a partir do nome", () => {
    expect(slugifyAchievement("Mestre das Vendas Ágeis!")).toBe("mestre-das-vendas-ageis");
    expect(slugifyAchievement("   ")).toBe("");
    expect(slugifyAchievement("a".repeat(80))).toHaveLength(50);
  });

  it("descreve o requisito com rótulo legível", () => {
    expect(labelForRequirement("lessons_completed", 5)).toBe("Aulas concluídas ≥ 5");
    expect(labelForRequirement("total_xp", 500)).toBe("XP total ≥ 500");
    expect(labelForRequirement("pomodoro_sessions", 7)).toBe("pomodoro_sessions ≥ 7");
  });

  it("rejeita rascunho incompleto", () => {
    const errors = validateAchievementDraft({ ...emptyAchievementDraft(), name: "ab", slug: "A", description: "curta" });
    expect(errors).toContain("Nome precisa de pelo menos 3 caracteres.");
    expect(errors).toContain("Descrição precisa de pelo menos 10 caracteres.");
    expect(errors.some((e) => e.includes("minúsculas"))).toBe(true);
  });

  it("rejeita tipo de requisito sem concessão automática", () => {
    const errors = validateAchievementDraft({
      ...emptyAchievementDraft(),
      name: "Sessões de foco",
      slug: "sessoes-de-foco",
      description: "Complete dez sessões de pomodoro",
      requirement_type: "pomodoro_sessions",
      requirement_value: "10",
    });
    expect(errors).toEqual(["Tipo de requisito sem concessão automática; escolha um dos tipos listados."]);
  });

  it("monta payload com números convertidos e campos aparados", () => {
    const { payload, errors } = buildAchievementPayload({
      ...emptyAchievementDraft(),
      name: "  Mestre XP  ",
      slug: " mestre-xp ",
      description: "  Acumule mil pontos de experiência  ",
      xp_reward: "250",
      requirement_type: "total_xp",
      requirement_value: "1000",
    });
    expect(errors).toEqual([]);
    expect(payload).toEqual({
      slug: "mestre-xp",
      name: "Mestre XP",
      description: "Acumule mil pontos de experiência",
      icon: "🏆",
      category: "learning",
      xp_reward: 250,
      requirement_type: "total_xp",
      requirement_value: 1000,
      gradient: "from-amber-500 to-orange-500",
    });
  });

  it("não monta payload quando há erro", () => {
    const { payload, errors } = buildAchievementPayload({ ...emptyAchievementDraft(), xp_reward: "abc" });
    expect(payload).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("AdminAchievementsTab", () => {
  it("lista conquistas com contagem de desbloqueios", async () => {
    render(<AdminAchievementsTab />);

    expect(await screen.findByText("Primeira Aula")).toBeInTheDocument();
    expect(screen.getByText("Dez Aulas")).toBeInTheDocument();
    expect(screen.getByText("Aulas concluídas ≥ 1")).toBeInTheDocument();
    expect(screen.getByText("50 XP")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("cria conquista com payload normalizado", async () => {
    render(<AdminAchievementsTab />);
    await screen.findByText("Primeira Aula");

    fireEvent.click(screen.getByRole("button", { name: /Nova conquista/i }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Mestre dos Testes" } });
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Conclua todas as aulas de teste" },
    });
    fireEvent.change(screen.getByLabelText("XP da recompensa"), { target: { value: "75" } });
    fireEvent.change(screen.getByLabelText("Valor do requisito"), { target: { value: "3" } });

    fireEvent.click(screen.getByRole("button", { name: "Criar conquista" }));

    await waitFor(() => expect(calls.filter((c) => c.op === "insert")).toHaveLength(1));
    const insert = calls.find((c) => c.op === "insert");
    expect(insert.table).toBe("achievements");
    expect(insert.payload).toMatchObject({
      slug: "mestre-dos-testes",
      name: "Mestre dos Testes",
      description: "Conclua todas as aulas de teste",
      xp_reward: 75,
      requirement_type: "lessons_completed",
      requirement_value: 3,
    });
    expect(toastSuccess).toHaveBeenCalledWith("Conquista criada");
  });

  it("mostra erro de slug duplicado", async () => {
    state.insertError = { code: "23505", message: "duplicate key value" };
    render(<AdminAchievementsTab />);
    await screen.findByText("Primeira Aula");

    fireEvent.click(screen.getByRole("button", { name: /Nova conquista/i }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Conquista Repetida" } });
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Descrição suficientemente longa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar conquista" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe uma conquista com esse identificador (slug).",
    );
    expect(toastError).toHaveBeenCalledWith("Identificador de conquista já usado");
  });

  it("edita conquista existente", async () => {
    render(<AdminAchievementsTab />);
    await screen.findByText("Primeira Aula");

    fireEvent.click(screen.getByRole("button", { name: "Editar Primeira Aula" }));
    fireEvent.change(screen.getByLabelText("XP da recompensa"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(calls.filter((c) => c.op === "update")).toHaveLength(1));
    const update = calls.find((c) => c.op === "update");
    expect(update.column).toBe("id");
    expect(update.value).toBe("ach-1");
    expect(update.patch).toMatchObject({ xp_reward: 90, slug: "primeira-aula" });
    expect(toastSuccess).toHaveBeenCalledWith("Conquista atualizada");
  });

  it("exclui conquista após confirmar, avisando quantos alunos desbloquearam", async () => {
    render(<AdminAchievementsTab />);
    await screen.findByText("Primeira Aula");

    fireEvent.click(screen.getByRole("button", { name: "Excluir Primeira Aula" }));
    expect(await screen.findByText(/2 aluno\(s\) já desbloquearam esta conquista/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(calls.filter((c) => c.op === "delete")).toHaveLength(1));
    const remove = calls.find((c) => c.op === "delete");
    expect(remove.table).toBe("achievements");
    expect(remove.column).toBe("id");
    expect(remove.value).toBe("ach-1");
    expect(toastSuccess).toHaveBeenCalledWith("Conquista excluída");
  });
});
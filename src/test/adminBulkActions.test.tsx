import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminCoursesTab, { type AdminCourse } from "@/components/admin/AdminCoursesTab";

const { calls, toastSuccess, toastError } = vi.hoisted(() => ({
  calls: [] as unknown[],
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: toastError } }));

vi.mock("@/integrations/supabase/client", () => {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.order = async () => ({ data: [{ id: "cat-1", name: "Vendas" }], error: null });
  builder.update = (patch: unknown) => ({
    in: async (column: string, ids: string[]) => {
      calls.push({ op: "update", patch, column, ids });
      return { data: null, error: null };
    },
  });
  builder.delete = () => ({
    in: async (column: string, ids: string[]) => {
      calls.push({ op: "delete", column, ids });
      return { data: null, error: null };
    },
  });
  return { supabase: { from: () => builder } };
});

const courses: AdminCourse[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Tecnicas de Vendas",
    slug: "tecnicas-de-vendas",
    description: "Curso de vendas",
    is_published: false,
    is_featured: false,
    level: "iniciante",
    total_lessons: 5,
    duration_minutes: 60,
    created_at: "2026-01-01T00:00:00.000Z",
    instructor_name: "Ana",
    category_id: null,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    title: "Negociacao Avancada",
    slug: "negociacao-avancada",
    description: "Curso de negociacao",
    is_published: true,
    is_featured: false,
    level: "avancado",
    total_lessons: 8,
    duration_minutes: 120,
    created_at: "2026-01-02T00:00:00.000Z",
    instructor_name: "Bruno",
    category_id: null,
  },
];

const renderTab = () => {
  const setCourses = vi.fn();
  render(
    <MemoryRouter>
      <AdminCoursesTab courses={courses} setCourses={setCourses} loadingData={false} onRefresh={() => undefined} />
    </MemoryRouter>,
  );
  return { setCourses };
};

describe("AdminCoursesTab - acoes em massa", () => {
  beforeEach(() => {
    calls.length = 0;
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it("seleciona todos os cursos filtrados e publica em massa", async () => {
    renderTab();
    fireEvent.click(screen.getByLabelText("Selecionar todos os cursos"));
    expect(screen.getByText("2 selecionado(s)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toEqual({
      op: "update",
      patch: { is_published: true },
      column: "id",
      ids: ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"],
    });
    expect(toastSuccess).toHaveBeenCalledWith("Cursos publicados");
    await waitFor(() => expect(screen.queryByText("2 selecionado(s)")).not.toBeInTheDocument());
  });

  it("exclui em massa somente depois de confirmar no dialogo", async () => {
    renderTab();
    fireEvent.click(screen.getByLabelText("Selecionar Tecnicas de Vendas"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir cursos selecionados" }));

    expect(calls).toHaveLength(0);
    fireEvent.click(await screen.findByRole("button", { name: "Excluir 1" }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toEqual({
      op: "delete",
      column: "id",
      ids: ["11111111-1111-1111-1111-111111111111"],
    });
  });

  it("limpa a selecao sem tocar no banco", () => {
    renderTab();
    fireEvent.click(screen.getByLabelText("Selecionar Negociacao Avancada"));
    expect(screen.getByText("1 selecionado(s)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /limpar selecao/i }));

    expect(screen.queryByText("1 selecionado(s)")).not.toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });
});
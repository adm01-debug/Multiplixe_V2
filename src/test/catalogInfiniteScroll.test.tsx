import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Catalog from "@/pages/Catalog";

const TOTAL = 25;

const { courses } = vi.hoisted(() => {
  const total = 25;
  return {
    courses: Array.from({ length: total }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return {
        id: String(i + 1),
        title: `Curso ${n}`,
        slug: `curso-${n}`,
        description: `Descricao ${n}`,
        thumbnail_url: null,
        duration_minutes: 60,
        level: "Iniciante",
        instructor_name: "Ana",
        total_lessons: 5,
        is_featured: false,
        category_id: "c1",
        categories: { id: "c1", name: "Cat", slug: "cat", description: null, icon: null, color: null },
      };
    }),
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "ana@exemplo.com", user_metadata: { full_name: "Ana" } },
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/hooks/useCachedQuery", () => ({
  useCourses: () => ({ data: courses, isLoading: false, isStale: false, isFetching: false, refetch: vi.fn() }),
  useCategories: () => ({ data: [], isLoading: false, isStale: false, isFetching: false, refetch: vi.fn() }),
}));

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({ isFavorite: () => false, toggleFavorite: vi.fn(), isTogglingFavorite: false }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderCatalog = (initialEntries: string[] = ["/"]) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        <TooltipProvider>
          <Catalog />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const loadMoreButton = () => screen.queryByRole("button", { name: "Carregar mais cursos" });

describe("paginacao do catalogo (PERF-003)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("limita a lista a 12 cursos e informa quanto ja foi exibido", () => {
    localStorage.setItem("catalog-view", "list");
    renderCatalog();

    expect(screen.getAllByRole("listitem")).toHaveLength(12);
    expect(screen.getByText(`Mostrando 12 de ${TOTAL} cursos`)).toBeInTheDocument();
    expect(loadMoreButton()).toBeInTheDocument();
  });

  it("carrega a proxima pagina e esconde o botao ao chegar no fim", async () => {
    localStorage.setItem("catalog-view", "list");
    renderCatalog();

    fireEvent.click(loadMoreButton()!);

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(24));
    expect(screen.getByText(`Mostrando 24 de ${TOTAL} cursos`)).toBeInTheDocument();

    fireEvent.click(loadMoreButton()!);

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(TOTAL));
    expect(loadMoreButton()).not.toBeInTheDocument();
  });

  it("nao pagina a grade virtualizada (todos os cursos ficam disponiveis)", () => {
    renderCatalog();

    expect(screen.queryByRole("list", { name: "Lista de cursos" })).not.toBeInTheDocument();
    expect(loadMoreButton()).not.toBeInTheDocument();
  });

  it("continua filtrando a lista paginada pela busca", async () => {
    localStorage.setItem("catalog-view", "list");
    renderCatalog();

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar cursos, instrutores..." }), { target: { value: "Curso 25" } });

    await waitFor(() => expect(screen.queryByText(`Mostrando 12 de ${TOTAL} cursos`)).not.toBeInTheDocument());
    const items = screen.getAllByRole("listitem");
    expect(items.some((el) => el.textContent?.includes("Curso 25"))).toBe(true);
    expect(items.length).toBeLessThan(12);
    expect(loadMoreButton()).not.toBeInTheDocument();
  });

      it("inicia a busca pelo parametro q da URL (atalho da pagina 404)", async () => {
        localStorage.setItem("catalog-view", "list");
        renderCatalog(["/catalogo?q=Curso%2025"]);

        await waitFor(() => {
          const items = screen.getAllByRole("listitem");
          expect(items).toHaveLength(1);
          expect(items[0].textContent).toContain("Curso 25");
        });
        expect(loadMoreButton()).not.toBeInTheDocument();
      });
});
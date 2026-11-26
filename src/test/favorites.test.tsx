import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import FavoritesSection from "@/components/favorites/FavoritesSection";
import FavoriteButton from "@/components/favorites/FavoriteButton";

const { courseRows, state, toggleFavorite } = vi.hoisted(() => {
  const rows = [1, 2, 3].map((n) => ({
    id: `c${n}`,
    slug: `curso-${n}`,
    title: `Curso ${n}`,
    description: `Descricao ${n}`,
    thumbnail_url: null,
    duration_minutes: 60,
    level: "Iniciante",
    instructor_name: "Ana",
    total_lessons: 5,
    is_published: true,
    categories: { name: "Vendas", color: null },
  }));

  return {
    courseRows: rows,
    state: { favorites: [] as Array<{ course_id: string }> },
    toggleFavorite: vi.fn(),
  };
});

const { mockUser } = vi.hoisted(() => ({ mockUser: { id: "u1", email: "ana@exemplo.com" } }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser, loading: false, signOut: vi.fn() }),
}));

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({
    favorites: state.favorites,
    isLoading: false,
    isFavorite: (courseId: string) => state.favorites.some((favorite) => favorite.course_id === courseId),
    toggleFavorite,
    isTogglingFavorite: false,
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: () => ({
          eq: () => Promise.resolve({ data: courseRows, error: null }),
        }),
      }),
    }),
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderSection = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <TooltipProvider>
          <FavoritesSection />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("favoritos (FUNC-002)", () => {
  beforeEach(() => {
    state.favorites = [];
    toggleFavorite.mockClear();
  });

  it("lista apenas os cursos favoritados, na ordem dos favoritos", async () => {
    state.favorites = [{ course_id: "c2" }, { course_id: "c1" }];
    renderSection();

    await screen.findByText("Curso 2");

    expect(screen.getByText("Curso 1")).toBeInTheDocument();
    expect(screen.queryByText("Curso 3")).not.toBeInTheDocument();
    expect(screen.getByText("2 cursos salvos para assistir depois")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remover dos favoritos" })).toHaveLength(2);
  });

  it("mostra o estado vazio com atalho para o catalogo quando nao ha favoritos", async () => {
    renderSection();

    expect(await screen.findByText("Sem favoritos ainda")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explorar cursos" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover dos favoritos" })).not.toBeInTheDocument();
  });

  it("alterna o favorito sem navegar para o curso", async () => {
    state.favorites = [{ course_id: "c1" }];
    render(
      <MemoryRouter>
        <a href="/curso/curso-1">
          <FavoriteButton courseId="c1" size="sm" />
        </a>
      </MemoryRouter>,
    );

    const button = screen.getByRole("button", { name: "Remover dos favoritos" });
    expect(button).toHaveAttribute("aria-pressed", "true");

    const notPrevented = fireEvent.click(button);

    expect(notPrevented).toBe(false);
    await waitFor(() => expect(toggleFavorite).toHaveBeenCalledWith("c1"));
  });
});
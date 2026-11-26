import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Catalog from "@/pages/Catalog";

const { courses } = vi.hoisted(() => ({
  courses: [
    {
      id: "1",
      title: "Curso Alfa",
      slug: "curso-alfa",
      description: "Descricao Alfa",
      thumbnail_url: null,
      video_preview_url: "https://cdn.exemplo.com/alfa.mp4",
      duration_minutes: 60,
      level: "Iniciante",
      instructor_name: "Ana",
      total_lessons: 5,
      is_featured: false,
      category_id: "c1",
      categories: { id: "c1", name: "Cat", slug: "cat", description: null, icon: null, color: null },
    },
    {
      id: "2",
      title: "Curso Beta",
      slug: "curso-beta",
      description: "Descricao Beta",
      thumbnail_url: null,
      video_preview_url: null,
      duration_minutes: 90,
      level: "Intermediario",
      instructor_name: "Bruno",
      total_lessons: 8,
      is_featured: true,
      category_id: "c1",
      categories: { id: "c1", name: "Cat", slug: "cat", description: null, icon: null, color: null },
    },
  ],
}));

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

const renderCatalog = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <TooltipProvider>
          <Catalog />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const listView = () => screen.queryByRole("list", { name: "Lista de cursos" });

describe("alternancia grade/lista do catalogo (UI-008)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("inicia em grade e expoe os botoes com estado acessivel", () => {
    renderCatalog();

    expect(screen.getByRole("button", { name: "Visualização em grade" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Visualização em lista" })).toHaveAttribute("aria-pressed", "false");
    expect(listView()).not.toBeInTheDocument();
  });

  it("troca para lista e persiste a preferencia em localStorage", () => {
    renderCatalog();

    fireEvent.click(screen.getByRole("button", { name: "Visualização em lista" }));

    expect(listView()).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Visualização em lista" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("catalog-view")).toBe("list");
  });

  it("retoma a preferencia salva ao abrir o catalogo", () => {
    localStorage.setItem("catalog-view", "list");
    renderCatalog();

    expect(listView()).toBeInTheDocument();
  });

  it("volta para grade e persiste a escolha", () => {
    localStorage.setItem("catalog-view", "list");
    renderCatalog();

    fireEvent.click(screen.getByRole("button", { name: "Visualização em grade" }));

    expect(listView()).not.toBeInTheDocument();
    expect(localStorage.getItem("catalog-view")).toBe("grid");
  });
});

describe("preview em video no hover do card (UI-009)", () => {
  const matchMediaOriginal = window.matchMedia;

  const cardDe = (titulo: string) => {
    const link = screen.getByLabelText(`Curso: ${titulo}`);
    return link.firstElementChild as HTMLElement;
  };

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = matchMediaOriginal;
  });

  it("monta o video do preview quando o mouse para no card", () => {
    vi.useFakeTimers();
    renderCatalog();

    fireEvent.mouseEnter(cardDe("Curso Alfa"));
    expect(document.querySelector("video")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", "https://cdn.exemplo.com/alfa.mp4");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).toHaveAttribute("aria-hidden", "true");
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute("loop");
  });

  it("nao monta video quando o curso nao tem preview", () => {
    vi.useFakeTimers();
    renderCatalog();

    fireEvent.mouseEnter(cardDe("Curso Beta"));
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(document.querySelector("video")).toBeNull();
  });

  it("nao monta video com prefers-reduced-motion", () => {
    vi.useFakeTimers();
    window.matchMedia = ((query: string) => ({
      ...matchMediaOriginal(query),
      matches: query.includes("reduce"),
    })) as typeof window.matchMedia;
    renderCatalog();

    fireEvent.mouseEnter(cardDe("Curso Alfa"));
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(document.querySelector("video")).toBeNull();
  });

  it("desmonta o video quando o mouse sai do card", () => {
    vi.useFakeTimers();
    renderCatalog();
    const card = cardDe("Curso Alfa");

    fireEvent.mouseEnter(card);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(document.querySelector("video")).not.toBeNull();

    fireEvent.mouseLeave(card);
    expect(document.querySelector("video")).toBeNull();
  });
});

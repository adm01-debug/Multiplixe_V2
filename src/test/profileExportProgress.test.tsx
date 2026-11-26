import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Profile from "@/pages/Profile";

const { docSave, invokeMock, tables, authValue, xpValue, achievementsValue, certificatesValue } = vi.hoisted(() => {
  const tables: Record<string, unknown[]> = {
    profiles: [{ created_at: "2025-01-15T00:00:00.000Z", avatar_url: null }],
    user_course_progress: [{ progress_percentage: 100, courses: { duration_minutes: 120 } }],
    user_achievements: [{ id: "a1" }],
    user_lesson_progress: [{ is_completed: true, watched_seconds: 600 }],
    user_streaks: [],
  };
  return {
    docSave: vi.fn(),
    invokeMock: vi.fn(),
    tables,
    authValue: {
      user: {
        id: "u1",
        email: "ana@exemplo.com",
        created_at: "2025-01-15T00:00:00.000Z",
        user_metadata: { full_name: "Ana Souza" },
      },
      loading: false,
      signOut: async () => undefined,
    },
    xpValue: {
      userXP: { xp_from_lessons: 10, xp_from_courses: 20, xp_from_achievements: 5, xp_from_streaks: 2 },
      totalXP: 37,
      loading: false,
    },
    achievementsValue: { achievements: [], isUnlocked: () => false, unlockedCount: 0, totalCount: 0 },
    certificatesValue: { getUserCertificates: async () => [] as unknown[] },
  };
});

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authValue }));
vi.mock("@/hooks/useUserXP", () => ({ useUserXP: () => xpValue }));
vi.mock("@/hooks/useAchievements", () => ({ useAchievements: () => achievementsValue }));
vi.mock("@/hooks/useCertificates", () => ({ useCertificates: () => certificatesValue }));

vi.mock("@/integrations/supabase/client", () => {
  const builder = (rows: unknown[]) => {
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.eq = () => b;
    b.order = () => b;
    b.limit = () => b;
    b.maybeSingle = async () => ({ data: rows[0] ?? null, error: null });
    b.single = async () => ({ data: rows[0] ?? null, error: null });
    b.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null });
    return b;
  };
  return {
    supabase: {
      from: (table: string) => builder(tables[table] ?? []),
      functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    },
  };
});

vi.mock("jspdf", () => ({
  default: class JsPDFMock {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    setFillColor = vi.fn();
    setTextColor = vi.fn();
    setFontSize = vi.fn();
    setFont = vi.fn();
    text = vi.fn();
    rect = vi.fn();
    roundedRect = vi.fn();
    save = docSave;
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/components/AchievementsGrid", () => ({ default: () => null }));
vi.mock("@/components/XPEvolutionChart", () => ({ default: () => null }));
vi.mock("@/components/profile/PersonalImpactWidget", () => ({ default: () => null }));
vi.mock("@/components/activity/ActivityTimeline", () => ({ default: () => null }));

const renderProfile = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <TooltipProvider>
          <Profile />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("exportar progresso em PDF no perfil (FUNC-010)", () => {
  beforeEach(() => {
    docSave.mockClear();
    invokeMock.mockReset();
    invokeMock.mockResolvedValue({ data: {}, error: null });
  });

  it("mostra o botao de exportar progresso na secao de estatisticas", async () => {
    renderProfile();

    expect(await screen.findByRole("button", { name: /exportar progresso/i })).toBeInTheDocument();
  });

  it("abre a pre-visualizacao do relatorio ao clicar", async () => {
    renderProfile();

    fireEvent.click(await screen.findByRole("button", { name: /exportar progresso/i }));

    expect(await screen.findByText(/o relat\u00f3rio inclui/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /baixar relat\u00f3rio pdf/i })).toBeInTheDocument();
  });

  it("gera o PDF com os dados do usuario ao confirmar", async () => {
    renderProfile();

    fireEvent.click(await screen.findByRole("button", { name: /exportar progresso/i }));
    fireEvent.click(await screen.findByRole("button", { name: /baixar relat\u00f3rio pdf/i }));

    await waitFor(() => expect(docSave).toHaveBeenCalledTimes(1));
    expect(String(docSave.mock.calls[0][0])).toMatch(/^progresso-ana-souza-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it("desabilita o botao de exportar dados enquanto a exportacao esta em andamento", async () => {
    let finishExport: (value: { data: unknown; error: null }) => void = () => undefined;
    invokeMock.mockImplementationOnce(
      () => new Promise<{ data: unknown; error: null }>((resolve) => { finishExport = resolve; }),
    );

    renderProfile();

    const exportButton = await screen.findByRole("button", { name: /exportar dados/i });
    fireEvent.click(exportButton);

    await waitFor(() => expect(exportButton).toBeDisabled());
    expect(invokeMock).toHaveBeenCalledWith("export-user-data");

    finishExport({ data: { ok: true }, error: null });
    await waitFor(() => expect(exportButton).not.toBeDisabled());
  });
});
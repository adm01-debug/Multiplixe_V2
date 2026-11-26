import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc, from: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}));

import SeasonalEventBanner from "@/components/gamification/SeasonalEventBanner";
import { normalizarEvento } from "@/hooks/useSeasonalEvent";
import { gerarSlug } from "@/hooks/useAdminSeasonalEvents";

const evento = {
  id: "e1",
  slug: "semana-do-produto",
  title: "Semana do Produto",
  description: "Bonus de XP para todos",
  emoji: null,
  xp_multiplier: 2,
  starts_at: "2026-11-24T00:00:00+00:00",
  ends_at: "2026-11-28T00:00:00+00:00",
  days_left: 2,
};

const renderizar = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SeasonalEventBanner />
    </QueryClientProvider>
  );
};

describe("eventos sazonais (GAME-009)", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("mostra o cartaz do evento com o bonus de XP", async () => {
    rpc.mockResolvedValue({ data: evento, error: null });

    renderizar();

    expect(await screen.findByText("Semana do Produto")).toBeInTheDocument();
    expect(screen.getByText(/XP extra 2x/)).toBeInTheDocument();
    expect(screen.getByText(/Termina em 2 dias/)).toBeInTheDocument();
    expect(rpc).toHaveBeenCalledWith("get_active_seasonal_event");
  });

  it("nao renderiza nada quando nao ha evento aberto", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    renderizar();

    await waitFor(() => expect(rpc).toHaveBeenCalled());
    expect(screen.queryByText(/XP extra/)).not.toBeInTheDocument();
  });

  it("mostra erro e permite tentar de novo", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("boom") });

    renderizar();

    expect(
      await screen.findByText("Não foi possível carregar o evento agora.")
    ).toBeInTheDocument();

    rpc.mockResolvedValue({ data: evento, error: null });
    fireEvent.click(screen.getByRole("button", { name: /Tentar de novo/i }));

    expect(await screen.findByText("Semana do Produto")).toBeInTheDocument();
  });

  it("normaliza o evento devolvido pelo banco", () => {
    expect(normalizarEvento(null)).toBeNull();
    expect(normalizarEvento({ slug: "sem-id" })).toBeNull();

    const normalizado = normalizarEvento({ ...evento, xp_multiplier: "0.5", days_left: "-3" });
    expect(normalizado?.xp_multiplier).toBe(1);
    expect(normalizado?.days_left).toBe(0);
  });

  it("gera identificador sem acento a partir do titulo", () => {
    expect(gerarSlug("Semana do Produto")).toBe("semana-do-produto");
    expect(gerarSlug("Volta às Aulas 2026!")).toBe("volta-as-aulas-2026");
  });
});
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const hoisted = vi.hoisted(() => ({ rpc: vi.fn(), user: { id: "user-1" } }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: hoisted.rpc },
}));

// Referencia estavel: o componente usa [user] como dependencia do efeito.
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: hoisted.user, loading: false }),
}));

import StudyBuddies from "@/components/social/StudyBuddies";

const renderizar = () =>
  render(
    <MemoryRouter>
      <StudyBuddies />
    </MemoryRouter>,
  );

describe("StudyBuddies", () => {
  beforeEach(() => {
    hoisted.rpc.mockReset();
  });

  it("le os colegas da RPC do ranking e nao mostra o proprio usuario", async () => {
    hoisted.rpc.mockResolvedValue({
      error: null,
      data: [
        { rank: 1, user_id: "user-1", display_name: "Ana", avatar_url: null, total_xp: 1500, current_level: 5 },
        { rank: 2, user_id: "user-2", display_name: "Bruno", avatar_url: null, total_xp: 900, current_level: 4 },
      ],
    });

    renderizar();

    const bruno = await screen.findByText("Bruno");
    expect(bruno).toBeTruthy();
    expect(hoisted.rpc).toHaveBeenCalledWith("get_leaderboard", { p_limit: 20, p_period: "all" });
    expect(screen.queryByText("Ana")).toBeNull();
    expect(bruno.closest("[class*='divide-y']")?.textContent).toContain("900");
  });

  it("mostra estado vazio quando nao ha outros alunos", async () => {
    hoisted.rpc.mockResolvedValue({ error: null, data: [] });

    renderizar();

    expect(await screen.findByText(/Nenhum colega encontrado/)).toBeTruthy();
  });

  it("nao quebra quando a RPC falha", async () => {
    hoisted.rpc.mockRejectedValue(new Error("boom"));

    renderizar();

    expect(await screen.findByText(/Nenhum colega encontrado/)).toBeTruthy();
  });
});
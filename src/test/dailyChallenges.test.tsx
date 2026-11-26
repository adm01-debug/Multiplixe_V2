import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const rpc = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc, auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}));

const xpMultiplierState = vi.hoisted(() => ({ value: 1 }));

vi.mock("@/hooks/useXpMultiplier", () => ({
  useXpMultiplier: () => ({
    multiplier: xpMultiplierState.value,
    label: xpMultiplierState.value > 1 ? "Fim de semana: XP em dobro" : "",
    loading: false,
    applyMultiplier: (xp: number) => Math.round(xp * xpMultiplierState.value),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

import DailyChallenges from "@/components/gamification/DailyChallenges";

const daily = {
  progress_id: "p1",
  challenge_id: "c1",
  title: "Primeira Vitória",
  description: "Conclua 1 aula hoje",
  challenge_type: "watch_lessons",
  target_value: 1,
  xp_reward: 50,
  challenge_period: "daily",
  challenge_date: "2026-11-26",
  current_progress: 1,
  is_completed: true,
  xp_claimed: false,
  ends_at: "2026-11-27T00:00:00+00:00",
};

const dailyInProgress = {
  ...daily,
  progress_id: "p2",
  challenge_id: "c2",
  title: "Maratonista do Dia",
  description: "Conclua 3 aulas hoje",
  challenge_type: "complete_lessons",
  target_value: 3,
  xp_reward: 150,
  current_progress: 2,
  is_completed: false,
};

const weekly = {
  ...daily,
  progress_id: "p3",
  challenge_id: "c3",
  title: "Semana de Foco",
  description: "Conclua 10 aulas até domingo",
  challenge_type: "complete_lessons",
  target_value: 10,
  xp_reward: 200,
  challenge_period: "weekly",
  challenge_date: "2026-11-23",
  current_progress: 4,
  is_completed: false,
  xp_claimed: false,
  ends_at: "2026-11-30T00:00:00+00:00",
};

describe("desafios diários e semanais (GAME-002)", () => {
  beforeEach(() => {
    xpMultiplierState.value = 1;
    rpc.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it("lê o progresso calculado no banco pelo RPC get_my_challenges", async () => {
    rpc.mockResolvedValue({ data: [daily, weekly], error: null });
    render(<DailyChallenges />);

    await waitFor(() => expect(screen.getByText("Semana de Foco")).toBeInTheDocument());
    expect(rpc).toHaveBeenCalledWith("get_my_challenges");
  });

  it("mostra o progresso real e separa a seção semanal", async () => {
    rpc.mockResolvedValue({ data: [dailyInProgress, weekly], error: null });
    render(<DailyChallenges />);

    await waitFor(() => expect(screen.getByText("Maratonista do Dia")).toBeInTheDocument());

    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(screen.getByText("4/10")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Desafios Semanais" })).toBeInTheDocument();
    expect(screen.getByText("0/1 completados")).toBeInTheDocument();
    expect(screen.getByText("Reinicia na segunda-feira")).toBeInTheDocument();
    expect(screen.getByText(/restantes/)).toBeInTheDocument();
  });

  it("coleta a recompensa usando o id do progresso do banco", async () => {
    rpc.mockResolvedValue({ data: [daily], error: null });
    render(<DailyChallenges />);

    const claim = await screen.findByRole("button", { name: /\+\d+/ });
    rpc.mockResolvedValueOnce({
      data: { success: true, xp_earned: 50, challenge_title: "Primeira Vitória" },
      error: null,
    });
    fireEvent.click(claim);

    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith("claim_daily_challenge_reward", {
        p_user_id: "u1",
        p_progress_id: "p1",
      })
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("+50 XP conquistado!", expect.anything()));
  });

  it("não grava progresso de desafio pelo cliente", async () => {
    rpc.mockResolvedValue({ data: [dailyInProgress, weekly], error: null });
    render(<DailyChallenges />);

    await waitFor(() => expect(screen.getByText("Maratonista do Dia")).toBeInTheDocument());
    expect(rpc.mock.calls.map(call => call[0])).toEqual(["get_my_challenges"]);
  });

  it("não renderiza nada quando não há desafios no período", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const { container } = render(<DailyChallenges />);

    await waitFor(() => expect(rpc).toHaveBeenCalledWith("get_my_challenges"));
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("aplica o multiplicador real de XP vindo do banco", async () => {
    xpMultiplierState.value = 2;
    rpc.mockResolvedValue({ data: [daily, weekly], error: null });
    render(<DailyChallenges />);

    const claim = await screen.findByRole("button", { name: /\+100/ });
    expect(claim).toBeInTheDocument();
    expect(screen.getByText(/XP x2/)).toBeInTheDocument();
  });
});

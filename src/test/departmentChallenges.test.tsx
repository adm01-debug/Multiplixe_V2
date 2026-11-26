import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const rpc = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc, from: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

import DepartmentChallenges from "@/components/gamification/DepartmentChallenges";

const fimDaMissao = () => new Date(Date.now() + 2 * 86400000 + 12 * 3600000).toISOString();

const missao = {
  id: "m1",
  title: "Missao coletiva: 500 XP em equipe",
  description: "Some XP com o time todo",
  department: "vendas",
  metric: "xp",
  target_value: 500,
  xp_reward: 100,
  starts_at: "2026-11-23T00:00:00+00:00",
  ends_at: fimDaMissao(),
  progresso: 320,
  participantes: 12,
  membros: 20,
  concluido: false,
  resgatado: false,
  resgatado_em: null,
  xp_resgatado: 0,
};

const renderizar = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DepartmentChallenges />
    </QueryClientProvider>
  );
};

describe("missoes coletivas por departamento (GAME-008)", () => {
  beforeEach(() => {
    rpc.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it("mostra o progresso coletivo calculado no banco", async () => {
    rpc.mockResolvedValue({ data: [missao], error: null });
    renderizar();

    await waitFor(() =>
      expect(screen.getByText("Missao coletiva: 500 XP em equipe")).toBeInTheDocument()
    );

    expect(rpc).toHaveBeenCalledWith("get_my_department_challenges");
    expect(screen.getByText("Meta: 320 / 500")).toBeInTheDocument();
    expect(
      screen.getByText("12 pessoas participando · 20 pessoas no departamento")
    ).toBeInTheDocument();
    expect(screen.getByText("XP ganho pelo time")).toBeInTheDocument();
    expect(screen.getByText("Termina em 3 dias")).toBeInTheDocument();
    expect(screen.getByText("vendas")).toBeInTheDocument();
    expect(screen.getByText("100 XP")).toBeInTheDocument();
  });

  it("resgata o bonus quando a meta foi batida", async () => {
    rpc.mockResolvedValue({ data: [{ ...missao, progresso: 500, concluido: true }], error: null });
    renderizar();

    const botao = await screen.findByRole("button", { name: "Resgatar bônus" });
    expect(botao).toBeEnabled();

    rpc.mockResolvedValueOnce({
      data: { success: true, xp_earned: 100, challenge_title: missao.title },
      error: null,
    });
    fireEvent.click(botao);

    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith("resgatar_desafio_departamento", { p_challenge_id: "m1" })
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("+100 XP — Bônus coletivo resgatado", expect.anything())
    );
  });

  it("bloqueia o resgate enquanto a meta nao foi batida", async () => {
    rpc.mockResolvedValue({ data: [missao], error: null });
    renderizar();

    const botao = await screen.findByRole("button", { name: "Resgatar bônus" });
    expect(botao).toBeDisabled();

    fireEvent.click(botao);
    expect(rpc).not.toHaveBeenCalledWith("resgatar_desafio_departamento", expect.anything());
  });

  it("mostra o bonus ja resgatado em vez do botao", async () => {
    rpc.mockResolvedValue({
      data: [{ ...missao, progresso: 500, concluido: true, resgatado: true, xp_resgatado: 100 }],
      error: null,
    });
    renderizar();

    await waitFor(() => expect(screen.getByText("Bônus resgatado (+100 XP)")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Resgatar bônus" })).toBeNull();
  });

  it("nao renderiza nada quando o time nao tem missao", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const { container } = renderizar();

    await waitFor(() => expect(rpc).toHaveBeenCalledWith("get_my_department_challenges"));
    await waitFor(() => expect(container.firstChild).toBeNull());
  });
});
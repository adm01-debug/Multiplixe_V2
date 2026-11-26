import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc, auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } },
}));

import CategoryLeaderboard from "@/components/leaderboard/CategoryLeaderboard";

const rows = [
  {
    category_id: "c1",
    category_name: "Vendas",
    category_slug: "vendas",
    category_color: "#f97316",
    user_id: "u1",
    display_name: "Ana",
    avatar_url: null,
    completed_courses: 3,
    completed_lessons: 12,
    rank: 1,
  },
  {
    category_id: "c1",
    category_name: "Vendas",
    category_slug: "vendas",
    category_color: "#f97316",
    user_id: "u2",
    display_name: "Bruno",
    avatar_url: null,
    completed_courses: 1,
    completed_lessons: 4,
    rank: 2,
  },
  {
    category_id: "c2",
    category_name: "Atendimento",
    category_slug: "atendimento",
    category_color: "#38bdf8",
    user_id: "u3",
    display_name: "Carla",
    avatar_url: null,
    completed_courses: 1,
    completed_lessons: 1,
    rank: 1,
  },
];

describe("ranking por categoria (GAME-011)", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("chama o RPC uma vez e agrupa por categoria", async () => {
    rpc.mockResolvedValue({ data: rows, error: null });
    render(<CategoryLeaderboard limit={3} />);

    await waitFor(() => expect(screen.getByText("Especialistas por Área")).toBeInTheDocument());

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("get_category_leaderboard", { p_category_id: undefined, p_limit: 10 });
    expect(screen.getByRole("button", { name: /Vendas/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Vendas/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Atendimento/ })).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("3 cursos · 12 aulas")).toBeInTheDocument();
  });

  it("filtra para uma categoria ao clicar no atalho", async () => {
    rpc.mockResolvedValue({ data: rows, error: null });
    render(<CategoryLeaderboard limit={3} />);

    await waitFor(() => expect(screen.getByText("Especialistas por Área")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Atendimento/ }));

    expect(await screen.findByText(/Top 1 em Atendimento/)).toBeInTheDocument();
    expect(screen.getByText("Carla")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("nao quebra e explica quando o RPC falha", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    render(<CategoryLeaderboard />);

    expect(
      await screen.findByText("Não foi possível carregar o ranking por categoria.")
    ).toBeInTheDocument();
  });

  it("mostra estado vazio sem atividade", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    render(<CategoryLeaderboard />);

    expect(await screen.findByText("Ainda não há especialistas")).toBeInTheDocument();
  });
});
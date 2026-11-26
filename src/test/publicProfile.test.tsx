import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: rpcMock },
}));

import PublicProfile from "@/pages/PublicProfile";

const renderPage = (userId = "u1") =>
  render(
    <MemoryRouter initialEntries={[`/usuario/${userId}`]}>
      <Routes>
        <Route path="/usuario/:id" element={<PublicProfile />} />
      </Routes>
    </MemoryRouter>
  );

const publicPayload = {
  available: true,
  profile: {
    user_id: "u1",
    full_name: "Ana Souza",
    department: "atendimento",
    avatar_url: null,
    member_since: "2025-01-15T00:00:00.000Z",
  },
  xp: { total_xp: 1240, current_level: 4 },
  streak: { current: 6, longest: 9 },
  achievements: [
    {
      slug: "first_course",
      name: "Primeiro Curso",
      description: "Concluiu o primeiro curso",
      icon: "🎓",
      gradient: "from-emerald-500 to-teal-500",
      xp_reward: 50,
      unlocked_at: "2025-02-01T00:00:00.000Z",
    },
  ],
  completed_courses: [{ title: "Atendimento nota 10", slug: "atendimento-nota-10", completed_at: "2025-03-01T00:00:00.000Z" }],
  certificates_count: 2,
};

beforeEach(() => {
  rpcMock.mockReset();
});

describe("Perfil público", () => {
  it("exibe nome, nível, XP, conquistas e cursos concluídos", async () => {
    rpcMock.mockResolvedValue({ data: publicPayload, error: null });

    renderPage();

    expect(await screen.findByRole("heading", { name: "Ana Souza" })).toBeInTheDocument();
    expect(screen.getByText("Nível 4")).toBeInTheDocument();
    expect(screen.getByText("1.240")).toBeInTheDocument();
    expect(screen.getByText("Primeiro Curso")).toBeInTheDocument();
    expect(screen.getByText("Atendimento nota 10")).toBeInTheDocument();
    expect(screen.getByText("6 dias de sequência")).toBeInTheDocument();
    expect(rpcMock).toHaveBeenCalledWith("get_public_profile", { p_user_id: "u1" });
  });

  it("não exibe e-mail do usuário", async () => {
    rpcMock.mockResolvedValue({ data: publicPayload, error: null });

    const { container } = renderPage();

    await screen.findByRole("heading", { name: "Ana Souza" });
    expect(container.textContent).not.toContain("@");
    expect(container.textContent).not.toContain("ana@exemplo.com");
  });

  it("mostra aviso quando o perfil é privado", async () => {
    rpcMock.mockResolvedValue({ data: { available: false, reason: "private" }, error: null });

    renderPage();

    expect(await screen.findByText("Este perfil é privado")).toBeInTheDocument();
  });

  it("mostra aviso quando o perfil não existe", async () => {
    rpcMock.mockResolvedValue({ data: { available: false, reason: "not_found" }, error: null });

    renderPage("00000000-0000-0000-0000-000000000000");

    await waitFor(() => expect(screen.getByText("Perfil não encontrado")).toBeInTheDocument());
  });

  it("mostra erro de carregamento quando a RPC falha", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });

    renderPage();

    expect(await screen.findByText("Não foi possível carregar o perfil")).toBeInTheDocument();
  });
});
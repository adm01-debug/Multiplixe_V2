import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const hoisted = vi.hoisted(() => ({ user: { id: "aluno-1" } }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: hoisted.user, signOut: vi.fn() }),
}));
vi.mock("@/hooks/useWallet", () => ({
  useWallet: () => ({ data: { coins: 0 } }),
}));
vi.mock("@/hooks/useGlobalSearch", () => ({
  useGlobalSearch: () => ({ results: [], isLoading: false }),
}));
vi.mock("@/components/NotificationBell", () => ({ default: () => null }));

import CommandPalette from "@/components/CommandPalette";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const montar = () => {
  // jsdom nao implementa scrollIntoView, que o cmdk usa ao abrir.
  Element.prototype.scrollIntoView = () => {};
  render(
    <MemoryRouter>
      <CommandPalette />
      <DashboardHeader
        userName="Aluno Teste"
        totalXP={10}
        isAdmin={false}
        coursesStale={false}
        coursesFetching={false}
        onRefreshCourses={vi.fn()}
        onSignOut={vi.fn()}
      />
    </MemoryRouter>,
  );
};

describe("busca acessivel sem saber o atalho", () => {
  it("tem botao visivel de busca no cabecalho", () => {
    montar();
    expect(screen.getByRole("button", { name: "Buscar no Multiplixe" })).toBeTruthy();
  });

  it("clicar no botao abre o palette de busca", async () => {
    montar();
    expect(screen.queryByPlaceholderText(/Buscar cursos/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Buscar no Multiplixe" }));

    await waitFor(() => expect(screen.getByPlaceholderText(/Buscar cursos/)).toBeTruthy());
  });
});
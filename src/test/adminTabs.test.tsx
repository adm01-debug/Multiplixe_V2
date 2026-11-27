import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

const hoisted = vi.hoisted(() => ({ user: { id: "admin-1" } }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: hoisted.user, loading: false }),
}));
vi.mock("@/hooks/useAdminRole", () => ({
  useAdminRole: () => ({ isAdmin: true, loading: false }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    }),
  },
}));

import Admin from "@/pages/Admin";

const MostrarUrl = () => {
  const { search } = useLocation();
  return <span data-testid="url">{search}</span>;
};

const montar = (entrada: string) =>
  render(
    <MemoryRouter initialEntries={[entrada]}>
      <Routes>
        <Route path="/admin" element={<><Admin /><MostrarUrl /></>} />
      </Routes>
    </MemoryRouter>,
  );

describe("abertura de aba no painel admin pela URL", () => {
  it("abre a aba de feedback quando a notificacao aponta para ela", async () => {
    montar("/admin?tab=feedback");

    const aba = screen.getByRole("tab", { name: /Feedback/ });
    await waitFor(() => expect(aba.getAttribute("aria-selected")).toBe("true"));
  });

  it("volta para cursos quando a URL nao diz a aba", async () => {
    montar("/admin");

    const aba = screen.getByRole("tab", { name: /Cursos/ });
    await waitFor(() => expect(aba.getAttribute("aria-selected")).toBe("true"));
  });

  it("grava a aba escolhida na URL", async () => {
    montar("/admin");

    fireEvent.mouseDown(screen.getByRole("tab", { name: /Webhooks/ }));
    fireEvent.click(screen.getByRole("tab", { name: /Webhooks/ }));

    await waitFor(() => expect(screen.getByTestId("url").textContent).toBe("?tab=webhooks"));
  });
});
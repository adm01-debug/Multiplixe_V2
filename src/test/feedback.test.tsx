import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({
  insert: vi.fn(),
  user: { id: "user-1" },
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ insert: hoisted.insert }) },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: hoisted.user, loading: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: hoisted.toastSuccess, error: hoisted.toastError },
}));

import FeedbackWidget from "@/components/feedback/FeedbackWidget";

const abrirEEnviar = async (mensagem: string) => {
  fireEvent.click(screen.getByLabelText("Enviar feedback"));
  fireEvent.click(await screen.findByText("Bug"));
  fireEvent.click(await screen.findByText("Satisfeito"));
  fireEvent.change(await screen.findByRole("textbox"), { target: { value: mensagem } });
  fireEvent.click(screen.getByRole("button", { name: /^Enviar$/ }));
};

describe("FeedbackWidget", () => {
  beforeEach(() => {
    hoisted.insert.mockReset();
    hoisted.toastSuccess.mockReset();
    hoisted.toastError.mockReset();
  });

  it("grava o feedback na tabela com tipo, humor e pagina", async () => {
    hoisted.insert.mockResolvedValue({ error: null });

    render(<FeedbackWidget />);
    await abrirEEnviar("  o quiz nao salva a ultima resposta  ");

    await waitFor(() => expect(hoisted.insert).toHaveBeenCalledTimes(1));
    expect(hoisted.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      tipo: "bug",
      humor: "happy",
      mensagem: "o quiz nao salva a ultima resposta",
      pagina: window.location.pathname,
    });
    expect(await screen.findByText(/Obrigado/)).toBeTruthy();
  });

  it("mostra o erro do banco e nao finge sucesso", async () => {
    hoisted.insert.mockResolvedValue({ error: { message: "permission denied" } });

    render(<FeedbackWidget />);
    await abrirEEnviar("nao consigo abrir o certificado");

    await waitFor(() => expect(hoisted.toastError).toHaveBeenCalledWith("permission denied"));
    expect(screen.queryByText(/Obrigado/)).toBeNull();
  });

  it("nao grava nada quando nao ha sessao", async () => {
      hoisted.user = null as unknown as { id: string };
    render(<FeedbackWidget />);
      await abrirEEnviar("quero sugerir uma trilha de negociacao");

      await waitFor(() =>
        expect(hoisted.toastError).toHaveBeenCalledWith("Entre na sua conta para enviar feedback"),
      );
    expect(hoisted.insert).not.toHaveBeenCalled();
      hoisted.user = { id: "user-1" };
  });
});
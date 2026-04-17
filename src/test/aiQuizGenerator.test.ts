import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

describe("AIQuizGeneratorModal", () => {
  it("renderiza estado inicial com textarea e botão Gerar", async () => {
    const { default: Modal } = await import("@/components/admin/AIQuizGeneratorModal");
    render(React.createElement(Modal, { open: true, onOpenChange: () => {}, onAccept: () => {} }));
    expect(screen.getByText(/Gerar quiz com IA/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gerar/i })).toBeInTheDocument();
  });

  it("invoca edge function ai-quiz-generator com conteúdo válido", async () => {
    invoke.mockResolvedValue({
      data: {
        questions: [
          { question_text: "Q1?", explanation: "Por quê", options: [{ option_text: "A", is_correct: true }, { option_text: "B", is_correct: false }] },
        ],
      },
      error: null,
    });
    const { default: Modal } = await import("@/components/admin/AIQuizGeneratorModal");
    render(React.createElement(Modal, { open: true, onOpenChange: () => {}, onAccept: () => {} }));
    const textarea = screen.getByLabelText(/Conteúdo de referência/i);
    fireEvent.change(textarea, { target: { value: "x".repeat(150) } });
    fireEvent.click(screen.getByRole("button", { name: /Gerar/i }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("ai-quiz-generator", expect.any(Object)));
  });

  it("não invoca quando conteúdo é menor que 100 chars", async () => {
    const { default: Modal } = await import("@/components/admin/AIQuizGeneratorModal");
    render(React.createElement(Modal, { open: true, onOpenChange: () => {}, onAccept: () => {} }));
    const textarea = screen.getByLabelText(/Conteúdo de referência/i);
    fireEvent.change(textarea, { target: { value: "curto" } });
    fireEvent.click(screen.getByRole("button", { name: /Gerar/i }));
    await new Promise((r) => setTimeout(r, 50));
    expect(invoke).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { useState } from "react";
import {
  LiveAnnouncerProvider,
  useAnnouncements,
  useLiveAnnouncer,
} from "@/components/accessibility/LiveAnnouncer";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";

const politeRegion = () => screen.getByRole("status");
const assertiveRegion = () => screen.getByRole("alert");

const Harness = () => {
  const { announce, announceProgress, announceSuccess } = useAnnouncements();
  return (
    <div>
      <button onClick={() => announce("Mensagem educada")}>polite</button>
      <button onClick={() => announce("Mensagem urgente", "assertive")}>assertive</button>
      <button onClick={() => announceProgress(2, 5, "Questão")}>progresso</button>
      <button onClick={() => announceSuccess("Tudo certo")}>sucesso</button>
    </div>
  );
};

const quizFixture = {
  id: "quiz-1",
  title: "Quiz de teste",
  description: null,
  passing_score: 70,
  xp_reward: 10,
  time_limit_seconds: null,
  quiz_questions: [
    {
      id: "q1",
      question_text: "Pergunta um",
      explanation: "Porque sim",
      order_index: 0,
      quiz_options: [
        { id: "o1", option_text: "Opcao um A", order_index: 0 },
        { id: "o2", option_text: "Opcao um B", order_index: 1 },
      ],
    },
    {
      id: "q2",
      question_text: "Pergunta dois",
      explanation: null,
      order_index: 1,
      quiz_options: [
        { id: "o3", option_text: "Opcao dois A", order_index: 0 },
        { id: "o4", option_text: "Opcao dois B", order_index: 1 },
      ],
    },
  ],
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("LiveAnnouncerProvider", () => {
  it("renderiza as regioes aria-live vazias", () => {
    render(
      <LiveAnnouncerProvider>
        <Harness />
      </LiveAnnouncerProvider>
    );
    expect(politeRegion()).toHaveAttribute("aria-live", "polite");
    expect(assertiveRegion()).toHaveAttribute("aria-live", "assertive");
    expect(politeRegion().textContent).toBe("");
  });

  it("anuncia mensagem educada e limpa depois de 3s", () => {
    render(
      <LiveAnnouncerProvider>
        <Harness />
      </LiveAnnouncerProvider>
    );
    fireEvent.click(screen.getByText("polite"));
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(politeRegion().textContent).toBe("Mensagem educada");
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(politeRegion().textContent).toBe("");
  });

  it("anuncia mensagem urgente na regiao assertiva", () => {
    render(
      <LiveAnnouncerProvider>
        <Harness />
      </LiveAnnouncerProvider>
    );
    fireEvent.click(screen.getByText("assertive"));
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(assertiveRegion().textContent).toBe("Mensagem urgente");
    expect(politeRegion().textContent).toBe("");
  });

  it("formata o progresso como 'Questão: 2 de 5'", () => {
    render(
      <LiveAnnouncerProvider>
        <Harness />
      </LiveAnnouncerProvider>
    );
    fireEvent.click(screen.getByText("progresso"));
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(politeRegion().textContent).toBe("Questão: 2 de 5");
  });

  it("nao quebra quando usado fora do provider", () => {
    const spy = vi.spyOn(console, "error");
    render(<Harness />);
    fireEvent.click(screen.getByText("polite"));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("QuizPlayer com anuncios", () => {
  it("anuncia a questao atual para leitores de tela", () => {
    render(
      <LiveAnnouncerProvider>
        <QuizPlayer
          quiz={quizFixture}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      </LiveAnnouncerProvider>
    );
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(politeRegion().textContent).toBe("Questão: 1 de 2");

    fireEvent.click(screen.getByText("Opcao um A"));
    fireEvent.click(screen.getByText("Próxima"));
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(politeRegion().textContent).toBe("Questão: 2 de 2");
  });
});
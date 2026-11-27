import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mocks.rpc, from: mocks.from },
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "aluno-1" } }),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { useQuizzes } from "@/hooks/useQuizzes";

const montarFromOrders = (tabela: string) =>
  Promise.resolve({
    data:
      tabela === "quiz_questions"
        ? [{ id: "q1", quiz_id: "quiz-1", question_text: "Pergunta?", explanation: null, order_index: 1 }]
        : [],
    error: null,
  });

const montarFrom = () => {
  mocks.from.mockImplementation((tabela: string) => ({
    select: () => ({
      eq: () => {
        const resultado = {
          maybeSingle: () =>
            Promise.resolve({
              data: tabela === "quizzes" ? { id: "quiz-1", title: "Quiz" } : null,
              error: null,
            }),
        };
        return { ...resultado, is: () => resultado, order: () => montarFromOrders(tabela) };
      },
      order: () =>
        Promise.resolve({
          data:
            tabela === "quiz_questions"
              ? [{ id: "q1", quiz_id: "quiz-1", question_text: "Pergunta?", explanation: null, order_index: 1 }]
              : [],
          error: null,
        }),
    }),
  }));
};

describe("opcoes do quiz vem da RPC e nao da view que ignorava a RLS", () => {
  it("carrega as opcoes pela funcao get_quiz_options_publicas", async () => {
    montarFrom();
    mocks.rpc.mockImplementation((nome: string) =>
      Promise.resolve(
        nome === "get_quiz_options_publicas"
          ? { data: [{ id: "o1", question_id: "q1", option_text: "A", order_index: 1 }], error: null }
          : { data: null, error: null },
      ),
    );

    const { result } = renderHook(() => useQuizzes());
    const quiz = await result.current.fetchQuizForCourse("curso-1");

    await waitFor(() => expect(quiz).not.toBeNull());
    const chamada = mocks.rpc.mock.calls.find((c) => c[0] === "get_quiz_options_publicas");
    expect(chamada?.[1]).toEqual({ p_question_ids: ["q1"] });
    expect(quiz?.quiz_questions[0].quiz_options).toEqual([{ id: "o1", option_text: "A", order_index: 1 }]);
  });
});
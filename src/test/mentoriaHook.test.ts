import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const chamadas = vi.hoisted(() => ({
  rpc: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));

const toasts = vi.hoisted(() => ({ sucesso: vi.fn(), erro: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (nome: string, args?: unknown) => chamadas.rpc(nome, args),
    from: (tabela: string) => ({
      insert: (payload: unknown) => chamadas.insert(tabela, payload),
      update: (payload: unknown) => ({
        eq: (coluna: string, valor: unknown) => chamadas.update(tabela, payload, coluna, valor),
      }),
    }),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-123" } }),
}));

vi.mock("sonner", () => ({ toast: { success: toasts.sucesso, error: toasts.erro } }));

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children
  );

beforeEach(() => {
  chamadas.rpc.mockReset();
  chamadas.insert.mockReset();
  chamadas.update.mockReset();
  toasts.sucesso.mockReset();
  toasts.erro.mockReset();
});

describe("useMentors", () => {
  it("chama get_mentors sem termo quando a busca esta vazia", async () => {
    chamadas.rpc.mockResolvedValue({ data: [], error: null });
    const { useMentors } = await import("@/hooks/useMentorship");

    const { result } = renderHook(() => useMentors("   "), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(chamadas.rpc).toHaveBeenCalledWith("get_mentors", { p_busca: undefined });
    expect(result.current.data).toEqual([]);
  });

  it("envia o termo aparado e devolve os mentores", async () => {
    chamadas.rpc.mockResolvedValue({
      data: [{ user_id: "m1", full_name: "Ana", topics: ["Excel"], meu_status: null }],
      error: null,
    });
    const { useMentors } = await import("@/hooks/useMentorship");

    const { result } = renderHook(() => useMentors("  excel  "), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(chamadas.rpc).toHaveBeenCalledWith("get_mentors", { p_busca: "excel" });
    expect(result.current.data?.[0].full_name).toBe("Ana");
  });

  it("propaga o erro do banco", async () => {
    chamadas.rpc.mockResolvedValue({ data: null, error: { message: "permission denied" } });
    const { useMentors } = await import("@/hooks/useMentorship");

    const { result } = renderHook(() => useMentors(""), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("permission denied");
  });
});

describe("useMyMentorship", () => {
  it("normaliza o painel quando o banco nao devolve nada", async () => {
    chamadas.rpc.mockResolvedValue({ data: null, error: null });
    const { useMyMentorship } = await import("@/hooks/useMentorship");

    const { result } = renderHook(() => useMyMentorship(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(chamadas.rpc).toHaveBeenCalledWith("get_my_mentorship", undefined);
    expect(result.current.data).toEqual({
      sou_mentor: false,
      topics: [],
      bio: null,
      recebidos: [],
      enviados: [],
    });
  });

  it("mantem os pedidos recebidos e enviados", async () => {
    chamadas.rpc.mockResolvedValue({
      data: { sou_mentor: true, topics: ["Excel"], bio: "Ajudo", recebidos: [{ id: "p1" }], enviados: [] },
      error: null,
    });
    const { useMyMentorship } = await import("@/hooks/useMentorship");

    const { result } = renderHook(() => useMyMentorship(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.sou_mentor).toBe(true);
    expect(result.current.data?.recebidos).toHaveLength(1);
  });
});

describe("useRequestMentorship", () => {
  it("grava o pedido com o aluno da sessao e avisa o sucesso", async () => {
    chamadas.insert.mockResolvedValue({ error: null });
    const { useRequestMentorship } = await import("@/hooks/useMentorship");

    const { result } = renderHook(() => useRequestMentorship(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        mentorId: "mentor-1",
        assunto: "  Excel  ",
        mensagem: "  preciso de ajuda  ",
      });
    });

    expect(chamadas.insert).toHaveBeenCalledWith("mentorship_requests", {
      mentee_id: "user-123",
      mentor_id: "mentor-1",
      topic: "Excel",
      message: "preciso de ajuda",
    });
    expect(toasts.sucesso).toHaveBeenCalledWith("Pedido enviado! O mentor foi avisado.");
  });

  it("explica pedido pendente duplicado em vez do erro cru do banco", async () => {
    chamadas.insert.mockResolvedValue({
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    const { useRequestMentorship } = await import("@/hooks/useMentorship");

    const { result } = renderHook(() => useRequestMentorship(), { wrapper });
    await act(async () => {
      await result.current
        .mutateAsync({ mentorId: "mentor-1", assunto: "Excel", mensagem: "preciso de ajuda" })
        .catch(() => undefined);
    });

    expect(toasts.erro).toHaveBeenCalledWith("Você já tem um pedido pendente com este mentor.");
  });
});

describe("useRespondMentorship", () => {
  it("envia a resposta sem nota quando o campo esta vazio", async () => {
    chamadas.rpc.mockResolvedValue({ data: { status: "accepted" }, error: null });
    const { useRespondMentorship } = await import("@/hooks/useMentorship");

    const { result } = renderHook(() => useRespondMentorship(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: "pedido-1", status: "accepted", nota: "   " });
    });

    expect(chamadas.rpc).toHaveBeenCalledWith("respond_mentorship_request", {
      p_id: "pedido-1",
      p_status: "accepted",
      p_nota: undefined,
    });
    expect(toasts.sucesso).toHaveBeenCalledWith("Mentoria aceita. O aluno foi avisado.");
  });
});

describe("useUpdateMentorProfile", () => {
  it("atualiza o perfil do proprio usuario e confirma", async () => {
    chamadas.update.mockResolvedValue({ error: null });
    const { useUpdateMentorProfile } = await import("@/hooks/useMentorship");

    const { result } = renderHook(() => useUpdateMentorProfile(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ is_mentor: true, topics: ["Excel"], bio: "  Ajudo  " });
    });

    expect(chamadas.update).toHaveBeenCalledWith(
      "profiles",
      { is_mentor: true, mentor_topics: ["Excel"], mentor_bio: "Ajudo" },
      "user_id",
      "user-123"
    );
    expect(toasts.sucesso).toHaveBeenCalledWith("Pronto! Você apareceu na lista de mentores.");
  });
});
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const insert = vi.fn();
const update = vi.fn();
const del = vi.fn();
const eqUpdate = vi.fn();
const eqUpdateUser = vi.fn();
const eqDelete = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: (...a: unknown[]) => insert(...a),
      update: (...a: unknown[]) => {
        update(...a);
        return { eq: (...e: unknown[]) => { eqUpdate(...e); return { eq: (...e2: unknown[]) => { eqUpdateUser(...e2); return Promise.resolve({ error: null }); } }; } };
      },
      delete: () => {
        del();
        return { eq: (...e: unknown[]) => { eqDelete(...e); return Promise.resolve({ error: null }); } };
      },
    }),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-123" } }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
};

beforeEach(() => {
  vi.clearAllMocks();
  insert.mockResolvedValue({ error: null });
});

describe("usePlaybookComments mutations", () => {
  it("rejeita comentário vazio em add", async () => {
    const { useAddPlaybookComment } = await import("@/hooks/usePlaybookComments");
    const { result } = renderHook(() => useAddPlaybookComment("pb-1"), { wrapper });
    result.current.mutate("   ");
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejeita comentário > 2000 chars em add", async () => {
    const { useAddPlaybookComment } = await import("@/hooks/usePlaybookComments");
    const { result } = renderHook(() => useAddPlaybookComment("pb-1"), { wrapper });
    result.current.mutate("x".repeat(2001));
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("insere comentário válido", async () => {
    const { useAddPlaybookComment } = await import("@/hooks/usePlaybookComments");
    const { result } = renderHook(() => useAddPlaybookComment("pb-1"), { wrapper });
    result.current.mutate("Comentário válido");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(insert).toHaveBeenCalledWith({
      playbook_id: "pb-1",
      user_id: "user-123",
      content: "Comentário válido",
    });
  });

  it("atualiza comentário com filtro por user_id", async () => {
    const { useUpdatePlaybookComment } = await import("@/hooks/usePlaybookComments");
    const { result } = renderHook(() => useUpdatePlaybookComment("pb-1"), { wrapper });
    result.current.mutate({ id: "c1", content: "novo" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(update).toHaveBeenCalledWith({ content: "novo" });
    expect(eqUpdate).toHaveBeenCalledWith("id", "c1");
    expect(eqUpdateUser).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("deleta comentário por id", async () => {
    const { useDeletePlaybookComment } = await import("@/hooks/usePlaybookComments");
    const { result } = renderHook(() => useDeletePlaybookComment("pb-1"), { wrapper });
    result.current.mutate("c1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(del).toHaveBeenCalled();
    expect(eqDelete).toHaveBeenCalledWith("id", "c1");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

let shouldFail = false;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
      }),
      insert: () => ({
        select: () => ({
          single: () =>
            shouldFail
              ? Promise.resolve({ data: null, error: new Error("boom") })
              : Promise.resolve({ data: { id: "real", user_id: "u", course_id: "c", created_at: "now" }, error: null }),
        }),
      }),
      delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
    }),
  },
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(QueryClientProvider, { client }, children);

beforeEach(() => {
  shouldFail = false;
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe("useFavorites optimistic updates", () => {
  it("adiciona favorito otimisticamente antes da resposta", async () => {
    const { useFavorites } = await import("@/hooks/useFavorites");
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.addFavorite("course-1"));
    await waitFor(() => expect(result.current.isFavorite("course-1")).toBe(true));
  });

  it("faz rollback em erro ao adicionar", async () => {
    shouldFail = true;
    const { useFavorites } = await import("@/hooks/useFavorites");
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.addFavorite("course-x"));
    await waitFor(() => expect(result.current.isFavorite("course-x")).toBe(false));
  });
});

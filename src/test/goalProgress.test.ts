import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

let goalRows: Record<string, unknown>[] = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: rpcMock,
    from: () => ({
      select: () => ({
        eq: () => ({ order: () => Promise.resolve({ data: goalRows, error: null }) }),
      }),
    }),
  },
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const futureDate = () => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(QueryClientProvider, { client }, children);

beforeEach(() => {
  rpcMock.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  goalRows = [
    {
      id: "g1",
      user_id: "u",
      goal_type: "lessons_week",
      target_value: 5,
      current_value: 3,
      start_date: "2026-11-23",
      end_date: futureDate(),
      completed: false,
      completed_at: null,
      created_at: "2026-11-23T10:00:00Z",
      updated_at: "2026-11-23T10:00:00Z",
    },
  ];
});

describe("useGoals com progresso real (FUNC-012)", () => {
  it("recalcula as metas no banco antes de ler e usa o valor gravado", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { useGoals } = await import("@/hooks/useGoals");
    const { result } = renderHook(() => useGoals(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(rpcMock).toHaveBeenCalledWith("recalculate_user_goals");
    expect(result.current.goals[0].current_value).toBe(3);
    expect(result.current.activeGoals).toHaveLength(1);
  });

  it("tolera ambiente sem a funcao e ainda lista as metas", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: "PGRST202", message: "not found" } });
    const { useGoals } = await import("@/hooks/useGoals");
    const { result } = renderHook(() => useGoals(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.goals).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("propaga erro real do recalculo em vez de mostrar progresso zerado", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });
    const { useGoals } = await import("@/hooks/useGoals");
    const { result } = renderHook(() => useGoals(), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(result.current.goals).toHaveLength(0);
  });
});
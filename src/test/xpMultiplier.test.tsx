import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}));

import { useXpMultiplier } from "@/hooks/useXpMultiplier";

describe("multiplicador de XP (GAME-005)", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("lê o multiplicador calculado no banco", async () => {
    rpc.mockResolvedValue({
      data: { multiplier: 1.5, streak: 7, streak_multiplier: 1.5, weekend_multiplier: 1, label: "Sequencia de 7 dias: XP x1.5" },
      error: null,
    });

    const { result } = renderHook(() => useXpMultiplier());

    await waitFor(() => expect(result.current.multiplier).toBe(1.5));
    expect(rpc).toHaveBeenCalledWith("get_my_xp_multiplier");
    expect(result.current.label).toContain("Sequencia de 7 dias");
    expect(result.current.applyMultiplier(200)).toBe(300);
  });

  it("cai para 1x quando o RPC falha", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const { result } = renderHook(() => useXpMultiplier());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.multiplier).toBe(1);
    expect(result.current.applyMultiplier(50)).toBe(50);
  });

  it("arredonda o XP concedido como o banco faz", async () => {
    rpc.mockResolvedValue({
      data: { multiplier: 1.5, streak: 7, streak_multiplier: 1.5, weekend_multiplier: 1, label: "" },
      error: null,
    });

    const { result } = renderHook(() => useXpMultiplier());

    await waitFor(() => expect(result.current.multiplier).toBe(1.5));
    expect(result.current.applyMultiplier(25)).toBe(38);
  });
});
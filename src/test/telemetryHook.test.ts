import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTelemetry } from "@/hooks/useTelemetry";

vi.mock("@/lib/telemetry", () => ({
  trackTelemetry: vi.fn().mockResolvedValue(undefined),
}));

describe("useTelemetry", () => {
  it("expõe track e trackFeature", () => {
    const { result } = renderHook(() => useTelemetry());
    expect(typeof result.current.track).toBe("function");
    expect(typeof result.current.trackFeature).toBe("function");
  });

  it("invoca trackTelemetry ao chamar track", async () => {
    const { trackTelemetry } = await import("@/lib/telemetry");
    const { result } = renderHook(() => useTelemetry());
    act(() => result.current.track("page_view", "home", { path: "/" }));
    expect(trackTelemetry).toHaveBeenCalledWith({
      event: "page_view",
      message: "home",
      metadata: { path: "/" },
    });
  });

  it("trackFeature usa evento feature_used", async () => {
    const { trackTelemetry } = await import("@/lib/telemetry");
    const { result } = renderHook(() => useTelemetry());
    act(() => result.current.trackFeature("ai_quiz_generated", { count: 5 }));
    expect(trackTelemetry).toHaveBeenCalledWith({
      event: "feature_used",
      message: "ai_quiz_generated",
      metadata: { count: 5 },
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    from: vi.fn().mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) }),
  },
}));

import { trackPageView, trackRenderError, trackMutationError, trackTelemetry } from "@/lib/telemetry";
import { supabase } from "@/integrations/supabase/client";

describe("telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { hostname: "app.example.com" },
      writable: true,
    });
  });

  it("trackPageView returns void without throwing", () => {
    expect(() => trackPageView("/dashboard")).not.toThrow();
  });

  it("trackRenderError accepts Error and stack", () => {
    expect(() => trackRenderError(new Error("boom"), "stack-trace")).not.toThrow();
  });

  it("trackMutationError accepts context object", () => {
    expect(() => trackMutationError(new Error("fail"), { kind: "mutation" })).not.toThrow();
  });

  it("trackTelemetry calls supabase.from('audit_logs') in prod-like env", async () => {
    await trackTelemetry({ event: "feature_used", message: "x", metadata: { a: 1 } });
    expect(supabase.from).toHaveBeenCalledWith("audit_logs");
  });

  it("trackTelemetry skips in localhost", async () => {
    Object.defineProperty(window, "location", {
      value: { hostname: "localhost" },
      writable: true,
    });
    vi.clearAllMocks();
    await trackTelemetry({ event: "page_view" });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("trackTelemetry swallows errors silently", async () => {
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      insert: vi.fn().mockRejectedValue(new Error("network")),
    });
    await expect(
      trackTelemetry({ event: "render_error", message: "x" })
    ).resolves.toBeUndefined();
  });
});

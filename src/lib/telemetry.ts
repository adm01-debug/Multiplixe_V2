import { supabase } from "@/integrations/supabase/client";

export type TelemetryEvent =
  | "page_view"
  | "mutation_error"
  | "render_error"
  | "feature_used";

interface TelemetryPayload {
  event: TelemetryEvent;
  message?: string;
  metadata?: Record<string, unknown>;
}

const isProd = (): boolean =>
  typeof window !== "undefined" && !window.location.hostname.includes("localhost");

/**
 * Telemetry wrapper — registra eventos críticos em audit_logs sem bloquear UI.
 * Falhas silenciosas (best-effort).
 */
export async function trackTelemetry({ event, message, metadata }: TelemetryPayload): Promise<void> {
  if (!isProd()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      user_id: user?.id ?? null,
      action: `telemetry.${event}`,
      resource_type: "telemetry",
      metadata: { message, ...metadata } as never,
    });
  } catch {
    // best-effort, never throw
  }
}

export function trackPageView(path: string): void {
  void trackTelemetry({ event: "page_view", metadata: { path } });
}

export function trackRenderError(error: Error, componentStack?: string): void {
  void trackTelemetry({
    event: "render_error",
    message: error.message,
    metadata: { stack: error.stack?.slice(0, 2000), componentStack: componentStack?.slice(0, 2000) },
  });
}

export function trackMutationError(error: Error, context?: Record<string, unknown>): void {
  void trackTelemetry({
    event: "mutation_error",
    message: error.message,
    metadata: { ...context, stack: error.stack?.slice(0, 1000) },
  });
}

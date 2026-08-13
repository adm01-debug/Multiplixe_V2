import { useCallback } from "react";
import { trackTelemetry, type TelemetryEvent } from "@/lib/telemetry";

/**
 * Hook para rastrear eventos críticos de telemetria.
 * Wrapper em torno de trackTelemetry para uso em componentes.
 */
export function useTelemetry() {
  const track = useCallback(
    (event: TelemetryEvent, message?: string, metadata?: Record<string, unknown>) => {
      void trackTelemetry({ event, message, metadata });
    },
    []
  );

  const trackFeature = useCallback(
    (featureName: string, metadata?: Record<string, unknown>) => {
      void trackTelemetry({
        event: "feature_used",
        message: featureName,
        metadata,
      });
    },
    []
  );

  return { track, trackFeature };
}

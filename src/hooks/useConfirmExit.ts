import { useEffect, useCallback, useState } from "react";

interface UseConfirmExitOptions {
  enabled?: boolean;
  message?: string;
}

export function useConfirmExit({
  enabled = true,
  message = "Você tem certeza que deseja sair? Seu progresso pode ser perdido.",
}: UseConfirmExitOptions = {}) {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Handle browser/tab close
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, message]);

  // For programmatic navigation confirmation
  const confirmNavigation = useCallback(
    (callback: () => void) => {
      if (!enabled) {
        callback();
        return;
      }
      setPendingNavigation(() => callback);
      setShowDialog(true);
    },
    [enabled]
  );

  const handleConfirm = useCallback(() => {
    if (pendingNavigation) {
      pendingNavigation();
    }
    setShowDialog(false);
    setPendingNavigation(null);
  }, [pendingNavigation]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  return {
    showDialog,
    confirmNavigation,
    handleConfirm,
    handleCancel,
    message,
  };
}

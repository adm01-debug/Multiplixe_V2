import { toast } from "sonner";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  description?: string;
  action?: ToastAction;
  duration?: number;
}

/**
 * Helpers padronizados para toasts via sonner.
 * Garante consistência visual e semântica em toda a aplicação.
 */

export function toastError(title: string, options?: ToastOptions): void {
  toast.error(title, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 6000,
  });
}

export function toastSuccess(title: string, options?: ToastOptions): void {
  toast.success(title, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 4000,
  });
}

export function toastInfo(title: string, options?: ToastOptions): void {
  toast.info(title, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 4000,
  });
}

export function toastWarning(title: string, options?: ToastOptions): void {
  toast.warning(title, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 5000,
  });
}

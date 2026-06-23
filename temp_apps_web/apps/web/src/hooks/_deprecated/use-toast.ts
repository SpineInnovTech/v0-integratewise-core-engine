import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  type?: "default" | "success" | "error" | "warning";
}

interface ToastState {
  toasts: Toast[];
}

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const toast = useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setState((prev) => ({
      toasts: [...prev.toasts, { id, title, description, variant }],
    }));
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setState((prev) => ({
        toasts: prev.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setState((prev) => ({
      toasts: prev.toasts.filter((t) => t.id !== id),
    }));
  }, []);

  return { toast, dismiss, toasts: state.toasts };
}

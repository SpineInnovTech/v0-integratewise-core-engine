import { useState, useEffect } from "react";

export interface ViewAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  reason?: string;
}

export function useViewAccess(viewId?: string): ViewAccessResult {
  const [state, setState] = useState<ViewAccessResult>({
    hasAccess: true,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (viewId) {
      setState((prev) => ({ ...prev, isLoading: true }));
      setTimeout(() => {
        setState({ hasAccess: true, isLoading: false, error: null, reason: "Access granted" });
      }, 100);
    }
  }, [viewId]);

  return state;
}

export default useViewAccess;

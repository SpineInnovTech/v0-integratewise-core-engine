"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

interface L2RedirectProps {
  /** The cognitive drawer tab to open */
  surface:
    | "lineage"
    | "spine"
    | "context"
    | "knowledge"
    | "think"
    | "act"
    | "approve"
    | "governance";
  /** Fallback route if redirect fails */
  fallbackRoute?: string;
  /** Loading message */
  message?: string;
}

/**
 * L2 Redirect Component
 *
 * Used for L2 (Cognitive Layer) pages that should open in the Cognitive Drawer
 * instead of being standalone pages. This maintains L1/L2 separation.
 */
export function L2Redirect({
  surface,
  fallbackRoute = "/personal/home",
  message = "Opening Cognitive Layer...",
}: L2RedirectProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // Open Cognitive Drawer to specified tab
    window.dispatchEvent(
      new CustomEvent("iw:cognitive:open", {
        detail: { surface, data: {} },
      })
    );
    // Navigate to fallback route
    navigate(fallbackRoute);
  }, [navigate, surface, fallbackRoute]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// Pre-configured redirects for common L2 pages
export function SignalsRedirect({ fallbackRoute }: { fallbackRoute?: string }) {
  return (
    <L2Redirect surface="knowledge" fallbackRoute={fallbackRoute} message="Opening Signals..." />
  );
}

export function EvidenceRedirect({ fallbackRoute }: { fallbackRoute?: string }) {
  return (
    <L2Redirect surface="lineage" fallbackRoute={fallbackRoute} message="Opening Evidence..." />
  );
}

export function PredictionsRedirect({ fallbackRoute }: { fallbackRoute?: string }) {
  return (
    <L2Redirect surface="think" fallbackRoute={fallbackRoute} message="Opening Predictions..." />
  );
}

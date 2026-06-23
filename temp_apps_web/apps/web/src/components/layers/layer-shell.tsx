"use client";

/**
 * LayerShell — shared chrome for dedicated L4–L7 workbench surfaces.
 *
 * Every dedicated layer workbench (Memory Hub, Operations, Execution,
 * Governance) wraps its content in this shell to get consistent:
 *   - Layer badge  (L4 / L5 / L6 / L7)
 *   - Title + subtitle
 *   - System-wire label (maps to the backend S-stage)
 *   - Scrollable content area
 *
 * Shared helpers exported from here so L4–L7 files don't repeat themselves:
 *   LayerLoading    — skeleton placeholder
 *   LayerEmptyState — icon + title + hint card
 */

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

// ─── Layer badge colour map ───────────────────────────────────────────────────

const LAYER_COLOURS: Record<string, string> = {
  L4: "bg-iw-forest/10 text-iw-forest border-iw-forest/20",
  L5: "bg-iw-gold/10 text-iw-gold border-iw-gold/20",
  L6: "bg-iw-gold/10 text-iw-gold-light border-iw-gold/20",
  L7: "bg-iw-forest-bright/10 text-iw-forest-bright border-iw-forest-bright/20",
};

// ─── LayerShell ───────────────────────────────────────────────────────────────

interface LayerShellProps {
  /** e.g. "L4" */
  layer: string;
  title: string;
  subtitle?: string;
  /** Small label referencing the backend system stage */
  systemWire?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function LayerShell({
  layer,
  title,
  subtitle,
  systemWire,
  icon,
  actions,
  children,
}: LayerShellProps) {
  const colour = LAYER_COLOURS[layer] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div className="flex flex-col h-full min-h-0 font-iw-sans">
      {/* ── Header ── */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border bg-background">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colour}`}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-iw-mono font-medium border ${colour}`}
                >
                  {layer}
                </span>
                <h1 className="text-base font-semibold leading-tight truncate">{title}</h1>
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 mt-0.5">
            {actions}
            {systemWire && (
              <span className="shrink-0 text-[10px] font-iw-mono text-muted-foreground/60 hidden sm:block">
                {systemWire}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Skeleton shown while data is loading */
export function LayerLoading() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-lg bg-muted border border-border" />
      ))}
    </div>
  );
}

/** Empty state card shown when a query returns no data */
export function LayerEmptyState({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <Card className="p-0 gap-0">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        {icon && (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
        )}
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {hint && (
          <p className="text-xs text-muted-foreground/70 max-w-xs leading-relaxed">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Animated counter helper ──────────────────────────────────────────────────

/** Format a number as a compact string (1.2k, 3.4M, etc.) */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/**
 * SpinePill — an honest, always-visible indicator of the REAL Spine (platform
 * truth layer) connection, probed through the relay (/api/spine/status). The
 * relay mints the platform credential server-side; the browser never holds it.
 *
 * Like ConnectionPill, this never fabricates "connected" — it shows exactly
 * what the relay reported.
 */

import { useEffect, useRef, useState } from "react";
import { Boxes, WifiOff, RefreshCw, X } from "lucide-react";
import { useSpineStatus } from "./use-spine";

export function SpinePill() {
  const { data, isLoading, error, refetch, isFetching } = useSpineStatus();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const connected = Boolean(data?.connected);
  const state: "checking" | "live" | "offline" = isLoading
    ? "checking"
    : connected
      ? "live"
      : "offline";

  const meta = {
    checking: { label: "Spine…", color: "#475569", bg: "#f1f5f9" },
    live: { label: `Spine · ${data?.toolCount ?? 0}`, color: "#047857", bg: "#ecfdf5" },
    offline: { label: "Spine offline", color: "#be123c", bg: "#fff1f2" },
  }[state];

  const detail =
    data?.detail ??
    (error instanceof Error ? error.message : "Checking the platform Spine…");

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
        style={{ background: meta.bg, color: meta.color }}
        title={detail}
      >
        {state === "offline" ? (
          <WifiOff className="h-3.5 w-3.5" />
        ) : (
          <Boxes className={`h-3.5 w-3.5 ${state === "checking" ? "animate-pulse" : ""}`} />
        )}
        <span className="hidden sm:inline">{meta.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Spine (platform truth)</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <Row label="Status">
              <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: meta.color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                {state === "live" ? "Connected (MCP)" : state === "checking" ? "Checking…" : "Unavailable"}
              </span>
            </Row>
            <Row label="Endpoint">
              <span className="font-mono text-[10px] text-muted-foreground break-all">
                {data?.endpoint ?? "mcp.integratewise.ai"}
              </span>
            </Row>
            <Row label="Tenant">
              <span className="font-mono text-[10px] text-muted-foreground">{data?.tenantId ?? "—"}</span>
            </Row>
            <Row label="Tools">
              <span className="text-muted-foreground">{connected ? (data?.toolCount ?? 0) : "—"}</span>
            </Row>
          </div>

          <p className="mt-3 rounded-md bg-muted/50 p-2 text-[11px] leading-snug text-muted-foreground">
            {detail}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Recheck
            </button>
          </div>

          {connected && data && data.tools.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <div className="mb-2 text-[11px] font-semibold text-foreground">
                Live tools ({data.tools.length})
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                {data.tools.map((t) => (
                  <div key={t.name} className="flex items-center gap-2">
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                        t.access === "read"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                      title={t.access === "read" ? "Read-only" : "Governed (HITL)"}
                    >
                      {t.access === "read" ? "R" : "W"}
                    </span>
                    <span
                      className="truncate font-mono text-[10px] text-muted-foreground"
                      title={t.description}
                    >
                      {t.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

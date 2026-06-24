/**
 * ConnectionPill — an honest, always-visible indicator of the real platform
 * gateway connection state. Clicking it opens a panel with the gateway URL,
 * live status detail, and a development affordance to connect with a platform
 * JWT (so real gateway data can be exercised before OAuth is wired).
 *
 * This component never fabricates a "connected" state — it reflects exactly
 * what `PlatformProvider` probed.
 */

import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  WifiOff,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { usePlatform, type GatewayConnState } from "@/platform/platform-context";

const STATE_META: Record<
  GatewayConnState,
  { label: string; color: string; bg: string; Icon: typeof ShieldCheck; spin?: boolean }
> = {
  checking: { label: "Checking…", color: "#475569", bg: "#f1f5f9", Icon: Loader2, spin: true },
  connected: { label: "Platform connected", color: "#047857", bg: "#ecfdf5", Icon: ShieldCheck },
  not_authenticated: { label: "Not connected", color: "#b45309", bg: "#fffbeb", Icon: ShieldAlert },
  offline: { label: "Gateway offline", color: "#be123c", bg: "#fff1f2", Icon: WifiOff },
};

function relativeTime(ts: number | null): string {
  if (!ts) return "—";
  const secs = Math.round((Date.now() - ts) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

export function ConnectionPill() {
  const { mode, user, hasToken, gateway, signInWithToken, signOut, refresh } = usePlatform();
  const allowTokenPaste =
    import.meta.env.DEV || import.meta.env.VITE_ALLOW_TOKEN_PASTE === "true";
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const meta = STATE_META[gateway.state];
  const Icon = meta.Icon;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function handleConnect() {
    const t = draft.trim();
    if (!t) return;
    signInWithToken(t);
    setDraft("");
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
        style={{ background: meta.bg, color: meta.color }}
        title={gateway.detail}
      >
        <Icon className={`h-3.5 w-3.5 ${meta.spin ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">{meta.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Platform gateway</h3>
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
                {meta.label}
              </span>
            </Row>
            <Row label="Endpoint">
              <span className="font-mono text-[10px] text-muted-foreground">{gateway.baseUrl}</span>
            </Row>
            <Row label="Mode">
              <span className="capitalize text-muted-foreground">{mode.replace("-", " ")}</span>
            </Row>
            {user && (
              <Row label="Identity">
                <span className="text-muted-foreground">{user.email || user.name}</span>
              </Row>
            )}
            <Row label="Checked">
              <span className="text-muted-foreground">{relativeTime(gateway.lastChecked)}</span>
            </Row>
          </div>

          <p className="mt-3 rounded-md bg-muted/50 p-2 text-[11px] leading-snug text-muted-foreground">
            {gateway.detail}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Recheck
            </button>
            {hasToken && (
              <button
                onClick={signOut}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                Clear token
              </button>
            )}
          </div>

          {allowTokenPaste && (
            <div className="mt-4 border-t border-border pt-3">
              <label className="mb-1 block text-[11px] font-semibold text-foreground">
                Connect with a platform JWT
                <span className="ml-1 font-normal text-muted-foreground">(development)</span>
              </label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Paste a platform-issued JWT to exercise live gateway data…"
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-background p-2 font-mono text-[10px] text-foreground outline-none focus:border-ring"
              />
              <button
                onClick={handleConnect}
                disabled={!draft.trim()}
                className="mt-2 w-full rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Connect
              </button>
              <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
                Stored locally in this browser only. The gateway verifies the token; an
                invalid one is reported honestly, never faked.
              </p>
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

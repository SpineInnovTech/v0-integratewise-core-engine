/**
 * L1/L2 → L3 native Twin handoff.
 *
 * The Twin is a Cloudflare-native in-app surface (see components/l1/twin/twin-workbench.tsx
 * + hooks/use-twin-chat.ts). "Opening the Twin" navigates to the in-app Twin route and
 * passes entity/insight context via sessionStorage — no external tab, OWUI-free (DECISION 22).
 */

export const TWIN_ROUTE = "/work/twin";

export type TwinHandoffSource = "l1" | "l2" | "insight" | "sidebar" | "command";

export interface TwinHandoffContext {
  entityId?: string;
  entityType?: string;
  entityName?: string;
  domain?: string;
  /** Pre-filled user message or /command */
  prompt?: string;
  /** Insight title when launched from L2 popup */
  insightTitle?: string;
  source?: TwinHandoffSource;
  l1Path?: string;
  /** Founder personal mode: include personal_memory + preferences */
  personal?: boolean;
  /** Specific personal categories to surface */
  personalCategories?: string[];
}

const HANDOFF_STORAGE_KEY = "iw_twin_handoff_v1";

export function writeTwinHandoffContext(ctx: TwinHandoffContext): TwinHandoffContext {
  const envelope: TwinHandoffContext & { writtenAt: string } = {
    ...ctx,
    l1Path: ctx.l1Path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
    writtenAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    /* quota / private mode */
  }
  return envelope;
}

export function readTwinHandoffContext(): (TwinHandoffContext & { writtenAt?: string }) | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TwinHandoffContext & { writtenAt?: string };
  } catch {
    return null;
  }
}

/**
 * Open the native L3 Twin surface with synced context.
 * Writes context to sessionStorage (read by TwinWorkbench on mount) and navigates
 * to the in-app Twin route. Optionally pass a router navigate fn for SPA navigation.
 */
export function openTwinWorkbench(
  ctx: TwinHandoffContext = {},
  navigate?: (path: string) => void
): void {
  writeTwinHandoffContext(ctx);
  if (navigate) {
    navigate(TWIN_ROUTE);
  } else if (typeof window !== "undefined") {
    window.location.assign(TWIN_ROUTE);
  }
}

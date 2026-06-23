/**
 * useInsightPopups — Trigger engine for contextual AI insight popups in L1
 *
 * Fetches signals from Think service, filters by relevance, manages queue,
 * and surfaces the most important insights as popups within the workspace.
 *
 * Rate limits: max 1 popup per 30s, max 3 per session.
 * Dismissed popups persist to localStorage.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSignals, type Signal } from "./use-signals";
import type { InsightPopup, InsightSeverity, InsightAction } from "@/components/l2/insights/types";

const STORAGE_KEY = "iw_dismissed_insights_v1";
const RATE_LIMIT_MS = 30_000;
const MAX_PER_SESSION = 10;
const AUTO_DISMISS_MS = 30_000;

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveDismissed(dismissed: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]));
  } catch {
    /* ignore */
  }
}

function bandToSeverity(band?: string): InsightSeverity {
  const b = String(band || "").toLowerCase();
  if (b === "critical" || b === "red") return "critical";
  if (b === "warning" || b === "yellow") return "warning";
  if (b === "good" || b === "green" || b === "success") return "success";
  return "info";
}

function severityPriority(a: InsightSeverity, b: InsightSeverity): number {
  const order: Record<string, number> = { critical: 0, warning: 1, info: 2, success: 3 };
  return (order[a] ?? 4) - (order[b] ?? 4);
}

function signalToPopup(signal: Signal): InsightPopup {
  const severity = bandToSeverity(signal.band);
  const title = signal.title || signal.type || "AI Insight";
  const message =
    signal.payload?.description ||
    signal.payload?.summary ||
    `${title} detected on ${signal.source || "system"}.`;

  const actions: InsightAction[] = [{ label: "Dismiss", type: "dismiss" }];

  // Critical/warning signals get Act + Deep actions
  if (severity === "critical" || severity === "warning") {
    actions.unshift({ label: "Act", type: "act" }, { label: "Go Deeper", type: "deep" });
  } else {
    actions.unshift({ label: "Go Deeper", type: "deep" });
  }

  // Always offer Twin for context
  actions.push({ label: "Ask Twin", type: "twin" });

  return {
    id: signal.id,
    type: "signal",
    severity,
    title,
    message,
    entityType: signal.payload?.entity_type || signal.type,
    entityId: signal.payload?.entity_id,
    entityName: signal.payload?.entity_name,
    source: signal.source || "System",
    sourceIcon: signal.payload?.source_icon,
    timestamp: signal.computed_at || signal.created_at || new Date().toISOString(),
    suggestedAction: signal.payload?.suggested_action,
    evidenceCount: signal.payload?.evidence_count,
    actions,
    raw: signal as unknown as Record<string, unknown>,
  };
}

function isRelevantToDomain(signal: Signal, domain?: string): boolean {
  if (!domain) return true;
  const entityType = String(signal.type || signal.payload?.entity_type || "").toLowerCase();
  const signalKey = String(signal.type || signal.payload?.signal_key || "").toLowerCase();

  // Domain relevance mapping
  const domainPatterns: Record<string, string[]> = {
    customer_success: ["account", "contact", "health", "renewal", "churn", "risk", "goal"],
    sales: ["deal", "opportunity", "lead", "pipeline", "forecast", "quota"],
    revops: ["revenue", "forecast", "pipeline", "deal", "quota", "cohort"],
    marketing: ["campaign", "lead", "email", "attribution", "social", "form"],
    finance: ["expense", "invoice", "revenue", "budget", "payment"],
    bizops: ["workflow", "integration", "connector", "task", "project"],
    product_engineering: ["feature", "bug", "sprint", "release", "roadmap", "incident"],
    service: ["ticket", "case", "sla", "customer", "support"],
    procurement: ["vendor", "renewal", "contract", "purchase"],
    it_admin: ["connector", "sync", "auth", "user", "role", "permission"],
    personal: ["task", "note", "calendar", "bookmark"],
  };

  const patterns = domainPatterns[domain.toLowerCase()] || [];
  if (patterns.length === 0) return true;

  return patterns.some((p) => entityType.includes(p) || signalKey.includes(p));
}

export interface UseInsightPopupsOptions {
  /** Current domain to filter signals by relevance */
  domain?: string;
  /** Whether popups are enabled */
  enabled?: boolean;
  /** Max popups to show per session */
  maxPerSession?: number;
}

export interface UseInsightPopupsResult {
  activePopup: InsightPopup | null;
  queue: InsightPopup[];
  dismissed: Set<string>;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  shownCount: number;
}

export function useInsightPopups(options: UseInsightPopupsOptions = {}): UseInsightPopupsResult {
  const { domain, enabled = true, maxPerSession = MAX_PER_SESSION } = options;
  const { signals } = useSignals(domain ? { domain } : undefined);

  const [activePopup, setActivePopup] = useState<InsightPopup | null>(null);
  const [queue, setQueue] = useState<InsightPopup[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);
  const [shownCount, setShownCount] = useState(0);

  const lastShownAtRef = useRef(0);
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Convert new signals to popups and add to queue
  useEffect(() => {
    if (!enabled || !signals.length) return;

    const newPopups = signals
      .filter((s) => !processedIdsRef.current.has(s.id))
      .filter((s) => !dismissed.has(s.id))
      .filter((s) => isRelevantToDomain(s, domain))
      .map(signalToPopup);

    if (newPopups.length === 0) return;

    // Mark as processed
    newPopups.forEach((p) => processedIdsRef.current.add(p.id));

    setQueue((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const unique = newPopups.filter((p) => !existingIds.has(p.id));
      if (unique.length === 0) return prev;

      // Merge and sort by severity
      const merged = [...prev, ...unique].sort((a, b) => {
        const sev = severityPriority(a.severity, b.severity);
        if (sev !== 0) return sev;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      return merged.slice(0, 20); // cap queue size
    });
  }, [signals, domain, enabled, dismissed]);

  // Show next popup from queue when conditions allow
  useEffect(() => {
    if (!enabled) return;
    if (activePopup) return;
    if (queue.length === 0) return;
    if (shownCount >= maxPerSession) return;

    const now = Date.now();
    if (now - lastShownAtRef.current < RATE_LIMIT_MS) {
      // Check again after rate limit window
      const timeout = setTimeout(
        () => {
          // force re-evaluation by touching state
          setQueue((q) => [...q]);
        },
        RATE_LIMIT_MS - (now - lastShownAtRef.current)
      );
      return () => clearTimeout(timeout);
    }

    // Show the highest priority popup
    const next = queue[0];
    setActivePopup(next);
    setQueue((q) => q.slice(1));
    lastShownAtRef.current = now;
    setShownCount((c) => c + 1);

    // Auto-dismiss after timeout
    autoDismissTimerRef.current = setTimeout(() => {
      setActivePopup((current) => {
        if (current?.id === next.id) {
          return null;
        }
        return current;
      });
    }, AUTO_DISMISS_MS);

    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [queue, activePopup, enabled, shownCount, maxPerSession]);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
    setActivePopup((current) => (current?.id === id ? null : current));
    setQueue((q) => q.filter((p) => p.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    const allIds = new Set(
      [...queue.map((p) => p.id), activePopup?.id].filter(Boolean) as string[]
    );
    setDismissed((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => next.add(id));
      saveDismissed(next);
      return next;
    });
    setActivePopup(null);
    setQueue([]);
  }, [queue, activePopup]);

  return {
    activePopup,
    queue,
    dismissed,
    dismiss,
    dismissAll,
    shownCount,
  };
}

export default useInsightPopups;

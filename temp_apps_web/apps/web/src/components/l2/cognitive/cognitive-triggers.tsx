"use client";

/**
 * Cognitive Triggers — Awareness Profile-Driven
 *
 * L2 is NOT a screen. It's an awareness service that manifests based on:
 * 1. User's awareness profile (signal entitlements, panel entitlements, threshold)
 * 2. Incoming signals that exceed the user's confidence threshold
 * 3. Domain-specific overlay matching the user's department
 *
 * The Twin only interrupts when it has something worth interrupting for.
 * Junior CSMs (threshold 0.90) get fewer interruptions than founders (0.65).
 */

import { useEffect, useCallback, useState } from "react";
import { useL2Drawer, type L2Surface } from "./l2-drawer-animated";
import { toast } from "sonner";

// ─── Awareness Profile Types ────────────────────────────────────────────────

export interface AwarenessProfile {
  enabled: boolean;
  /** Which signal types can interrupt this user */
  signal_entitlements: string[];
  /** Which context panels appear when overlay activates */
  panel_entitlements: string[];
  /** Confidence threshold — signals below this don't trigger overlay */
  threshold: number;
  /** Domain-specific overlay variant */
  domain_overlay: string;
  /** User's department */
  department: string;
  /** User's role */
  role: string;
}

export interface IncomingSignal {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  entity_id?: string;
  entity_name?: string;
  title: string;
  body?: string;
  department?: string;
}

// ─── Default Profiles by Role ───────────────────────────────────────────────

const DEFAULT_PROFILES: Record<string, Partial<AwarenessProfile>> = {
  founder: {
    threshold: 0.65, // sees weak signals early
    signal_entitlements: [
      "health_drop",
      "renewal_approaching",
      "arr_change",
      "support_escalation",
      "signal_cluster",
      "engagement_drop",
      "stale_data",
      "memory_conflict",
      "context_gap",
      "goal_at_risk",
    ],
    panel_entitlements: ["spine", "context"],
  },
  manager: {
    threshold: 0.75,
    signal_entitlements: [
      "health_drop",
      "renewal_approaching",
      "support_escalation",
      "engagement_drop",
      "goal_at_risk",
      "signal_cluster",
    ],
    panel_entitlements: ["spine", "context"],
  },
  member: {
    threshold: 0.85,
    signal_entitlements: ["health_drop", "renewal_approaching", "support_escalation"],
    panel_entitlements: ["context"],
  },
  viewer: {
    threshold: 0.95, // almost never interrupted
    signal_entitlements: ["health_drop"],
    panel_entitlements: [],
  },
};

// ─── Profile Fetching ───────────────────────────────────────────────────────

/**
 * Fetch the user's awareness profile from the gateway.
 * Falls back to default based on role if not configured.
 */
async function fetchAwarenessProfile(apiBase: string, token: string): Promise<AwarenessProfile> {
  try {
    const res = await fetch(`${apiBase}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Auth failed");
    const user = await res.json();

    const role = user.role || "member";
    const department = user.department || "general";
    const defaults = DEFAULT_PROFILES[role] || DEFAULT_PROFILES.member;

    return {
      enabled: true,
      signal_entitlements: defaults.signal_entitlements || [],
      panel_entitlements: defaults.panel_entitlements || [],
      threshold: defaults.threshold || 0.85,
      domain_overlay: department,
      department,
      role,
    };
  } catch {
    // Fallback — default member profile
    return {
      enabled: true,
      signal_entitlements: ["health_drop", "renewal_approaching"],
      panel_entitlements: ["context"],
      threshold: 0.85,
      domain_overlay: "general",
      department: "general",
      role: "member",
    };
  }
}

// ─── Hook: Awareness-Driven Triggers ────────────────────────────────────────

export function useCognitiveTriggers() {
  const { openDrawer, isOpen } = useL2Drawer();
  const [profile, setProfile] = useState<AwarenessProfile | null>(null);

  // Load profile on mount
  useEffect(() => {
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || "";
    const token = localStorage.getItem("iw_token") || "";
    if (apiBase && token) {
      fetchAwarenessProfile(apiBase, token).then(setProfile);
    } else {
      // Default profile for dev/unauthenticated
      setProfile({
        enabled: true,
        signal_entitlements: ["health_drop", "renewal_approaching", "support_escalation"],
        panel_entitlements: ["spine", "context"],
        threshold: 0.75,
        domain_overlay: "general",
        department: "general",
        role: "founder",
      });
    }
  }, []);

  /**
   * Evaluate an incoming signal against the user's awareness profile.
   * Only triggers overlay if: signal type is entitled AND confidence exceeds threshold.
   */
  const evaluateSignal = useCallback(
    (signal: IncomingSignal) => {
      if (!profile || !profile.enabled) return;
      if (isOpen) return; // don't stack overlays

      // Check signal entitlement
      if (!profile.signal_entitlements.includes(signal.type)) return;

      // Check confidence threshold
      if (signal.confidence < profile.threshold) return;

      // Signal passes — manifest the overlay
      const isCritical = signal.severity === "critical" || signal.severity === "high";

      if (isCritical) {
        toast.warning(signal.title, {
          description: signal.body || `${signal.entity_name || "Entity"} needs attention`,
        });
      } else {
        toast(signal.title, {
          description: signal.body || "Twin has a recommendation",
        });
      }

      // Open drawer with entitled panels
      setTimeout(() => {
        openDrawer({
          trigger: "twin",
          contextType: "signal",
          contextId: signal.entity_id || signal.id,
          requestedSurface: (profile.panel_entitlements[0] as L2Surface) || "context",
        });
      }, 500);
    },
    [profile, isOpen, openDrawer]
  );

  return {
    profile,
    evaluateSignal,
  };
}

// ─── Component: Signal Listener ─────────────────────────────────────────────

/**
 * Listens for incoming signals and evaluates them against awareness profile.
 * Uses SSE from gateway or polling from D1 signals table.
 */
export function CognitiveEventListener() {
  const { evaluateSignal, profile } = useCognitiveTriggers();

  useEffect(() => {
    if (!profile?.enabled) return;

    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || "";
    if (!apiBase) return;

    // Poll signals every 30 seconds (SSE upgrade later)
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("iw_token") || "";
        const res = await fetch(`${apiBase}/api/v1/intelligence/signals?status=active&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const signals: IncomingSignal[] = data.data || data.signals || [];

        // Evaluate each signal against profile
        for (const signal of signals) {
          evaluateSignal(signal);
        }
      } catch {
        // Silent fail — signals are non-critical
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [profile, evaluateSignal]);

  return null; // Logic-only component
}

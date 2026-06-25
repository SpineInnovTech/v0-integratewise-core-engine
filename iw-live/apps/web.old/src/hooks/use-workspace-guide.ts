/**
 * useWorkspaceGuide — Contextual product tour for new users
 *
 * Reuses the same popup infrastructure as useInsightPopups,
 * but surfaces educational guidance instead of signals.
 *
 * Guide progress persists to localStorage per user.
 * Once complete, normal signal-based popups take over.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { InsightPopup, InsightAction } from "@/components/l2/insights/types";

const STORAGE_KEY = "iw_workspace_guide_v1";
const COMPLETED_KEY = "iw_workspace_guide_v1_completed";

export interface GuideStep {
  id: string;
  /** Which domains this step applies to ("all" for any) */
  domains: string[] | "all";
  /** Which module this step applies to ("all" for any) */
  modules: string[] | "all";
  title: string;
  message: string;
  /** Delay before showing this step (ms) */
  delayMs: number;
  /** Whether this step requires the user to be on a specific view */
  requiresView?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUIDE CONTENT — Domain-aware onboarding tips
// ═══════════════════════════════════════════════════════════════════════════════

const GUIDE_STEPS: GuideStep[] = [
  // Universal welcome (any domain, dashboard)
  {
    id: "welcome",
    domains: "all",
    modules: ["dashboard"],
    delayMs: 2000,
    title: "Welcome to your workspace",
    message:
      "This is your command center. Everything you need is here — accounts, tasks, insights, and actions. I'll guide you through the key areas.",
  },
  // Dashboard KPIs
  {
    id: "dashboard-kpis",
    domains: "all",
    modules: ["dashboard"],
    delayMs: 6000,
    title: "Your metrics at a glance",
    message:
      "These cards show your most important numbers. They update automatically as your data flows in from connected tools.",
  },
  // Left sidebar navigation
  {
    id: "sidebar-nav",
    domains: "all",
    modules: ["dashboard"],
    delayMs: 10000,
    title: "Navigate your workspace",
    message:
      "The sidebar on the left lets you switch between views — accounts, tasks, meetings, analytics, and more. Everything is organized by how you work.",
  },
  // Twin sidebar
  {
    id: "twin-sidebar",
    domains: "all",
    modules: ["dashboard", "accounts", "tasks"],
    delayMs: 14000,
    title: "Your AI Twin",
    message:
      "The panel on the right is your Twin — an AI that knows your workspace. Ask it questions, get summaries, or request actions. It learns from your context.",
  },
  // Command palette
  {
    id: "command-palette",
    domains: "all",
    modules: "all",
    delayMs: 18000,
    title: "Command anything",
    message:
      "Press ⌘K (or Ctrl+K) to open the command palette. Search anything, jump to any view, or trigger actions without leaving your keyboard.",
  },
  // Governance / Approvals
  {
    id: "governance",
    domains: "all",
    modules: "all",
    delayMs: 22000,
    title: "Governance & Approvals",
    message:
      "The shield icon in the header is your governance center. When the AI suggests actions, they land here for your review and approval. You stay in control.",
  },
  // Notifications
  {
    id: "notifications",
    domains: "all",
    modules: "all",
    delayMs: 26000,
    title: "Stay informed",
    message:
      "The bell icon shows signals from your data — health changes, risks, opportunities. These are contextual and appear when they matter.",
  },
  // Intelligence (L2)
  {
    id: "intelligence",
    domains: "all",
    modules: "all",
    delayMs: 30000,
    title: "Go deeper with Intelligence",
    message:
      "Press ⌘J (or click 'Intelligence' in the sidebar) to open the cognitive layer. See the Spine, context, knowledge, and reasoning behind every insight.",
  },
  // CS-specific guidance
  {
    id: "cs-accounts",
    domains: ["CUSTOMER_SUCCESS"],
    modules: ["accounts"],
    delayMs: 2000,
    title: "Your account portfolio",
    message:
      "This is your account list. Health scores, ARR, renewal dates — all in one place. Click any account to see its full 360° view.",
  },
  {
    id: "cs-health",
    domains: ["CUSTOMER_SUCCESS"],
    modules: ["account-health"],
    delayMs: 2000,
    title: "Account health explained",
    message:
      "Health scores combine engagement, support tickets, product usage, and payment status. Green is healthy, yellow needs attention, red requires action.",
  },
  // BizOps-specific guidance
  {
    id: "bizops-workbench",
    domains: ["CUSTOMER_SUCCESS"],
    modules: ["dashboard"],
    delayMs: 4000,
    title: "Cross-department visibility",
    message:
      "BizOps gives you a unified view across Sales, Marketing, Finance, and more. Switch departments using the domain selector in the sidebar.",
  },
  // Sales-specific guidance
  {
    id: "sales-pipeline",
    domains: ["SALES"],
    modules: ["pipeline"],
    delayMs: 2000,
    title: "Your pipeline",
    message:
      "Track deals from qualification to close. The Twin can analyze your pipeline health, forecast revenue, and suggest next steps for stalled deals.",
  },
  // Completion
  {
    id: "complete",
    domains: "all",
    modules: "all",
    delayMs: 34000,
    title: "You're all set",
    message:
      "That's the overview. As you use the workspace, I'll surface contextual insights and suggestions. You can always ask the Twin for help. Happy working!",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

interface GuideState {
  completedSteps: string[];
  currentStepIndex: number;
  startedAt: number;
  isComplete: boolean;
}

function loadGuideState(): GuideState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    completedSteps: [],
    currentStepIndex: 0,
    startedAt: Date.now(),
    isComplete: false,
  };
}

function saveGuideState(state: GuideState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function isGuideCompleted(): boolean {
  try {
    return localStorage.getItem(COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markGuideCompleted() {
  try {
    localStorage.setItem(COMPLETED_KEY, "true");
  } catch {
    /* ignore */
  }
}

export function resetGuide() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPLETED_KEY);
  } catch {
    /* ignore */
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export interface UseWorkspaceGuideOptions {
  domain?: string;
  moduleId?: string;
  enabled?: boolean;
}

export interface UseWorkspaceGuideResult {
  activePopup: InsightPopup | null;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  isComplete: boolean;
  progress: number; // 0-1
}

export function useWorkspaceGuide(options: UseWorkspaceGuideOptions = {}): UseWorkspaceGuideResult {
  const { domain = "CUSTOMER_SUCCESS", moduleId = "dashboard", enabled = true } = options;

  const [state, setState] = useState<GuideState>(loadGuideState);
  const [activePopup, setActivePopup] = useState<InsightPopup | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  // Track elapsed time since guide started
  useEffect(() => {
    if (!enabled || state.isComplete || isGuideCompleted()) return;
    startTimeRef.current = state.startedAt;

    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, state.isComplete, state.startedAt]);

  // Determine which steps are applicable to current domain/module
  const applicableSteps = GUIDE_STEPS.filter((step) => {
    const domainMatch =
      step.domains === "all" || step.domains.includes(domain) || step.domains.includes("all");
    const moduleMatch = step.modules === "all" || step.modules.includes(moduleId);
    return domainMatch && moduleMatch;
  });

  // Find the next step that should be shown based on elapsed time
  useEffect(() => {
    if (!enabled || state.isComplete || isGuideCompleted()) return;

    // Find steps that should be shown now but haven't been completed or dismissed
    const nextStep = applicableSteps.find((step) => {
      if (state.completedSteps.includes(step.id)) return false;
      return elapsedMs >= step.delayMs;
    });

    if (nextStep && !activePopup) {
      const popup: InsightPopup = {
        id: `guide_${nextStep.id}`,
        type: "signal", // reuse signal type for simplicity
        severity: "info",
        title: nextStep.title,
        message: nextStep.message,
        source: "Workspace Guide",
        timestamp: new Date().toISOString(),
        actions: [
          { label: "Next", type: "dismiss" },
          { label: "Skip Guide", type: "dismiss" },
        ],
      };
      setActivePopup(popup);
    }

    // Check if all applicable steps are complete
    const allComplete = applicableSteps.every((step) => state.completedSteps.includes(step.id));
    if (allComplete && !state.isComplete) {
      setState((prev) => {
        const next = { ...prev, isComplete: true };
        saveGuideState(next);
        markGuideCompleted();
        return next;
      });
    }
  }, [elapsedMs, applicableSteps, state, activePopup, enabled]);

  const dismiss = useCallback((id: string) => {
    const stepId = id.replace("guide_", "");
    setState((prev) => {
      const next = {
        ...prev,
        completedSteps: [...prev.completedSteps, stepId],
      };
      saveGuideState(next);
      return next;
    });
    setActivePopup(null);
  }, []);

  const dismissAll = useCallback(() => {
    const allStepIds = applicableSteps.map((s) => s.id);
    setState((prev) => {
      const next = {
        ...prev,
        completedSteps: [...new Set([...prev.completedSteps, ...allStepIds])],
        isComplete: true,
      };
      saveGuideState(next);
      markGuideCompleted();
      return next;
    });
    setActivePopup(null);
  }, [applicableSteps]);

  const progress =
    applicableSteps.length > 0 ? state.completedSteps.length / applicableSteps.length : 1;

  return {
    activePopup,
    dismiss,
    dismissAll,
    isComplete: state.isComplete || isGuideCompleted(),
    progress,
  };
}

export default useWorkspaceGuide;

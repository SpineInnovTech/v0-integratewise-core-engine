"use client";

/**
 * Insight Popup Provider
 * Wraps the workspace and manages contextual AI insight popups in L1.
 *
 * Two modes:
 * - Guide mode (new users): Educational workspace tour via useWorkspaceGuide
 * - Signal mode (returning users): Contextual AI alerts via useInsightPopups
 *
 * Usage:
 *   <InsightPopupProvider domain={domain} onAct={...} onAskTwin={...}>
 *     <WorkspaceContent />
 *   </InsightPopupProvider>
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { useInsightPopups } from "@/hooks/use-insight-popups";
import { useWorkspaceGuide, markGuideCompleted } from "@/hooks/use-workspace-guide";
import { AIInsightPopup } from "./ai-insight-popup";
import type { InsightPopup, InsightPopupContextValue } from "./types";

const InsightPopupContext = createContext<InsightPopupContextValue | null>(null);

export function useInsightPopupContext(): InsightPopupContextValue {
  const ctx = useContext(InsightPopupContext);
  if (!ctx) {
    throw new Error("useInsightPopupContext must be used within InsightPopupProvider");
  }
  return ctx;
}

interface InsightPopupProviderProps {
  children: React.ReactNode;
  /** Current domain for relevance filtering */
  domain?: string;
  /** Current module/view for contextual guidance */
  moduleId?: string;
  /** Whether popups are enabled (default: true) */
  enabled?: boolean;
  /** Force guide mode for new users (auto-detected if undefined) */
  guideMode?: boolean;
  /** Called when user clicks "Act" on a popup */
  onAct?: (popup: InsightPopup) => void;
  /** Called when user clicks "Ask Twin" on a popup */
  onAskTwin?: (popup: InsightPopup) => void;
  /** Right offset in pixels (account for TwinSidebar) */
  offsetRight?: number;
}

export function InsightPopupProvider({
  children,
  domain,
  moduleId,
  enabled = true,
  guideMode: guideModeProp,
  onAct,
  onAskTwin,
  offsetRight = 24,
}: InsightPopupProviderProps) {
  const [popupsEnabled, setPopupsEnabled] = useState(enabled);

  // Auto-detect guide mode: if not explicitly set, check if guide is completed
  const guide = useWorkspaceGuide({
    domain,
    moduleId,
    enabled: guideModeProp !== false, // enable unless explicitly disabled
  });

  const isGuideMode = guideModeProp ?? !guide.isComplete;

  const {
    activePopup: signalPopup,
    queue,
    dismiss: dismissSignal,
    dismissAll: dismissAllSignals,
  } = useInsightPopups({
    domain,
    enabled: popupsEnabled && !isGuideMode, // disable signals during guide
  });

  // Use guide popup when in guide mode, otherwise use signal popup
  const activePopup = isGuideMode ? guide.activePopup : signalPopup;

  const handleDismiss = useCallback(
    (id: string) => {
      if (isGuideMode) {
        guide.dismiss(id);
      } else {
        dismissSignal(id);
      }
    },
    [isGuideMode, guide, dismissSignal]
  );

  const handleDismissAll = useCallback(() => {
    if (isGuideMode) {
      guide.dismissAll();
      markGuideCompleted();
    } else {
      dismissAllSignals();
    }
  }, [isGuideMode, guide, dismissAllSignals]);

  const handleAct = useCallback(
    (popup: InsightPopup) => {
      onAct?.(popup);
    },
    [onAct]
  );

  const handleAskTwin = useCallback(
    (popup: InsightPopup) => {
      onAskTwin?.(popup);
    },
    [onAskTwin]
  );

  const value: InsightPopupContextValue = {
    activePopup,
    queueLength: isGuideMode ? 0 : queue.length,
    dismiss: handleDismiss,
    dismissAll: handleDismissAll,
    act: handleAct,
    goDeeper: () => {
      /* handled by AIInsightPopup internally via useL2Drawer */
    },
    askTwin: handleAskTwin,
    enabled: popupsEnabled,
    setEnabled: setPopupsEnabled,
  };

  return (
    <InsightPopupContext.Provider value={value}>
      {children}
      <AIInsightPopup
        popup={activePopup}
        onDismiss={handleDismiss}
        onAct={handleAct}
        onAskTwin={handleAskTwin}
        offsetRight={offsetRight}
      />
    </InsightPopupContext.Provider>
  );
}

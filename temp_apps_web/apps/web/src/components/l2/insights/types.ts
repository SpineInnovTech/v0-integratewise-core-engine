/**
 * Insight Popup Types
 * Contextual AI insight popups within L1 workspace views
 */

export type InsightSeverity = "critical" | "warning" | "info" | "success";

export type InsightActionType = "act" | "deep" | "twin" | "dismiss";

export interface InsightAction {
  label: string;
  type: InsightActionType;
  icon?: string;
}

export interface InsightPopup {
  id: string;
  type: "signal" | "situation";
  severity: InsightSeverity;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  source: string;
  sourceIcon?: string;
  timestamp: string;
  suggestedAction?: string;
  evidenceCount?: number;
  /** Actions available on this popup */
  actions: InsightAction[];
  /** Raw signal data for advanced handling */
  raw?: Record<string, unknown>;
}

export interface InsightPopupState {
  /** Currently displayed popup */
  active: InsightPopup | null;
  /** Queue of pending popups */
  queue: InsightPopup[];
  /** IDs of dismissed popups (persists to localStorage) */
  dismissed: Set<string>;
  /** Last popup shown timestamp (for rate limiting) */
  lastShownAt: number;
}

export interface InsightPopupContextValue {
  activePopup: InsightPopup | null;
  queueLength: number;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  act: (popup: InsightPopup) => void;
  goDeeper: (popup: InsightPopup) => void;
  askTwin: (popup: InsightPopup) => void;
  /** Whether popups are globally enabled */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

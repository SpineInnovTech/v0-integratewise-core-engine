"use client";

/**
 * AI Insight Popup
 * Contextual floating card within L1 workspace views
 *
 * Appears when the trigger engine surfaces a relevant signal.
 * User can dismiss, act (approval), go deeper (L2), or ask twin.
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  Zap,
  MessageSquare,
  ChevronRight,
  Brain,
  Shield,
  Clock,
} from "lucide-react";
import { useL2Drawer } from "@/components/l2/cognitive/l2-drawer-animated";
import type { InsightPopup, InsightSeverity } from "./types";

const SEVERITY_CONFIG: Record<
  InsightSeverity,
  {
    icon: typeof AlertTriangle;
    color: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    color: "#C04040",
    bg: "rgba(199, 91, 91, 0.08)",
    border: "rgba(199, 91, 91, 0.25)",
    label: "CRITICAL",
  },
  warning: {
    icon: AlertTriangle,
    color: "#C79F4A",
    bg: "rgba(212, 160, 90, 0.08)",
    border: "rgba(212, 160, 90, 0.25)",
    label: "WARNING",
  },
  info: {
    icon: Info,
    color: "#3d7a50",
    bg: "rgba(61, 122, 80, 0.08)",
    border: "rgba(61, 122, 80, 0.25)",
    label: "INSIGHT",
  },
  success: {
    icon: CheckCircle,
    color: "#3D7A50",
    bg: "rgba(91, 168, 138, 0.08)",
    border: "rgba(91, 168, 138, 0.25)",
    label: "SUCCESS",
  },
};

interface AIInsightPopupProps {
  popup: InsightPopup | null;
  onDismiss: (id: string) => void;
  onAct?: (popup: InsightPopup) => void;
  onAskTwin?: (popup: InsightPopup) => void;
  /** Position offset to avoid overlapping TwinSidebar */
  offsetRight?: number;
}

export function AIInsightPopup({
  popup,
  onDismiss,
  onAct,
  onAskTwin,
  offsetRight = 24,
}: AIInsightPopupProps) {
  const { openDrawer } = useL2Drawer();
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);

  // Auto-dismiss progress bar
  useEffect(() => {
    if (!popup || isHovered) {
      setProgress(100);
      return;
    }
    setProgress(100);
    const start = Date.now();
    const duration = 30000; // 30s
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [popup, isHovered]);

  const handleGoDeeper = useCallback(
    (p: InsightPopup) => {
      // Open L2 Drawer with signals surface, scoped to the entity
      openDrawer({
        trigger: "signal",
        requestedSurface: "signals",
        contextId: p.entityId || p.id,
        contextType: p.entityType || "entity",
        entityName: p.entityName || undefined,
      });
      onDismiss(p.id);
    },
    [openDrawer, onDismiss]
  );

  const handleAct = useCallback(
    (p: InsightPopup) => {
      onAct?.(p);
      onDismiss(p.id);
    },
    [onAct, onDismiss]
  );

  const handleAskTwin = useCallback(
    (p: InsightPopup) => {
      onAskTwin?.(p);
      onDismiss(p.id);
    },
    [onAskTwin, onDismiss]
  );

  return (
    <AnimatePresence>
      {popup && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed z-[60]"
          style={{
            bottom: 24,
            right: offsetRight,
            maxWidth: 380,
            width: "calc(100vw - 48px)",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <PopupCard
            popup={popup}
            progress={progress}
            onDismiss={onDismiss}
            onAct={handleAct}
            onGoDeeper={handleGoDeeper}
            onAskTwin={handleAskTwin}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PopupCard({
  popup,
  progress,
  onDismiss,
  onAct,
  onGoDeeper,
  onAskTwin,
}: {
  popup: InsightPopup;
  progress: number;
  onDismiss: (id: string) => void;
  onAct: (p: InsightPopup) => void;
  onGoDeeper: (p: InsightPopup) => void;
  onAskTwin: (p: InsightPopup) => void;
}) {
  const config = SEVERITY_CONFIG[popup.severity];
  const Icon = config.icon;

  return (
    <div
      className="rounded-xl border bg-white shadow-lg overflow-hidden"
      style={{
        borderColor: config.border,
        boxShadow: `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px ${config.border}`,
      }}
    >
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-gray-100">
        <div
          className="h-full transition-all duration-100 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: config.color,
          }}
        />
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-wide"
              style={{
                backgroundColor: config.bg,
                color: config.color,
              }}
            >
              {config.label}
            </span>
            {popup.source && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                {popup.source}
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mt-1 leading-snug">{popup.title}</h4>
        </div>

        <button
          onClick={() => onDismiss(popup.id)}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Dismiss insight"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-600 leading-relaxed">{popup.message}</p>

        {popup.entityName && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500">
            <Shield className="w-3 h-3" />
            <span className="font-medium">{popup.entityName}</span>
            {popup.evidenceCount !== undefined && popup.evidenceCount > 0 && (
              <span className="text-gray-400">· {popup.evidenceCount} evidence</span>
            )}
          </div>
        )}

        {popup.suggestedAction && (
          <div className="mt-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-[11px] text-gray-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-iw-gold" />
              <span className="font-medium">Suggested:</span> {popup.suggestedAction}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-1.5">
        {popup.actions.map((action) => {
          if (action.type === "dismiss") {
            return (
              <button
                key={action.label}
                onClick={() => onDismiss(popup.id)}
                className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                  action.label === "Skip Guide"
                    ? "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {action.label}
              </button>
            );
          }
          if (action.type === "act") {
            return (
              <button
                key={action.type}
                onClick={() => onAct(popup)}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: "#C79F4A" }}
              >
                <Shield className="w-3 h-3" />
                Act
              </button>
            );
          }
          if (action.type === "deep") {
            return (
              <button
                key={action.type}
                onClick={() => onGoDeeper(popup)}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors hover:bg-gray-50"
                style={{
                  borderColor: "#3d7a50",
                  color: "#3d7a50",
                }}
              >
                <ChevronRight className="w-3 h-3" />
                Go Deeper
              </button>
            );
          }
          if (action.type === "twin") {
            return (
              <button
                key={action.type}
                onClick={() => onAskTwin(popup)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
              >
                <MessageSquare className="w-3 h-3" />
                Twin
              </button>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

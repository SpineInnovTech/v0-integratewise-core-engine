/**
 * Workplace Loading Screen
 *
 * Shown after AI Loader completes and Normalizer is processing.
 * This is the final step before user sees the actual Workplace.
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Users, FileText, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { subscribeToProgress, type SyncJob } from "@/api/workspace";
import { checkWorkspaceReady } from "@/lib/onboarding-api";
import { DOMAIN_NORMALIZER_STEPS } from "./domain-messages";

interface WorkplaceLoadingProps {
  domain: string;
  onReady: () => void;
  onStart?: () => Promise<void> | void;
  realFlow?: boolean; // true only for real user connectors, not skip/demo
  tenantId?: string;
}

interface LoadingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "active" | "completed";
}

const INITIAL_STEPS: LoadingStep[] = [
  {
    id: "normalizer",
    label: "Normalizing your data...",
    icon: <Sparkles className="w-5 h-5" />,
    status: "active",
  },
  {
    id: "spine_schema",
    label: "Building Spine schema...",
    icon: <Building2 className="w-5 h-5" />,
    status: "pending",
  },
  {
    id: "spine_traits",
    label: "Wiring domain traits...",
    icon: <Users className="w-5 h-5" />,
    status: "pending",
  },
  {
    id: "ui",
    label: "Preparing your workbench...",
    icon: <FileText className="w-5 h-5" />,
    status: "pending",
  },
];

export function WorkplaceLoading({
  domain,
  onReady,
  onStart,
  realFlow,
  tenantId,
}: WorkplaceLoadingProps) {
  // Select domain-specific steps, fallback to generic.
  // Normalize incoming canonical domain (e.g. CUSTOMER_SUCCESS or customer_success) to map key.
  const norm = (domain || "").toLowerCase();
  const domainSteps = DOMAIN_NORMALIZER_STEPS[norm];
  const initialSteps: LoadingStep[] = domainSteps
    ? domainSteps.map((s, i) => ({
        id: s.id,
        label: s.label,
        icon:
          i === 0 ? (
            <Sparkles className="w-5 h-5" />
          ) : i === 1 ? (
            <Building2 className="w-5 h-5" />
          ) : i === 2 ? (
            <Users className="w-5 h-5" />
          ) : (
            <FileText className="w-5 h-5" />
          ),
        status: (i === 0 ? "active" : "pending") as "active" | "pending" | "completed",
      }))
    : INITIAL_STEPS;

  const [steps, setSteps] = useState<LoadingStep[]>(initialSteps);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const finishedRef = React.useRef(false);

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer: number | undefined;
    let hardSafetyTimer: number | undefined;
    let unsubscribe: (() => void) | undefined;

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setProgress(100);
      updateSteps(100);
      setIsComplete(true);
      window.setTimeout(onReady, 1500);
    };

    // Unconditional safety net: the activation pipeline must always reach the
    // workbench within ~10s, even if the progress backend never responds.
    // Animates progress to completion so the user sees the full normalizer flow.
    const startGracefulFinish = () => {
      if (cancelled || finishedRef.current) return;
      let pct = 10;
      const tick = window.setInterval(() => {
        if (cancelled || finishedRef.current) {
          window.clearInterval(tick);
          return;
        }
        pct = Math.min(100, pct + 18);
        setProgress(pct);
        updateSteps(pct);
        if (pct >= 100) {
          window.clearInterval(tick);
          finish();
        }
      }, 600);
    };

    const start = async () => {
      try {
        await onStart?.();
      } catch (err) {
        console.error("[WorkplaceLoading] Failed to start activation:", err);
      }

      if (cancelled) return;

      const hasRealFlow = !!realFlow;

      // Demo / Skip (no connectors -> no real jobs will ever arrive): animate to
      // completion promptly so the user reaches the workbench in a few seconds
      // instead of staring at 0% until the 3-minute safety timer fires.
      if (!hasRealFlow) {
        startGracefulFinish();
        return;
      }

      // REAL USER FLOW ONLY: when realFlow=true (connectors provided), NEVER auto-finish on timers by default.
      // But add a soft safety to complete dashboard load so UI does not hang forever.
      // Background data sync (via pipeline) continues; the loader is just the initial "creamy" UX.
      hardSafetyTimer = window.setTimeout(() => {
        if (!hasRealFlow) {
          startGracefulFinish();
        } else {
          console.warn(
            "[WorkplaceLoading] Real flow safety timeout — completing dashboard load to prevent hang. Data will continue syncing in background."
          );
          finish(); // Force complete UI; CZ verification can show true progress
        }
      }, 180000); // 3min for full real pipeline normalizer

      unsubscribe = subscribeToProgress(
        (jobs) => {
          if (jobs.length === 0) {
            setProgress((p) => (p > 0 ? p : 5));
            updateSteps(5);
            if (!fallbackTimer && !hasRealFlow) {
              fallbackTimer = window.setTimeout(async () => {
                if (cancelled || finishedRef.current) return;
                try {
                  const ready = await checkWorkspaceReady(tenantId || "current");
                  if (ready) {
                    finish();
                    return;
                  }
                } catch {
                  // ignore
                }
                // only auto-finish if no real jobs expected
              }, 60000);
            }
            return;
          }

          if (fallbackTimer) {
            window.clearTimeout(fallbackTimer);
            fallbackTimer = undefined;
          }

          const totalJobs = jobs.length;
          const completedJobs = jobs.filter((j) => j.status === "completed").length;
          const percent = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

          setProgress(percent);
          updateSteps(percent);

          if (jobs.length > 0 && jobs.every((j) => j.status === "completed")) {
            finish();
          }
        },
        (error) => {
          console.error("[WorkplaceLoading] Progress error in real flow:", error);
        }
      );
    };

    start();

    return () => {
      cancelled = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (hardSafetyTimer) window.clearTimeout(hardSafetyTimer);
      unsubscribe?.();
    };
  }, [onReady, onStart, realFlow, tenantId]);

  const updateSteps = (percent: number) => {
    setSteps((current) => {
      const newSteps = [...current];

      if (percent >= 25) newSteps[0].status = "completed";
      else if (percent > 0) newSteps[0].status = "active";

      if (percent >= 50) {
        newSteps[0].status = "completed";
        newSteps[1].status = "completed";
      } else if (percent >= 25) {
        newSteps[1].status = "active";
      }

      if (percent >= 75) {
        newSteps[2].status = "completed";
      } else if (percent >= 50) {
        newSteps[2].status = "active";
      }

      if (percent >= 100) {
        newSteps[3].status = "completed";
      } else if (percent >= 75) {
        newSteps[3].status = "active";
      }

      return newSteps;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {isComplete ? "Your workspace is ready!" : "Finalizing your workspace..."}
        </h2>
        <p className="text-muted-foreground">
          {isComplete
            ? "Redirecting you to your personalized workspace"
            : "We are activating your first context, entities, and insights."}
        </p>
      </motion.div>

      {/* Progress visualization */}
      <div className="w-full space-y-4 mb-8">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
              step.status === "active"
                ? "bg-iw-forest/5 border border-iw-forest/20"
                : step.status === "completed"
                  ? "bg-iw-forest-bright/10 border border-iw-forest-bright/20"
                  : "bg-muted border border-border"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                step.status === "active"
                  ? "bg-iw-forest text-white"
                  : step.status === "completed"
                    ? "bg-iw-forest-bright text-white"
                    : "bg-muted-foreground/20 text-muted-foreground"
              }`}
            >
              {step.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
            </div>

            <div className="flex-1">
              <p
                className={`font-medium ${
                  step.status === "active"
                    ? "text-iw-forest"
                    : step.status === "completed"
                      ? "text-iw-forest-mid"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>

            {step.status === "active" && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-iw-forest rounded-full"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="w-full space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Overall progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-iw-forest to-iw-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Complete state */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8"
          >
            <button
              onClick={onReady}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-iw-forest to-iw-gold text-white rounded-xl font-semibold hover:brightness-95 transition-colors"
            >
              Enter Workspace
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WorkplaceLoading;

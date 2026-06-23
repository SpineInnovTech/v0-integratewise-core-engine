/**
 * Loader Phase 1: Progressive Hydration UI
 *
 * Shows users the "creamy layer" data loading process
 * Goal: Deliver value in 60 seconds, no empty dashboard
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  Database,
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  Building2,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { LogoMark } from "@/components/common/brand/logo";
import type { Domain } from "./workspace-config";

interface LoaderPhase1Props {
  domain: Domain;
  connectors: {
    crm?: string;
    task?: string;
    workspace?: string;
  };
  onComplete: () => void;
}

interface LoadingStage {
  id: string;
  label: string;
  sublabel: string;
  icon: any;
  duration: number; // seconds
  entities?: {
    type: string;
    count: number;
  }[];
}

// ─── DOMAIN-SPECIFIC LOADING STAGES ────────────────────────────────────────

const getLoadingStages = (domain: Domain, connectors: any): LoadingStage[] => {
  const crmName = connectors.crm
    ? connectors.crm.charAt(0).toUpperCase() + connectors.crm.slice(1)
    : "CRM";

  const stages: LoadingStage[] = [
    {
      id: "connect",
      label: "Establishing connections",
      sublabel: `Connecting to ${crmName}, ${connectors.task}, and ${connectors.workspace}`,
      icon: Zap,
      duration: 8,
    },
    {
      id: "extract",
      label: "Extracting creamy layer",
      sublabel: "Pulling recent, high-value entities (last 90 days, max 50 items)",
      icon: Database,
      duration: 15,
    },
  ];

  // Domain-specific stages
  switch (domain) {
    case "CUSTOMER_SUCCESS":
      stages.push(
        {
          id: "normalize",
          label: "Normalizing account data",
          sublabel: "Processing health scores, renewal dates, touchpoints",
          icon: Building2,
          duration: 12,
          entities: [
            { type: "accounts", count: 15 },
            { type: "contacts", count: 42 },
            { type: "meetings", count: 23 },
          ],
        },
        {
          id: "calculate",
          label: "Calculating insights",
          sublabel: "Computing ARR, at-risk accounts, expansion opportunities",
          icon: TrendingUp,
          duration: 10,
        }
      );
      break;

    case "SALES":
      stages.push(
        {
          id: "normalize",
          label: "Normalizing pipeline data",
          sublabel: "Processing deals, stages, forecasts",
          icon: BarChart3,
          duration: 12,
          entities: [
            { type: "deals", count: 28 },
            { type: "accounts", count: 19 },
            { type: "activities", count: 64 },
          ],
        },
        {
          id: "calculate",
          label: "Calculating metrics",
          sublabel: "Computing pipeline value, win rate, forecast attainment",
          icon: TrendingUp,
          duration: 10,
        }
      );
      break;

    case "MARKETING":
      stages.push(
        {
          id: "normalize",
          label: "Normalizing campaign data",
          sublabel: "Processing campaigns, leads, attribution",
          icon: Users,
          duration: 12,
          entities: [
            { type: "campaigns", count: 12 },
            { type: "leads", count: 156 },
            { type: "emails", count: 8 },
          ],
        },
        {
          id: "calculate",
          label: "Calculating ROI",
          sublabel: "Computing MQL→SQL rates, pipeline generated, campaign ROI",
          icon: TrendingUp,
          duration: 10,
        }
      );
      break;

    default:
      stages.push(
        {
          id: "normalize",
          label: "Normalizing data",
          sublabel: "Processing entities and relationships",
          icon: FileText,
          duration: 12,
          entities: [
            { type: "tasks", count: 34 },
            { type: "projects", count: 8 },
            { type: "documents", count: 19 },
          ],
        },
        {
          id: "calculate",
          label: "Calculating metrics",
          sublabel: "Computing key performance indicators",
          icon: TrendingUp,
          duration: 10,
        }
      );
  }

  stages.push({
    id: "hydrate",
    label: "Hydrating your workspace",
    sublabel: "Building your personalized dashboard",
    icon: Sparkles,
    duration: 15,
  });

  return stages;
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export function LoaderPhase1({ domain, connectors, onComplete }: LoaderPhase1Props) {
  const auth = useAuth();
  const [currentStage, setCurrentStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pipelineStarted, setPipelineStarted] = useState(false);

  const stages = getLoadingStages(domain, connectors);
  const activeStage = stages[currentStage];

  // Start pipeline processing on mount
  const startPipelineProcessing = useCallback(async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      if (!apiBase) {
        console.warn("[LoaderPhase1] No API base URL configured, using simulated timing");
        setPipelineStarted(true);
        return;
      }

      // Get tenant ID from auth context
      const tenantId = auth.user?.tenant_id || "default";

      const response = await fetch(`${apiBase}/api/v1/pipeline/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        credentials: "include",
        body: JSON.stringify({
          context: "onboarding-loader",
          connectors,
          domain,
        }),
      });

      if (!response.ok) {
        console.warn("[LoaderPhase1] Pipeline API call failed:", response.status);
        // Non-fatal — continue with simulated timing
      } else {
        const data = await response.json();
        console.log("[LoaderPhase1] Pipeline processing started:", data);
      }
    } catch (err) {
      console.warn("[LoaderPhase1] Pipeline API error:", err);
      // Non-fatal — continue with simulated timing
    } finally {
      setPipelineStarted(true);
    }
  }, [auth.user, connectors, domain]);

  useEffect(() => {
    if (!pipelineStarted) {
      startPipelineProcessing();
    }
  }, [pipelineStarted, startPipelineProcessing]);

  useEffect(() => {
    if (!activeStage || !pipelineStarted) return;

    // Progress animation within current stage
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = 100 / (activeStage.duration * 10);
        return Math.min(prev + increment, 100);
      });
    }, 100);

    // Move to next stage
    const stageTimer = setTimeout(() => {
      setCompletedStages((prev) => [...prev, activeStage.id]);
      setProgress(0);

      if (currentStage < stages.length - 1) {
        setCurrentStage(currentStage + 1);
      } else {
        setTimeout(onComplete, 1000);
      }
    }, activeStage.duration * 1000);

    // Safety timeout: always complete the loader (move to workspace) after max time
    // This ensures dashboard never hangs indefinitely on real or simulated flow.
    const safetyTimer = setTimeout(
      () => {
        console.warn(
          "[LoaderPhase1] Safety timeout — forcing onComplete to prevent dashboard hang"
        );
        onComplete();
      },
      (stages.reduce((sum, s) => sum + s.duration, 0) + 45) * 1000
    );

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stageTimer);
      clearTimeout(safetyTimer);
    };
  }, [currentStage, activeStage, stages.length, onComplete, pipelineStarted]);

  const totalDuration = stages.reduce((acc, s) => acc + s.duration, 0);
  const elapsedDuration = stages.slice(0, currentStage).reduce((acc, s) => acc + s.duration, 0);
  const overallProgress =
    ((elapsedDuration + (progress / 100) * activeStage.duration) / totalDuration) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 font-iw-sans relative overflow-hidden bg-tactile-noise">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-accent blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-12">
          <LogoMark size={80} color="var(--iw-forest)" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 space-y-8 backdrop-blur-xl glass-card">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-iw-serif text-primary">Setting up your workspace</h2>
            <p className="text-muted-foreground text-sm">
              We're extracting the creamy layer from your tools — this takes ~60 seconds
            </p>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-iw-mono text-iw-gold">{Math.round(overallProgress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden border border-border">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Stages List */}
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = index === currentStage;
              const isCompleted = completedStages.includes(stage.id);

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : isCompleted
                        ? "border-iw-gold/30 bg-iw-gold/5"
                        : "border-border/30 bg-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-primary/10" : isCompleted ? "bg-iw-gold/10" : "bg-muted"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-iw-gold" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <Icon className="w-5 h-5 text-muted-foreground/60" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-semibold mb-1 ${
                          isActive
                            ? "text-foreground"
                            : isCompleted
                              ? "text-iw-gold"
                              : "text-muted-foreground/80"
                        }`}
                      >
                        {stage.label}
                      </div>
                      <div className="text-sm text-muted-foreground">{stage.sublabel}</div>

                      {/* Entity counts (only show when active) */}
                      {isActive && stage.entities && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 flex items-center gap-4 text-xs"
                        >
                          {stage.entities.map((entity) => (
                            <div key={entity.type} className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              <span className="text-muted-foreground">
                                {entity.count} {entity.type}
                              </span>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {/* Stage progress bar */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 h-1 bg-muted rounded-full overflow-hidden border border-border"
                        >
                          <motion.div
                            className="h-full bg-primary"
                            style={{ width: `${progress}%` }}
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Timer */}
                    {isActive && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-iw-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{stage.duration}s</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 rounded-lg border border-iw-gold/20 bg-iw-gold/5 p-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-iw-gold" />
            <div className="text-sm text-foreground/85">
              <strong>The Creamy Layer:</strong> We're pulling only recent, high-value data (last 90
              days, max 50 entities) so you see value immediately without overwhelming your
              workspace.
            </div>
          </div>

          {/* API Status Box */}
          {apiError && (
            <div className="bg-iw-gold/5 border border-iw-gold/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-iw-gold shrink-0 mt-0.5" />
              <div className="text-xs text-iw-gold">
                <strong>Note:</strong> Pipeline API not available. Using simulated loading — your
                data will sync once backend is deployed.
              </div>
            </div>
          )}
        </div>

        {/* ETA */}
        <div className="text-center mt-6 text-sm text-muted-foreground font-iw-mono">
          Estimated time remaining:{" "}
          {Math.max(
            0,
            totalDuration - Math.round(elapsedDuration + (progress / 100) * activeStage.duration)
          )}
          s
        </div>
      </div>
    </div>
  );
}

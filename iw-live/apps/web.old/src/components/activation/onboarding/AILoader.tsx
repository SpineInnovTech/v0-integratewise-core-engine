/**
 * AI Loader Component
 *
 * Shows Creamy Layer progress during onboarding Step 5.
 * Displays real-time extraction progress from connected systems.
 */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Database, Sparkles, Loader2 } from "lucide-react";
import { getCreamyProgress, type CreamyProgress } from "@/api/workspace";
import { DOMAIN_EXTRACTION_MESSAGES } from "./domain-messages";

interface AILoaderProps {
  jobId: string;
  connector: string;
  domain: string;
  onComplete: () => void;
}

const ANALYSIS_MESSAGES = [
  "Mapping your source schema...",
  "Extracting high-signal entities...",
  "Linking relationships to your workspace...",
  "Generating first-pass AI insights...",
  "Preparing your knowledge index...",
  "Finalizing setup...",
];

export function AILoader({ jobId, connector, domain, onComplete }: AILoaderProps) {
  const [progress, setProgress] = useState<CreamyProgress | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Select domain-specific messages, fallback to generic.
  // Normalize UPPER domain (CUSTOMER_SUCCESS) or lower to the snake_case keys used here.
  const normDomain = (domain || "").toLowerCase();
  const messages = DOMAIN_EXTRACTION_MESSAGES[normDomain] || ANALYSIS_MESSAGES;

  // REAL USER FLOW ONLY.
  // - If jobId present (real connectors selected and initializeSpine succeeded): STRICT real polling only.
  //   No simulation, no auto-finish on timeout/failure. Errors surfaced for debugging via CZ Verification panel.
  // - If no jobId: simulation (demo/skip mode only).
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let simInterval: NodeJS.Timeout;
    let mounted = true;
    let failedPolls = 0;
    let completed = false;

    const finish = () => {
      if (completed) return;
      completed = true;
      clearInterval(interval);
      clearInterval(simInterval);
      setTimeout(() => mounted && onComplete(), 800);
    };

    // Simulation ONLY for no-jobId (explicit Skip / demo mode).
    // Real user flow (when connectors selected) MUST use real jobId and real backend completion.
    const startSimulation = () => {
      if (completed || simInterval || jobId) return;
      let pct = progress?.progress?.percentage || 0;
      simInterval = setInterval(() => {
        if (!mounted) return;
        pct = Math.min(100, pct + 12);
        setProgress({
          status: pct >= 100 ? "completed" : "processing",
          progress: { percentage: pct, processed: Math.round(pct), total: 100 },
          extractedCount: Math.round(pct * 1.4),
        } as CreamyProgress);
        if (pct >= 100) finish();
      }, 700);
    };

    const checkProgress = async () => {
      if (!jobId) {
        startSimulation(); // only for explicit skip/demo
        return;
      }
      try {
        const data = await getCreamyProgress(jobId);
        if (!mounted) return;
        failedPolls = 0;
        setProgress(data);
        if (data.status === "completed") {
          finish();
        } else if (data.status === "failed") {
          console.error("[AILoader] REAL Creamy job failed for real user flow", data);
          setError("Creamy hydration failed. Check verification panel and backend logs.");
          // Do NOT simulate or auto-finish for real path. Let user see failure.
        }
      } catch (err) {
        failedPolls += 1;
        console.warn("[AILoader] Progress check failed (real flow), attempt", failedPolls, err);
        if (failedPolls >= 12) {
          // high tolerance, then surface error only
          setError(
            "Real creamy job not responding after many polls. Backend may still be processing or failed."
          );
          // no simulation for real jobId
        }
      }
    };

    checkProgress();
    interval = setInterval(checkProgress, 2000);

    // For real jobId: long timeout but only log + error, do not auto-advance or simulate.
    // Real user flow must wait for actual completion or explicit failure.
    const safety = setTimeout(() => {
      if (jobId && !completed) {
        console.error(
          "[AILoader] REAL job timeout after 45s - real user flow did not complete. Do not fake success."
        );
        setError(
          "Real creamy job timed out. Check connectors, pipeline, and verification panel for status."
        );
      }
      // NO startSimulation for real jobId
    }, 45000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearInterval(simInterval);
      clearTimeout(safety);
    };
  }, [jobId, onComplete]);

  // Rotate messages
  useEffect(() => {
    if (!progress || progress.status === "completed") return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [progress?.status]);

  const percentage = progress?.progress?.percentage || 0;
  const currentMessage = messages[messageIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-[440px] max-w-3xl mx-auto space-y-8">
      {/* Animated brain icon */}
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-iw-forest to-iw-gold flex items-center justify-center shadow-lg shadow-iw-forest/25"
        >
          <Brain className="w-12 h-12 text-white" />
        </motion.div>

        {/* Orbiting sparkles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <Sparkles className="w-5 h-5 text-iw-gold-light absolute -top-1 -right-1" />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <Database className="w-4 h-4 text-iw-slate-mid/80 absolute -bottom-1 -left-1" />
        </motion.div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-2 max-w-xl">
        <h3 className="text-2xl font-bold text-foreground">
          {progress?.status === "completed" ? "Analysis Complete!" : `Syncing ${connector}...`}
        </h3>
        <p className="text-muted-foreground">
          {progress?.status === "completed"
            ? "Your workspace intelligence has been prepared."
            : currentMessage}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-iw-forest to-iw-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        {progress && (
          <p className="text-xs text-muted-foreground/70 text-center">
            {progress.progress.processed} of {progress.progress.total} items processed
          </p>
        )}
      </div>

      {/* Stats */}
      {progress && progress.extractedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-iw-forest-mid bg-iw-forest/5 border border-iw-forest/15 px-4 py-2 rounded-full"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{progress.extractedCount} entities extracted</span>
        </motion.div>
      )}

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-iw-red text-sm text-center"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}

export default AILoader;

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Loader2, Zap, Database, GitBranch, Brain, ArrowRight } from "lucide-react";
import { Logo } from "../landing/logo";

interface IntelligenceActivationProps {
  userName: string;
  connectedApps: string[];
  onComplete: () => void;
}

interface ActivationStep {
  id: string;
  label: string;
  description: string;
  status: "pending" | "active" | "complete";
  duration: number;
}

const CONNECTOR_ICONS: Record<string, string> = {
  hubspot: "🧡",
  salesforce: "☁️",
  jira: "🔵",
  airtable: "📊",
  postgresql: "🐘",
  mysql: "🐬",
  notion: "📝",
  "google-drive": "📁",
  confluence: "🌐",
  gmail: "📧",
  slack: "💬",
  sharepoint: "📑",
  chatgpt: "🤖",
  claude: "🧠",
  gemini: "✨",
};

const FLOW_LABELS: Record<string, string> = {
  hubspot: "Flow A",
  salesforce: "Flow A",
  jira: "Flow A",
  airtable: "Flow A",
  postgresql: "Flow A",
  mysql: "Flow A",
  notion: "Flow B",
  "google-drive": "Flow B",
  confluence: "Flow B",
  gmail: "Flow B",
  slack: "Flow B",
  sharepoint: "Flow B",
  chatgpt: "Flow C",
  claude: "Flow C",
  gemini: "Flow C",
};

export function IntelligenceActivation({ userName, connectedApps, onComplete }: IntelligenceActivationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ActivationStep[]>([
    {
      id: "init",
      label: "Initializing Unified Intelligence Layer",
      description: "Setting up your Spine architecture...",
      status: "active",
      duration: 2000,
    },
    {
      id: "connectors",
      label: "Establishing Connector Channels",
      description: `Connecting ${connectedApps.length} integration${connectedApps.length > 1 ? "s" : ""}...`,
      status: "pending",
      duration: 2500,
    },
    {
      id: "flows",
      label: "Configuring Data Flows",
      description: "Mapping Flow A, B, and C pipelines...",
      status: "pending",
      duration: 2000,
    },
    {
      id: "entity",
      label: "Building Entity 360 Fusion Model",
      description: "Creating unified context graph...",
      status: "pending",
      duration: 2500,
    },
    {
      id: "ready",
      label: "Intelligence Layer Active",
      description: "IntegrateWise OS is ready",
      status: "pending",
      duration: 1500,
    },
  ]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const processStep = (index: number) => {
      if (index >= steps.length) {
        // All complete, redirect after delay
        timeoutId = setTimeout(onComplete, 1000);
        return;
      }

      // Mark current as active
      setSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i === index ? "active" : i < index ? "complete" : "pending"
      })));

      // Complete after duration
      timeoutId = setTimeout(() => {
        setSteps(prev => prev.map((s, i) => ({
          ...s,
          status: i === index ? "complete" : s.status
        })));
        
        setCurrentStep(index + 1);
        processStep(index + 1);
      }, steps[index].duration);
    };

    processStep(currentStep);

    return () => clearTimeout(timeoutId);
  }, []);

  const allComplete = steps.every(s => s.status === "complete");

  return (
    <div className="min-h-screen flex bg-[#F3F4F6] relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, #3F5185 1px, transparent 1px),
                           linear-gradient(to bottom, #3F5185 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />
      </div>

      {/* Pulsing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3F5185]/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D46780]/5 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-12"
        >
          <Logo width={40} />
          <span className="text-2xl font-bold text-[#1E2A4A]">
            Integrate<span className="text-[#D46780]">Wise</span>
          </span>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#4256AB] to-[#3F5185] flex items-center justify-center shadow-lg"
              animate={allComplete ? {} : {
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {allComplete ? (
                <CheckCircle2 className="w-10 h-10 text-white" />
              ) : (
                <Zap className="w-10 h-10 text-white" />
              )}
            </motion.div>
            <h1 className="text-2xl font-bold text-[#1E2A4A] mb-2">
              {allComplete ? `Welcome, ${userName}!` : "Activating Intelligence Layer"}
            </h1>
            <p className="text-sm text-[#62748E]">
              {allComplete 
                ? "IntegrateWise is ready to use" 
                : "Setting up your unified intelligence architecture..."}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                  step.status === "active" 
                    ? "bg-[#3F5185]/5 border border-[#3F5185]/20" 
                    : step.status === "complete"
                    ? "bg-[#F3F4F6] border border-[#E2E8F0]"
                    : "bg-transparent border border-[#E2E8F0]/50"
                }`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  step.status === "complete"
                    ? "bg-[#3F5185]/10"
                    : step.status === "active"
                    ? "bg-[#3F5185]/5"
                    : "bg-[#F3F4F6]"
                }`}>
                  {step.status === "complete" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#3F5185]" />
                  ) : step.status === "active" ? (
                    <Loader2 className="w-4 h-4 text-[#3F5185] animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#90A1B9]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm font-semibold ${
                      step.status === "pending" ? "text-[#90A1B9]" : "text-[#1E2A4A]"
                    }`}>
                      {step.label}
                    </h3>
                    {step.status === "active" && (
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="px-2 py-0.5 bg-[#3F5185]/10 rounded-full"
                      >
                        <span className="text-[10px] font-bold text-[#3F5185] uppercase tracking-wider">
                          Processing
                        </span>
                      </motion.div>
                    )}
                  </div>
                  <p className={`text-xs ${
                    step.status === "pending" ? "text-[#90A1B9]" : "text-[#62748E]"
                  }`}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Connector Preview */}
          {currentStep >= 1 && connectedApps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#F3F4F6] border border-[#E2E8F0] rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-4 h-4 text-[#3F5185]" />
                <span className="text-xs font-semibold text-[#45556C] uppercase tracking-wider">
                  Active Connectors
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {connectedApps.map((app, index) => (
                  <motion.div
                    key={app}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2 + index * 0.1 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg"
                  >
                    <span className="text-sm">{CONNECTOR_ICONS[app] || "🔌"}</span>
                    <span className="text-xs font-medium text-[#1E2A4A] capitalize">
                      {app.replace("-", " ")}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#3F5185]/10 text-[#3F5185] rounded font-bold">
                      {FLOW_LABELS[app] || "Flow A"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#62748E]">Overall Progress</span>
              <span className="text-xs font-bold text-[#3F5185]">
                {Math.round((steps.filter(s => s.status === "complete").length / steps.length) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#4256AB] to-[#3F5185]"
                initial={{ width: "0%" }}
                animate={{ 
                  width: `${(steps.filter(s => s.status === "complete").length / steps.length) * 100}%` 
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Bottom info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-[#90A1B9]">
            {allComplete 
              ? "Redirecting to your workspace..." 
              : "This usually takes 10-15 seconds"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
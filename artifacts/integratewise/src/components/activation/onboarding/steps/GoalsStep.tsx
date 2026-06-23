/**
 * Step 3: Goals & Workspace
 *
 * User selects primary goal and creates their first workspace.
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  Database,
  Sparkles,
  Target,
  Users,
  Zap,
  Check,
} from "lucide-react";

interface GoalsStepProps {
  onComplete: (data: { goal: string; workspaceName: string; workspaceType: string }) => void;
  onBack: () => void;
}

const GOALS = [
  {
    id: "organize",
    label: "Organize knowledge",
    icon: Database,
    iconColor: "text-iw-gold",
    bgColor: "bg-iw-gold/5",
  },
  {
    id: "insights",
    label: "Get insights",
    icon: Sparkles,
    iconColor: "text-iw-forest",
    bgColor: "bg-iw-forest/5",
  },
  {
    id: "context",
    label: "Track context",
    icon: Target,
    iconColor: "text-iw-slate",
    bgColor: "bg-iw-slate/5",
  },
  {
    id: "team",
    label: "Improve team",
    icon: Users,
    iconColor: "text-primary",
    bgColor: "bg-primary/5",
  },
  {
    id: "automate",
    label: "Automate work",
    icon: Zap,
    iconColor: "text-iw-gold",
    bgColor: "bg-iw-gold/5",
  },
];

const WORKSPACE_TYPES = [
  { id: "company", label: "Company" },
  { id: "department", label: "Department" },
  { id: "client", label: "Client" },
  { id: "project", label: "Project" },
];

export function GoalsStep({ onComplete, onBack }: GoalsStepProps) {
  const [selectedGoal, setSelectedGoal] = useState<string>("organize");
  const [workspaceName, setWorkspaceName] = useState("Acme Corp");
  const [workspaceType, setWorkspaceType] = useState("client");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedGoal || !workspaceName) return;

    setIsSubmitting(true);
    onComplete({
      goal: selectedGoal,
      workspaceName,
      workspaceType,
    });
    setIsSubmitting(false);
  };

  const canContinue = selectedGoal && workspaceName;

  return (
    <div className="max-w-5xl mx-auto w-full pt-2 font-iw-sans">
      <div className="text-center mb-8">
        <h2 className="text-[28px] md:text-[36px] leading-[1.08] font-iw-serif text-primary mb-3 tracking-[-0.02em]">
          Set your goals & workspace
        </h2>
        <p className="text-[16px] md:text-[18px] leading-[1.12] text-muted-foreground font-medium">
          Choose your primary goal and create your first workspace
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          What would you like help with first?
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {GOALS.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selectedGoal === goal.id;

            return (
              <motion.button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative min-h-[110px] flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-card hover:border-muted-foreground/50"
                }`}
              >
                {isSelected && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                <div
                  className={`w-10 h-10 rounded-lg ${goal.bgColor} flex items-center justify-center mb-2`}
                >
                  <Icon className={`w-5 h-5 ${goal.iconColor}`} strokeWidth={2} />
                </div>
                <span
                  className={`text-[13px] font-semibold text-center leading-tight ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {goal.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border my-6" />

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Create your first workspace</h3>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-foreground mb-2">Workspace Name</label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full h-[48px] px-4 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-card text-foreground text-[15px] font-medium transition-all"
            placeholder="Enter workspace name"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {WORKSPACE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setWorkspaceType(type.id)}
              className={`h-[44px] px-4 rounded-xl border text-[14px] font-semibold transition-all duration-200 ${
                workspaceType === type.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50 bg-card"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={onBack}
          className="h-[48px] min-w-[100px] flex items-center justify-center gap-2 px-5 text-foreground border border-border hover:bg-muted font-semibold rounded-xl bg-card transition-all text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={handleContinue}
          disabled={!canContinue || isSubmitting}
          className={`h-[48px] flex-1 flex items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-all ${
            canContinue && !isSubmitting
              ? "bg-primary text-primary-foreground hover:bg-iw-forest-bright"
              : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
          }`}
        >
          {isSubmitting ? (
            <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default GoalsStep;

"use client";

/**
 * L2 Simulation Panel
 * Run "what-if" predictions with outcome simulations
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import {
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight,
  BarChart3,
  Target,
  Zap,
  History,
} from "lucide-react";

interface PanelProps {
  entityId?: string;
  entityType?: string;
  tenantId?: string;
}

interface SimulationResult {
  id: string;
  scenarioName: string;
  winProbability: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  confidence: number;
  expectedValue: number;
  keyFactors: { factor: string; impact: number }[];
  recommendation: string;
}

interface SimulationRequest {
  id: string;
  entityName: string;
  actionType: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  results?: SimulationResult[];
}

const ACTION_TYPES = [
  { id: "renewal_outreach", label: "Renewal Outreach", icon: "🔄" },
  { id: "upsell_pitch", label: "Upsell Pitch", icon: "📈" },
  { id: "churn_intervention", label: "Churn Intervention", icon: "🚨" },
  { id: "qbr_scheduling", label: "QBR Scheduling", icon: "📅" },
  { id: "executive_escalation", label: "Executive Escalation", icon: "👔" },
];

const riskColor = {
  low: "text-green-600 bg-green-100 dark:bg-green-900/30",
  medium: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
  high: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  critical: "text-red-600 bg-red-100 dark:bg-red-900/30",
};

export function SimulationPanel({ entityType, entityId }: PanelProps) {
  const { data: simulations, isLoading } = useWorkspaceEntities<any>("simulations");
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"run" | "history">("run");
  const [activeResult, setActiveResult] = useState<SimulationResult | null>(null);

  const handleRunSimulation = () => {
    if (!selectedAction) return;
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      const latest = simulations[0]?.results?.[0] || null;
      setActiveResult(latest);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="p-3 border rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-600" />
          Simulation Engine
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Run "what-if" predictions (Clause 1, 4)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("run")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "run"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Run Simulation
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "history"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-muted-foreground"
          }`}
        >
          History
        </button>
      </div>

      {activeTab === "run" && (
        <>
          {/* Action Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Action to Simulate</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTION_TYPES.map((action) => (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  className={`p-3 border rounded-lg text-left flex items-center gap-2 transition-colors ${
                    selectedAction === action.id
                      ? "bg-orange-100 border-orange-300 dark:bg-orange-900/30"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="text-sm">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <Button
            onClick={handleRunSimulation}
            disabled={!selectedAction || isRunning}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isRunning ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                Running Simulation...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Quick Simulation
              </>
            )}
          </Button>

          {/* Results */}
          {activeResult && (
            <div className="space-y-4">
              {/* Primary Result Card */}
              <div className="p-4 border rounded-lg bg-gradient-to-br from-background to-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Win Probability</span>
                  <Badge className={riskColor[activeResult.riskLevel]}>
                    {activeResult.riskLevel} risk
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`text-4xl font-bold ${
                      activeResult.winProbability > 0.7
                        ? "text-green-600"
                        : activeResult.winProbability > 0.5
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {Math.round(activeResult.winProbability * 100)}%
                  </div>
                  <div className="flex-1">
                    <Progress value={activeResult.winProbability * 100} className="h-3" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round(activeResult.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
              </div>

              {/* Expected Value */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${activeResult.expectedValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Expected Value</div>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold">100</div>
                  <div className="text-xs text-muted-foreground">Monte Carlo Runs</div>
                </div>
              </div>

              {/* Key Factors */}
              <div>
                <h4 className="text-sm font-medium mb-2">Key Factors</h4>
                <div className="space-y-2">
                  {activeResult.keyFactors.map((factor, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1 text-sm text-muted-foreground capitalize">
                        {factor.factor.replace(/_/g, " ")}
                      </div>
                      <Progress value={factor.impact * 100} className="w-24 h-2" />
                      <div className="w-12 text-xs text-right">
                        {Math.round(factor.impact * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div
                className={`p-3 rounded-lg flex items-start gap-2 ${
                  activeResult.winProbability > 0.7
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                }`}
              >
                {activeResult.winProbability > 0.7 ? (
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <span className="text-sm">{activeResult.recommendation}</span>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "history" && (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {simulations.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No simulation history</p>
              </div>
            )}
            {simulations.map((sim) => (
              <div
                key={sim.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{sim.entityName}</div>
                    <div className="text-xs text-muted-foreground">
                      {sim.actionType.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={sim.status === "completed" ? "default" : "secondary"}>
                      {sim.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(sim.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                {sim.results && sim.results[0] && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span
                      className={`font-medium ${
                        sim.results[0].winProbability > 0.7 ? "text-green-600" : "text-yellow-600"
                      }`}
                    >
                      {Math.round(sim.results[0].winProbability * 100)}% win
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {sim.results[0].riskLevel} risk
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

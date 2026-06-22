/**
 * GoalAlignmentBar — Persistent bar shown at the top of every L1 module.
 * Shows: North Star progress, department goal alignment, active lens, and drilldown trigger.
 * 
 * This is the visual embodiment of: "Every view traces to org growth."
 */

import { useState } from "react";
import {
  Target, TrendingUp, TrendingDown, ChevronDown, ChevronRight,
  ArrowUpRight, ArrowDownRight, Eye, Building2, Zap, Users,
  Factory, Briefcase
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import { useGoals } from "./goal-context";
import { type CTXEnum } from "../spine/types";
import { type GoalStatus, type Goal, type KPI, getKPIsForGoal, getGoalById } from "./goal-schema";
import { motion, AnimatePresence } from "motion/react";

const STATUS_COLORS: Record<GoalStatus, string> = {
  ON_TRACK: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  AT_RISK: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  OFF_TRACK: "text-red-600 bg-red-50 dark:bg-red-950/30",
  EXCEEDED: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  NOT_STARTED: "text-gray-500 bg-gray-50 dark:bg-gray-950/30",
};

const STATUS_DOT: Record<GoalStatus, string> = {
  ON_TRACK: "bg-emerald-500",
  AT_RISK: "bg-amber-500",
  OFF_TRACK: "bg-red-500",
  EXCEEDED: "bg-blue-500",
  NOT_STARTED: "bg-gray-400",
};

interface GoalAlignmentBarProps {
  activeCtx: CTXEnum;
  moduleName?: string;
}

export function GoalAlignmentBar({ activeCtx, moduleName }: GoalAlignmentBarProps) {
  const goals = useGoals();
  const [expanded, setExpanded] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const deptAlignment = goals.getDeptAlignment(activeCtx);
  const deptGoals = goals.getDeptGoals(activeCtx);
  const northStar = goals.northStar;

  const overallStatus: GoalStatus = deptAlignment.overallScore >= 80 ? "ON_TRACK" 
    : deptAlignment.overallScore >= 60 ? "AT_RISK" : "OFF_TRACK";

  return (
    <div className="border-b border-border bg-card">
      {/* Compact Bar */}
      <div className="px-6 py-2.5 flex items-center gap-4">
        {/* North Star Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">North Star</div>
            <div className="text-xs font-semibold truncate max-w-[160px]">{northStar.name}</div>
          </div>
        </div>

        <div className="w-px h-8 bg-border hidden md:block" />

        {/* Org Type Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          {goals.orgType === "PRODUCT" ? (
            <Badge variant="outline" className="text-[9px] gap-1 py-0.5 font-bold">
              <Factory className="w-3 h-3" /> PRODUCT
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] gap-1 py-0.5 font-bold">
              <Briefcase className="w-3 h-3" /> SERVICES
            </Badge>
          )}
        </div>

        {/* Lens Toggle */}
        <div className="flex p-0.5 bg-secondary rounded-md shrink-0">
          <button
            onClick={() => goals.setActiveLens("PROVIDER")}
            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${
              goals.activeLens === "PROVIDER" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <Building2 className="w-3 h-3" /> Our Growth
          </button>
          <button
            onClick={() => goals.setActiveLens("CLIENT")}
            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${
              goals.activeLens === "CLIENT" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <Users className="w-3 h-3" /> Client Value
          </button>
        </div>

        <div className="w-px h-8 bg-border hidden lg:block" />

        {/* Department Goal Alignment Score */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-2 h-2 rounded-full ${STATUS_DOT[overallStatus]}`} />
            <span className="text-xs font-bold">{deptAlignment.overallScore}%</span>
            <span className="text-[10px] text-muted-foreground hidden lg:inline">Goal Alignment</span>
          </div>

          {/* Mini goal chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {deptAlignment.goalBreakdown.slice(0, 4).map(g => (
              <button
                key={g.goalId}
                onClick={() => { setSelectedGoalId(g.goalId); setExpanded(true); }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium shrink-0 transition-all hover:ring-1 hover:ring-primary/30 ${STATUS_COLORS[g.status]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[g.status]}`} />
                <span className="truncate max-w-[100px]">{g.name}</span>
                {g.trend !== 0 && (
                  g.trend > 0
                    ? <ArrowUpRight className="w-2.5 h-2.5" />
                    : <ArrowDownRight className="w-2.5 h-2.5" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors shrink-0"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Expanded Goal Drilldown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 border-t border-border/50 pt-3">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* North Star Card */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold">North Star</span>
                    <Badge variant="outline" className={`text-[8px] ml-auto ${STATUS_COLORS[northStar.status]}`}>
                      {northStar.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold mb-1">{northStar.name}</h4>
                  <p className="text-[10px] text-muted-foreground mb-3">{northStar.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-bold">{northStar.progress}%</span>
                    </div>
                    <Progress value={northStar.progress} className="h-1.5" />
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Current: <span className="text-foreground font-medium">{northStar.current}</span></span>
                      <span className="text-muted-foreground">Target: <span className="text-foreground font-medium">{northStar.target}</span></span>
                    </div>
                  </div>
                </div>

                {/* Strategic Goals */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Strategic Goals</div>
                  {goals.strategicGoals.map(sg => (
                    <button
                      key={sg.id}
                      onClick={() => setSelectedGoalId(sg.id === selectedGoalId ? null : sg.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                        selectedGoalId === sg.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold truncate mr-2">{sg.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[sg.status]}`} />
                          <span className="text-[10px] font-bold">{sg.progress}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${sg.status === "ON_TRACK" ? "bg-emerald-500" : sg.status === "AT_RISK" ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${sg.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[9px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          {sg.lens === "PROVIDER" ? <Building2 className="w-2.5 h-2.5" /> : sg.lens === "CLIENT" ? <Users className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                          {sg.lens === "BOTH" ? "Both Lenses" : sg.lens === "PROVIDER" ? "Our Growth" : "Client Value"}
                        </span>
                        <span className={`flex items-center gap-0.5 font-medium ${sg.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {sg.trend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                          {Math.abs(sg.trend)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Department KPIs (for this CTX) */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Department KPIs</div>
                  <ScrollArea className="max-h-[220px]">
                    <div className="space-y-2 pr-2">
                      {goals.getDeptKPIs(activeCtx).length > 0 ? (
                        goals.getDeptKPIs(activeCtx).map(kpi => (
                          <KPICard key={kpi.id} kpi={kpi} />
                        ))
                      ) : (
                        // Show all KPIs if no department-specific ones
                        goals.allKPIs.slice(0, 6).map(kpi => (
                          <KPICard key={kpi.id} kpi={kpi} />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Goal Trace Path */}
              {selectedGoalId && (
                <GoalTracePath orgType={goals.orgType} goalId={selectedGoalId} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ kpi }: { kpi: KPI }) {
  const pct = Math.min(100, Math.round((kpi.currentValue / kpi.targetValue) * 100));

  return (
    <div className="p-2.5 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold truncate mr-2">{kpi.name}</span>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[kpi.status]}`} />
      </div>
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="text-lg font-bold tracking-tight">
          {kpi.unit === "$" ? `$${(kpi.currentValue >= 1000000 ? (kpi.currentValue / 1000000).toFixed(1) + "M" : kpi.currentValue >= 1000 ? (kpi.currentValue / 1000).toFixed(0) + "K" : kpi.currentValue)}` :
           kpi.unit === "%" ? `${kpi.currentValue}%` :
           kpi.unit === "x" ? `${kpi.currentValue}x` :
           `${kpi.currentValue}${kpi.unit === "score" ? "" : ` ${kpi.unit}`}`}
        </span>
        <span className="text-[9px] text-muted-foreground">
          / {kpi.unit === "$" ? `$${(kpi.targetValue >= 1000000 ? (kpi.targetValue / 1000000).toFixed(1) + "M" : kpi.targetValue >= 1000 ? (kpi.targetValue / 1000).toFixed(0) + "K" : kpi.targetValue)}` :
              kpi.unit === "%" ? `${kpi.targetValue}%` :
              kpi.unit === "x" ? `${kpi.targetValue}x` :
              `${kpi.targetValue}`}
        </span>
        <span className={`text-[9px] font-bold flex items-center gap-0.5 ml-auto ${kpi.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {kpi.trend >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
          {Math.abs(kpi.trend)}%
        </span>
      </div>
      {/* Sparkline */}
      {kpi.sparkline && kpi.sparkline.length > 0 && (
        <div className="flex items-end gap-px h-3 mt-1">
          {kpi.sparkline.map((v, i) => {
            const max = Math.max(...kpi.sparkline!);
            const min = Math.min(...kpi.sparkline!);
            const range = max - min || 1;
            const height = Math.max(2, ((v - min) / range) * 12);
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm ${i === kpi.sparkline!.length - 1 ? "bg-primary" : "bg-primary/30"}`}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Goal Trace Path ─────────────────────────────────────────────────────────

function GoalTracePath({ orgType, goalId }: { orgType: string; goalId: string }) {
  const goals = useGoals();
  const tracePath = goals.traceToNorthStar(goalId);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-3 rounded-lg bg-secondary/30 border border-border"
    >
      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
        Goal Trace → North Star
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {tracePath.map((id, i) => {
          const goal = goals.allGoals.find(g => g.id === id);
          if (!goal) return null;
          return (
            <div key={id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${
                goal.tier === "NORTH_STAR" ? "bg-primary/10 text-primary border border-primary/20" :
                goal.tier === "STRATEGIC" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" :
                "bg-card border border-border"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[goal.status]}`} />
                {goal.name}
                <span className="text-[8px] opacity-60">({goal.progress}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
/**
 * Goal Context — React Provider for Goal-Anchored Architecture
 * 
 * Makes orgType, goalTree, and KPIs available throughout the app.
 * Every L1 module reads from this to know what goals it serves.
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import {
  type OrgType, type MeasurementLens, type Goal, type KPI,
  getGoalTree, getKPIs, getNorthStar, getStrategicGoals,
  getDepartmentGoals, getGoalsByLens, getKPIsForGoal,
  computeGoalAlignment, getEntityGoalRefs, traceGoalToNorthStar,
  type EntityGoalRef, type GoalStatus,
} from "./goal-schema";

// ─── Context Shape ───────────────────────────────────────────────────────────

interface GoalContextValue {
  orgType: OrgType;
  setOrgType: (type: OrgType) => void;
  activeLens: MeasurementLens;
  setActiveLens: (lens: MeasurementLens) => void;
  
  // Goal Tree Access
  northStar: Goal;
  strategicGoals: Goal[];
  allGoals: Goal[];
  allKPIs: KPI[];
  
  // Department-scoped
  getDeptGoals: (department: string) => Goal[];
  getDeptKPIs: (department: string) => KPI[];
  getDeptAlignment: (department: string) => {
    overallScore: number;
    goalBreakdown: { goalId: string; name: string; score: number; status: GoalStatus; trend: number }[];
    northStarContribution: number;
  };
  
  // Entity-level
  getEntityGoals: (department: string, entityType: string) => EntityGoalRef[];
  traceToNorthStar: (goalId: string) => string[];
  
  // Lens-filtered
  getGoalsForLens: (lens: MeasurementLens) => Goal[];
}

const GoalContext = createContext<GoalContextValue | null>(null);

export function useGoals() {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error("useGoals must be used within GoalProvider");
  return ctx;
}

// Safe version that returns defaults when outside provider
export function useGoalsSafe() {
  const ctx = useContext(GoalContext);
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function GoalProvider({ children, initialOrgType = "PRODUCT" }: { children: ReactNode; initialOrgType?: OrgType }) {
  const [orgType, setOrgType] = useState<OrgType>(initialOrgType);
  const [activeLens, setActiveLens] = useState<MeasurementLens>("PROVIDER");

  // Sync with parent when initialOrgType changes
  useEffect(() => {
    setOrgType(initialOrgType);
  }, [initialOrgType]);

  const northStar = useMemo(() => getNorthStar(orgType), [orgType]);
  const strategicGoals = useMemo(() => getStrategicGoals(orgType), [orgType]);
  const allGoals = useMemo(() => getGoalTree(orgType), [orgType]);
  const allKPIs = useMemo(() => getKPIs(orgType), [orgType]);

  const getDeptGoals = useCallback((department: string) => getDepartmentGoals(orgType, department), [orgType]);
  
  const getDeptKPIs = useCallback((department: string) => {
    const deptGoals = getDepartmentGoals(orgType, department);
    const goalIds = new Set(deptGoals.map(g => g.id));
    return getKPIs(orgType).filter(k => goalIds.has(k.goalId));
  }, [orgType]);

  const getDeptAlignment = useCallback((department: string) => computeGoalAlignment(orgType, department), [orgType]);
  const getEntityGoals = useCallback((department: string, entityType: string) => getEntityGoalRefs(orgType, department, entityType), [orgType]);
  const traceToNorthStar = useCallback((goalId: string) => traceGoalToNorthStar(orgType, goalId), [orgType]);
  const getGoalsForLens = useCallback((lens: MeasurementLens) => getGoalsByLens(orgType, lens), [orgType]);

  const value: GoalContextValue = {
    orgType, setOrgType, activeLens, setActiveLens,
    northStar, strategicGoals, allGoals, allKPIs,
    getDeptGoals, getDeptKPIs, getDeptAlignment,
    getEntityGoals, traceToNorthStar, getGoalsForLens,
  };

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}
/**
 * useAccelerator — React hook for Domain Accelerator data.
 *
 * Wraps the Hydration Fabric's accelerator slots with a typed API.
 * Falls back to direct API calls if Fabric is unavailable.
 *
 * Six accelerators (v3.6 §12):
 *   1. health_score      — Account Health (CS domain)
 *   2. churn_prediction   — Churn Risk (CS domain)
 *   3. revenue_forecast   — Revenue Forecast (RevOps domain)
 *   4. pipeline_velocity  — Pipeline Velocity (Sales domain)
 *   5. nps_analysis       — NPS Analysis (cross-domain)
 *   6. data_quality       — Data Quality (cross-domain)
 *
 * Hydration slots: accelerator.{name}
 * API routes:      /api/v1/intelligence/accelerator/{slug}
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { accelerator as acceleratorApi } from "@/lib/api-client";

// ── Types ────────────────────────────────────────────────────────────────────

export type AcceleratorType =
  | "health_score"
  | "churn_prediction"
  | "revenue_forecast"
  | "pipeline_velocity"
  | "nps_analysis"
  | "data_quality";

export interface AcceleratorResult<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  lastUpdated: number | null;
}

export interface HealthScoreData {
  score: number;
  trend: "improving" | "stable" | "declining";
  factors: Array<{ name: string; impact: number; direction: "positive" | "negative" }>;
  entityId?: string;
}

export interface ChurnPredictionData {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  predictedChurnDate?: string;
  topFactors: Array<{ name: string; weight: number }>;
  confidence: number;
}

export interface RevenueForecastData {
  forecastedMrr: number;
  forecastedArr: number;
  nrr: number;
  grr: number;
  growthRate: number;
  period: string;
  confidence: number;
}

export interface PipelineVelocityData {
  avgDealCycle: number;
  winRate: number;
  avgDealSize: number;
  velocity: number;
  trend: "accelerating" | "stable" | "slowing";
  stageConversion: Array<{ stage: string; rate: number }>;
}

export interface NpsAnalysisData {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  trend: "improving" | "stable" | "declining";
  themes: Array<{ topic: string; sentiment: "positive" | "negative"; count: number }>;
}

export interface DataQualityData {
  overallScore: number;
  completeness: number;
  accuracy: number;
  freshness: number;
  consistency: number;
  issues: Array<{
    field: string;
    type: string;
    count: number;
    severity: "low" | "medium" | "high";
  }>;
}

// ── API method mapping ───────────────────────────────────────────────────────

const API_MAP: Record<AcceleratorType, (params?: any) => Promise<any>> = {
  health_score: acceleratorApi.healthScore,
  churn_prediction: acceleratorApi.churnPrediction,
  revenue_forecast: acceleratorApi.revenueForecast,
  pipeline_velocity: acceleratorApi.pipelineVelocity,
  nps_analysis: acceleratorApi.npsAnalysis,
  data_quality: acceleratorApi.dataQuality,
};

// ── Fallback data (used when backend is unavailable) ─────────────────────────

const FALLBACK_DATA: Record<AcceleratorType, any> = {
  health_score: {
    score: 72,
    trend: "stable",
    factors: [
      { name: "Product adoption", impact: 0.85, direction: "positive" },
      { name: "Support tickets", impact: -0.12, direction: "negative" },
      { name: "Feature usage", impact: 0.65, direction: "positive" },
    ],
  } as HealthScoreData,
  churn_prediction: {
    riskScore: 0.23,
    riskLevel: "medium",
    topFactors: [
      { name: "Declining logins", weight: 0.35 },
      { name: "Support escalations", weight: 0.25 },
    ],
    confidence: 0.78,
  } as ChurnPredictionData,
  revenue_forecast: {
    forecastedMrr: 0,
    forecastedArr: 0,
    nrr: 100,
    grr: 95,
    growthRate: 0,
    period: "current",
    confidence: 0.5,
  } as RevenueForecastData,
  pipeline_velocity: {
    avgDealCycle: 0,
    winRate: 0,
    avgDealSize: 0,
    velocity: 0,
    trend: "stable",
    stageConversion: [],
  } as PipelineVelocityData,
  nps_analysis: {
    score: 0,
    promoters: 0,
    passives: 0,
    detractors: 0,
    trend: "stable",
    themes: [],
  } as NpsAnalysisData,
  data_quality: {
    overallScore: 0,
    completeness: 0,
    accuracy: 0,
    freshness: 0,
    consistency: 0,
    issues: [],
  } as DataQualityData,
};

// ── API → Frontend transform adapters ────────────────────────────────────────
// The Think service returns different field names/structures than the frontend
// interfaces. These adapters centralize the mapping so components don't break.

function transformHealthScore(raw: any): HealthScoreData {
  return {
    score: raw.score ?? 0,
    trend: raw.trend ?? "stable",
    factors: (raw.factors || []).map((f: any) => ({
      name: f.name,
      impact: f.weight ?? f.impact ?? 0,
      direction: (f.value ?? 0) >= 50 ? ("positive" as const) : ("negative" as const),
    })),
    entityId: raw.entityId,
  };
}

function transformChurnPrediction(raw: any): ChurnPredictionData {
  return {
    riskScore: raw.riskScore ?? 0,
    riskLevel: raw.riskBand ?? raw.riskLevel ?? "low",
    predictedChurnDate: raw.predictedChurnDate,
    topFactors: (raw.factors || raw.topFactors || []).map((f: any) => ({
      name: f.name,
      weight: f.weight ?? 0,
    })),
    confidence: raw.confidence ?? 0,
  };
}

function transformRevenueForecast(raw: any): RevenueForecastData {
  return {
    forecastedMrr: raw.weightedForecast ?? raw.forecastedMrr ?? 0,
    forecastedArr: (raw.weightedForecast ?? 0) * 12 || raw.forecastedArr || 0,
    nrr: raw.nrr ?? 100,
    grr: raw.grr ?? 95,
    growthRate: raw.growthRate ?? 0,
    period: raw.period ?? "current",
    confidence: raw.confidence ?? 0,
  };
}

function transformPipelineVelocity(raw: any): PipelineVelocityData {
  // API returns stageConversions as Record<string,number>, frontend expects Array<{stage,rate}>
  const conversions = raw.stageConversions || {};
  const stageConversion = Object.entries(conversions).map(([stage, rate]) => ({
    stage,
    rate: rate as number,
  }));
  return {
    avgDealCycle: raw.avgDaysToClose ?? raw.avgDealCycle ?? 0,
    winRate: raw.winRate ?? (conversions.closed_won || 0),
    avgDealSize: raw.avgDealSize ?? 0,
    velocity: raw.velocity ?? 0,
    trend: raw.trend ?? "stable",
    stageConversion,
  };
}

function transformNpsAnalysis(raw: any): NpsAnalysisData {
  // API nests promoters/passives/detractors inside distribution{}
  const dist = raw.distribution || {};
  return {
    score: raw.npsScore ?? raw.score ?? 0,
    promoters: dist.promoters ?? raw.promoters ?? 0,
    passives: dist.passives ?? raw.passives ?? 0,
    detractors: dist.detractors ?? raw.detractors ?? 0,
    trend: raw.trend ?? "stable",
    themes: (raw.topDrivers || raw.themes || []).map((d: any) => ({
      topic: d.factor ?? d.topic ?? "",
      sentiment: (d.impact ?? 0) > 0 ? ("positive" as const) : ("negative" as const),
      count: d.count ?? Math.round((d.impact ?? 0) * 100),
    })),
  };
}

function transformDataQuality(raw: any): DataQualityData {
  // API nests scores inside dimensions{}
  const dims = raw.dimensions || {};
  return {
    overallScore: raw.overallScore ?? 0,
    completeness: dims.completeness ?? raw.completeness ?? 0,
    accuracy: dims.accuracy ?? raw.accuracy ?? 0,
    freshness: dims.freshness ?? raw.freshness ?? 0,
    consistency: dims.consistency ?? raw.consistency ?? 0,
    issues: (raw.topIssues || raw.issues || []).map((i: any) => ({
      field: i.field ?? "",
      type: i.issue ?? i.type ?? "",
      count: i.count ?? 1,
      severity: i.severity ?? "low",
    })),
  };
}

const TRANSFORM_MAP: Record<AcceleratorType, (raw: any) => any> = {
  health_score: transformHealthScore,
  churn_prediction: transformChurnPrediction,
  revenue_forecast: transformRevenueForecast,
  pipeline_velocity: transformPipelineVelocity,
  nps_analysis: transformNpsAnalysis,
  data_quality: transformDataQuality,
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAccelerator<T = any>(
  type: AcceleratorType,
  params?: Record<string, any>
): AcceleratorResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const apiFn = API_MAP[type];
      if (!apiFn) throw new Error(`Unknown accelerator: ${type}`);

      const result = await apiFn(params);

      if (!controller.signal.aborted) {
        // Transform API response shape → frontend interface shape
        const transform = TRANSFORM_MAP[type];
        const transformed = result ? transform(result) : FALLBACK_DATA[type];
        setData((transformed as T) ?? (FALLBACK_DATA[type] as T));
        setLastUpdated(Date.now());
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      if (!abortRef.current?.signal.aborted) {
        console.warn(`[useAccelerator] ${type} failed, using fallback:`, err?.message);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Graceful degradation → serve fallback data
        setData(FALLBACK_DATA[type] as T);
        setLastUpdated(Date.now());
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [type, JSON.stringify(params)]);

  useEffect(() => {
    fetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetch]);

  return { data, loading, error, refetch: fetch, lastUpdated };
}

/**
 * Convenience hooks for each accelerator — typed returns.
 */
export const useHealthScore = (params?: { entity_id?: string; domain?: string }) =>
  useAccelerator<HealthScoreData>("health_score", params);

export const useChurnPrediction = (params?: { entity_id?: string; horizon_days?: number }) =>
  useAccelerator<ChurnPredictionData>("churn_prediction", params);

export const useRevenueForecast = (params?: { period?: string; segment?: string }) =>
  useAccelerator<RevenueForecastData>("revenue_forecast", params);

export const usePipelineVelocity = (params?: { pipeline_id?: string }) =>
  useAccelerator<PipelineVelocityData>("pipeline_velocity", params);

export const useNpsAnalysis = (params?: { segment?: string; period?: string }) =>
  useAccelerator<NpsAnalysisData>("nps_analysis", params);

export const useDataQuality = (params?: { domain?: string; entity_type?: string }) =>
  useAccelerator<DataQualityData>("data_quality", params);

export default useAccelerator;

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

export interface Deal {
  id: string;
  name: string;
  value?: number;
  stage?: string;
  status?: "at_risk" | "normal" | "closed";
  probability?: number;
  owner?: string;
  account?: string;
  account_id?: string;
  close_date?: string;
  closeDate?: string;
  created_at?: string;
  type?: string;
  daysInStage?: number;
  nextAction?: string;
}

export type DealData = Deal;

export interface UseDealsResult {
  deals: Deal[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDeals(filters?: Record<string, any>): UseDealsResult {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ entity_type: "deal" });
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null) params.append(k, String(v));
        });
      }
      const res = await apiFetch<{ entities?: any[] }>(
        `/api/v1/workspace/entities?${params.toString()}`,
        {},
        "Deals"
      );
      const entities = res.entities || [];
      const mapped: Deal[] = entities.map((e: any) => ({
        id: e.id || e.entity_id || "",
        name: e.name || e.fields?.name || "",
        value: e.amount || e.fields?.amount || e.value || e.fields?.value,
        stage: e.stage || e.fields?.stage,
        status: e.status || e.fields?.status,
        probability: e.probability || e.fields?.probability,
        owner: e.owner || e.fields?.owner,
        account: e.account || e.fields?.account,
        account_id: e.account_id || e.fields?.account_id,
        close_date: e.close_date || e.fields?.close_date,
        closeDate: e.close_date || e.fields?.close_date,
        created_at: e.created_at,
        type: e.type || e.fields?.type,
        daysInStage: e.days_in_stage || e.fields?.days_in_stage,
        nextAction: e.next_action || e.fields?.next_action,
      }));
      setDeals(mapped);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { deals, isLoading, error, refetch };
}

export default useDeals;

/**
 * use-demo-data.ts — Hook to check/manage demo seed data
 *
 * Calls the `has_demo_data()` RPC to check if the current tenant
 * has demo data, and provides a `cleanup()` method that calls
 * `cleanup_demo_data()` to remove it all.
 *
 * @see sql-migrations/078_demo_data_system.sql
 */
import { useState, useEffect, useCallback } from "react";
import { spineClient } from "@/utils/spine/client";

export interface DemoDataState {
  /** Whether the tenant currently has demo data */
  hasDemoData: boolean;
  /** Initial check in progress */
  isLoading: boolean;
  /** Cleanup in progress */
  isCleaning: boolean;
  /** Remove all demo data and reload views */
  cleanup: () => Promise<void>;
}

export function useDemoData(): DemoDataState {
  const [hasDemoData, setHasDemoData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { data, error } = await spineClient.rpc("has_demo_data");
        if (!cancelled && !error) {
          setHasDemoData(!!data);
        }
      } catch {
        // Silent — if RPC doesn't exist yet, assume no demo data
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const cleanup = useCallback(async () => {
    setIsCleaning(true);
    try {
      const { error } = await spineClient.rpc("cleanup_demo_data");
      if (!error) {
        setHasDemoData(false);
        // Force-reload all views so they refetch data
        window.location.reload();
      } else {
        console.error("[useDemoData] cleanup failed:", error.message);
      }
    } catch (e: any) {
      console.error("[useDemoData] cleanup error:", e?.message);
    } finally {
      setIsCleaning(false);
    }
  }, []);

  return { hasDemoData, isLoading, isCleaning, cleanup };
}

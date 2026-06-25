"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api-client";

export function useAdminApi<T>(url: string) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await apiFetch<T>(url, {}, "Admin");
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [url, reloadToken]);

  return {
    data,
    loading,
    error,
    reload: () => setReloadToken((v) => v + 1),
  };
}

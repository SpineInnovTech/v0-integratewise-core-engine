/**
 * useSchemaDashboard Hook
 *
 * Fetches schema-driven dashboard data from BFF.
 * The BFF transforms technical schema names to organic UI labels.
 *
 * PRINCIPLE: Frontend NEVER sees entity_type or field names.
 * Only organic labels flow to the UI.
 */

import { useQuery } from "@tanstack/react-query";

// Types matching BFF response
interface BFFDashboardResponse {
  view: {
    department: string;
    industry?: string | null;
    sections: Array<{
      id: string;
      title: string;
      description: string;
      icon?: string;
      entity_count?: number;
    }>;
    entities: Array<{
      display_name: string;
      section_id: string;
      fields: Array<{
        label: string;
        value: unknown;
        type: string;
        format?: Record<string, unknown>;
      }>;
    }>;
    summary: {
      total_entities: number;
      entity_types: string[];
      last_updated: string;
    };
  };
  meta: {
    schema_version: string;
    department: string;
    entity_count: number;
  };
}

interface UseSchemaDashboardOptions {
  tenantId: string;
  department: string;
  /** Specific section to filter to */
  section?: string;
  /** Polling interval in ms (default: 30000) */
  refreshInterval?: number;
  /** Enable/disable query */
  enabled?: boolean;
}

/**
 * Fetch dashboard data from BFF
 *
 * The BFF:
 * 1. Reads tenant schema from cache/database
 * 2. Fetches entities from Spine
 * 3. Transforms technical names to organic labels
 * 4. Returns UI-ready view
 */
async function fetchDashboard(
  tenantId: string,
  department: string,
  section?: string
): Promise<BFFDashboardResponse> {
  const params = new URLSearchParams({
    department,
    tenant_id: tenantId,
  });

  if (section) {
    params.set("section", section);
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/bff/v1/dashboard?${params.toString()}`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook for schema-driven dashboard data
 *
 * Usage:
 * ```tsx
 * const { view, isLoading, error } = useSchemaDashboard({
 *   tenantId: 'xxx',
 *   department: 'CUSTOMER_SUCCESS'
 * });
 *
 * return <SchemaDashboard view={view} isLoading={isLoading} />;
 * ```
 */
export function useSchemaDashboard(options: UseSchemaDashboardOptions) {
  const { tenantId, department, section, refreshInterval = 30000, enabled = true } = options;

  const query = useQuery({
    queryKey: ["schema-dashboard", tenantId, department, section],
    queryFn: () => fetchDashboard(tenantId, department, section),
    enabled: enabled && !!tenantId && !!department,
    refetchInterval: refreshInterval,
    staleTime: 10000, // 10 seconds
  });

  return {
    /** Dashboard view (organic labels only) */
    view: query.data?.view,
    /** Metadata about schema */
    meta: query.data?.meta,
    /** Loading state */
    isLoading: query.isLoading,
    /** Error state */
    error: query.error,
    /** Refetch function */
    refetch: query.refetch,
  };
}

export default useSchemaDashboard;

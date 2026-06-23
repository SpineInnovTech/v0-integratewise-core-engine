export interface SchemaUpdaterEnv {
  supabaseUrl?: string;
  serviceRoleKey?: string;
}

export interface ObserveAdaptiveSchemaFieldsParams extends SchemaUpdaterEnv {
  tenantId: string;
  entityType: string;
  sourceSystem: string;
  data: Record<string, unknown>;
}

export interface SyncTenantConnectedConnectorsParams extends SchemaUpdaterEnv {
  tenantId: string;
  connectorIds: string[];
  mode?: "replace" | "merge" | "remove";
  metadata?: Record<string, any>;
}

interface TenantSpineConfigRow {
  tenant_id: string;
  domains?: string[] | null;
  active_ctx?: string | null;
  schema_version?: string | null;
  depth_matrix_snapshot?: Record<string, unknown> | null;
  connected_connectors?: string[] | null;
  industry?: string | null;
  company_size?: string | null;
  user_type?: string | null;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function connectorEquals(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function inferDataType(value: unknown): string {
  if (value === null || value === undefined) return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value) || typeof value === "object") return "json";
  return "string";
}

async function restRequest(
  env: SchemaUpdaterEnv,
  path: string,
  init?: RequestInit
): Promise<Response | null> {
  if (!env.supabaseUrl || !env.serviceRoleKey) return null;
  try {
    const response = await fetch(`${env.supabaseUrl}${path}`, {
      ...init,
      headers: {
        apikey: env.serviceRoleKey,
        Authorization: `Bearer ${env.serviceRoleKey}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    return response;
  } catch {
    return null;
  }
}

async function fetchTenantSpineConfig(
  env: SchemaUpdaterEnv,
  tenantId: string
): Promise<TenantSpineConfigRow | null> {
  const response = await restRequest(
    env,
    `/rest/v1/tenant_spine_config?tenant_id=eq.${encodeURIComponent(
      tenantId
    )}&select=tenant_id,domains,active_ctx,schema_version,depth_matrix_snapshot,connected_connectors,industry,company_size,user_type`
  );
  if (!response?.ok) return null;
  const rows = (await response.json()) as TenantSpineConfigRow[];
  return rows[0] || null;
}

export async function observeAdaptiveSchemaFields(
  params: ObserveAdaptiveSchemaFieldsParams
): Promise<void> {
  if (!params.tenantId || !params.entityType || !params.data) return;

  const fields = Object.entries(params.data).filter(
    ([key, value]) => !key.startsWith("_") && value !== undefined
  );
  if (fields.length === 0) return;

  await Promise.allSettled(
    fields.map(async ([fieldKey, value]) => {
      const response = await restRequest(params, "/rest/v1/rpc/record_spine_field_observation", {
        method: "POST",
        body: JSON.stringify({
          p_tenant_id: params.tenantId,
          p_entity_type: params.entityType,
          p_field_key: fieldKey,
          p_field_path: fieldKey,
          p_data_type: inferDataType(value),
          p_sample_value: value == null ? null : String(value).slice(0, 200),
          p_source_system: params.sourceSystem,
        }),
      });

      if (!response?.ok) {
        throw new Error(`Observation RPC failed for ${fieldKey}`);
      }
    })
  );
}

export async function syncTenantConnectedConnectors(
  params: SyncTenantConnectedConnectorsParams
): Promise<string[]> {
  const { tenantId, connectorIds, mode = "merge", metadata } = params;
  if (!tenantId) return [];

  const existing = await fetchTenantSpineConfig(params, tenantId);
  const currentConnectors = Array.isArray(existing?.connected_connectors)
    ? existing.connected_connectors.filter(Boolean)
    : [];
  const requested = unique(connectorIds);

  let nextConnectors = currentConnectors;
  if (mode === "replace") {
    nextConnectors = requested;
  } else if (mode === "remove") {
    nextConnectors = currentConnectors.filter(
      (current) => !requested.some((candidate) => connectorEquals(candidate, current))
    );
  } else {
    nextConnectors = unique([...currentConnectors, ...requested]);
  }

  // Build connector metadata map for flow classification
  const connectorMetadata: Record<string, any> = {};
  if (metadata?.flowType && requested.length > 0) {
    requested.forEach((id) => {
      connectorMetadata[id] = { flowType: metadata.flowType };
    });
  }

  const nextDepthMatrix =
    existing?.depth_matrix_snapshot && typeof existing.depth_matrix_snapshot === "object"
      ? {
          ...existing.depth_matrix_snapshot,
          connected_connectors: nextConnectors,
          connector_metadata: {
            ...(existing.depth_matrix_snapshot as any)?.connector_metadata,
            ...connectorMetadata,
          },
        }
      : {
          connected_connectors: nextConnectors,
          connector_metadata: connectorMetadata,
        };

  const timestamp = new Date().toISOString();
  const body = existing
    ? {
        connected_connectors: nextConnectors,
        depth_matrix_snapshot: nextDepthMatrix,
        updated_at: timestamp,
      }
    : {
        tenant_id: tenantId,
        domains: [],
        active_ctx: "CTX_BIZOPS",
        schema_version: "1",
        depth_matrix_snapshot: nextDepthMatrix,
        connected_connectors: nextConnectors,
        updated_at: timestamp,
      };

  const response = existing
    ? await restRequest(
        params,
        `/rest/v1/tenant_spine_config?tenant_id=eq.${encodeURIComponent(tenantId)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(body),
        }
      )
    : await restRequest(params, "/rest/v1/tenant_spine_config?on_conflict=tenant_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(body),
      });

  if (!response?.ok) {
    const message = response ? await response.text().catch(() => "") : "request failed";
    throw new Error(`Failed to sync connected connectors for tenant ${tenantId}: ${message}`);
  }

  return nextConnectors;
}

export async function syncTenantConnectedConnector(
  params: SchemaUpdaterEnv & {
    tenantId: string;
    connectorId: string;
    connected: boolean;
    flowType?: "A" | "B" | "C";
  }
): Promise<string[]> {
  return syncTenantConnectedConnectors({
    ...params,
    connectorIds: [params.connectorId],
    mode: params.connected ? "merge" : "remove",
    metadata: params.flowType ? { flowType: params.flowType } : undefined,
  });
}

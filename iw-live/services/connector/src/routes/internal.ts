/**
 * Connector Internal Routes
 * Handles: initialize-spine, schema management
 *
 * Post-migration 079: All schema writes go to `tenant_spine_config` (the SSOT).
 * The old `tenant_schema_configs` table was never created in production.
 */

import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../types";
import { createConnectSession, deleteNangoConnection, toNangoIntegrationId } from "../lib/nango";

const app = new Hono<{ Bindings: Env }>();

// ─── Nango: Session Token ─────────────────────────────────────────────────────

const NangoSessionSchema = z.object({
  integration_id: z.string().min(1), // e.g. "slack", "jira", "notion"
});

/**
 * POST /internal/nango/session
 *
 * Called by the frontend before showing the Nango Connect UI.
 * Returns a short-lived session token that the frontend passes to the UI.
 *
 * The connectionId is always our tenant_id — one Nango connection per
 * tenant+integration pair.
 */
app.post("/internal/nango/session", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();

  if (!tenantId) return c.json({ error: "Missing tenant ID" }, 400);
  if (!c.env.NANGO_SECRET_KEY) {
    return c.json(
      {
        error: "Nango not configured",
        hint: "Set NANGO_SECRET_KEY. In Nango dashboard register integrations for the providers in the map (hubspot, jira etc.) using their OAuth client secrets. This enables real user connections.",
      },
      503
    );
  }

  try {
    const body = await c.req.json();
    const { integration_id } = NangoSessionSchema.parse(body);
    const nangoIntegrationId = toNangoIntegrationId(integration_id);

    const session = await createConnectSession(
      {
        NANGO_SECRET_KEY: c.env.NANGO_SECRET_KEY as string,
        NANGO_BASE_URL: c.env.NANGO_BASE_URL as string | undefined,
      },
      {
        integrationId: nangoIntegrationId,
        connectionId: `${tenantId}`,
        metadata: { tenant_id: tenantId },
      }
    );

    return c.json({
      session_token: session.token,
      expires_at: session.expires_at,
      integration_id: nangoIntegrationId,
      correlation_id: correlationId,
    });
  } catch (err) {
    console.error("[Connector] Nango session error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Failed to create Nango session" },
      500
    );
  }
});

// ─── Nango: Disconnect ────────────────────────────────────────────────────────

const NangoDisconnectSchema = z.object({
  integration_id: z.string().min(1),
});

/**
 * POST /internal/nango/disconnect
 *
 * Called when a user disconnects a tool from the settings page.
 * Deletes the Nango connection and marks the connector as disconnected in D1 (CF-only store).
 */
app.post("/internal/nango/disconnect", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "Missing tenant ID" }, 400);
  if (!c.env.NANGO_SECRET_KEY) {
    return c.json(
      {
        error: "Nango not configured",
        hint: "Set NANGO_SECRET_KEY. In Nango dashboard register integrations for the providers in the map (hubspot, jira etc.) using their OAuth client secrets. This enables real user connections.",
      },
      503
    );
  }

  try {
    const body = await c.req.json();
    const { integration_id } = NangoDisconnectSchema.parse(body);
    const nangoIntegrationId = toNangoIntegrationId(integration_id);

    // Delete from Nango
    await deleteNangoConnection(
      {
        NANGO_SECRET_KEY: c.env.NANGO_SECRET_KEY as string,
        NANGO_BASE_URL: c.env.NANGO_BASE_URL as string | undefined,
      },
      nangoIntegrationId,
      tenantId
    );

    // Mark disconnected in D1 (connectors table from tenants/migrations/0006, CF-only — DECISION 22)
    if ((c.env as any).EDGE_DB) {
      const db = (c.env as any).EDGE_DB as D1Database;
      const now = new Date().toISOString();
      await db
        .prepare(
          `UPDATE connectors SET status = 'disconnected', updated_at = ? WHERE tenant_id = ? AND provider = ?`
        )
        .bind(now, tenantId, integration_id)
        .run();
      // Prune from the tenant_spine_config.connected_connectors projection array.
      const row = await db
        .prepare(`SELECT connected_connectors FROM tenant_spine_config WHERE tenant_id = ?`)
        .bind(tenantId)
        .first<{ connected_connectors?: string }>();
      if (row?.connected_connectors) {
        try {
          const list: string[] = JSON.parse(row.connected_connectors);
          const filtered = list.filter((p) => p !== integration_id);
          await db
            .prepare(
              `UPDATE tenant_spine_config SET connected_connectors = ?, updated_at = datetime('now') WHERE tenant_id = ?`
            )
            .bind(JSON.stringify(filtered), tenantId)
            .run();
        } catch {
          /* ignore malformed array */
        }
      }
    }

    return c.json({ success: true, disconnected: integration_id });
  } catch (err) {
    console.error("[Connector] Nango disconnect error:", err);
    return c.json({ error: err instanceof Error ? err.message : "Failed to disconnect" }, 500);
  }
});

const InitializeSpineSchema = z.object({
  domain: z.string(),
  industry: z.string().optional(),
  department: z.string().optional(),
  connectors: z.array(
    z.object({
      provider: z.string(),
      entityTypes: z.array(z.string()),
      flowType: z.enum(["A", "B", "C"]),
    })
  ),
});
// Retained for back-compat/reference; the initialize-spine handler is now a
// deprecated no-op (schema is written by the CF Gateway to D1 — task 2.1).
void InitializeSpineSchema;

/**
 * POST /internal/initialize-spine
 *
 * Sets up tenant schema configuration based on selected domain and connectors.
 * Writes to `tenant_spine_config` — the unified schema SSOT.
 *
 * This function:
 * 1. Builds allowed_entity_types from selected connectors
 * 2. Builds connector_configs per-provider
 * 3. Upserts into tenant_spine_config
 * 4. Upserts onboarding state
 */
app.post("/internal/initialize-spine", async (c) => {
  // DEPRECATED (DECISION 22 / spine-hydration-lifecycle task 2.1).
  // The single, authoritative Spine-schema writer is the CF Gateway
  // (services/gateway/src/workspace-spine.ts -> D1 tenant_spine_config).
  // This Neon-backed path created split-brain state and no longer writes.
  // Kept as a no-op so any legacy caller receives a clear, non-fatal response.
  const tenantId = c.req.header("x-tenant-id");
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();

  if (!tenantId) {
    return c.json({ error: "Missing tenant ID" }, 400);
  }

  console.warn(
    "[Connector] /internal/initialize-spine is DEPRECATED — schema is written by the " +
      "CF Gateway to D1 (single source of truth). No write performed."
  );

  return c.json(
    {
      success: true,
      deprecated: true,
      message:
        "initialize-spine is handled by the CF Gateway (D1). This endpoint no longer writes.",
      correlation_id: correlationId,
    },
    410
  );
});

/**
 * GET /internal/schema/:tenantId
 *
 * Get schema configuration for a tenant.
 * Reads from tenant_spine_config (SSOT).
 */
app.get("/internal/schema/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();

  try {
    if (!c.env.EDGE_DB) {
      // Cloudflare-only: D1 is the single source of truth — no non-CF fallback.
      console.error("[Connector] CONFIG ERROR: EDGE_DB (D1) binding missing");
      return c.json({ error: "D1 binding not configured", correlation_id: correlationId }, 500);
    }

    const config = await c.env.EDGE_DB.prepare(
      `SELECT domains, industry, allowed_entity_types, connector_configs,
              depth_matrix_snapshot, schema_version, connected_connectors
         FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1`
    )
      .bind(tenantId)
      .first<{
        domains: string | null;
        industry: string | null;
        allowed_entity_types: string | null;
        connector_configs: string | null;
        depth_matrix_snapshot: string | null;
        schema_version: string | null;
        connected_connectors: string | null;
      }>();

    if (!config) {
      return c.json({ error: "Schema config not found" }, 404);
    }

    // D1 stores these columns as JSON strings (written by the gateway).
    const parse = (v: string | null, fallback: unknown) => {
      if (typeof v !== "string") return fallback;
      try {
        return JSON.parse(v);
      } catch {
        return fallback;
      }
    };

    return c.json({
      config: {
        domains: parse(config.domains, []),
        industry: config.industry,
        allowedEntityTypes: parse(config.allowed_entity_types, []),
        connectorConfigs: parse(config.connector_configs, {}),
        depthMatrix: parse(config.depth_matrix_snapshot, {}),
        schemaVersion: config.schema_version,
        connectedConnectors: parse(config.connected_connectors, []),
      },
      correlation_id: correlationId,
    });
  } catch (error) {
    console.error("[Connector] Get schema error:", error);
    return c.json(
      {
        error: "Failed to get schema",
        correlation_id: correlationId,
      },
      500
    );
  }
});

export default app;

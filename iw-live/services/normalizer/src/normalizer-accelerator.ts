import {
  getAllowedFieldSetForEntity,
  pruneRecordToResolvedSchema,
  type ResolvedAdaptiveSchema,
} from "@integratewise/types";

/**
 * Section 6 — NORMALIZER ACCELERATOR (Universal Normalizer Pack)
 * Implementation of Truth + Context Linkage
 */

export interface NormalizerContext {
  tenant_id: string;
  entity_type: string;
  source: string;
  category?: string;
  user_id?: string;
  account_id?: string;
  team_id?: string;
  user_role?: string;
  env?: any; // To access service URLs
  resolvedSchema?: ResolvedAdaptiveSchema | null;
}

export async function runNormalizerAccelerator(data: any, ctx: NormalizerContext) {
  let current = data;

  // NA0: Schema Detector (Tool -> SSOT Entity)
  current = await stageNA0_SchemaDetector(current, ctx);

  // NA1: Canonical Transformer (Traits mapping)
  current = await stageNA1_CanonicalTransformer(current, ctx);

  // NA2: SSOT Binder (ID registry)
  current = await stageNA2_SSOTBinder(current, ctx);

  // NA3: Lineage Manager (Evidence refs & Correlation)
  current = await stageNA3_LineageManager(current, ctx);

  // NA4: Relation Binder (Canonical Edge mapping)
  current = await stageNA4_RelationBinder(current, ctx);

  // NA5: Spine Publisher (Final Commit - The Linkage Handshake)
  current = await stageNA5_SpinePublisher(current, ctx);

  return current;
}

async function stageNA0_SchemaDetector(data: any, ctx: NormalizerContext) {
  const allowedFields = getAllowedFieldSetForEntity(ctx.resolvedSchema, ctx.entity_type);
  return {
    ...data,
    _adaptive_schema: {
      entity_type: ctx.entity_type,
      allowed_fields: allowedFields ? Array.from(allowedFields) : [],
      schema_bound: Boolean(ctx.resolvedSchema),
    },
  };
}

async function stageNA1_CanonicalTransformer(data: any, ctx: NormalizerContext) {
  const allowedFields = getAllowedFieldSetForEntity(ctx.resolvedSchema, ctx.entity_type);
  if (!allowedFields) return data;
  const { record, droppedFields } = pruneRecordToResolvedSchema(data, allowedFields);
  return {
    ...record,
    ...(droppedFields.length > 0 ? { _schema_pruned_fields: droppedFields } : {}),
  };
}

async function stageNA2_SSOTBinder(data: any, _ctx: NormalizerContext) {
  // Ensure stable UUID. If tool has external_id, we map it.
  if (!data.id) {
    data.id = crypto.randomUUID();
  }
  return data;
}

async function stageNA3_LineageManager(data: any, ctx: NormalizerContext) {
  // LINKAGE: Create the lineage metadata
  return {
    ...data,
    _lineage: {
      spine_id: data.id,
      source_system: ctx.source,
      external_id: data.external_id || null,
      sync_at: new Date().toISOString(),
    },
  };
}

async function stageNA4_RelationBinder(data: any, ctx: NormalizerContext) {
  // Map relationships from Tool IDs to Canonical IDs (FIX-008)
  if (!ctx.env?.D1) {
    return data;
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const resolveId = async (
    targetType: string,
    domain: string,
    sourceId: string
  ): Promise<string | null> => {
    if (!sourceId || UUID_REGEX.test(sourceId)) {
      return sourceId || null;
    }
    try {
      const tableName = `${domain}_data`;
      const query = `SELECT id FROM ${tableName} WHERE type = ? AND source_tool = ? AND source_id = ? LIMIT 1`;
      const res = (await ctx.env.D1.prepare(query)
        .bind(targetType, ctx.source, sourceId)
        .first()) as { id: string } | null;
      return res?.id || null;
    } catch (err) {
      console.warn(`[NA4] Relation mapping failed for ${targetType} (sourceId: ${sourceId}):`, err);
      return null;
    }
  };

  const t = ctx.entity_type.toLowerCase();

  if (t === "contact") {
    // 1. contact.account_id -> resolve to spine account UUID
    const rawAccountId = data.account_id || data.company_id;
    if (rawAccountId) {
      const canonicalId = await resolveId("account", "grow", String(rawAccountId));
      if (canonicalId) {
        data.account_id = canonicalId;
        if (data.company_id) data.company_id = canonicalId;
      }
    }
  } else if (t === "deal" || t === "opportunity") {
    // 2. deal.contact_id -> resolve to spine contact UUID
    const rawContactId = data.contact_id || data.primary_contact_id;
    if (rawContactId) {
      const canonicalId = await resolveId("contact", "grow", String(rawContactId));
      if (canonicalId) {
        data.contact_id = canonicalId;
        if (data.primary_contact_id) data.primary_contact_id = canonicalId;
      }
    }
    // Also deal.account_id -> resolve to spine account UUID
    const rawAccountId = data.account_id || data.company_id;
    if (rawAccountId) {
      const canonicalId = await resolveId("account", "grow", String(rawAccountId));
      if (canonicalId) {
        data.account_id = canonicalId;
        if (data.company_id) data.company_id = canonicalId;
      }
    }
  } else if (t === "ticket") {
    // 3. ticket.account_id -> resolve to spine account UUID
    const rawAccountId = data.account_id || data.company_id || data.organization_id;
    if (rawAccountId) {
      const canonicalId = await resolveId("account", "grow", String(rawAccountId));
      if (canonicalId) {
        data.account_id = canonicalId;
        if (data.company_id) data.company_id = canonicalId;
        if (data.organization_id) data.organization_id = canonicalId;
      }
    }
    // Also ticket.contact_id -> resolve to spine contact UUID
    const rawContactId = data.contact_id || data.user_id;
    if (rawContactId) {
      const canonicalId = await resolveId("contact", "grow", String(rawContactId));
      if (canonicalId) {
        data.contact_id = canonicalId;
        if (data.user_id) data.user_id = canonicalId;
      }
    }
  }

  return data;
}

async function stageNA5_SpinePublisher(data: any, ctx: NormalizerContext) {
  console.log(`[NA5] Publishing Linkage: Truth (Spine) + Context (Knowledge)`);

  const spineUrl = ctx.env?.SPINE_SERVICE_URL || "http://localhost:8788";
  const knowledgeUrl = ctx.env?.KNOWLEDGE_SERVICE_URL || "http://localhost:8785";

  // 1. Structured Data (The Truth)
  const spineEntity = {
    entity_type: ctx.entity_type,
    name: data.name || data.title || data.email || data.id || "Unnamed",
    source: ctx.source,
    source_id:
      data.id ||
      data.source_id ||
      data.external_id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now())),
    data: data,
  };

  const spineHeaders = {
    "Content-Type": "application/json",
    "x-tenant-id": ctx.tenant_id,
    "x-spine-context-category": ctx.category || "business",
    "x-spine-context-user-id": ctx.user_id || "",
    "x-spine-context-account-id": ctx.account_id || "",
    "x-spine-context-team-id": ctx.team_id || "",
  };

  const spineBody = JSON.stringify({
    tenant_id: ctx.tenant_id,
    entities: [spineEntity],
    trace_id: data._lineage?.sync_at || new Date().toISOString(),
  });

  // Zero-latency service bindings vs external HTTP calls (FIX-007)
  const spinePromise = ctx.env?.SPINE
    ? ctx.env.SPINE.fetch(`http://spine/v1/spine/${ctx.entity_type}`, {
        method: "POST",
        headers: spineHeaders,
        body: spineBody,
      })
    : fetch(`${spineUrl}/v1/spine/${ctx.entity_type}`, {
        method: "POST",
        headers: spineHeaders,
        body: spineBody,
      });

  // 2. Unstructured Data (The Context Graph) — Flow B: same Knowledge queue as sectorize (CONSOLIDATED_AGENT_TODO D.19)
  const knowledgePayload = {
    tenant_id: ctx.tenant_id,
    entity_type: ctx.entity_type,
    entity_id: data.id,
    source_type: "api",
    source_name: ctx.source,
    content: JSON.stringify({
      original_payload: data._raw || {},
      extracted_graph: data._graph || {},
      lineage: data._lineage,
    }),
    correlation_id:
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined,
  };

  const contextPromise = ctx.env?.KNOWLEDGE_QUEUE
    ? ctx.env.KNOWLEDGE_QUEUE.send(knowledgePayload).catch((err: unknown) => {
        console.warn(
          `[NA5] Knowledge queue send failed (non-fatal): ${err instanceof Error ? err.message : err}`
        );
      })
    : ctx.env?.KNOWLEDGE
      ? ctx.env.KNOWLEDGE.fetch("http://knowledge/knowledge/ingest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": ctx.tenant_id,
            "x-spine-context-category": ctx.category || "business",
            "x-spine-context-user-id": ctx.user_id || "",
          },
          body: JSON.stringify(knowledgePayload),
        })
      : fetch(`${knowledgeUrl}/knowledge/ingest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": ctx.tenant_id,
            "x-spine-context-category": ctx.category || "business",
            "x-spine-context-user-id": ctx.user_id || "",
          },
          body: JSON.stringify(knowledgePayload),
        });

  try {
    const [spineRes] = await Promise.all([spinePromise, contextPromise]);
    if (spineRes && !spineRes.ok) {
      console.error(`Spine Publisher Failed with status ${spineRes.status}`);
    }
  } catch (err) {
    console.error(`Linkage Dispatch Failed: ${err}`);
  }

  return data;
}

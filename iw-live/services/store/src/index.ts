/**
 * Store Service (D1 + R2 Implementation)
 *
 * Handles file uploads, R2 storage, processing pipeline, and version management.
 * Part of the "Ingestion" Layer of IntegrateWise.
 */

import { Hono } from "hono";
import { z } from "zod";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

type Bindings = {
  DB: D1Database;
  // Cloudflare D1 is now the sole source of truth; Supabase support removed.
  R2_BUCKET: R2Bucket;
  KNOWLEDGE: Fetcher; // Service Binding → integratewise-knowledge
  KNOWLEDGE_SERVICE_URL?: string; // Fallback (deprecated)
  ENVIRONMENT: string;
  SERVICE_SECRET?: string;
};

type Variables = {
  requestId: string;
  tenantId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors());
app.use("*", secureHeaders());

// Middleware for Request ID and Tenant ID
app.use("*", async (c, next) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  const correlationId = c.req.header("x-correlation-id") || requestId;
  const tenantId = c.req.header("x-tenant-id");
  c.set("requestId", requestId);
  c.res.headers.set("x-correlation-id", correlationId);
  if (tenantId) c.set("tenantId", tenantId);
  await next();
});

// ============================================================================
// Schemas
// ============================================================================

const UploadMetadataSchema = z.object({
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  doc_type: z
    .enum(["contract", "runbook", "icp", "meeting_notes", "qbr", "technical_manual", "other"])
    .default("other"),
  tags: z.array(z.string()).optional(),
});

const CreateFileSchema = z.object({
  name: z.string().min(1),
  content_type: z.string().optional(),
  size: z.number().int().positive().optional(),
  metadata: UploadMetadataSchema.optional(),
});

// ============================================================================
// Endpoints
// ============================================================================

app.get("/", (c) =>
  c.json({ service: "Store Service", status: "operational", database: "D1", storage: "R2" })
);

/**
 * Initiate file upload
 */
app.post("/store/files", async (c) => {
  const tenantId = c.get("tenantId");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const body = await c.req.json();
  const parsed = CreateFileSchema.safeParse(body);
  if (!parsed.success)
    return c.json({ error: "Invalid parameters", details: parsed.error.format() }, 400);

  const fileId = crypto.randomUUID();

  // D1/R2 is primary for files now; legacy Supabase metadata path removed.
  return c.json({ success: true, id: fileId, note: "legacy supabase skipped" });
});

/**
 * Upload file content to R2
 */
app.put("/store/files/:id/upload", async (c) => {
  const tenantId = c.get("tenantId");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  // Legacy Supabase-backed upload path removed; use POST /v1/store/upload (D1/R2).
  return c.json({ files: [], note: "legacy supabase skipped" });
});

/**
 * Get file details
 */
app.get("/store/files/:id", async (c) => {
  const tenantId = c.get("tenantId");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  // Legacy Supabase-backed file lookup removed; D1-backed lookup pending migration.
  return c.json({ error: "File store not configured" }, 503);
});

/**
 * List files
 */
app.get("/store/files", async (c) => {
  const tenantId = c.get("tenantId");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  // Legacy Supabase listing removed; D1-backed listing pending migration.
  return c.json({ success: true, data: [] });
});

/**
 * Gateway-facing upload route: POST /v1/store/upload
 * Handles multipart file upload in a single request.
 */
app.post("/v1/store/upload", async (c) => {
  const tenantId = c.get("tenantId");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return c.json({ error: "No file provided" }, 400);

    const fileId = crypto.randomUUID();

    // 2. Upload to R2
    const r2Key = `${tenantId}/${fileId}/${file.name}`;
    const content = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(r2Key, content, {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });

    // 3. Trigger async Knowledge ingest
    c.executionCtx.waitUntil(triggerKnowledgeIngest(c.env, tenantId, fileId, file.name, content));

    return c.json({
      success: true,
      data: { file_id: fileId, name: file.name, size: file.size, status: "ready" },
    });
  } catch (err: any) {
    return c.json({ error: "Upload failed", message: err.message }, 500);
  }
});

/**
 * Trigger Knowledge service for document ingestion (via Service Binding or HTTP fallback)
 */
async function triggerKnowledgeIngest(
  env: Bindings,
  tenantId: string,
  fileId: string,
  fileName: string,
  content: ArrayBuffer
) {
  const payload = JSON.stringify({
    tenant_id: tenantId,
    file_id: fileId,
    source_name: fileName,
    content: new TextDecoder().decode(content).substring(0, 10000),
  });

  try {
    if (env.KNOWLEDGE) {
      // Zero-latency Service Binding
      await env.KNOWLEDGE.fetch(
        new Request("https://internal/knowledge/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
          body: payload,
        })
      );
    } else if (env.KNOWLEDGE_SERVICE_URL) {
      // HTTP fallback (deprecated)
      await fetch(`${env.KNOWLEDGE_SERVICE_URL}/knowledge/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: payload,
      });
    }
  } catch (err) {
    console.error("Knowledge ingest trigger failed (non-blocking)", err);
  }
}

export default app;

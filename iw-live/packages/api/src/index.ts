import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env, Entity, Metric, EntityType } from "./types";
import * as db from "./db";
import { processCommand, processWithClaude } from "./ai";

const app = new Hono<{ Bindings: Env }>();

// CORS for frontend
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "https://hub-controller.pages.dev",
      "https://1d15f5c7.hub-controller.pages.dev",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "hub-controller-api" }));
app.get("/api", (c) => c.json({ status: "ok", version: "1.0.0" }));

// ============ AI Command Endpoint ============
app.post("/api/command", async (c) => {
  const { input, useAdvanced } = await c.req.json();
  if (!input) {
    return c.json({ error: "Input required" }, 400);
  }

  const result = useAdvanced
    ? await processWithClaude(c.env, input)
    : await processCommand(c.env, input);

  // Log the command (with tenant context if available)
  await c.env.DB.prepare(
    `
    INSERT INTO ai_commands (id, input, intent, entities_affected, response, success, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  )
    .bind(
      crypto.randomUUID(),
      input,
      result.intent,
      result.entities ? JSON.stringify(result.entities.map((e) => e.id)) : null,
      result.message,
      1,
      new Date().toISOString()
    )
    .run();

  return c.json(result);
});

// ============ Entities CRUD ============
app.get("/api/entities", async (c) => {
  const type = c.req.query("type") as EntityType | undefined;
  const status = c.req.query("status") as
    | "active"
    | "completed"
    | "archived"
    | "blocked"
    | "pending"
    | undefined;
  const category = c.req.query("category");
  const owner = c.req.query("owner");
  const source = c.req.query("source");
  const limit = parseInt(c.req.query("limit") || "100");
  const offset = parseInt(c.req.query("offset") || "0");

  const entities = await db.listEntities(c.env.DB, {
    type,
    status,
    category: category || undefined,
    owner: owner || undefined,
    source: source || undefined,
    limit,
    offset,
  });

  return c.json(entities);
});

app.get("/api/entities/search", async (c) => {
  const q = c.req.query("q");
  if (!q) {
    return c.json({ error: "Query required" }, 400);
  }
  const entities = await db.searchEntities(c.env.DB, q);
  return c.json(entities);
});

app.get("/api/entities/:id", async (c) => {
  const entity = await db.getEntity(c.env.DB, c.req.param("id"));
  if (!entity) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(entity);
});

app.post("/api/entities", async (c) => {
  const data = await c.req.json();
  const entity = await db.createEntity(c.env.DB, data);
  await db.logActivity(c.env.DB, {
    entity_id: entity.id,
    action: "created",
  });
  return c.json(entity, 201);
});

app.put("/api/entities/:id", async (c) => {
  const data = await c.req.json();
  const entity = await db.updateEntity(c.env.DB, c.req.param("id"), data);
  if (!entity) {
    return c.json({ error: "Not found" }, 404);
  }
  await db.logActivity(c.env.DB, {
    entity_id: entity.id,
    action: "updated",
    details: { changes: data },
  });
  return c.json(entity);
});

app.delete("/api/entities/:id", async (c) => {
  const deleted = await db.deleteEntity(c.env.DB, c.req.param("id"));
  if (!deleted) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ success: true });
});

// ============ Type-specific aliases ============
// Projects
app.get("/api/projects", async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: "project" });
  return c.json(entities);
});

app.post("/api/projects", async (c) => {
  const data = await c.req.json();
  const entity = await db.createEntity(c.env.DB, { ...data, type: "project" });
  return c.json(entity, 201);
});

// Tasks
app.get("/api/tasks", async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: "task" });
  return c.json(entities);
});

// Customers
app.get("/api/customers", async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: "customer" });
  // Transform to expected format
  const customers = entities.map((e) => ({
    id: e.id,
    name: e.title,
    status: e.status,
    mrr: (e.metadata as Record<string, number>)?.mrr || 0,
    healthScore: (e.metadata as Record<string, number>)?.healthScore || 0,
    lastActivity: e.updated_at,
  }));
  return c.json(customers);
});

// Opportunities (Salesforce)
app.get("/api/integrations/salesforce/opportunities", async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: "opportunity" });
  const opportunities = entities.map((e) => ({
    id: e.id,
    name: e.title,
    account: (e.metadata as Record<string, string>)?.account || "",
    stage: e.status,
    amount: (e.metadata as Record<string, number>)?.amount || 0,
    closeDate: e.due_date,
  }));
  return c.json(opportunities);
});

// ============ Metrics ============
app.get("/api/metrics/kpis", async (c) => {
  const category = c.req.query("category");
  const period = c.req.query("period");
  const metrics = await db.getMetrics(c.env.DB, category || undefined, period || undefined);
  return c.json(metrics);
});

app.get("/api/metrics/latest", async (c) => {
  const category = c.req.query("category");
  const metrics = await db.getLatestMetrics(c.env.DB, category || undefined);
  return c.json(metrics);
});

app.post("/api/metrics", async (c) => {
  const data = await c.req.json();
  const metric = await db.createMetric(c.env.DB, data);
  return c.json(metric, 201);
});

// ============ Finance ============
app.get("/api/finance/summary", async (c) => {
  const metrics = await db.getLatestMetrics(c.env.DB, "finance");
  return c.json({
    budget: metrics.budget || 1000000,
    actual: metrics.actual || 800000,
    burn: metrics.burn || 80000,
    runwayMonths: metrics.runway || 9,
  });
});

// ============ Marketing ============
app.get("/api/marketing/metrics", async (c) => {
  const metrics = await db.getLatestMetrics(c.env.DB, "marketing");
  return c.json({
    leads: metrics.leads || 0,
    mqls: metrics.mqls || 0,
    cac: metrics.cac || 0,
    roi: metrics.roi || 0,
  });
});

// ============ Team ============
app.get("/api/team/utilization", async (c) => {
  const metrics = await db.getLatestMetrics(c.env.DB, "team");
  return c.json({ overall: metrics.utilization || 72 });
});

app.get("/api/team/members", async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: "team_member" });
  const members = entities.map((e) => ({
    name: e.title,
    role: e.category,
    utilization: (e.metadata as Record<string, number>)?.utilization || 0,
    status: e.status === "active" ? "Active" : "Inactive",
  }));
  return c.json(members);
});

// ============ Digital/IT ============
app.get("/api/digital/systems", async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: "document", category: "system" });
  const systems = entities.map((e) => ({
    name: e.title,
    type: (e.metadata as Record<string, string>)?.type || "Infrastructure",
    status: e.status === "active" ? "Operational" : "Degraded",
    uptime: (e.metadata as Record<string, string>)?.uptime || "99.9%",
  }));
  return c.json(systems);
});

// ============ Ops/Compliance ============
app.get("/api/ops/compliance", async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: "compliance" });
  const items = entities.map((e) => ({
    item: e.title,
    status: e.status === "completed" ? "Complete" : "Pending",
    dueDate: e.due_date || "",
    owner: e.owner || "",
  }));
  return c.json(items);
});

// ============ R&D ============
app.get("/api/rnd/projects", async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: "rnd" });
  const projects = entities.map((e) => ({
    name: e.title,
    category: e.category || "General",
    status: e.status === "active" ? "Active" : e.status === "pending" ? "Planning" : "Completed",
    progress: (e.metadata as Record<string, number>)?.progress || 0,
  }));
  return c.json(projects);
});

// ============ Investors ============
app.get("/api/investors/reports", async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: "document", category: "investor" });
  const reports = entities.map((e) => ({
    title: e.title,
    type: (e.metadata as Record<string, string>)?.type || "Report",
    date: e.created_at,
    status: e.status === "completed" ? "Sent" : "Draft",
  }));
  return c.json(reports);
});

// ============ Docs Hub ============
app.get("/api/integrations/index/docs", async (c) => {
  const entities = await db.listEntities(c.env.DB, { type: "document" });
  const docs = entities.map((e) => ({
    source: e.source || "manual",
    title: e.title,
    url: (e.metadata as Record<string, string>)?.url || "#",
    tags: e.tags || [],
  }));
  return c.json(docs);
});

// ============ Activities ============
app.get("/api/activities", async (c) => {
  const entityId = c.req.query("entity_id");
  const limit = parseInt(c.req.query("limit") || "50");
  const activities = await db.getActivities(c.env.DB, entityId || undefined, limit);
  return c.json(activities);
});

// ============ Dashboard ============
app.get("/api/dashboard", async (c) => {
  const stats = await db.getDashboardStats(c.env.DB);
  return c.json(stats);
});

// ============ Integrations ============
app.get("/api/integrations", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM integrations ORDER BY name").all();
  return c.json(result.results || []);
});

app.post("/api/integrations", async (c) => {
  const { name, type, config } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `
    INSERT INTO integrations (id, name, type, config, status, created_at)
    VALUES (?, ?, ?, ?, 'active', ?)
  `
  )
    .bind(id, name, type, JSON.stringify(config), new Date().toISOString())
    .run();
  return c.json({ id, name, type, status: "active" }, 201);
});

// ============ Webhooks ============

// HubSpot Webhook - CRM contacts, deals, forms
app.post("/webhooks/hubspot", async (c) => {
  const signature = c.req.header("X-HubSpot-Signature") || "";
  const body = await c.req.text();

  // Verify signature (HubSpot uses clientSecret + body for v1 signatures)
  if (c.env.HUBSPOT_CLIENT_SECRET) {
    const data = new TextEncoder().encode(c.env.HUBSPOT_CLIENT_SECRET + body);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const expectedHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature && signature !== expectedHex) {
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  const events = JSON.parse(body);
  let processed = 0;

  for (const event of Array.isArray(events) ? events : [events]) {
    await db.createEntity(c.env.DB, {
      type: "event",
      title: `HubSpot: ${event.subscriptionType || event.eventType || "webhook"}`,
      source: "hubspot",
      source_id: `hubspot_${event.objectId || event.eventId || Date.now()}`,
      status: "pending",
      priority: "medium",
      category: "crm",
      metadata: { hubspot_event: event, received_at: new Date().toISOString() },
    });
    processed++;
  }

  await db.logActivity(c.env.DB, {
    action: "webhook_received",
    details: { provider: "hubspot", count: processed },
  });
  return c.json({ success: true, provider: "hubspot", processed });
});

// LinkedIn Webhook - Lead Gen forms, ads
app.post("/webhooks/linkedin", async (c) => {
  const body = await c.req.json();

  await db.createEntity(c.env.DB, {
    type: "lead",
    title: `LinkedIn: ${body.eventType || body.type || "lead"}`,
    source: "linkedin",
    source_id: `linkedin_${body.id || body.leadId || Date.now()}`,
    status: "pending",
    priority: "high",
    category: "marketing",
    metadata: { linkedin_event: body, received_at: new Date().toISOString() },
  });

  await db.logActivity(c.env.DB, { action: "webhook_received", details: { provider: "linkedin" } });
  return c.json({ success: true, provider: "linkedin" });
});

// Canva Webhook - Design exports, brand kit
app.post("/webhooks/canva", async (c) => {
  const body = await c.req.json();

  await db.createEntity(c.env.DB, {
    type: "document",
    title: `Canva: ${body.design?.name || body.resource?.name || "Design Export"}`,
    source: "canva",
    source_id: `canva_${body.design?.id || body.resource?.id || Date.now()}`,
    status: "active",
    priority: "low",
    category: "design",
    metadata: { canva_event: body, received_at: new Date().toISOString() },
  });

  await db.logActivity(c.env.DB, { action: "webhook_received", details: { provider: "canva" } });
  return c.json({ success: true, provider: "canva" });
});

// Salesforce Webhook - Leads, Opportunities, Accounts
app.post("/webhooks/salesforce", async (c) => {
  const body = await c.req.json();

  const stageMap: Record<string, string> = {
    "Closed Won": "completed",
    "Closed Lost": "archived",
    Negotiation: "active",
    Proposal: "active",
    Qualification: "pending",
  };

  await db.createEntity(c.env.DB, {
    type: "opportunity",
    title: body.Name || `Salesforce: ${body.attributes?.type || "record"}`,
    source: "salesforce",
    source_id: body.Id || `sf_${Date.now()}`,
    status: (stageMap[body.StageName] || "active") as
      | "active"
      | "completed"
      | "archived"
      | "blocked"
      | "pending",
    priority: "high",
    category: "sales",
    metadata: {
      amount: body.Amount,
      account: body.Account?.Name,
      close_date: body.CloseDate,
      stage: body.StageName,
      salesforce_data: body,
      received_at: new Date().toISOString(),
    },
  });

  await db.logActivity(c.env.DB, {
    action: "webhook_received",
    details: { provider: "salesforce", type: body.attributes?.type },
  });
  return c.json({ success: true, provider: "salesforce" });
});

// Pipedrive Webhook - Deals, Contacts, Organizations
app.post("/webhooks/pipedrive", async (c) => {
  const body = await c.req.json();
  const current = body.current || body.data || body;

  await db.createEntity(c.env.DB, {
    type: "opportunity",
    title: current.title || current.name || `Pipedrive: ${body.event || "deal"}`,
    source: "pipedrive",
    source_id: `pipedrive_${current.id || Date.now()}`,
    status:
      current.status === "won" ? "completed" : current.status === "lost" ? "archived" : "active",
    priority: "high",
    category: "sales",
    metadata: {
      value: current.value,
      currency: current.currency,
      stage_id: current.stage_id,
      person_id: current.person_id,
      org_id: current.org_id,
      pipedrive_data: body,
      received_at: new Date().toISOString(),
    },
  });

  await db.logActivity(c.env.DB, {
    action: "webhook_received",
    details: { provider: "pipedrive", event: body.event },
  });
  return c.json({ success: true, provider: "pipedrive" });
});

// Google Ads Webhook - Conversions, leads
app.post("/webhooks/google-ads", async (c) => {
  const body = await c.req.json();

  await db.createEntity(c.env.DB, {
    type: "event",
    title: `Google Ads: ${body.event_type || body.conversion_action || "conversion"}`,
    source: "google_ads",
    source_id: body.conversion_id || body.gclid || `gads_${Date.now()}`,
    status: "active",
    priority: "medium",
    category: "marketing",
    metadata: { google_ads_data: body, received_at: new Date().toISOString() },
  });

  await db.logActivity(c.env.DB, {
    action: "webhook_received",
    details: { provider: "google_ads" },
  });
  return c.json({ success: true, provider: "google_ads" });
});

// Facebook/Meta Webhook - Lead ads, conversions
app.get("/webhooks/meta", async (c) => {
  // Verification challenge for Meta webhooks
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  if (mode === "subscribe" && token === c.env.META_VERIFY_TOKEN) {
    return c.text(challenge || "");
  }
  return c.text("Forbidden", 403);
});

app.post("/webhooks/meta", async (c) => {
  const body = await c.req.json();

  for (const entry of body.entry || [body]) {
    const changes = entry.changes || [entry];
    for (const change of changes) {
      await db.createEntity(c.env.DB, {
        type: "event",
        title: `Meta: ${change.field || entry.messaging?.[0]?.message ? "message" : "event"}`,
        source: "meta",
        source_id: entry.id || `meta_${Date.now()}`,
        status: "pending",
        priority: "medium",
        category: "marketing",
        metadata: { meta_event: entry, change, received_at: new Date().toISOString() },
      });
    }
  }

  await db.logActivity(c.env.DB, { action: "webhook_received", details: { provider: "meta" } });
  return c.json({ success: true, provider: "meta" });
});

// WhatsApp Business Webhook - Messages, status updates
app.get("/webhooks/whatsapp", async (c) => {
  // Verification challenge for WhatsApp webhooks
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  if (mode === "subscribe" && token === c.env.WHATSAPP_VERIFY_TOKEN) {
    return c.text(challenge || "");
  }
  return c.text("Forbidden", 403);
});

app.post("/webhooks/whatsapp", async (c) => {
  const body = await c.req.json();
  let processed = 0;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};

      // Process messages
      for (const msg of value.messages || []) {
        await db.createEntity(c.env.DB, {
          type: "event",
          title: `WhatsApp: ${msg.type} from ${msg.from}`,
          source: "whatsapp",
          source_id: msg.id,
          status: "pending",
          priority: "high",
          category: "communication",
          metadata: {
            message: msg,
            contact: value.contacts?.[0],
            phone_number_id: value.metadata?.phone_number_id,
            received_at: new Date().toISOString(),
          },
        });
        processed++;
      }

      // Process status updates
      for (const status of value.statuses || []) {
        await db.createEntity(c.env.DB, {
          type: "event",
          title: `WhatsApp Status: ${status.status} for ${status.recipient_id}`,
          source: "whatsapp",
          source_id: status.id,
          status: "active",
          priority: "low",
          category: "communication",
          metadata: { status_update: status, received_at: new Date().toISOString() },
        });
        processed++;
      }
    }
  }

  await db.logActivity(c.env.DB, {
    action: "webhook_received",
    details: { provider: "whatsapp", processed },
  });
  return c.json({ success: true, provider: "whatsapp", processed });
});

// Webhook providers list endpoint
app.get("/api/webhooks/providers", async (c) => {
  const providers = [
    {
      name: "hubspot",
      endpoint: "/webhooks/hubspot",
      auth: "hmac-sha256",
      category: "CRM/Sales",
      status: "active",
    },
    {
      name: "linkedin",
      endpoint: "/webhooks/linkedin",
      auth: "oauth2",
      category: "Marketing",
      status: "active",
    },
    {
      name: "canva",
      endpoint: "/webhooks/canva",
      auth: "hmac-sha256",
      category: "Design",
      status: "active",
    },
    {
      name: "salesforce",
      endpoint: "/webhooks/salesforce",
      auth: "outbound-message",
      category: "CRM/Sales",
      status: "active",
    },
    {
      name: "pipedrive",
      endpoint: "/webhooks/pipedrive",
      auth: "basic-auth",
      category: "Sales",
      status: "active",
    },
    {
      name: "google_ads",
      endpoint: "/webhooks/google-ads",
      auth: "oauth2",
      category: "Marketing",
      status: "active",
    },
    {
      name: "meta",
      endpoint: "/webhooks/meta",
      auth: "verify-token",
      category: "Marketing",
      status: "active",
    },
    {
      name: "whatsapp",
      endpoint: "/webhooks/whatsapp",
      auth: "verify-token",
      category: "Communication",
      status: "active",
    },
  ];
  return c.json(providers);
});

export default app;

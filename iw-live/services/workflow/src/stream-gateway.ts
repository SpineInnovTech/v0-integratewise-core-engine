/**
 * IntegrateWise - Stream Gateway
 *
 * Real-time WebSocket/SSE service using Cloudflare Durable Objects.
 *
 * Durable Objects:
 * - SignalStreamDO: Tenant-scoped signal broadcasting
 * - PresenceDO: User presence tracking per room
 * - RoomDO: Collaboration rooms (tasks, accounts, dashboards)
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { DurableObject } from "cloudflare:workers";
import { resolveTenantAdaptiveSchema } from "../../../packages/types/src/adaptive-schema";
import {
  getSuccessEntityAliases,
  resolveSuccessSchema,
  type CSCanonicalEntityType,
  type CSSectionId,
  type RoleLens,
  type SectionContract,
  type SuccessPageProjection,
} from "../../../packages/types/src/success-schema";

// =============================================================================
// TYPES
// =============================================================================

interface Env {
  SIGNAL_STREAM: DurableObjectNamespace;
  PRESENCE: DurableObjectNamespace;
  ROOM: DurableObjectNamespace;
  CONNECTION_META: KVNamespace;
  RATE_LIMIT: KVNamespace;
  // Aligned with BFF (workflow) bindings
  SPINE: Fetcher;
  KNOWLEDGE: Fetcher;
  THINK: Fetcher;
  ACT?: Fetcher;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ENVIRONMENT?: string;
  MAX_CONNECTIONS_PER_TENANT?: string;
  MAX_CONNECTIONS_PER_USER?: string;
  HEARTBEAT_INTERVAL_MS?: string;
  CONNECTION_TIMEOUT_MS?: string;
}

interface Signal {
  id: string;
  type: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  entity_type?: string;
  entity_id?: string;
  account_id?: string;
  data?: Record<string, unknown>;
  created_at: string;
}

interface PresenceUser {
  user_id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "busy";
  cursor?: { x: number; y: number };
  last_seen: number;
}

interface StreamMessage {
  type:
    | "signal"
    | "presence"
    | "update"
    | "notification"
    | "cursor"
    | "typing"
    | "subscribe"
    | "unsubscribe"
    | "ping"
    | "analytics";
  channel: string;
  payload: unknown;
  sender_id?: string;
  timestamp: number;
}

// =============================================================================
// DURABLE OBJECT: Signal Stream
// =============================================================================

export class SignalStreamDO extends DurableObject {
  private sessions: Map<WebSocket, { tenantId: string; userId: string; channels: Set<string> }> =
    new Map();
  private recentSignals: Signal[] = [];
  private readonly MAX_RECENT_SIGNALS = 100;
  private doState: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.doState = state;
    // Load recent signals from storage on startup
    this.doState.blockConcurrencyWhile(async () => {
      const stored = await this.doState.storage.get<Signal[]>("recentSignals");
      if (stored) this.recentSignals = stored;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }

    // HTTP endpoints
    switch (url.pathname) {
      case "/broadcast":
        if (request.method === "POST") {
          return this.handleBroadcast(request);
        }
        break;
      case "/stats":
        return this.handleStats();
      case "/recent":
        return Response.json({ signals: this.recentSignals });
    }

    return new Response("Not Found", { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const userId = url.searchParams.get("userId");
    const channels = url.searchParams.get("channels")?.split(",") || ["default"];

    if (!tenantId || !userId) {
      return new Response("Missing tenantId or userId", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket with hibernation support
    this.doState.acceptWebSocket(server);

    // Store session metadata
    this.sessions.set(server, {
      tenantId,
      userId,
      channels: new Set(channels),
    });

    // Send initial state
    server.send(
      JSON.stringify({
        type: "init",
        payload: {
          connected: true,
          channels,
          recent_signals: this.recentSignals
            .filter((s) => channels.includes("all") || channels.includes(s.type))
            .slice(0, 20),
        },
        timestamp: Date.now(),
      })
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  // Hibernation API handlers
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(message as string) as StreamMessage;
      const session = this.sessions.get(ws);

      if (!session) return;

      switch (data.type) {
        case "subscribe":
          if (typeof data.channel === "string") {
            session.channels.add(data.channel);
          }
          break;
        case "unsubscribe":
          if (typeof data.channel === "string") {
            session.channels.delete(data.channel);
          }
          break;
        case "ping":
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          break;
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string): Promise<void> {
    this.sessions.delete(ws);
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);
    this.sessions.delete(ws);
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    const signal = (await request.json()) as Signal;
    const tenantId = request.headers.get("x-tenant-id");

    if (!tenantId) {
      return new Response("Missing x-tenant-id header", { status: 400 });
    }

    // Store in recent signals
    this.recentSignals.unshift(signal);
    if (this.recentSignals.length > this.MAX_RECENT_SIGNALS) {
      this.recentSignals.pop();
    }
    await this.doState.storage.put("recentSignals", this.recentSignals);

    // Broadcast to matching sessions
    let delivered = 0;
    for (const [ws, session] of this.sessions) {
      if (session.tenantId === tenantId) {
        try {
          ws.send(
            JSON.stringify({
              type: "signal",
              channel: signal.type,
              payload: signal,
              timestamp: Date.now(),
            })
          );
          delivered++;
        } catch (error) {
          // Connection dead, will be cleaned up
          this.sessions.delete(ws);
        }
      }
    }

    return Response.json({ status: "broadcast", delivered, total_connections: this.sessions.size });
  }

  private handleStats(): Response {
    const tenantCounts: Record<string, number> = {};
    for (const [, session] of this.sessions) {
      tenantCounts[session.tenantId] = (tenantCounts[session.tenantId] || 0) + 1;
    }

    return Response.json({
      total_connections: this.sessions.size,
      by_tenant: tenantCounts,
      recent_signals_count: this.recentSignals.length,
    });
  }
}

// =============================================================================
// DURABLE OBJECT: Presence
// =============================================================================

export class PresenceDO extends DurableObject {
  private users: Map<string, PresenceUser> = new Map();
  private sockets: Map<WebSocket, string> = new Map(); // ws -> userId
  private doState: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.doState = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }

    switch (url.pathname) {
      case "/users":
        return Response.json({ users: Array.from(this.users.values()) });
      case "/join":
        if (request.method === "POST") {
          const user = (await request.json()) as PresenceUser;
          this.users.set(user.user_id, { ...user, last_seen: Date.now() });
          this.broadcastPresence("join", user);
          return Response.json({ status: "joined" });
        }
        break;
      case "/leave":
        if (request.method === "POST") {
          const { user_id } = (await request.json()) as { user_id: string };
          const user = this.users.get(user_id);
          if (user) {
            this.users.delete(user_id);
            this.broadcastPresence("leave", user);
          }
          return Response.json({ status: "left" });
        }
        break;
    }

    return new Response("Not Found", { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const userName = url.searchParams.get("userName") || "Anonymous";

    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.doState.acceptWebSocket(server);
    this.sockets.set(server, userId);

    // Add user to presence
    const user: PresenceUser = {
      user_id: userId,
      name: userName,
      status: "online",
      last_seen: Date.now(),
    };
    this.users.set(userId, user);

    // Send current users
    server.send(
      JSON.stringify({
        type: "presence_init",
        payload: { users: Array.from(this.users.values()) },
        timestamp: Date.now(),
      })
    );

    // Broadcast join
    this.broadcastPresence("join", user, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(message as string);
      const userId = this.sockets.get(ws);
      if (!userId) return;

      const user = this.users.get(userId);
      if (!user) return;

      switch (data.type) {
        case "cursor":
          user.cursor = data.payload;
          user.last_seen = Date.now();
          this.broadcastPresence("cursor", user, ws);
          break;
        case "status":
          user.status = data.payload.status;
          user.last_seen = Date.now();
          this.broadcastPresence("status", user, ws);
          break;
        case "heartbeat":
          user.last_seen = Date.now();
          break;
      }
    } catch (error) {
      console.error("Presence message error:", error);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const userId = this.sockets.get(ws);
    if (userId) {
      const user = this.users.get(userId);
      if (user) {
        this.users.delete(userId);
        this.broadcastPresence("leave", user);
      }
      this.sockets.delete(ws);
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("Presence WebSocket error:", error);
    this.webSocketClose(ws);
  }

  private broadcastPresence(event: string, user: PresenceUser, exclude?: WebSocket): void {
    const message = JSON.stringify({
      type: `presence_${event}`,
      payload: user,
      timestamp: Date.now(),
    });

    for (const [ws] of this.sockets) {
      if (ws !== exclude) {
        try {
          ws.send(message);
        } catch {
          this.sockets.delete(ws);
        }
      }
    }
  }
}

// =============================================================================
// DURABLE OBJECT: Room (Collaboration)
// =============================================================================

export class RoomDO extends DurableObject {
  private participants: Map<WebSocket, { userId: string; name: string }> = new Map();
  private roomState: Record<string, unknown> = {};
  private doState: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.doState = state;
    this.doState.blockConcurrencyWhile(async () => {
      const stored = await this.doState.storage.get<Record<string, unknown>>("roomState");
      if (stored) this.roomState = stored;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }

    switch (url.pathname) {
      case "/state":
        return Response.json({ state: this.roomState, participants: this.participants.size });
      case "/update":
        if (request.method === "POST") {
          const update = (await request.json()) as { key: string; value: unknown };
          this.roomState[update.key] = update.value;
          await this.doState.storage.put("roomState", this.roomState);
          this.broadcastUpdate(update);
          return Response.json({ status: "updated" });
        }
        break;
    }

    return new Response("Not Found", { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const userName = url.searchParams.get("userName") || "Anonymous";

    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.doState.acceptWebSocket(server);
    this.participants.set(server, { userId, name: userName });

    // Send current state
    server.send(
      JSON.stringify({
        type: "room_init",
        payload: {
          state: this.roomState,
          participants: Array.from(this.participants.values()),
        },
        timestamp: Date.now(),
      })
    );

    // Broadcast join
    this.broadcastToAll(
      {
        type: "participant_join",
        payload: { userId, name: userName },
        timestamp: Date.now(),
      },
      server
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(message as string);
      const participant = this.participants.get(ws);
      if (!participant) return;

      switch (data.type) {
        case "update":
          this.roomState[data.key] = data.value;
          await this.doState.storage.put("roomState", this.roomState);
          this.broadcastUpdate(
            { key: data.key, value: data.value, sender: participant.userId },
            ws
          );
          break;
        case "cursor":
          this.broadcastToAll(
            {
              type: "cursor",
              payload: { userId: participant.userId, cursor: data.cursor },
              timestamp: Date.now(),
            },
            ws
          );
          break;
        case "typing":
          this.broadcastToAll(
            {
              type: "typing",
              payload: { userId: participant.userId, field: data.field },
              timestamp: Date.now(),
            },
            ws
          );
          break;
      }
    } catch (error) {
      console.error("Room message error:", error);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const participant = this.participants.get(ws);
    if (participant) {
      this.participants.delete(ws);
      this.broadcastToAll({
        type: "participant_leave",
        payload: participant,
        timestamp: Date.now(),
      });
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("Room WebSocket error:", error);
    this.webSocketClose(ws);
  }

  private broadcastUpdate(
    update: { key: string; value: unknown; sender?: string },
    exclude?: WebSocket
  ): void {
    const message = JSON.stringify({
      type: "state_update",
      payload: update,
      timestamp: Date.now(),
    });

    for (const [ws] of this.participants) {
      if (ws !== exclude) {
        try {
          ws.send(message);
        } catch {
          this.participants.delete(ws);
        }
      }
    }
  }

  private broadcastToAll(message: object, exclude?: WebSocket): void {
    const json = JSON.stringify(message);
    for (const [ws] of this.participants) {
      if (ws !== exclude) {
        try {
          ws.send(json);
        } catch {
          this.participants.delete(ws);
        }
      }
    }
  }
}

// =============================================================================
// HONO APP - HTTP API
// =============================================================================

const ALLOWED_SSE_ORIGINS = [
  "https://app.integratewise.ai",
  "https://integratewise.ai",
  "http://localhost:5173",
  "http://localhost:3000",
];

function resolveSSEOrigin(request: Request): string {
  const origin = request.headers.get("Origin") || "";
  return ALLOWED_SSE_ORIGINS.includes(origin) ? origin : ALLOWED_SSE_ORIGINS[0];
}

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: ALLOWED_SSE_ORIGINS,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-tenant-id", "x-user-id"],
  })
);

// Health check
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "integratewise-stream-gateway",
    description: "Real-time WebSocket/SSE service using Durable Objects",
    endpoints: {
      websocket: "/ws/signals?tenantId=...&userId=...",
      sse: "/sse/signals?tenantId=...",
      presence: "/ws/presence/:roomId?userId=...",
      room: "/ws/room/:roomId?userId=...",
    },
  });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// =============================================================================
// WEBSOCKET ENDPOINTS
// =============================================================================

/**
 * WebSocket endpoint for signal streaming
 */
app.get("/ws/signals", async (c) => {
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "Missing tenantId" }, 400);
  }

  // Rate limiting check
  const rateLimitKey = `ws:${tenantId}:count`;
  const currentCount = parseInt((await c.env.RATE_LIMIT.get(rateLimitKey)) || "0");
  const maxConnections = parseInt(c.env.MAX_CONNECTIONS_PER_TENANT || "100");

  if (currentCount >= maxConnections) {
    return c.json({ error: "Too many connections for tenant" }, 429);
  }

  // Route to tenant-specific Durable Object
  const id = c.env.SIGNAL_STREAM.idFromName(tenantId);
  const stub = c.env.SIGNAL_STREAM.get(id);

  // Increment connection count
  await c.env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), { expirationTtl: 3600 });

  return stub.fetch(c.req.raw);
});

/**
 * WebSocket endpoint for presence tracking
 */
app.get("/ws/presence/:roomId", async (c) => {
  const roomId = c.req.param("roomId");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "Missing tenantId" }, 400);
  }

  const id = c.env.PRESENCE.idFromName(`${tenantId}:${roomId}`);
  const stub = c.env.PRESENCE.get(id);

  return stub.fetch(c.req.raw);
});

/**
 * WebSocket endpoint for collaboration rooms
 */
app.get("/ws/room/:roomId", async (c) => {
  const roomId = c.req.param("roomId");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "Missing tenantId" }, 400);
  }

  const id = c.env.ROOM.idFromName(`${tenantId}:${roomId}`);
  const stub = c.env.ROOM.get(id);

  return stub.fetch(c.req.raw);
});

// =============================================================================
// SSE ENDPOINT (Fallback for environments without WebSocket)
// =============================================================================

app.get("/sse/signals", async (c) => {
  const tenantId = c.req.query("tenantId");
  const userId = c.req.query("userId");

  if (!tenantId || !userId) {
    return c.json({ error: "Missing tenantId or userId" }, 400);
  }

  // Get recent signals from Durable Object
  const id = c.env.SIGNAL_STREAM.idFromName(tenantId);
  const stub = c.env.SIGNAL_STREAM.get(id);

  const recentResponse = await stub.fetch(new Request("http://internal/recent"));
  const { signals } = (await recentResponse.json()) as { signals: Signal[] };

  // Create SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial signals
  (async () => {
    try {
      // Send recent signals
      for (const signal of signals.slice(0, 10)) {
        await writer.write(encoder.encode(`data: ${JSON.stringify(signal)}\n\n`));
      }

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(async () => {
        try {
          await writer.write(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Keep connection alive for up to 5 minutes, then let client reconnect
      setTimeout(() => {
        clearInterval(heartbeatInterval);
        writer.close();
      }, 300000);
    } catch (error) {
      console.error("SSE error:", error);
      writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": resolveSSEOrigin(c.req.raw),
    },
  });
});

// =============================================================================
// HTTP API FOR BROADCASTING
// =============================================================================

/**
 * POST /broadcast - Broadcast a signal to all connected clients
 */
app.post("/broadcast", async (c) => {
  const tenantId = c.req.header("x-tenant-id");

  if (!tenantId) {
    return c.json({ error: "Missing x-tenant-id header" }, 400);
  }

  const signal = (await c.req.json()) as Signal;

  // Route to tenant's Signal Stream DO
  const id = c.env.SIGNAL_STREAM.idFromName(tenantId);
  const stub = c.env.SIGNAL_STREAM.get(id);

  const response = await stub.fetch(
    new Request("http://internal/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(signal),
    })
  );

  return response;
});

/**
 * GET /stats - Get connection statistics
 */
app.get("/stats", async (c) => {
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "Missing tenantId" }, 400);
  }

  const id = c.env.SIGNAL_STREAM.idFromName(tenantId);
  const stub = c.env.SIGNAL_STREAM.get(id);

  const response = await stub.fetch(new Request("http://internal/stats"));
  return response;
});

/**
 * GET /presence/:roomId - Get users in a room
 */
app.get("/presence/:roomId", async (c) => {
  const roomId = c.req.param("roomId");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "Missing tenantId" }, 400);
  }

  const id = c.env.PRESENCE.idFromName(`${tenantId}:${roomId}`);
  const stub = c.env.PRESENCE.get(id);

  const response = await stub.fetch(new Request("http://internal/users"));
  return response;
});

/**
 * GET /room/:roomId/state - Get room state
 */
app.get("/room/:roomId/state", async (c) => {
  const roomId = c.req.param("roomId");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "Missing tenantId" }, 400);
  }

  const id = c.env.ROOM.idFromName(`${tenantId}:${roomId}`);
  const stub = c.env.ROOM.get(id);

  const response = await stub.fetch(new Request("http://internal/state"));
  return response;
});

// =============================================================================
// BFF — WORKSPACE API ROUTES (v3.6)
// Gateway proxies /api/v1/workspace/* → here as /v1/workspace/*
// These are composite views aggregating from Pipeline + Knowledge stores
// =============================================================================

async function fetchSpineEntities(
  c: any,
  tenantId: string,
  entityType: string,
  limit = 100
): Promise<any[]> {
  try {
    const response = await c.env.SPINE.fetch(
      new Request(
        `http://spine/api/entities?type=${encodeURIComponent(entityType)}&limit=${limit}`,
        {
          headers: { "x-tenant-id": tenantId },
        }
      )
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as any;
    const entities = payload?.entities || payload?.data || [];
    return Array.isArray(entities) ? entities : [];
  } catch {
    return [];
  }
}

function readEntityData(entity: any): Record<string, any> {
  return entity?.data && typeof entity.data === "object" ? entity.data : {};
}

function sourceOf(entity: any): string {
  return (
    entity?.source ||
    readEntityData(entity).source ||
    readEntityData(entity).source_system ||
    "spine"
  );
}

function toAccount(entity: any): any {
  const data = readEntityData(entity);
  return {
    id: entity.id || entity.source_id || data.account_id || data.id || crypto.randomUUID(),
    name: data.account_name || entity.name || data.name || "Unknown Account",
    industry: data.industry_vertical || data.industry || "Unknown",
    arr: Number(data.arr || data.estimated_value_usd || data.value || 0),
    healthScore: Number(data.health_score || data.score || 0),
    renewalDate: data.renewal_date || data.next_renewal_date || null,
    renewalConfidence: Number(data.renewal_confidence || 0),
    growth: data.growth || "stable",
    assignedCSM: data.assigned_csm || data.owner || "Unassigned",
    lastInteraction: data.last_interaction_at || data.last_updated_at || entity.updated_at || null,
    status: data.status || (Number(data.health_score || 0) < 5 ? "atRisk" : "active"),
    source: sourceOf(entity),
  };
}

function toRenewal(entity: any): any {
  const data = readEntityData(entity);
  const dateValue = data.renewal_date || data.next_renewal_date;
  const renewalDate = dateValue ? new Date(dateValue) : null;
  const days =
    renewalDate != null
      ? Math.max(0, Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;
  return {
    id: entity.id || entity.source_id || data.renewal_id || crypto.randomUUID(),
    accountId: data.account_id || data.account_master_id || "unknown",
    accountName: data.account_name || data.name || "Unknown Account",
    arr: Number(data.contract_value || data.arr || 0),
    renewalDate: renewalDate?.toISOString() || null,
    daysUntilRenewal: days,
    healthScore: Number(data.health_score || 0),
    confidence: Number(data.renewal_confidence || 0),
    status: data.status || "onTrack",
    expansionPotential: Number(data.expansion_potential || 0),
    lastInteraction: data.last_interaction_at || entity.updated_at || null,
    assignedCSM: data.assigned_csm || data.owner || "Unassigned",
    source: sourceOf(entity),
  };
}

function toRisk(entity: any): any {
  const data = readEntityData(entity);
  return {
    id: entity.id || entity.source_id || data.risk_id || crypto.randomUUID(),
    name: data.risk_name || entity.name || "Risk",
    description: data.description || data.risk_description || "",
    likelihood: data.likelihood || "medium",
    impact: data.impact || "medium",
    category: data.risk_category || "operational",
    status: data.status || "active",
    owner: data.owner || "Unassigned",
    accountId: data.account_id || data.account_master_id || "unknown",
    detectedAt: entity.created_at || new Date().toISOString(),
    source: sourceOf(entity),
  };
}

function toContact(entity: any): any {
  const data = readEntityData(entity);
  return {
    id: entity.id || entity.source_id || data.contact_id || crypto.randomUUID(),
    name: data.full_name || data.contact_name || data.name || entity.name || "Unknown Contact",
    email: data.email || null,
    role: data.role_title || data.role || data.stakeholder_type || "Stakeholder",
    isChampion: Boolean(data.is_champion || data.champion_status),
    accountId: data.account_id || data.account_master_id || "unknown",
    lastActivity: data.last_contact_at || data.last_activity || entity.updated_at || null,
    source: sourceOf(entity),
  };
}

function toTeamMember(entity: any) {
  const data = readEntityData(entity);
  return {
    id: entity.id || entity.source_id || data.person_id || crypto.randomUUID(),
    fullName: data.full_name || data.name || entity.name || "Unknown Team Member",
    email: data.email || null,
    role: data.role || data.assignment_role || "Account Team",
    department: data.department || "Customer Success",
    region: data.region || null,
    accountCount: Number(data.account_count || 0),
    totalArrManaged: Number(data.total_arr_managed || 0),
    avgHealthScore: Number(data.avg_health_score || 0),
    atRiskAccountCount: Number(data.at_risk_account_count || 0),
    source: sourceOf(entity),
  };
}

function toTask(entity: any): any {
  const data = readEntityData(entity);
  return {
    id: entity.id || entity.source_id || data.task_id || crypto.randomUUID(),
    title: data.task_name || data.title || entity.name || "Task",
    description: data.description || "",
    priority: data.priority || "medium",
    status: data.status || "todo",
    category: data.category || data.source_category || "engagement",
    owner: data.owner || "Unassigned",
    accountId: data.account_id || data.account_master_id,
    accountName: data.account_name || data.account || undefined,
    dueDate: data.due_date || data.target_completion_date || null,
    source: sourceOf(entity),
  };
}

function toIntegration(entity: any) {
  const data = readEntityData(entity);
  return {
    id: entity.id || entity.source_id || data.integration_id || crypto.randomUUID(),
    systemName: data.system_name || data.source_system || entity.name || "Integration",
    integrationType: data.integration_type || "connector",
    status: data.status || "unknown",
    lastSyncAt: data.last_sync_at || data.completed_at || entity.updated_at || null,
    source: sourceOf(entity),
  };
}

function toSuccessPlan(entity: any) {
  const data = readEntityData(entity);
  return {
    id: entity.id || entity.source_id || data.success_plan_id || crypto.randomUUID(),
    accountId: data.account_id || data.account_master_id || "unknown",
    executiveSummary: data.executive_summary || entity.name || "Success plan",
    planPeriod: data.plan_period || "Current period",
    planStatus: data.plan_status || "Active",
    creationDate: data.creation_date || entity.created_at || null,
    nextQbrDate: data.next_qbr_date || null,
    executiveSponsorCustomer: data.executive_sponsor_customer || null,
    executiveSponsorInternal: data.executive_sponsor_internal || null,
    source: sourceOf(entity),
    updatedAt: data.last_updated || entity.updated_at || null,
  };
}

function toInsight(entity: any) {
  const data = readEntityData(entity);
  return {
    id: entity.id || entity.source_id || data.insight_id || crypto.randomUUID(),
    type: data.type || "positive",
    title: data.title || data.insight_text || entity.name || "Insight",
    description: data.description || data.recommended_action || "",
    confidence: Number(data.confidence || 70),
    sources: [sourceOf(entity)],
    accountId: data.account_id || data.account_master_id || undefined,
    suggestedAction: data.recommended_action || "Review",
    detectedAt: data.date_generated || entity.created_at || new Date().toISOString(),
  };
}

function toUsageMetric(entity: any) {
  const data = readEntityData(entity);
  return {
    id: entity.id || entity.source_id || data.metric_id || crypto.randomUUID(),
    metricName: data.metric_name || data.dimension_name || entity.name || "Metric",
    currentValue: Number(data.current_value || 0),
    targetValue: Number(data.target_value || 0),
    healthStatus: data.health_status || "unknown",
    trend: data.trend || (Boolean(data.trend_is_good) ? "up" : "stable"),
    source: sourceOf(entity),
    updatedAt: data.last_measured || entity.updated_at || null,
  };
}

function toTechnicalAsset(entity: any) {
  const data = readEntityData(entity);
  return {
    id: entity.id || entity.source_id || data.asset_id || crypto.randomUUID(),
    name: data.asset_name || data.service_name || data.api_name || entity.name || "Technical asset",
    type: data.asset_type || data.service_tier || data.api_type || "asset",
    healthStatus: data.health_status || "unknown",
    ownerTeam: data.owner_team || data.technical_owner_customer || "Unknown",
    source: sourceOf(entity),
    updatedAt: data.last_sync_from_anypoint || entity.updated_at || null,
  };
}

function latestFreshness(rows: any[]): string | null {
  const timestamps = rows
    .map(
      (row) =>
        readEntityData(row).last_sync_at ||
        readEntityData(row).last_measured ||
        row.updated_at ||
        row.created_at
    )
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function buildProof(rows: any[], entityType?: string) {
  const proofMap = new Map<
    string,
    { source: string; entityType?: string; updatedAt?: string | null }
  >();
  for (const row of rows) {
    const source = sourceOf(row);
    const updatedAt = readEntityData(row).last_sync_at || row.updated_at || row.created_at || null;
    const key = `${source}:${entityType || row.entity_type || ""}`;
    if (!proofMap.has(key)) {
      proofMap.set(key, { source, entityType: entityType || row.entity_type, updatedAt });
    }
  }
  return Array.from(proofMap.values());
}

function buildSectionContract<T>(
  rows: any[],
  data: T,
  actions: Array<{ id: string; label: string; kind: "view" | "act" | "connect" | "review" }>,
  enabled = true,
  entityType?: string
): SectionContract<T> {
  const count = Array.isArray(data)
    ? data.length
    : Object.keys((data as Record<string, unknown>) || {}).length;
  const status = !enabled ? "empty" : count > 0 ? "ready" : rows.length > 0 ? "partial" : "empty";
  const coverage = !enabled ? 0 : count > 0 ? 100 : rows.length > 0 ? 50 : 0;
  return {
    status,
    coverage,
    freshness: latestFreshness(rows),
    proof: buildProof(rows, entityType),
    actions,
    data,
  };
}

async function fetchSuccessEntities(
  c: any,
  tenantId: string,
  entityType: CSCanonicalEntityType,
  limit = 100
): Promise<any[]> {
  const aliases = getSuccessEntityAliases(entityType);
  const responses = await Promise.all(
    aliases.map((alias) => fetchSpineEntities(c, tenantId, alias, limit))
  );
  const deduped = new Map<string, any>();
  for (const rows of responses) {
    for (const row of rows) {
      const key = row.id || row.source_id || `${row.entity_type}:${row.name || row.created_at}`;
      if (!deduped.has(key)) deduped.set(key, row);
    }
  }
  return Array.from(deduped.values());
}

async function getSuccessSchemaContext(env: Env, tenantId: string, requestedLens?: RoleLens) {
  const resolvedAdaptive = await resolveTenantAdaptiveSchema({
    supabaseUrl: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    tenantId,
    requestedLens,
  });
  if (!resolvedAdaptive) {
    return resolveSuccessSchema({
      domains: ["CUSTOMER_SUCCESS"],
      connectedConnectors: [],
      requestedLens,
      allowedEntityTypes: [],
      fieldsByEntity: {},
    });
  }
  return resolveSuccessSchema({
    domains: resolvedAdaptive.domains,
    industry: resolvedAdaptive.industry,
    activeCtx: resolvedAdaptive.activeCtx,
    connectedConnectors: resolvedAdaptive.connectedConnectors,
    requestedLens,
    allowedEntityTypes: resolvedAdaptive.allowedEntityTypes,
    fieldsByEntity: resolvedAdaptive.fieldsByEntity,
  });
}

async function buildSuccessPageProjection(
  c: any,
  tenantId: string,
  pageId: CSSectionId,
  lens?: RoleLens
): Promise<SuccessPageProjection> {
  const successSchema = await getSuccessSchemaContext(c.env as Env, tenantId, lens);
  const activeLens = lens || successSchema.activeRoleLens;
  const sectionEnabled = successSchema.derivedSectionAvailability[pageId]?.enabled ?? true;

  switch (pageId) {
    case "accounts_overview": {
      const [accounts, renewals, risks] = await Promise.all([
        fetchSuccessEntities(c, tenantId, "account", 300),
        fetchSuccessEntities(c, tenantId, "success_plan", 100),
        fetchSuccessEntities(c, tenantId, "risk", 100),
      ]);
      const mappedAccounts = accounts.map(toAccount);
      const summary = {
        totalAccounts: mappedAccounts.length,
        totalARR: mappedAccounts.reduce((sum, account) => sum + Number(account.arr || 0), 0),
        avgHealth:
          mappedAccounts.length > 0
            ? mappedAccounts.reduce((sum, account) => sum + Number(account.healthScore || 0), 0) /
              mappedAccounts.length
            : 0,
        atRiskAccounts: mappedAccounts.filter((account) =>
          String(account.status).toLowerCase().includes("risk")
        ).length,
        renewalsTracked: renewals.length,
        activeRisks: risks.length,
      };
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          summary: buildSectionContract(
            accounts,
            summary,
            [{ id: "view-accounts", label: "View Accounts", kind: "view" }],
            sectionEnabled,
            "account"
          ),
          accounts_table: buildSectionContract(
            accounts,
            mappedAccounts,
            [{ id: "review-health", label: "Review Health", kind: "review" }],
            sectionEnabled,
            "account"
          ),
        },
      };
    }
    case "account_detail": {
      const accountId = c.req.query("accountId") || c.req.query("id") || "";
      const [accounts, contacts, risks, tasks, usage, technicalAssets] = await Promise.all([
        fetchSuccessEntities(c, tenantId, "account", 100),
        fetchSuccessEntities(c, tenantId, "account_contact", 200),
        fetchSuccessEntities(c, tenantId, "risk", 100),
        fetchSuccessEntities(c, tenantId, "task", 200),
        fetchSuccessEntities(c, tenantId, "platform_health_metric", 200),
        fetchSuccessEntities(c, tenantId, "technical_service", 100),
      ]);
      const mappedAccounts = accounts.map(toAccount);
      const selected =
        mappedAccounts.find((account) => account.id === accountId) ||
        mappedAccounts.find(
          (account) => String(account.name).toLowerCase() === accountId.toLowerCase()
        ) ||
        mappedAccounts[0] ||
        null;
      const scopedContacts = contacts
        .map(toContact)
        .filter((contact) => !selected || !contact.accountId || contact.accountId === selected.id);
      const scopedRisks = risks
        .map(toRisk)
        .filter((risk) => !selected || !risk.accountId || risk.accountId === selected.id);
      const scopedTasks = tasks
        .map(toTask)
        .filter((task) => !selected || !task.accountId || task.accountId === selected.id);
      const mappedUsage = usage.map(toUsageMetric);
      const mappedAssets = technicalAssets.map(toTechnicalAsset);
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          hero: buildSectionContract(
            accounts,
            selected || {},
            [{ id: "open-account", label: "Open Account", kind: "view" }],
            sectionEnabled,
            "account"
          ),
          stakeholders: buildSectionContract(
            contacts,
            scopedContacts,
            [{ id: "view-contacts", label: "View Contacts", kind: "view" }],
            sectionEnabled,
            "account_contact"
          ),
          risks: buildSectionContract(
            risks,
            scopedRisks,
            [{ id: "review-risks", label: "Review Risks", kind: "review" }],
            sectionEnabled,
            "risk"
          ),
          actions: buildSectionContract(
            tasks,
            scopedTasks,
            [{ id: "view-tasks", label: "View Tasks", kind: "view" }],
            sectionEnabled,
            "task"
          ),
          technical_health: buildSectionContract(
            [...usage, ...technicalAssets],
            activeLens === "tam"
              ? { metrics: mappedUsage.slice(0, 8), assets: mappedAssets.slice(0, 8) }
              : { metrics: mappedUsage.slice(0, 4), assets: mappedAssets.slice(0, 4) },
            [{ id: "review-health", label: "Review Technical Health", kind: "review" }],
            sectionEnabled,
            "platform_health_metric"
          ),
        },
      };
    }
    case "contacts_stakeholders": {
      const [contacts, team] = await Promise.all([
        fetchSuccessEntities(c, tenantId, "account_contact", 300),
        fetchSuccessEntities(c, tenantId, "internal_team_member", 200),
      ]);
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          stakeholders: buildSectionContract(
            contacts,
            contacts.map(toContact),
            [{ id: "manage-contacts", label: "Manage Stakeholders", kind: "view" }],
            sectionEnabled,
            "account_contact"
          ),
          internal_team: buildSectionContract(
            team,
            team.map(toTeamMember),
            [{ id: "review-ownership", label: "Review Ownership", kind: "review" }],
            sectionEnabled,
            "internal_team_member"
          ),
        },
      };
    }
    case "tasks_actions": {
      const [tasks, initiatives] = await Promise.all([
        fetchSuccessEntities(c, tenantId, "task", 300),
        fetchSuccessEntities(c, tenantId, "initiative", 200),
      ]);
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          tasks: buildSectionContract(
            tasks,
            tasks.map(toTask),
            [{ id: "view-tasks", label: "View Tasks", kind: "view" }],
            sectionEnabled,
            "task"
          ),
          initiatives: buildSectionContract(
            initiatives,
            initiatives.map(toTask),
            [{ id: "review-initiatives", label: "Review Initiatives", kind: "review" }],
            sectionEnabled,
            "initiative"
          ),
        },
      };
    }
    case "risks": {
      const [risks, assets] = await Promise.all([
        fetchSuccessEntities(c, tenantId, "risk", 300),
        fetchSuccessEntities(c, tenantId, "technical_asset", 150),
      ]);
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          register: buildSectionContract(
            risks,
            risks.map(toRisk),
            [{ id: "review-risk-plan", label: "Review Risk Plan", kind: "review" }],
            sectionEnabled,
            "risk"
          ),
          technical_context: buildSectionContract(
            assets,
            assets.map(toTechnicalAsset),
            [{ id: "view-affected-assets", label: "View Affected Assets", kind: "view" }],
            activeLens === "tam" && sectionEnabled,
            "technical_asset"
          ),
        },
      };
    }
    case "renewals": {
      const accounts = await fetchSuccessEntities(c, tenantId, "account", 200);
      const mappedRenewals = accounts.map(toRenewal);
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          renewals: buildSectionContract(
            accounts,
            mappedRenewals,
            [{ id: "review-renewals", label: "Review Renewals", kind: "review" }],
            sectionEnabled,
            "account"
          ),
        },
      };
    }
    case "usage_adoption": {
      const [usage, environment, assets] = await Promise.all([
        fetchSuccessEntities(c, tenantId, "usage_dimension", 200),
        fetchSuccessEntities(c, tenantId, "environment_health", 150),
        fetchSuccessEntities(c, tenantId, "api_portfolio", 150),
      ]);
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          metrics: buildSectionContract(
            [...usage, ...environment],
            {
              usage: usage.map(toUsageMetric),
              environment: environment.map(toUsageMetric),
              technicalAssets: assets.map(toTechnicalAsset),
            },
            [{ id: "review-adoption", label: "Review Adoption", kind: "review" }],
            sectionEnabled,
            "usage_dimension"
          ),
        },
      };
    }
    case "support_cases": {
      const [risks, engagements] = await Promise.all([
        fetchSuccessEntities(c, tenantId, "risk", 200),
        fetchSuccessEntities(c, tenantId, "engagement", 200),
      ]);
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          support: buildSectionContract(
            [...risks, ...engagements],
            { risks: risks.map(toRisk), engagements: engagements.map(toTask) },
            [{ id: "review-support", label: "Review Support", kind: "review" }],
            sectionEnabled,
            "risk"
          ),
        },
      };
    }
    case "success_plans": {
      const [plans, objectives, initiatives] = await Promise.all([
        fetchSuccessEntities(c, tenantId, "success_plan", 200),
        fetchSuccessEntities(c, tenantId, "strategic_objective", 200),
        fetchSuccessEntities(c, tenantId, "initiative", 200),
      ]);
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          plans: buildSectionContract(
            [...plans, ...objectives, ...initiatives],
            {
              plans: plans.map(toSuccessPlan),
              objectives: objectives.map((objective) => readEntityData(objective)),
              initiatives: initiatives.map(toTask),
            },
            [{ id: "review-success-plan", label: "Review Success Plan", kind: "review" }],
            sectionEnabled,
            "success_plan"
          ),
        },
      };
    }
    case "ai_insights": {
      const intelligenceUrl = new URL("http://think/v1/success/intelligence");
      intelligenceUrl.searchParams.set("lens", activeLens);
      intelligenceUrl.searchParams.set("pageId", "ai_insights");
      intelligenceUrl.searchParams.set("limit", "20");
      const [insights, thinkResult] = await Promise.all([
        fetchSuccessEntities(c, tenantId, "generated_insight", 200),
        c.env.THINK.fetch(
          new Request(intelligenceUrl.toString(), { headers: { "x-tenant-id": tenantId } })
        )
          .then(async (response: Response) => (response.ok ? response.json() : {}))
          .catch(() => ({})),
      ]);
      const signalPayload = Array.isArray((thinkResult as any)?.recentSignals)
        ? (thinkResult as any).recentSignals
        : Array.isArray((thinkResult as any)?.recent_signals)
          ? (thinkResult as any).recent_signals
          : [];
      const signalInsights = signalPayload.map((signal: any) => ({
        id: signal.id || crypto.randomUUID(),
        type:
          signal.pageId === "renewals"
            ? "renewal"
            : signal.pageId === "risks"
              ? "risk"
              : signal.pageId === "usage_adoption"
                ? "engagement"
                : "positive",
        title: signal.title || "Signal detected",
        description: signal.description || "",
        confidence: Number(signal.confidence || 70),
        sources: [signal.source || "spine"],
        accountId: signal.entityId || undefined,
        suggestedAction: signal.suggestedAction || "Review insight",
        detectedAt: signal.detectedAt || new Date().toISOString(),
      }));
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          insights: buildSectionContract(
            insights,
            [...insights.map(toInsight), ...signalInsights],
            [{ id: "review-insights", label: "Review Insights", kind: "review" }],
            sectionEnabled,
            "generated_insight"
          ),
        },
      };
    }
    case "integrations_sync_health": {
      const [integrations, syncs] = await Promise.all([
        fetchSuccessEntities(c, tenantId, "external_integration", 200),
        fetchSuccessEntities(c, tenantId, "sync_log", 200),
      ]);
      return {
        pageId,
        lens: activeLens,
        productProfile: successSchema.activeProductProfile,
        generatedAt: new Date().toISOString(),
        sections: {
          integrations: buildSectionContract(
            [...integrations, ...syncs],
            {
              integrations: integrations.map(toIntegration),
              syncs: syncs.map(toIntegration),
              connectorCoverage: successSchema.connectorCapabilityCoverage,
            },
            [{ id: "view-integrations", label: "View Integrations", kind: "view" }],
            sectionEnabled,
            "external_integration"
          ),
        },
      };
    }
  }

  return {
    pageId,
    lens: activeLens,
    productProfile: successSchema.activeProductProfile,
    generatedAt: new Date().toISOString(),
    sections: {},
  };
}

/**
 * GET /v1/workspace/cs/dashboard/executive
 * Real projection for CS flagship path (truth + context + signal proof).
 */
app.get("/v1/workspace/cs/dashboard/executive", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || c.req.query("tenantId") || "";
  const [accountRows, healthRows, riskRows, renewalRows, thinkResult] = await Promise.all([
    fetchSpineEntities(c, tenantId, "account", 200),
    fetchSpineEntities(c, tenantId, "account_health", 200),
    fetchSpineEntities(c, tenantId, "risk_register", 200),
    fetchSpineEntities(c, tenantId, "renewal", 200),
    c.env.THINK.fetch(
      new Request("http://think/v1/success/intelligence?lens=account_success&limit=12", {
        headers: { "x-tenant-id": tenantId },
      })
    )
      .then(async (response) => (response.ok ? response.json() : {}))
      .catch(() => ({})),
  ]);

  const healthByAccount = new Map<string, any>();
  for (const h of healthRows) {
    const data = readEntityData(h);
    const accountId = data.account_id || data.account_master_id || h.source_id;
    if (accountId) healthByAccount.set(String(accountId), h);
  }

  const accounts = accountRows.map((row) => {
    const base = toAccount(row);
    const health = healthByAccount.get(base.id);
    if (health) {
      const hData = readEntityData(health);
      base.healthScore = Number(hData.health_score || hData.score || base.healthScore || 0);
    }
    return base;
  });

  const renewals = renewalRows.map(toRenewal).sort((a, b) => {
    if (a.daysUntilRenewal == null) return 1;
    if (b.daysUntilRenewal == null) return -1;
    return a.daysUntilRenewal - b.daysUntilRenewal;
  });
  const risks = riskRows.map(toRisk);

  const signals = Array.isArray((thinkResult as any)?.recentSignals)
    ? (thinkResult as any).recentSignals
    : Array.isArray((thinkResult as any)?.recent_signals)
      ? (thinkResult as any).recent_signals
      : [];
  const recentInsights = signals.slice(0, 5).map((signal: any) => ({
    id: signal.id || crypto.randomUUID(),
    type:
      signal.pageId === "renewals"
        ? "renewal"
        : signal.pageId === "risks"
          ? "risk"
          : signal.pageId === "usage_adoption"
            ? "engagement"
            : "positive",
    title: signal.title || "Signal detected",
    description: signal.description || "No description available",
    confidence: Number(signal.confidence || 70),
    sources: [signal.source || "spine"],
    accountId: signal.entityId || signal.entity_id || undefined,
    suggestedAction: signal.suggestedAction || signal.action || "Review account context",
    detectedAt: signal.detectedAt || signal.created_at || new Date().toISOString(),
  }));

  const sourceCounts = new Map<string, { entities: number; role: string }>();
  for (const entity of [...accountRows, ...healthRows, ...riskRows, ...renewalRows]) {
    const src = sourceOf(entity);
    const data = readEntityData(entity);
    const role = String(data.source_role || data.integration_role || "unspecified");
    const existing = sourceCounts.get(src);
    if (existing) {
      existing.entities += 1;
    } else {
      sourceCounts.set(src, { entities: 1, role });
    }
  }
  const recommendationCounts = new Map<string, number>();
  for (const signal of signals) {
    const src = signal?.source || "spine";
    recommendationCounts.set(src, (recommendationCounts.get(src) || 0) + 1);
  }

  const proof = Array.from(sourceCounts.entries()).map(([source, details]) => ({
    source,
    spine_entities: details.entities,
    recommendations: recommendationCounts.get(source) || 0,
    role: details.role,
  }));

  const totalARR = accounts.reduce((sum, account) => sum + Number(account.arr || 0), 0);
  const atRiskAccounts = accounts.filter((account) => Number(account.healthScore || 0) < 5);
  const atRiskARR = atRiskAccounts.reduce((sum, account) => sum + Number(account.arr || 0), 0);

  return c.json({
    accounts,
    metrics: {
      totalARR,
      atRiskARR,
      expansionPotential: renewals.reduce(
        (sum, renewal) => sum + Number(renewal.expansionPotential || 0),
        0
      ),
      avgHealth:
        accounts.length > 0
          ? accounts.reduce((sum, account) => sum + Number(account.healthScore || 0), 0) /
            accounts.length
          : 0,
    },
    upcomingRenewals: renewals.slice(0, 8),
    recentInsights,
    tasksDue: risks.slice(0, 5).map((risk) => ({
      id: risk.id,
      title: `Mitigate: ${risk.name}`,
      priority: risk.impact === "high" ? "high" : "medium",
      dueDate: risk.detectedAt,
      dueDays: 0,
      category: "risk",
      accountName: risk.accountId,
      source: risk.source,
    })),
    proof,
  });
});

app.get("/v1/workspace/success/page/:pageId", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || c.req.query("tenantId") || "";
  const requestedLens = (c.req.query("lens") || undefined) as RoleLens | undefined;
  const pageId = c.req.param("pageId") as CSSectionId;
  const projection = await buildSuccessPageProjection(c, tenantId, pageId, requestedLens);
  return c.json(projection);
});

app.get("/v1/workspace/cs/page/:pageId", async (c) => {
  const rewrittenUrl = new URL(c.req.url);
  if (!rewrittenUrl.searchParams.has("lens")) {
    rewrittenUrl.searchParams.set("lens", "account_success");
  }
  rewrittenUrl.pathname = `/v1/workspace/success/page/${c.req.param("pageId")}`;
  const request = new Request(rewrittenUrl.toString(), c.req.raw);
  return app.fetch(request, c.env, c.executionCtx);
});

app.get("/v1/workspace/tam/page/:pageId", async (c) => {
  const rewrittenUrl = new URL(c.req.url);
  if (!rewrittenUrl.searchParams.has("lens")) {
    rewrittenUrl.searchParams.set("lens", "tam");
  }
  rewrittenUrl.pathname = `/v1/workspace/success/page/${c.req.param("pageId")}`;
  const request = new Request(rewrittenUrl.toString(), c.req.raw);
  return app.fetch(request, c.env, c.executionCtx);
});

app.get("/v1/workspace/cs/accounts", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || c.req.query("tenantId") || "";
  const rows = await fetchSpineEntities(c, tenantId, "account", 300);
  return c.json(rows.map(toAccount));
});

app.get("/v1/workspace/cs/risks", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || c.req.query("tenantId") || "";
  const rows = await fetchSpineEntities(c, tenantId, "risk_register", 300);
  return c.json(rows.map(toRisk));
});

app.get("/v1/workspace/cs/renewals", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || c.req.query("tenantId") || "";
  const rows = await fetchSpineEntities(c, tenantId, "renewal", 300);
  return c.json(rows.map(toRenewal));
});

app.get("/v1/workspace/cs/insights", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || c.req.query("tenantId") || "";
  const response = await c.env.THINK.fetch(
    new Request("http://think/v1/success/intelligence?lens=account_success&pageId=ai_insights", {
      headers: { "x-tenant-id": tenantId },
    })
  );
  const payload = response.ok ? await response.json() : {};
  const items = Array.isArray((payload as any)?.recentSignals)
    ? (payload as any).recentSignals
    : Array.isArray((payload as any)?.recent_signals)
      ? (payload as any).recent_signals
      : [];
  return c.json(
    items.map((signal: any) => ({
      id: signal.id || crypto.randomUUID(),
      type:
        signal.pageId === "renewals"
          ? "renewal"
          : signal.pageId === "risks"
            ? "risk"
            : signal.pageId === "usage_adoption"
              ? "engagement"
              : "positive",
      title: signal.title || "Signal detected",
      description: signal.description || "No description available",
      confidence: Number(signal.confidence || 70),
      sources: [signal.source || "spine"],
      accountId: signal.entityId || signal.entity_id || undefined,
      suggestedAction: signal.suggestedAction || signal.action || "Review account context",
      detectedAt: signal.detectedAt || signal.created_at || new Date().toISOString(),
    }))
  );
});

app.post("/v1/workspace/cs/insights/:id/act", async (c) => {
  const insightId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  return c.json({
    success: true,
    insight_id: insightId,
    action: body?.action || "review",
    status: "queued_for_approval",
    approval_required: true,
    created_at: new Date().toISOString(),
  });
});

app.post("/v1/workspace/cs/insights/:id/dismiss", async (c) => {
  const insightId = c.req.param("id");
  return c.json({ success: true, insight_id: insightId, dismissed: true });
});

// =============================================================================
// BI ROUTES — Cloudflare D1 Native (No Supabase)
// =============================================================================

/**
 * GET /v1/workspace/bi/executive — Executive metrics dashboard
 */
app.get("/v1/workspace/bi/executive", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const db = c.env.ANALYTICS_DB;

  const [deptHealth, execMetrics, founderMetrics, signals, decisions] = await Promise.all([
    db
      .prepare("SELECT * FROM bi_department_health WHERE tenant_id = ? ORDER BY health_score DESC")
      .bind(tenantId)
      .all(),
    db
      .prepare("SELECT * FROM bi_executive_metrics WHERE tenant_id = ? ORDER BY metric_name")
      .bind(tenantId)
      .all(),
    db
      .prepare(
        "SELECT * FROM bi_founder_dashboard WHERE tenant_id = ? ORDER BY category, metric_name"
      )
      .bind(tenantId)
      .all(),
    db
      .prepare(
        "SELECT * FROM bi_cross_department_signals WHERE tenant_id = ? AND acknowledged = 0 ORDER BY created_at DESC LIMIT 10"
      )
      .bind(tenantId)
      .all(),
    db
      .prepare(
        "SELECT * FROM bi_strategic_decisions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5"
      )
      .bind(tenantId)
      .all(),
  ]);

  return c.json({
    tenant_id: tenantId,
    departments: deptHealth.results || [],
    executive_metrics: execMetrics.results || [],
    founder_metrics: founderMetrics.results || [],
    signals: signals.results || [],
    decisions: decisions.results || [],
    generated_at: new Date().toISOString(),
  });
});

/**
 * GET /v1/workspace/bi/founder — Founder-specific dashboard
 */
app.get("/v1/workspace/bi/founder", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const db = c.env.ANALYTICS_DB;

  const [metrics, signals] = await Promise.all([
    db
      .prepare(
        "SELECT * FROM bi_founder_dashboard WHERE tenant_id = ? ORDER BY category, metric_name"
      )
      .bind(tenantId)
      .all(),
    db
      .prepare(
        "SELECT * FROM bi_cross_department_signals WHERE tenant_id = ? AND severity IN ('high', 'critical') AND acknowledged = 0 ORDER BY created_at DESC LIMIT 5"
      )
      .bind(tenantId)
      .all(),
  ]);

  const grouped = (metrics.results || []).reduce((acc: any, m: any) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return c.json({
    tenant_id: tenantId,
    categories: grouped,
    alerts: signals.results || [],
    generated_at: new Date().toISOString(),
  });
});

/**
 * GET /v1/workspace/bi/department/:dept — Department health detail
 */
app.get("/v1/workspace/bi/department/:dept", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const department = c.req.param("dept");
  const db = c.env.ANALYTICS_DB;

  const dept = await db
    .prepare("SELECT * FROM bi_department_health WHERE tenant_id = ? AND department = ?")
    .bind(tenantId, department)
    .first();

  if (!dept) {
    return c.json({ error: "Department not found" }, 404);
  }

  return c.json({
    tenant_id: tenantId,
    department: dept,
    generated_at: new Date().toISOString(),
  });
});

/**
 * GET /v1/workspace/bi/signals — Cross-department signals
 */
app.get("/v1/workspace/bi/signals", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const acknowledged = c.req.query("acknowledged") || "0";
  const db = c.env.ANALYTICS_DB;

  const signals = await db
    .prepare(
      "SELECT * FROM bi_cross_department_signals WHERE tenant_id = ? AND acknowledged = ? ORDER BY created_at DESC LIMIT 20"
    )
    .bind(tenantId, acknowledged)
    .all();

  return c.json({
    tenant_id: tenantId,
    signals: signals.results || [],
    generated_at: new Date().toISOString(),
  });
});

/**
 * POST /v1/workspace/bi/signals/:id/ack — Acknowledge a signal
 */
app.post("/v1/workspace/bi/signals/:id/ack", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const signalId = c.req.param("id");
  const db = c.env.ANALYTICS_DB;

  await db
    .prepare(
      "UPDATE bi_cross_department_signals SET acknowledged = 1 WHERE id = ? AND tenant_id = ?"
    )
    .bind(signalId, tenantId)
    .run();

  return c.json({ success: true, signal_id: signalId, acknowledged: true });
});

/**
 * GET /v1/workspace/bi/decisions — Strategic decisions
 */
app.get("/v1/workspace/bi/decisions", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const status = c.req.query("status");
  const db = c.env.ANALYTICS_DB;

  let query = "SELECT * FROM bi_strategic_decisions WHERE tenant_id = ?";
  const params: any[] = [tenantId];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY created_at DESC LIMIT 20";

  const decisions = await db
    .prepare(query)
    .bind(...params)
    .all();

  return c.json({
    tenant_id: tenantId,
    decisions: decisions.results || [],
    generated_at: new Date().toISOString(),
  });
});

/**
 * GET /v1/workspace/dashboard — Composite dashboard for a domain
 * Aggregates: entity counts, signals, readiness, top metrics
 */
app.get("/v1/workspace/dashboard", async (c) => {
  const domain = c.req.query("domain") || "CUSTOMER_SUCCESS";
  const tenantId = c.req.header("x-tenant-id") || c.req.query("tenantId") || "";

  // Aggregate from Spine (entities) + Think (signals)
  const [pipelineResult, thinkResult, governResult] = await Promise.allSettled([
    c.env.SPINE.fetch(
      new Request("http://spine/api/dashboard", {
        headers: { "x-tenant-id": tenantId },
      })
    ).then((r: Response) => (r.ok ? r.json() : null)),
    c.env.THINK.fetch(
      new Request("http://think/v1/signals", {
        headers: { "x-tenant-id": tenantId },
      })
    ).then((r: Response) => (r.ok ? r.json() : null)),
    Promise.resolve(null),
  ]);

  // Extract with safe defaults
  const pipelineData = pipelineResult.status === "fulfilled" ? pipelineResult.value || {} : {};
  const thinkData = thinkResult.status === "fulfilled" ? thinkResult.value || {} : {};
  const governData = governResult.status === "fulfilled" ? governResult.value || {} : {};

  return c.json({
    domain,
    tenant_id: tenantId,
    summary: {
      total_entities: (pipelineData as any)?.entity_count || 0,
      healthy: (pipelineData as any)?.healthy_count || 0,
      at_risk: (pipelineData as any)?.at_risk_count || 0,
      critical: (pipelineData as any)?.critical_count || 0,
    },
    signals: {
      total: (thinkData as any)?.signal_count || 0,
      unread: (thinkData as any)?.unread_count || 0,
      active_situations: (thinkData as any)?.active_situations || 0,
      items: (thinkData as any)?.recent_signals || [],
    },
    pending_approvals: (governData as any)?.pending_count || 0,
    pipeline_health: (pipelineData as any)?.health_score || 0,
    readiness: { score: 0, hydration_bucket: "B0" },
    last_updated: new Date().toISOString(),
  });
});

/**
 * GET /v1/workspace/readiness — Hydration readiness per department
 */
app.get("/v1/workspace/readiness", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";

  return c.json({
    tenant_id: tenantId,
    departments: {
      CUSTOMER_SUCCESS: { bucket: "B0", score: 0, connectors: 0 },
      SALES: { bucket: "B0", score: 0, connectors: 0 },
      REVOPS: { bucket: "B0", score: 0, connectors: 0 },
      MARKETING: { bucket: "B0", score: 0, connectors: 0 },
      PRODUCT: { bucket: "B0", score: 0, connectors: 0 },
    },
    overall_bucket: "B0",
    last_updated: new Date().toISOString(),
  });
});

/**
 * GET /v1/workspace/navigation — L1 module navigation config
 */
app.get("/v1/workspace/navigation", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const viewContext = c.req.header("x-view-context") || "CTX_BIZOPS";

  // Navigation adapts based on role/domain
  const modules = [
    { id: "home", label: "Home", icon: "home", enabled: true },
    { id: "goals", label: "Goals & Metrics", icon: "target", enabled: true },
    { id: "entities", label: "Accounts", icon: "users", enabled: true },
    { id: "signals", label: "Signals", icon: "bell", enabled: true },
    { id: "tasks", label: "Tasks", icon: "check-square", enabled: true },
    { id: "knowledge", label: "Knowledge", icon: "book", enabled: true },
    { id: "brainstorm", label: "Brainstorm", icon: "sparkles", enabled: true },
    { id: "connectors", label: "Connectors", icon: "plug", enabled: true },
    { id: "approvals", label: "Approvals", icon: "shield", enabled: true },
    { id: "settings", label: "Settings", icon: "settings", enabled: true },
  ];

  return c.json({
    tenant_id: tenantId,
    view_context: viewContext,
    modules,
    spaces: ["personal", "work", "team"],
  });
});

/**
 * GET /v1/workspace/hydration/manifest — Progressive Hydration Fabric manifest
 * Serves the slot bindings and provider config for the frontend's Hydration Fabric.
 * Respects tenant isolation and view context.
 */
app.get("/v1/workspace/hydration/manifest", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "default";
  const viewContext = c.req.header("x-view-context") || "CTX_BIZOPS";

  // Build manifest from domain config
  const manifest: any = {
    version: "3.6",
    generatedAt: new Date().toISOString(),
    configSource: "bff",
    tenant_id: tenantId,
    view_context: viewContext,

    providers: {
      spine: { type: "spine", enabled: true },
      rest: { type: "rest", enabled: true, baseUrl: "" },
      doppler: { type: "doppler", enabled: false },
      static: { type: "static", enabled: true, meta: { datasets: {} } },
      kv: { type: "kv", enabled: true },
      graphql: { type: "graphql", enabled: false },
    },

    slots: generateDomainSlots(viewContext),

    roleBindings: {
      "*": {
        roleId: "*",
        domain: viewContext,
        allowedSlots: ["*"],
        hydrationStrategy: "lazy",
        maxConcurrent: 4,
        preloadSlots: ["dashboard", "signals"],
      },
    },

    transforms: {
      identity: { id: "identity", description: "Pass through", type: "map" },
      "extract-data": {
        id: "extract-data",
        description: "Extract .data from response",
        type: "map",
        spec: { root: "data" },
      },
    },
  };

  return c.json(manifest);
});

/**
 * Helper: Generate domain-specific slots with scope (personal/work/team)
 */
function generateDomainSlots(_ctx: string): any {
  const baseSlots: Record<string, any> = {
    // Personal slots — same for all users
    dashboard: {
      slotId: "dashboard",
      provider: "rest",
      endpoint: "/api/v1/workspace/dashboard",
      ttl: 30000,
      priority: 1,
      scope: "personal",
    },
    tasks: {
      slotId: "tasks",
      provider: "rest",
      endpoint: "/api/v1/workspace/tasks",
      ttl: 30000,
      priority: 2,
      scope: "personal",
    },
    calendar: {
      slotId: "calendar",
      provider: "rest",
      endpoint: "/api/v1/workspace/calendar",
      ttl: 60000,
      priority: 2,
      scope: "personal",
    },
    notes: {
      slotId: "notes",
      provider: "rest",
      endpoint: "/api/v1/workspace/notes",
      ttl: 60000,
      priority: 3,
      scope: "personal",
    },

    // Work slots — domain-specific
    signals: {
      slotId: "signals",
      provider: "rest",
      endpoint: "/api/v1/cognitive/signals",
      ttl: 15000,
      priority: 1,
      scope: "work",
    },
    entities: {
      slotId: "entities",
      provider: "rest",
      endpoint: "/api/v1/pipeline/entities",
      ttl: 30000,
      priority: 2,
      scope: "work",
    },
    knowledge: {
      slotId: "knowledge",
      provider: "rest",
      endpoint: "/api/v1/knowledge/search",
      ttl: 60000,
      priority: 3,
      scope: "work",
    },
    goals: {
      slotId: "goals",
      provider: "rest",
      endpoint: "/api/v1/workspace/goals",
      ttl: 120000,
      priority: 3,
      scope: "work",
    },
    connectors: {
      slotId: "connectors",
      provider: "rest",
      endpoint: "/api/v1/connector/status",
      ttl: 300000,
      priority: 4,
      scope: "work",
    },

    // Team slots — org-level
    "team.presence": {
      slotId: "team.presence",
      provider: "rest",
      endpoint: "/api/v1/workspace/presence",
      ttl: 5000,
      priority: 1,
      scope: "team",
    },
    "team.activity": {
      slotId: "team.activity",
      provider: "rest",
      endpoint: "/api/v1/workspace/activity",
      ttl: 15000,
      priority: 2,
      scope: "team",
    },
  };

  return baseSlots;
}

/**
 * GET /v1/workspace/space/:spaceType — Space-specific data
 */
app.get("/v1/workspace/space/:spaceType", async (c) => {
  const spaceType = c.req.param("spaceType");
  const tenantId = c.req.header("x-tenant-id") || "";

  return c.json({
    space: spaceType,
    tenant_id: tenantId,
    blocks: [
      { id: "summary", type: "summary_snapshot", visible: true },
      { id: "signal_feed", type: "signal_feed", visible: true },
      { id: "quick_actions", type: "quick_actions", visible: true },
      { id: "goals", type: "goal_tracker", visible: true },
      { id: "connect_tool", type: "connect_next_tool", visible: true },
    ],
    hydration_bucket: "B0",
  });
});

/**
 * GET /v1/workspace/view/:viewId — L1 module view data
 */
app.get("/v1/workspace/view/:viewId", async (c) => {
  const viewId = c.req.param("viewId");
  const tenantId = c.req.header("x-tenant-id") || "";

  return c.json({
    view_id: viewId,
    tenant_id: tenantId,
    data: {},
    layout: "default",
    last_updated: new Date().toISOString(),
  });
});

/**
 * CSM domain workspace routes
 */
app.all("/v1/workspace/csm/*", async (c) => {
  const path = c.req.path.replace("/v1/workspace/csm/", "");
  const rewrittenUrl = new URL(c.req.url);
  rewrittenUrl.pathname = `/v1/workspace/cs/${path}`;
  const request = new Request(rewrittenUrl.toString(), c.req.raw);
  return app.fetch(request, c.env, c.executionCtx);
});

app.all("/v1/workspace/tam/*", async (c) => {
  const path = c.req.path.replace("/v1/workspace/tam/", "");
  const rewrittenUrl = new URL(c.req.url);
  rewrittenUrl.pathname = `/v1/workspace/success/${path}`;
  if (!rewrittenUrl.searchParams.has("lens")) {
    rewrittenUrl.searchParams.set("lens", "tam");
  }
  const request = new Request(rewrittenUrl.toString(), c.req.raw);
  return app.fetch(request, c.env, c.executionCtx);
});

/**
 * Evidence routes (for L2 cognitive evidence surface)
 */
app.all("/v1/workspace/evidence/*", async (c) => {
  const path = c.req.path.replace("/v1/workspace/evidence/", "");
  const tenantId = c.req.header("x-tenant-id") || "";

  return c.json({
    evidence_type: path,
    tenant_id: tenantId,
    items: [],
    last_updated: new Date().toISOString(),
  });
});

// Catch-all workspace
app.all("/v1/workspace/*", async (c) => {
  const path = c.req.path.replace("/v1/workspace/", "");
  return c.json({
    path,
    tenant_id: c.req.header("x-tenant-id") || "",
    data: null,
    message: "Route registered, implementation pending",
  });
});

// =============================================================================
// EXPORT
// =============================================================================

export default app;

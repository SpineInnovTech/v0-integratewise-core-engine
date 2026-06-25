import { DurableObject } from "cloudflare:workers";
import type { Env } from "./types";

export interface ActiveSignal {
  id: string;
  title: string;
  body?: string;
  severity: "info" | "warning" | "critical";
  source: string;
  created_at: string;
  read: number; // 0 or 1
  resolved: number; // 0 or 1
}

export interface ActiveExecution {
  id: string;
  proposal_id?: string;
  title: string;
  action_type: string;
  status: "queued" | "running" | "complete" | "failed" | "paused";
  queued_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface PendingApproval {
  id: string;
  proposal_id: string;
  title: string;
  summary: string;
  confidence: number;
  status: "pending" | "approved" | "rejected" | "expired";
  proposed_at: string;
  expires_at: string; // ISO string for alarm triggers
}

export class TenantBrainDO extends DurableObject<Env> {
  constructor(
    private state: DurableObjectState,
    env: Env
  ) {
    super(state, env);

    // Initialize SQLite schema inside DO local storage
    this.state.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS tenant_state (
        tenant_id TEXT PRIMARY KEY,
        is_paused INTEGER DEFAULT 0,
        pause_reason TEXT,
        approval_threshold REAL DEFAULT 0.8,
        updated_at TEXT
      )
    `);

    this.state.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS active_signals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT,
        severity TEXT,
        source TEXT,
        created_at TEXT,
        read INTEGER DEFAULT 0,
        resolved INTEGER DEFAULT 0
      )
    `);

    this.state.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS active_executions (
        id TEXT PRIMARY KEY,
        proposal_id TEXT,
        title TEXT,
        action_type TEXT,
        status TEXT,
        queued_at TEXT,
        started_at TEXT,
        completed_at TEXT
      )
    `);

    this.state.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS pending_approvals (
        id TEXT PRIMARY KEY,
        proposal_id TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        confidence REAL,
        status TEXT,
        proposed_at TEXT,
        expires_at TEXT
      )
    `);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const tenantId = request.headers.get("x-tenant-id") || "iw-customer-zero";

    // Initialize tenant state row if not present
    this.state.storage.sql.exec(
      "INSERT OR IGNORE INTO tenant_state (tenant_id, is_paused, pause_reason, approval_threshold, updated_at) VALUES (?, 0, NULL, 0.8, ?)",
      tenantId,
      new Date().toISOString()
    );

    // Endpoint: GET /state
    if (path.endsWith("/state")) {
      const tenantRow = this.state.storage.sql
        .exec("SELECT * FROM tenant_state WHERE tenant_id = ?", tenantId)
        .one() as {
        is_paused: number;
        pause_reason: string | null;
        approval_threshold: number;
        updated_at: string;
      };
      const signals = [
        ...this.state.storage.sql.exec("SELECT * FROM active_signals WHERE resolved = 0"),
      ];
      const executions = [
        ...this.state.storage.sql.exec(
          "SELECT * FROM active_executions WHERE status IN ('queued', 'running')"
        ),
      ];
      const approvals = [
        ...this.state.storage.sql.exec("SELECT * FROM pending_approvals WHERE status = 'pending'"),
      ];

      return Response.json({
        tenant_id: tenantId,
        is_paused: tenantRow.is_paused === 1,
        pause_reason: tenantRow.pause_reason,
        approval_threshold: tenantRow.approval_threshold,
        active_signals: signals,
        active_executions: executions,
        pending_approvals: approvals,
        updated_at: tenantRow.updated_at,
      });
    }

    // Endpoint: POST /signal (Ingest new signal)
    if (path.endsWith("/signal") && request.method === "POST") {
      const body = (await request.json()) as Partial<ActiveSignal>;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      this.state.storage.sql.exec(
        "INSERT INTO active_signals (id, title, body, severity, source, created_at, read, resolved) VALUES (?, ?, ?, ?, ?, ?, 0, 0)",
        id,
        body.title || "Untitled Signal",
        body.body || "",
        body.severity || "info",
        body.source || "unknown",
        now
      );

      return Response.json({ success: true, id });
    }

    // Endpoint: POST /execution (Register execution)
    if (path.endsWith("/execution") && request.method === "POST") {
      const body = (await request.json()) as Partial<ActiveExecution>;
      const id = body.id || crypto.randomUUID();
      const now = new Date().toISOString();

      this.state.storage.sql.exec(
        "INSERT INTO active_executions (id, proposal_id, title, action_type, status, queued_at) VALUES (?, ?, ?, ?, ?, ?)",
        id,
        body.proposal_id || "",
        body.title || "Execution",
        body.action_type || "action",
        "queued",
        now
      );

      return Response.json({ success: true, id });
    }

    // Endpoint: PATCH /execution/:id (Update execution status)
    if (path.includes("/execution/") && request.method === "PATCH") {
      const execId = path.split("/execution/")[1];
      const body = (await request.json()) as { status: string };
      const now = new Date().toISOString();

      this.state.storage.sql.exec(
        "UPDATE active_executions SET status = ?, completed_at = ? WHERE id = ?",
        body.status,
        now,
        execId
      );

      return Response.json({ success: true });
    }

    // Endpoint: POST /approval (Register pending approval & Set Alarm)
    if (path.endsWith("/approval") && request.method === "POST") {
      const body = (await request.json()) as {
        proposal_id: string;
        title: string;
        summary: string;
        confidence: number;
      };
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // Expire in 15 minutes
      const expireTime = Date.now() + 15 * 60 * 1000;
      const expiresAt = new Date(expireTime).toISOString();

      this.state.storage.sql.exec(
        "INSERT INTO pending_approvals (id, proposal_id, title, summary, confidence, status, proposed_at, expires_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)",
        id,
        body.proposal_id,
        body.title,
        body.summary,
        body.confidence,
        now,
        expiresAt
      );

      // Set pause status for the tenant
      this.state.storage.sql.exec(
        "UPDATE tenant_state SET is_paused = 1, pause_reason = ?, updated_at = ? WHERE tenant_id = ?",
        `Awaiting approval: ${body.title}`,
        now,
        tenantId
      );

      // Schedule DO Alarm for timeout escalation
      await this.state.storage.setAlarm(expireTime);

      return Response.json({ success: true, id, expires_at: expiresAt });
    }

    // Endpoint: PATCH /approval/:id (Act on approval)
    if (path.includes("/approval/") && request.method === "PATCH") {
      const approvalId = path.split("/approval/")[1];
      const body = (await request.json()) as { action: "approve" | "reject" };
      const status = body.action === "approve" ? "approved" : "rejected";
      const now = new Date().toISOString();

      this.state.storage.sql.exec(
        "UPDATE pending_approvals SET status = ? WHERE id = ?",
        status,
        approvalId
      );

      // Check if there are still pending approvals before unpausing
      const pendingCount = this.state.storage.sql
        .exec("SELECT COUNT(*) as count FROM pending_approvals WHERE status = 'pending'")
        .one() as { count: number };

      if (pendingCount.count === 0) {
        this.state.storage.sql.exec(
          "UPDATE tenant_state SET is_paused = 0, pause_reason = NULL, updated_at = ? WHERE tenant_id = ?",
          now,
          tenantId
        );
      }

      return Response.json({ success: true, status, is_paused: pendingCount.count > 0 });
    }

    // Endpoint: POST /gc (Garbage Collection)
    if (path.endsWith("/gc") && request.method === "POST") {
      const now = new Date().toISOString();

      // Delete completed/failed executions older than 7 days
      this.state.storage.sql.exec(
        "DELETE FROM active_executions WHERE status IN ('complete', 'failed') AND datetime(queued_at) < datetime(?, '-7 days')",
        now
      );

      // Delete actioned approvals older than 7 days
      this.state.storage.sql.exec(
        "DELETE FROM pending_approvals WHERE status IN ('approved', 'rejected', 'expired') AND datetime(proposed_at) < datetime(?, '-7 days')",
        now
      );

      return Response.json({ success: true });
    }

    return new Response("Not Found", { status: 404 });
  }

  /**
   * Cloudflare Durable Object Alarm Handler
   * Handles timeout escalations when alarms trigger.
   */
  async alarm(): Promise<void> {
    const now = new Date().toISOString();

    // Find all expired pending approvals
    const expiredList = [
      ...this.state.storage.sql.exec(
        "SELECT id, title, proposal_id FROM pending_approvals WHERE status = 'pending' AND datetime(expires_at) <= datetime(?)",
        now
      ),
    ];

    for (const app of expiredList) {
      console.warn(
        `[TenantBrainDO Alarm] Escalation timeout triggered for proposal: ${app.title} (${app.id})`
      );

      // Mark status as expired
      this.state.storage.sql.exec(
        "UPDATE pending_approvals SET status = 'expired' WHERE id = ?",
        app.id
      );

      // Escalation for timed-out approvals (Twin-only, 100% Cloudflare).
      // Hostinger VPS / Hermes is not part of the Twin runtime.
      // Only TwinAgent + TenantBrainDO (CF Agents SDK + SQLite DOs).
      // Mark expired locally. Governance (L7) / Intelligence handles review.
      // No execution bypass; follows HARD GATE.
      console.warn(
        `[TenantBrainDO Alarm] Proposal escalation (Twin-only CF): ${app.title} (${app.id}) — marked expired for governance review`
      );
      // Future: emit via INTELLIGENCE binding if a signal endpoint is available.
    }

    // Check if there are still pending approvals remaining
    const pendingCount = this.state.storage.sql
      .exec("SELECT COUNT(*) as count FROM pending_approvals WHERE status = 'pending'")
      .one() as { count: number };

    if (pendingCount.count === 0) {
      this.state.storage.sql.exec(
        "UPDATE tenant_state SET is_paused = 0, pause_reason = NULL, updated_at = ?",
        now
      );
    }
  }
}

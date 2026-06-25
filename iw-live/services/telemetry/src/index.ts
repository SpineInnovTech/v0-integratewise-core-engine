/**
 * IntegrateWise Telemetry Service
 * Receives Cloudflare Worker tail logs and exposes a viewer endpoint.
 */

export interface Env {
  LOGS_DB: D1Database;
}

interface TailEvent {
  scriptName: string;
  event: any;
  eventTimestamp: number;
  logs: any[];
  exceptions: any[];
}

export default {
  // Tail Consumer: receives logs from other workers
  async tail(events: TailEvent[], env: Env, ctx: ExecutionContext) {
    if (!env.LOGS_DB) {
      console.warn("LOGS_DB binding missing, cannot store tail events.");
      return;
    }

    // Batch insert logs into D1
    const stmts = [];
    for (const tailEvent of events) {
      const script = tailEvent.scriptName;
      const timestamp = new Date(tailEvent.eventTimestamp).toISOString();
      const logsJson = JSON.stringify(tailEvent.logs || []);
      const exceptionsJson = JSON.stringify(tailEvent.exceptions || []);

      stmts.push(
        env.LOGS_DB.prepare(
          `INSERT INTO worker_logs (script_name, timestamp, logs, exceptions) VALUES (?, ?, ?, ?)`
        ).bind(script, timestamp, logsJson, exceptionsJson)
      );
    }

    if (stmts.length > 0) {
      await env.LOGS_DB.batch(stmts).catch((err) => {
        console.error("Failed to insert logs into D1:", err);
      });
    }
  },

  // Log Viewer: exposes logs via simple HTTP API
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/logs") {
      if (!env.LOGS_DB) {
        return new Response(JSON.stringify({ error: "LOGS_DB missing" }), { status: 500 });
      }

      const limit = Number(url.searchParams.get("limit")) || 100;
      const script = url.searchParams.get("script");

      let query = "SELECT * FROM worker_logs ORDER BY timestamp DESC LIMIT ?";
      let params: any[] = [limit];

      if (script) {
        query = "SELECT * FROM worker_logs WHERE script_name = ? ORDER BY timestamp DESC LIMIT ?";
        params = [script, limit];
      }

      const result = await env.LOGS_DB.prepare(query)
        .bind(...params)
        .all();

      return new Response(JSON.stringify(result.results), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("IntegrateWise Telemetry API", { status: 200 });
  },
};

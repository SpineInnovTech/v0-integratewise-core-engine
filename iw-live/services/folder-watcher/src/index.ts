import { DurableObject } from "cloudflare:workers";
import { processAuditLog, isAuditLogFile } from "./audit-handler";

export interface Env {
  FOLDER_WATCHER_DO: DurableObjectNamespace;
  PIPELINE_QUEUE: Queue;
  FOLDER_WATCHER_KEY?: string;
  SPINE_CACHE_DB: D1Database;
  AI_SEARCH?: any; // Cloudflare AI Search binding
}

export class FolderWatcherDO extends DurableObject {
  private lastProcessedSeq: number = 0;
  env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.env = env;
    ctx.blockConcurrencyWhile(async () => {
      this.lastProcessedSeq = (await this.ctx.storage.get<number>("lastProcessedSeq")) || 0;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = (await request.json()) as {
        seq?: number;
        tenant_id: string;
        events: Array<{
          action: "add" | "change" | "unlink";
          path: string;
          content?: string;
          timestamp: string;
        }>;
      };

      if (!body.tenant_id || !body.events) {
        return new Response("Missing tenant_id or events", { status: 400 });
      }

      // Check sequence number to avoid duplicate/out-of-order processing
      if (body.seq !== undefined) {
        if (body.seq <= this.lastProcessedSeq) {
          console.log(
            `[FolderWatcherDO] Ignoring duplicate/old sequence ${body.seq} (last: ${this.lastProcessedSeq})`
          );
          return new Response(JSON.stringify({ status: "ignored", reason: "duplicate_sequence" }));
        }
        this.lastProcessedSeq = body.seq;
        await this.ctx.storage.put("lastProcessedSeq", this.lastProcessedSeq);
      }

      // Send to Pipeline Queue for normalizer ingestion
      // We send a single event per file change
      for (const event of body.events) {
        // Check if this is an audit log file
        if (isAuditLogFile(event.path)) {
          if (event.content) {
            console.log(`[FolderWatcherDO] Detected audit log file: ${event.path}`);
            try {
              const result = await processAuditLog(event.content, event.path, this.env);
              console.log(
                `[FolderWatcherDO] Processed audit log: ${result.processed} events, ${result.errors} errors`
              );
            } catch (error) {
              console.error(`[FolderWatcherDO] Failed to process audit log ${event.path}:`, error);
            }
          }
          // Don't send audit logs to Pipeline Queue
          continue;
        }

        const payload = {
          _entity_type: "file",
          _source_id: event.path,
          _tenant_id: body.tenant_id,
          action: event.action,
          path: event.path,
          content: event.content,
          timestamp: event.timestamp,
        };

        // This is a minimal payload that the Normalizer will process
        // We push it to the PIPELINE_QUEUE to enter Stage 1.
        await this.env.PIPELINE_QUEUE.send({
          message_version: 1,
          stage: "analyze",
          source: "folder-watcher",
          source_type: "webhook",
          tenant_id: body.tenant_id,
          payload: payload,
          metadata: {
            trace_id: `fw-${crypto.randomUUID()}`,
            attempt: 0,
            received_at: new Date().toISOString(),
          },
        });
      }

      return new Response(JSON.stringify({ status: "processed", events: body.events.length }));
    } catch (error: any) {
      console.error("[FolderWatcherDO] Error processing request:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "folder-watcher" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authenticate the incoming request
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }
    const token = authHeader.substring(7);
    if (env.FOLDER_WATCHER_KEY && token !== env.FOLDER_WATCHER_KEY) {
      return new Response("Forbidden", { status: 403 });
    }

    if (url.pathname === "/api/ingest" && request.method === "POST") {
      try {
        const body = (await request.clone().json()) as { tenant_id: string };
        if (!body.tenant_id) {
          return new Response("Missing tenant_id", { status: 400 });
        }

        // Generate a stable ID for the Durable Object based on the tenant_id
        // This ensures each tenant has their own queue of events and cursor
        const id = env.FOLDER_WATCHER_DO.idFromName(body.tenant_id);
        const stub = env.FOLDER_WATCHER_DO.get(id);

        return stub.fetch(request);
      } catch (err) {
        return new Response("Invalid JSON body", { status: 400 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};

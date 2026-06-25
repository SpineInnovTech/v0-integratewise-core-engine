/**
 * Hermes — SSE Execution Stream
 *
 * Provides Server-Sent Events for real-time execution status updates.
 * Uses Durable Objects for connection durability and broadcast.
 *
 * Routes:
 *   GET /stream/:taskId  → SSE stream of execution events
 */

import type { StreamEvent, StreamSubscriber, ExecutionTask } from "./types";

export interface StreamEnv {
  STREAM_HUB: DurableObjectNamespace;
  EXECUTION_META?: KVNamespace;
}

// ─── SSE Response Builder ───────────────────────────────────────────────────

export async function createSSEResponse(taskId: string, env: StreamEnv): Promise<Response> {
  const id = env.STREAM_HUB.idFromName(`stream:${taskId}`);
  const stub = env.STREAM_HUB.get(id);

  const url = new URL(`http://internal/stream/${taskId}`);
  const request = new Request(url.toString(), {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
    },
  });

  return stub.fetch(request);
}

// ─── StreamHub Durable Object ───────────────────────────────────────────────

export class StreamHubDO {
  private state: DurableObjectState;
  private env: StreamEnv;
  private subscribers: Map<string, StreamSubscriber> = new Map();
  private heartbeatInterval?: ReturnType<typeof setInterval>;

  constructor(state: DurableObjectState, env: StreamEnv) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const taskId = parts[1];

    if (!taskId) {
      return new Response(JSON.stringify({ error: "taskId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Client request: open SSE stream
    if (request.method === "GET") {
      return this.handleSubscribe(taskId);
    }

    // Internal request: broadcast event
    if (request.method === "POST" && url.pathname.endsWith("/broadcast")) {
      const event = (await request.json()) as StreamEvent;
      await this.broadcast(taskId, event);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Internal request: get subscriber count
    if (request.method === "GET" && url.pathname.endsWith("/count")) {
      return new Response(JSON.stringify({ taskId, subscribers: this.subscribers.size }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }

  private async handleSubscribe(taskId: string): Promise<Response> {
    const { readable, writable } = new TransformStream<string, string>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
    });

    const writer = writable.getWriter();
    const subscriberId = crypto.randomUUID();

    // Send initial headers
    await writer.write(":ok\n\n");

    const subscriber: StreamSubscriber = {
      id: subscriberId,
      writable: writer,
      connectedAt: Date.now(),
    };

    this.subscribers.set(subscriberId, subscriber);

    // Start heartbeat if not already running
    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => this.sendHeartbeats(), 30000);
    }

    // Send initial status if available
    const initialStatus = await this.getCachedStatus(taskId);
    if (initialStatus) {
      await this.sendToSubscriber(subscriber, {
        event: "status",
        taskId,
        timestamp: new Date().toISOString(),
        data: initialStatus,
      });
    }

    // Clean up on disconnect
    this.state.waitUntil(
      (async () => {
        try {
          await writer.closed;
        } catch {
          // Client disconnected
        } finally {
          this.subscribers.delete(subscriberId);
          if (this.subscribers.size === 0 && this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = undefined;
          }
        }
      })()
    );

    return new Response(readable as unknown as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Task-Id": taskId,
      },
    });
  }

  private async broadcast(taskId: string, event: StreamEvent): Promise<void> {
    const message = formatSSE(event);
    const promises: Promise<void>[] = [];

    for (const subscriber of this.subscribers.values()) {
      promises.push(this.sendRaw(subscriber, message));
    }

    await Promise.all(promises);

    // Cache latest status in KV for new subscribers
    if (event.event === "status" || event.event === "outcome") {
      await this.cacheStatus(taskId, event.data);
    }
  }

  private async sendToSubscriber(subscriber: StreamSubscriber, event: StreamEvent): Promise<void> {
    await this.sendRaw(subscriber, formatSSE(event));
  }

  private async sendRaw(subscriber: StreamSubscriber, message: string): Promise<void> {
    try {
      await subscriber.writable.write(message);
    } catch {
      // Writer closed, will be cleaned up
      this.subscribers.delete(subscriber.id);
    }
  }

  private sendHeartbeats(): void {
    const heartbeat: StreamEvent = {
      event: "heartbeat",
      taskId: "",
      timestamp: new Date().toISOString(),
      data: { ts: Date.now() },
    };

    for (const subscriber of this.subscribers.values()) {
      this.sendRaw(subscriber, formatSSE(heartbeat)).catch(() => {
        /* ignore */
      });
    }
  }

  private async getCachedStatus(taskId: string): Promise<unknown | null> {
    if (!this.env.EXECUTION_META) return null;
    try {
      const raw = await this.env.EXECUTION_META.get(`stream-status:${taskId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private async cacheStatus(taskId: string, data: unknown): Promise<void> {
    if (!this.env.EXECUTION_META) return;
    await this.env.EXECUTION_META.put(`stream-status:${taskId}`, JSON.stringify(data), {
      expirationTtl: 3600,
    });
  }
}

// ─── External Broadcast Helper ──────────────────────────────────────────────

export async function broadcastEvent(
  taskId: string,
  event: StreamEvent,
  env: StreamEnv
): Promise<void> {
  const id = env.STREAM_HUB.idFromName(`stream:${taskId}`);
  const stub = env.STREAM_HUB.get(id);

  await stub.fetch(
    new Request(`http://internal/stream/${taskId}/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    })
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatSSE(event: StreamEvent): string {
  const lines: string[] = [];
  lines.push(`event: ${event.event}`);
  lines.push(`id: ${event.taskId}-${Date.now()}`);
  lines.push(`data: ${JSON.stringify(event.data)}`);
  if (event.timestamp) {
    lines.push(`data: ${JSON.stringify({ _timestamp: event.timestamp })}`);
  }
  lines.push("");
  lines.push("");
  return lines.join("\n");
}

/**
 * Emit a status update for a task.
 * Used by the executor to push real-time updates.
 */
export async function emitStatus(task: ExecutionTask, env: StreamEnv): Promise<void> {
  await broadcastEvent(
    task.taskId,
    {
      event: "status",
      taskId: task.taskId,
      timestamp: new Date().toISOString(),
      data: {
        taskId: task.taskId,
        actionId: task.actionId,
        status: task.status,
        backend: task.backend,
        updatedAt: task.updatedAt,
      },
    },
    env
  );
}

export async function emitOutcome(task: ExecutionTask, env: StreamEnv): Promise<void> {
  await broadcastEvent(
    task.taskId,
    {
      event: "outcome",
      taskId: task.taskId,
      timestamp: new Date().toISOString(),
      data: {
        taskId: task.taskId,
        status: task.status,
        success: task.outcome?.success ?? false,
        data: task.outcome?.data,
        error: task.error,
        lineage: task.lineage.trace,
      },
    },
    env
  );
}

export async function emitLog(
  taskId: string,
  message: string,
  level: "info" | "warn" | "error",
  env: StreamEnv
): Promise<void> {
  await broadcastEvent(
    taskId,
    {
      event: "log",
      taskId,
      timestamp: new Date().toISOString(),
      data: { level, message },
    },
    env
  );
}

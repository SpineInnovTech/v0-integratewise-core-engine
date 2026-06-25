/**
 * ExecutionEngineDO — Stateful Task Execution Durable Object
 *
 * Handles long-running / stateful task execution with persistence.
 * Used by the executor when backend = "durable_object".
 */

import type { ExecutionTask, ExecutionOutcome, ExecutionStatus } from "./types";

interface EngineEnv {
  ACT?: Fetcher;
  SPINE?: Fetcher;
  KNOWLEDGE?: Fetcher;
}

interface TaskState {
  task: ExecutionTask;
  status: ExecutionStatus;
  outcome?: ExecutionOutcome;
  startedAt: string;
  finishedAt?: string;
}

export class ExecutionEngineDO {
  private state: DurableObjectState;
  private env: EngineEnv;

  constructor(state: DurableObjectState, env: EngineEnv) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);

    // POST /execute — start a task
    if (request.method === "POST" && parts[0] === "execute") {
      const body = (await request.json()) as { task: ExecutionTask };
      const result = await this.runTask(body.task);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // GET /status/:taskId — get task status
    if (request.method === "GET" && parts[0] === "status" && parts[1]) {
      const taskState = await this.state.storage.get<TaskState>(`task:${parts[1]}`);
      if (!taskState) {
        return new Response(JSON.stringify({ error: "Task not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(taskState), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }

  private async runTask(task: ExecutionTask): Promise<ExecutionOutcome> {
    const startedAt = new Date().toISOString();
    const taskState: TaskState = {
      task,
      status: "running",
      startedAt,
    };

    await this.state.storage.put(`task:${task.taskId}`, taskState);

    try {
      // Proxy to ACT service (same as executeViaDurableObject in executor.ts)
      if (!this.env.ACT) {
        throw new Error("ACT service binding not available");
      }

      const res = await this.env.ACT.fetch(
        new Request("http://act/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": task.tenantId,
            "x-approval-token": task.payload.approvalToken,
          },
          body: JSON.stringify({
            action_id: task.actionId,
            action_type: task.payload.actionType,
            target_tool: task.payload.targetTool,
            payload: task.payload.params,
            approval_token: task.payload.approvalToken,
          }),
        })
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`ACT returned ${res.status}: ${body}`);
      }

      const data = await res.json();
      const outcome: ExecutionOutcome = {
        success: true,
        data,
      };

      taskState.status = "completed";
      taskState.outcome = outcome;
      taskState.finishedAt = new Date().toISOString();
      await this.state.storage.put(`task:${task.taskId}`, taskState);

      return outcome;
    } catch (err: any) {
      const outcome: ExecutionOutcome = {
        success: false,
      };

      taskState.status = "failed";
      taskState.outcome = outcome;
      taskState.finishedAt = new Date().toISOString();
      await this.state.storage.put(`task:${task.taskId}`, taskState);

      return outcome;
    }
  }
}

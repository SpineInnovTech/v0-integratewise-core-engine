/**
 * Stub for cloudflare:workers in Vitest (no Workers runtime).
 * Exports minimal shapes so modules that import from 'cloudflare:workers' load in tests.
 */

export class DurableObject {
  constructor(_state: unknown, _env: Record<string, unknown>) {}
  async fetch(_request: Request): Promise<Response> {
    return new Response("OK", { status: 200 });
  }
}

export interface WorkflowStep {
  run(ctx: unknown, step: unknown): Promise<unknown>;
}

export interface WorkflowEvent {
  payload: unknown;
}

export class WorkflowEntrypoint {
  async run(_ctx: unknown, _event: WorkflowEvent): Promise<unknown> {
    return undefined;
  }
}

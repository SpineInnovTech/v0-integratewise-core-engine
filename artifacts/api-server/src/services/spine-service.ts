import {
  callSpineTool,
  listSpineTools,
  spineConfig,
  SpineError,
} from "../connectors/spine";

// Read/write classification for the privileged Spine proxy. This is FAIL-CLOSED:
// a tool counts as read-only ONLY when one of its name segments is a known safe
// read verb AND none is a known mutation verb. Anything unrecognised is treated
// as governed (write) and refused by the read-only /spine/call guard, so a new
// or oddly-named platform tool can never slip through as auto-callable.
const READ_VERBS = new Set([
  "get", "list", "search", "read", "fetch", "describe", "count",
  "recent", "view", "semantic", "resolve", "lookup", "query", "find",
]);
const WRITE_VERBS = new Set([
  "write", "propose", "approve", "reject", "upsert", "create", "update",
  "delete", "send", "commit", "sync", "run", "execute", "exec", "import",
  "export", "archive", "assign", "link", "unlink", "emit", "qualify",
  "convert", "log", "patch", "set", "add", "remove", "merge", "apply",
  "trigger", "schedule", "cancel", "publish", "revoke", "grant", "ingest",
  "store", "save", "put", "post", "rename", "move", "enable", "disable",
]);

export function isReadOnlyTool(name: string): boolean {
  const segments = name.toLowerCase().split(/[._]/).filter(Boolean);
  if (segments.some((s) => WRITE_VERBS.has(s))) return false; // explicit mutation
  return segments.some((s) => READ_VERBS.has(s)); // allow only known-safe reads
}

export interface SpineToolInfo {
  name: string;
  description: string;
  access: "read" | "write";
  inputSchema?: unknown;
}

export interface SpineStatus {
  connected: boolean;
  endpoint: string;
  tenantId: string;
  toolCount: number;
  tools: SpineToolInfo[];
  detail: string;
  checkedAt: string;
}

export async function getSpineStatus(): Promise<SpineStatus> {
  const base = {
    endpoint: spineConfig.url,
    tenantId: spineConfig.tenantId,
    checkedAt: new Date().toISOString(),
  };
  try {
    const tools = await listSpineTools();
    return {
      ...base,
      connected: true,
      toolCount: tools.length,
      tools: tools.map((t) => ({
        name: t.name,
        description: (t.description ?? "").trim(),
        access: isReadOnlyTool(t.name) ? "read" : "write",
        inputSchema: t.inputSchema,
      })),
      detail: `Spine connected — ${tools.length} tools available for tenant ${spineConfig.tenantId}.`,
    };
  } catch (err) {
    // Honest degradation: HTTP 200 with connected:false and a real reason, never
    // a fabricated "live" state.
    return {
      ...base,
      connected: false,
      toolCount: 0,
      tools: [],
      detail: err instanceof SpineError ? err.message : "Spine is unavailable.",
    };
  }
}

export async function invokeReadOnlyTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  if (!isReadOnlyTool(name)) {
    throw new SpineError(
      "governed",
      `"${name}" mutates platform state and must run through governance (HITL), not a direct relay call.`,
    );
  }
  return callSpineTool(name, args);
}

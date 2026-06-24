/**
 * Spine client (front-end seam).
 *
 * The Spine (truth layer in integratewise-live) is reached over MCP. Customer
 * Zero NEVER holds the platform credential in the browser — the api-server
 * relay mints + caches it server-side and proxies the tool surface. This client
 * only talks to that relay (`/api/spine/*`). Failures are explicit, never faked.
 */

export type SpineToolAccess = "read" | "write";

export interface SpineToolInfo {
  name: string;
  description: string;
  access: SpineToolAccess;
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

export async function fetchSpineStatus(signal?: AbortSignal): Promise<SpineStatus> {
  const res = await fetch("/api/spine/status", {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Spine relay responded ${res.status}`);
  }
  return (await res.json()) as SpineStatus;
}

interface SpineCallResponse<T> {
  name: string;
  result: T;
  error?: string;
}

export async function callSpineTool<T = unknown>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch("/api/spine/call", {
    method: "POST",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ name, arguments: args }),
  });
  const data = (await res
    .json()
    .catch(() => ({}))) as Partial<SpineCallResponse<T>>;
  if (!res.ok) {
    throw new Error(data.error ?? `Spine relay responded ${res.status}`);
  }
  return data.result as T;
}

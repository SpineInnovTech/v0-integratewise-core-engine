/**
 * Spine connector — the privileged MCP link to the IntegrateWise platform
 * (integratewise-live). Customer Zero authenticates DIRECTLY to the platform
 * Spine over MCP: it mints a short-lived client-credentials token server-side
 * and proxies the Spine's tool surface. The token NEVER reaches the browser.
 *
 * Doctrine (see replit.md + memory/mcp-spine-access.md):
 *  - The platform owns truth. Customer Zero reads/acts through these tools.
 *  - Token minting + caching live here (server-side); the relay is the only
 *    holder of the credential.
 *  - MCP tool output is UNTRUSTED data — it is passed through, never executed.
 *
 * Defaults point at the verified public prod endpoint, which mints a token with
 * no client secret, so this works with zero configuration. Override with
 * SPINE_MCP_URL / SPINE_TENANT_ID / SPINE_SCOPE when wiring a different host.
 */

const SPINE_MCP_URL = (
  process.env["SPINE_MCP_URL"] ?? "https://mcp.integratewise.ai"
).replace(/\/$/, "");
const SPINE_TENANT_ID = process.env["SPINE_TENANT_ID"] ?? "iw-customer-zero";
// Least privilege: the relay path is read-only, so the default scope omits
// memory:write. A future HITL governance path can widen this via SPINE_SCOPE.
const SPINE_SCOPE =
  process.env["SPINE_SCOPE"] ?? "mcp:tools mcp:resources memory:read";
const SPINE_USER_ID = process.env["SPINE_USER_ID"] ?? "customer-zero";

const TOKEN_SAFETY_MS = 60_000;
const REQUEST_TIMEOUT_MS = 8_000;

export const spineConfig = {
  url: SPINE_MCP_URL,
  tenantId: SPINE_TENANT_ID,
};

export interface SpineTool {
  name: string;
  description: string;
  inputSchema?: unknown;
}

export class SpineError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SpineError";
  }
}

interface CachedToken {
  token: string;
  expiresAtMs: number;
}
let cached: CachedToken | null = null;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function mintToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAtMs - TOKEN_SAFETY_MS > now) return cached.token;

  let resp: Response;
  try {
    resp = await fetchWithTimeout(`${SPINE_MCP_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-tenant-id": SPINE_TENANT_ID,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: SPINE_SCOPE,
      }).toString(),
    });
  } catch (err) {
    throw new SpineError(
      "unreachable",
      err instanceof Error && err.name === "AbortError"
        ? "Spine token endpoint timed out."
        : "Spine token endpoint is unreachable.",
    );
  }

  if (!resp.ok) {
    throw new SpineError(
      "token_rejected",
      `Spine token endpoint responded ${resp.status}.`,
    );
  }

  const data = (await resp.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new SpineError(
      "token_missing",
      "Spine token endpoint returned no access_token.",
    );
  }

  const ttlMs = (typeof data.expires_in === "number" ? data.expires_in : 3600) * 1000;
  cached = { token: data.access_token, expiresAtMs: now + ttlMs };
  return cached.token;
}

/** The MCP Streamable HTTP transport may answer as text/event-stream. */
function parseMaybeSse(text: string): unknown {
  if (text.includes("data:")) {
    const lines = text
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .filter(Boolean);
    for (const line of lines) {
      try {
        return JSON.parse(line);
      } catch {
        /* keep scanning */
      }
    }
  }
  return JSON.parse(text);
}

let rpcId = 0;

export async function spineRpc<T = unknown>(
  method: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const token = await mintToken();

  let resp: Response;
  try {
    resp = await fetchWithTimeout(`${SPINE_MCP_URL}/mcp`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-tenant-id": SPINE_TENANT_ID,
        "x-user-id": SPINE_USER_ID,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
    });
  } catch (err) {
    throw new SpineError(
      "unreachable",
      err instanceof Error && err.name === "AbortError"
        ? "Spine timed out."
        : "Spine is unreachable.",
    );
  }

  if (resp.status === 401 || resp.status === 403) {
    cached = null; // force a fresh mint next time
    throw new SpineError("unauthorized", `Spine rejected the credential (${resp.status}).`);
  }
  if (!resp.ok) {
    throw new SpineError("http_error", `Spine responded ${resp.status}.`);
  }

  const text = await resp.text();
  let payload: { result?: T; error?: { message?: string } };
  try {
    payload = parseMaybeSse(text) as typeof payload;
  } catch {
    throw new SpineError("bad_response", "Spine returned a non-JSON response.");
  }
  if (payload.error) {
    throw new SpineError("rpc_error", payload.error.message ?? "Spine tool error.");
  }
  return payload.result as T;
}

export async function listSpineTools(): Promise<SpineTool[]> {
  const result = await spineRpc<{ tools?: SpineTool[] }>("tools/list", {});
  return Array.isArray(result?.tools) ? result.tools : [];
}

export async function callSpineTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  return spineRpc("tools/call", { name, arguments: args });
}

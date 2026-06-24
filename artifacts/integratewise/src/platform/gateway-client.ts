/**
 * Gateway client — a minimal, typed fetch wrapper over the IntegrateWise
 * platform gateway (Cloudflare). This is the single path the universal
 * front-end uses to reach the platform.
 *
 * Doctrine: explicit, honest failures. Every non-2xx response and every
 * network/CORS error becomes a typed `GatewayError`. There is NO silent
 * fallback to empty data — callers must render an honest state instead.
 */

export type TokenGetter = () => string | null;

export interface GatewayClientConfig {
  baseUrl: string;
  getToken: TokenGetter;
}

export interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal;
  /** Skip attaching the Authorization header (e.g. the public /health probe). */
  skipAuth?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

/**
 * A typed error for every failed gateway interaction.
 * `status === 0` means the request never reached the gateway (network/CORS/DNS).
 */
export class GatewayError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "GatewayError";
  }

  /** Gateway rejected the credential (or none was supplied). */
  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** The request never reached the gateway. */
  get isUnreachable(): boolean {
    return this.status === 0 && this.code !== "aborted";
  }

  /** The request was cancelled by the caller (AbortController). */
  get isAborted(): boolean {
    return this.code === "aborted";
  }
}

export interface GatewayHealth {
  status: string;
  service: string;
  ts: number;
}

export interface GatewayClient {
  readonly baseUrl: string;
  get<T>(path: string, opts?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  /** Public, unauthenticated liveness probe (root `/health`). */
  health(signal?: AbortSignal): Promise<GatewayHealth>;
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function withQuery(url: string, query?: RequestOptions["query"]): string {
  if (!query) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
}

async function request<T>(
  config: GatewayClientConfig,
  method: "GET" | "POST" | "PATCH",
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  if (!opts.skipAuth) {
    const token = config.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const url = withQuery(joinUrl(config.baseUrl, path), opts.query);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new GatewayError(0, "aborted", "Request aborted");
    }
    // Network failure, DNS, or blocked CORS — never reached the gateway.
    throw new GatewayError(
      0,
      "unreachable",
      `Gateway unreachable: ${(err as Error)?.message ?? "network error"}`,
    );
  }

  if (!res.ok) {
    let body: unknown;
    let message = `${res.status} ${res.statusText}`.trim();
    let code = `http_${res.status}`;
    try {
      body = await res.json();
      if (body && typeof body === "object") {
        const b = body as Record<string, unknown>;
        if (typeof b.message === "string") message = b.message;
        else if (typeof b.error === "string") message = b.error;
        if (typeof b.code === "string") code = b.code;
      }
    } catch {
      /* non-JSON error body — keep status text */
    }
    throw new GatewayError(res.status, code, message, body);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export function createGatewayClient(config: GatewayClientConfig): GatewayClient {
  return {
    baseUrl: config.baseUrl,
    get: <T>(path: string, opts?: RequestOptions) => request<T>(config, "GET", path, opts),
    post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>(config, "POST", path, { ...opts, body }),
    patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>(config, "PATCH", path, { ...opts, body }),
    health: (signal?: AbortSignal) =>
      request<GatewayHealth>(config, "GET", "/health", { skipAuth: true, signal }),
  };
}

/**
 * GatewayHttpClient — Core HTTP client for CF Gateway communication
 *
 * Wraps fetch with:
 * - Auth headers injection (Authorization, x-tenant-id, Content-Type)
 * - 401 interceptor → AuthManager.refreshToken() → replay once
 * - 429 interceptor → respect Retry-After header
 * - 5xx retry with exponential backoff (1s, 2s, 4s — max 3 attempts)
 * - Offline detection → queue GET requests → replay on reconnect
 * - Typed get/post/patch/delete methods
 *
 * Requirements: R1 (Gateway Proxy Client Initialization), R9 (Error Handling and Offline Resilience)
 */

import { authManager } from "./auth-manager";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SSEEvent {
  id?: string;
  event?: string;
  data: unknown;
}

export interface SSEConnection {
  close(): void;
  readonly status: "connected" | "connecting" | "disconnected";
}

export interface GatewayHttpClientInterface {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
  sse(path: string, onMessage: (event: SSEEvent) => void): SSEConnection;
  /** Subscribe to online/offline state changes */
  onOfflineChange(cb: (isOffline: boolean) => void): () => void;
  /** Current offline status */
  readonly isOffline: boolean;
}

export interface GatewayRequestError {
  message: string;
  status: number;
  code?: string;
  retryable: boolean;
}

interface QueuedRequest {
  path: string;
  params?: Record<string, string>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000; // 1s, 2s, 4s
const REQUEST_TIMEOUT_MS = 30_000;

// ─── Implementation ─────────────────────────────────────────────────────────

class GatewayHttpClient implements GatewayHttpClientInterface {
  private readonly _baseUrl: string;
  private _isOffline = false;
  private _offlineQueue: QueuedRequest[] = [];
  private _offlineListeners: Set<(isOffline: boolean) => void> = new Set();

  constructor(baseUrl: string) {
    this._baseUrl = baseUrl.replace(/\/$/, ""); // strip trailing slash

    // Initialize offline detection
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      this._isOffline = !navigator.onLine;

      window.addEventListener("online", this._handleOnline);
      window.addEventListener("offline", this._handleOffline);
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  get isOffline(): boolean {
    return this._isOffline;
  }

  onOfflineChange(cb: (isOffline: boolean) => void): () => void {
    this._offlineListeners.add(cb);
    return () => {
      this._offlineListeners.delete(cb);
    };
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    // If offline, queue GET requests for replay on reconnect
    if (this._isOffline) {
      return this._queueForReplay<T>(path, params);
    }
    const url = this._buildUrl(path, params);
    return this._requestWithRetry<T>(url, { method: "GET" });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = this._buildUrl(path);
    return this._requestWithRetry<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const url = this._buildUrl(path);
    return this._requestWithRetry<T>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    const url = this._buildUrl(path);
    return this._requestWithRetry<T>(url, { method: "DELETE" });
  }

  sse(path: string, onMessage: (event: SSEEvent) => void): SSEConnection {
    let status: "connected" | "connecting" | "disconnected" = "connecting";
    let eventSource: EventSource | null = null;

    const connect = async () => {
      const headers = await this._getHeaders();
      // EventSource doesn't support custom headers natively;
      // pass token as query parameter for SSE auth
      const token = headers["Authorization"]?.replace("Bearer ", "") || "";
      const tenantId = headers["x-tenant-id"] || "";
      const url = new URL(`${this._baseUrl}${path}`);
      if (token) url.searchParams.set("token", token);
      if (tenantId) url.searchParams.set("tenant_id", tenantId);

      eventSource = new EventSource(url.toString());

      eventSource.onopen = () => {
        status = "connected";
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage({ id: event.lastEventId, data });
        } catch {
          onMessage({ id: event.lastEventId, data: event.data });
        }
      };

      eventSource.onerror = () => {
        status = "disconnected";
        // EventSource auto-reconnects by default
      };
    };

    connect();

    return {
      close() {
        eventSource?.close();
        eventSource = null;
        status = "disconnected";
      },
      get status() {
        return status;
      },
    };
  }

  // ─── Private: Request Pipeline ───────────────────────────────────────────

  /**
   * Execute request with full retry logic:
   * 1. Build headers (auth + tenant + content-type)
   * 2. Execute fetch
   * 3. Handle 401 → refresh + replay once
   * 4. Handle 429 → wait Retry-After → retry
   * 5. Handle 5xx → exponential backoff (max 3 attempts)
   */
  private async _requestWithRetry<T>(
    url: string,
    init: RequestInit,
    attempt = 0,
    isRetryAfter401 = false
  ): Promise<T> {
    const headers = await this._getHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const requestInit: RequestInit = {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
      signal: controller.signal,
    };

    let response: Response;

    try {
      response = await fetch(url, requestInit);
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      // AbortError = timeout
      if (err instanceof Error && err.name === "AbortError") {
        throw this._createError("Request timed out", 408, "TIMEOUT", false);
      }

      // Network error → mark offline, queue if GET
      if (init.method === "GET") {
        this._setOffline(true);
        // Parse path from URL for queueing
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const params: Record<string, string> = {};
        urlObj.searchParams.forEach((v, k) => {
          params[k] = v;
        });
        return this._queueForReplay<T>(path, Object.keys(params).length > 0 ? params : undefined);
      }

      throw this._createError(
        err instanceof Error ? err.message : "Network error",
        0,
        "NETWORK_ERROR",
        true
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // ── 401: Refresh token and replay (once) ────────────────────────────────
    if (response.status === 401 && !isRetryAfter401) {
      try {
        await authManager.refreshToken();
        return this._requestWithRetry<T>(url, init, 0, true);
      } catch {
        // Refresh failed — bubble the 401 up
        throw this._createError("Authentication expired", 401, "AUTH_EXPIRED", false);
      }
    }

    // ── 429: Respect Retry-After header ─────────────────────────────────────
    if (response.status === 429) {
      const retryAfter = this._parseRetryAfter(response.headers.get("Retry-After"));
      if (retryAfter > 0) {
        await this._sleep(retryAfter);
        return this._requestWithRetry<T>(url, init, attempt, isRetryAfter401);
      }
      throw this._createError("Rate limited", 429, "RATE_LIMITED", true);
    }

    // ── 5xx: Exponential backoff (1s, 2s, 4s — max 3 attempts) ─────────────
    if (response.status >= 500 && attempt < MAX_RETRIES - 1) {
      const delay = BACKOFF_BASE_MS * Math.pow(2, attempt); // 1s, 2s, 4s
      await this._sleep(delay);
      return this._requestWithRetry<T>(url, init, attempt + 1, isRetryAfter401);
    }

    // ── Error responses ─────────────────────────────────────────────────────
    if (!response.ok) {
      const body = await response.text().catch(() => "Unknown error");
      let message = body;
      let code: string | undefined;
      try {
        const parsed = JSON.parse(body);
        message = parsed.message || parsed.error || body;
        code = parsed.code;
      } catch {
        // body was not JSON
      }
      throw this._createError(message, response.status, code, response.status >= 500);
    }

    // ── 204 No Content ──────────────────────────────────────────────────────
    if (response.status === 204) {
      return {} as T;
    }

    // ── Success ─────────────────────────────────────────────────────────────
    return (await response.json()) as T;
  }

  // ─── Private: Headers ────────────────────────────────────────────────────

  private async _getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    try {
      const session = await authManager.getSession();
      if (session) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
        headers["x-tenant-id"] = session.user.tenant_id;
      }
    } catch {
      // No auth session available — proceed without auth headers
      // (public endpoints don't need them)
    }

    return headers;
  }

  // ─── Private: URL Building ───────────────────────────────────────────────

  private _buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this._baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }

  // ─── Private: Offline Queue ──────────────────────────────────────────────

  private _queueForReplay<T>(path: string, params?: Record<string, string>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this._offlineQueue.push({
        path,
        params,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
  }

  private _handleOnline = (): void => {
    this._setOffline(false);
    this._replayQueue();
  };

  private _handleOffline = (): void => {
    this._setOffline(true);
  };

  private _setOffline(offline: boolean): void {
    if (this._isOffline === offline) return;
    this._isOffline = offline;
    for (const listener of this._offlineListeners) {
      try {
        listener(offline);
      } catch {
        // Don't let bad listeners break the client
      }
    }
  }

  private async _replayQueue(): Promise<void> {
    const queue = [...this._offlineQueue];
    this._offlineQueue = [];

    for (const request of queue) {
      try {
        const result = await this.get(request.path, request.params);
        request.resolve(result);
      } catch (err) {
        request.reject(err);
      }
    }
  }

  // ─── Private: Helpers ────────────────────────────────────────────────────

  private _parseRetryAfter(header: string | null): number {
    if (!header) return 0;

    // Try parsing as seconds
    const seconds = parseInt(header, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return seconds * 1000;
    }

    // Try parsing as HTTP-date
    const date = Date.parse(header);
    if (!isNaN(date)) {
      const delayMs = date - Date.now();
      return delayMs > 0 ? delayMs : 0;
    }

    return 0;
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private _createError(
    message: string,
    status: number,
    code: string | undefined,
    retryable: boolean
  ): GatewayRequestError {
    return { message, status, code, retryable };
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────────

function createGatewayClient(): GatewayHttpClient {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const spineProvider = import.meta.env.VITE_SPINE_PROVIDER || "spine-db";

  // Only throw if not in local-mock mode and URL is missing
  if (!baseUrl && spineProvider !== "local-mock") {
    throw new Error(
      "[GatewayHttpClient] VITE_API_BASE_URL is not configured. " +
        "Set this environment variable to the CF Gateway URL (e.g., https://gateway.dev.integratewise.ai). " +
        "If running in development without a gateway, set VITE_SPINE_PROVIDER=local-mock."
    );
  }

  return new GatewayHttpClient(baseUrl || "http://localhost:8786");
}

export const gatewayClient: GatewayHttpClientInterface = createGatewayClient();

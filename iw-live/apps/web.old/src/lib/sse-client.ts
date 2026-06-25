/**
 * SSE Client — Real-time event delivery via Server-Sent Events from CF Gateway
 *
 * Connects to CF Gateway SSE endpoints (e.g., /stream/signals) for real-time
 * signal delivery. Falls back to polling when SSE is unavailable.
 *
 * Features:
 * - EventSource-based SSE connection with auth via query params
 * - Exponential backoff reconnection (1s base, 30s cap)
 * - Fallback polling (30s interval) after 3+ reconnection failures
 * - Typed event dispatch with multiple listeners per event
 * - Connection status tracking
 *
 * Requirements: R12 (Real-Time Signal and Event Delivery)
 */

import { authManager } from "./auth-manager";
import { gatewayClient } from "./gateway-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SSEConnectionStatus = "connected" | "connecting" | "disconnected";

export interface SSEClientOptions {
  /** Base URL for SSE endpoint (defaults to VITE_API_BASE_URL) */
  baseUrl?: string;
  /** Maximum reconnection attempts before falling back to polling (default: 3) */
  maxReconnectBeforeFallback?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  backoffBaseMs?: number;
  /** Maximum backoff delay in ms (default: 30000) */
  backoffMaxMs?: number;
  /** Polling interval in ms when in fallback mode (default: 30000) */
  pollingIntervalMs?: number;
}

export type SSEEventHandler = (data: unknown) => void;

export interface ISSEClient {
  /** Connect to an SSE endpoint path */
  connect(path: string): void;
  /** Disconnect from the SSE endpoint and stop polling */
  disconnect(): void;
  /** Register an event handler for a specific event type */
  on(event: string, handler: SSEEventHandler): () => void;
  /** Current connection status */
  readonly status: SSEConnectionStatus;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_MAX_RECONNECT_BEFORE_FALLBACK = 3;
const DEFAULT_BACKOFF_BASE_MS = 1000;
const DEFAULT_BACKOFF_MAX_MS = 30_000;
const DEFAULT_POLLING_INTERVAL_MS = 30_000;

// ─── Implementation ─────────────────────────────────────────────────────────

class SSEClient implements ISSEClient {
  private _status: SSEConnectionStatus = "disconnected";
  private _eventSource: EventSource | null = null;
  private _path: string | null = null;
  private _listeners: Map<string, Set<SSEEventHandler>> = new Map();
  private _statusListeners: Set<(status: SSEConnectionStatus) => void> = new Set();

  // Reconnection state
  private _reconnectAttempts = 0;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _intentionalDisconnect = false;

  // Fallback polling state
  private _isPolling = false;
  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  // Configuration
  private readonly _baseUrl: string;
  private readonly _maxReconnectBeforeFallback: number;
  private readonly _backoffBaseMs: number;
  private readonly _backoffMaxMs: number;
  private readonly _pollingIntervalMs: number;

  constructor(options: SSEClientOptions = {}) {
    this._baseUrl = (
      options.baseUrl ||
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:8786"
    ).replace(/\/$/, "");
    this._maxReconnectBeforeFallback =
      options.maxReconnectBeforeFallback ?? DEFAULT_MAX_RECONNECT_BEFORE_FALLBACK;
    this._backoffBaseMs = options.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS;
    this._backoffMaxMs = options.backoffMaxMs ?? DEFAULT_BACKOFF_MAX_MS;
    this._pollingIntervalMs = options.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS;
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  get status(): SSEConnectionStatus {
    return this._status;
  }

  /**
   * Subscribe to connection status changes.
   */
  onStatusChange(cb: (status: SSEConnectionStatus) => void): () => void {
    this._statusListeners.add(cb);
    return () => {
      this._statusListeners.delete(cb);
    };
  }

  /**
   * Connect to the SSE endpoint at the given path.
   * Passes auth token and tenant_id as query parameters since EventSource
   * does not support custom headers.
   */
  connect(path: string): void {
    // If already connected to the same path, no-op
    if (this._path === path && this._status === "connected") {
      return;
    }

    // Clean up any existing connection
    this._cleanupConnection();
    this._intentionalDisconnect = false;
    this._path = path;
    this._reconnectAttempts = 0;

    this._doConnect();
  }

  /**
   * Disconnect from SSE and stop any polling/reconnection.
   */
  disconnect(): void {
    this._intentionalDisconnect = true;
    this._cleanupConnection();
    this._stopPolling();
    this._path = null;
    this._setStatus("disconnected");
  }

  /**
   * Register an event handler for a specific event type.
   * Use "*" to listen for all events.
   * Returns an unsubscribe function.
   */
  on(event: string, handler: SSEEventHandler): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(handler);

    // If already connected and listening for a named event,
    // register it on the EventSource
    if (this._eventSource && event !== "*" && event !== "message") {
      this._registerNamedEvent(event);
    }

    return () => {
      this._listeners.get(event)?.delete(handler);
      if (this._listeners.get(event)?.size === 0) {
        this._listeners.delete(event);
      }
    };
  }

  // ─── Private: Connection ─────────────────────────────────────────────────

  private async _doConnect(): Promise<void> {
    if (!this._path) return;

    this._setStatus("connecting");

    try {
      const session = await authManager.getSession();
      const url = new URL(`${this._baseUrl}${this._path}`);

      // EventSource doesn't support custom headers, pass auth via query params
      if (session) {
        url.searchParams.set("token", session.accessToken);
        url.searchParams.set("tenant_id", session.user.tenant_id);
      }

      this._eventSource = new EventSource(url.toString());

      this._eventSource.onopen = () => {
        this._setStatus("connected");
        this._reconnectAttempts = 0;

        // If we were polling, stop it
        if (this._isPolling) {
          this._stopPolling();
        }
      };

      // Default message handler (events without a named type)
      this._eventSource.onmessage = (event) => {
        this._dispatchEvent("message", event);
      };

      this._eventSource.onerror = () => {
        // EventSource fires onerror on connection loss
        if (this._intentionalDisconnect) return;

        this._eventSource?.close();
        this._eventSource = null;
        this._setStatus("disconnected");
        this._attemptReconnect();
      };

      // Register named event listeners that were added before connect
      for (const eventName of this._listeners.keys()) {
        if (eventName !== "*" && eventName !== "message") {
          this._registerNamedEvent(eventName);
        }
      }
    } catch {
      // Connection setup failed (e.g., no auth)
      this._setStatus("disconnected");
      this._attemptReconnect();
    }
  }

  /**
   * Register a named event type on the EventSource (for typed SSE events).
   */
  private _registerNamedEvent(eventName: string): void {
    if (!this._eventSource) return;

    this._eventSource.addEventListener(eventName, (event: Event) => {
      const messageEvent = event as MessageEvent;
      this._dispatchEvent(eventName, messageEvent);
    });
  }

  /**
   * Dispatch a received event to all matching handlers.
   */
  private _dispatchEvent(eventName: string, event: MessageEvent): void {
    let data: unknown;
    try {
      data = JSON.parse(event.data);
    } catch {
      data = event.data;
    }

    // Dispatch to exact event name listeners
    const handlers = this._listeners.get(eventName);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch {
          // Don't let a bad listener break the event loop
        }
      }
    }

    // Dispatch to wildcard listeners
    const wildcardHandlers = this._listeners.get("*");
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(data);
        } catch {
          // Don't let a bad listener break the event loop
        }
      }
    }
  }

  // ─── Private: Reconnection with Exponential Backoff ──────────────────────

  /**
   * Attempt reconnection with exponential backoff (1s, 2s, 4s, 8s, ... max 30s).
   * After maxReconnectBeforeFallback failures, switch to polling.
   */
  private _attemptReconnect(): void {
    if (this._intentionalDisconnect) return;

    this._reconnectAttempts++;

    // After repeated failures, fall back to polling
    if (this._reconnectAttempts > this._maxReconnectBeforeFallback) {
      this._startPolling();
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
    const delay = Math.min(
      this._backoffBaseMs * Math.pow(2, this._reconnectAttempts - 1),
      this._backoffMaxMs
    );

    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      if (!this._intentionalDisconnect) {
        this._doConnect();
      }
    }, delay);
  }

  // ─── Private: Fallback Polling ───────────────────────────────────────────

  /**
   * Start polling the same path via HTTP GET at 30-second intervals.
   * This is the fallback when SSE is unavailable.
   */
  private _startPolling(): void {
    if (this._isPolling || !this._path) return;

    this._isPolling = true;
    this._setStatus("connecting"); // Indicate we're trying an alternative

    // Perform an immediate poll
    this._poll();

    // Set up interval for subsequent polls
    this._pollTimer = setInterval(() => {
      this._poll();
    }, this._pollingIntervalMs);
  }

  /**
   * Execute a single poll request.
   */
  private async _poll(): Promise<void> {
    if (!this._path || this._intentionalDisconnect) return;

    try {
      // Use gatewayClient for polling (has auth + retry built in)
      const data = await gatewayClient.get<unknown>(this._path);

      // Update status to connected on first successful poll
      if (this._status !== "connected") {
        this._setStatus("connected");
      }

      // Dispatch polled data as a "message" event
      const messageHandlers = this._listeners.get("message");
      if (messageHandlers) {
        for (const handler of messageHandlers) {
          try {
            handler(data);
          } catch {
            // Don't break polling loop
          }
        }
      }

      // Also dispatch to signal handlers (for /stream/signals endpoint)
      const signalHandlers = this._listeners.get("signal");
      if (signalHandlers) {
        for (const handler of signalHandlers) {
          try {
            handler(data);
          } catch {
            // Don't break polling loop
          }
        }
      }

      // Dispatch to wildcard handlers
      const wildcardHandlers = this._listeners.get("*");
      if (wildcardHandlers) {
        for (const handler of wildcardHandlers) {
          try {
            handler(data);
          } catch {
            // Don't break polling loop
          }
        }
      }

      // After a successful poll, attempt to re-establish SSE connection
      // (if we haven't already done so recently)
      this._attemptSSEReconnectFromPolling();
    } catch {
      // Poll failed — stay in polling mode, will retry next interval
      if (this._status === "connected") {
        this._setStatus("disconnected");
      }
    }
  }

  /**
   * While in polling mode, periodically attempt to re-establish SSE.
   * This tries once every 5 polling cycles (every ~150s).
   */
  private _pollCycleCount = 0;
  private _attemptSSEReconnectFromPolling(): void {
    this._pollCycleCount++;
    if (this._pollCycleCount >= 5) {
      this._pollCycleCount = 0;
      this._stopPolling();
      this._reconnectAttempts = 0;
      this._doConnect();
    }
  }

  /**
   * Stop fallback polling.
   */
  private _stopPolling(): void {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    this._isPolling = false;
    this._pollCycleCount = 0;
  }

  // ─── Private: Cleanup & Status ───────────────────────────────────────────

  /**
   * Clean up the current EventSource connection and reconnection timer.
   */
  private _cleanupConnection(): void {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = null;
    }
  }

  /**
   * Update connection status and notify listeners.
   */
  private _setStatus(status: SSEConnectionStatus): void {
    if (this._status === status) return;
    this._status = status;

    for (const listener of this._statusListeners) {
      try {
        listener(status);
      } catch {
        // Don't let a bad listener break status updates
      }
    }
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────────

export const sseClient: ISSEClient = new SSEClient();

/**
 * Factory for creating SSE clients with custom options (e.g., for testing).
 */
export function createSSEClient(options?: SSEClientOptions): ISSEClient {
  return new SSEClient(options);
}

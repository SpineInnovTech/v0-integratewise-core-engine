/**
 * Stream Client — Real-time WebSocket/SSE connection to Stream Gateway
 *
 * Architecture v3.5: Stream Gateway uses Durable Objects for:
 * - SignalStreamDO: Tenant-scoped signal broadcasting
 * - PresenceDO: User presence tracking per room
 * - RoomDO: Collaboration rooms
 *
 * Routes:
 *   /ws/signals      → Subscribe to real-time signals
 *   /ws/presence/:id → Track user presence in a room
 *   /ws/room/:id     → Join collaboration room
 *   /sse/signals     → SSE fallback for signals
 *   /broadcast       → POST signal to connected clients
 */

import { getStreamUrl } from "./api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StreamMessage {
  type: "signal" | "presence" | "update" | "notification" | "cursor" | "typing";
  channel: string;
  payload: any;
  sender_id?: string;
  timestamp: number;
}

export interface SignalEvent {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  entity_id?: string;
  entity_type?: string;
  agent?: string;
  message: string;
  payload?: any;
  timestamp: number;
}

export interface PresenceUser {
  userId: string;
  userName: string;
  avatar?: string;
  status: "online" | "away" | "busy";
  cursor?: { x: number; y: number };
  lastSeen: number;
}

export type StreamStatus = "connecting" | "connected" | "disconnected" | "error";

// ─── Signal Stream (WebSocket) ───────────────────────────────────────────────

export class SignalStream {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private listeners = new Map<string, Set<(data: any) => void>>();
  private statusListeners = new Set<(status: StreamStatus) => void>();
  private _status: StreamStatus = "disconnected";

  constructor(
    private tenantId: string,
    private userId: string,
    private channels: string[] = ["signal.*"],
    private getToken?: () => string | null
  ) {}

  get status(): StreamStatus {
    return this._status;
  }

  /** Connect to the signal stream WebSocket */
  connect(): void {
    const baseUrl = getStreamUrl();
    if (!baseUrl) {
      console.warn("[SignalStream] No stream URL configured — skipping connection");
      return;
    }

    const wsUrl = baseUrl.replace(/^http/, "ws");
    const params = new URLSearchParams({
      tenantId: this.tenantId,
      userId: this.userId,
      channels: this.channels.join(","),
    });

    const token = this.getToken?.();
    if (token) params.set("token", token);

    this.setStatus("connecting");

    try {
      this.ws = new WebSocket(`${wsUrl}/ws/signals?${params}`);

      this.ws.onopen = () => {
        console.log("[SignalStream] Connected");
        this.setStatus("connected");
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: StreamMessage = JSON.parse(event.data);
          this.dispatch(msg.channel, msg);
          this.dispatch("*", msg); // Wildcard listeners
        } catch (err) {
          console.warn("[SignalStream] Failed to parse message:", event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log("[SignalStream] Disconnected:", event.code, event.reason);
        this.setStatus("disconnected");
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("[SignalStream] Error:", error);
        this.setStatus("error");
      };
    } catch (err) {
      console.error("[SignalStream] Connection failed:", err);
      this.setStatus("error");
      this.attemptReconnect();
    }
  }

  /** Disconnect from the signal stream */
  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  /** Subscribe to a channel pattern */
  on(channel: string, callback: (data: StreamMessage) => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(channel)?.delete(callback);
    };
  }

  /** Subscribe to status changes */
  onStatus(callback: (status: StreamStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /** Send a message to the stream */
  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private dispatch(channel: string, data: StreamMessage): void {
    this.listeners.get(channel)?.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error("[SignalStream] Listener error:", err);
      }
    });
  }

  private setStatus(status: StreamStatus): void {
    this._status = status;
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch {}
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(
      `[SignalStream] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (this._status !== "connected") {
        this.connect();
      }
    }, delay);
  }
}

// ─── SSE Fallback ────────────────────────────────────────────────────────────

export class SignalSSE {
  private eventSource: EventSource | null = null;
  private listeners = new Map<string, Set<(data: any) => void>>();

  constructor(
    private tenantId: string,
    private userId: string,
    private channels: string[] = ["signal.*"]
  ) {}

  connect(): void {
    const baseUrl = getStreamUrl();
    if (!baseUrl) return;

    const params = new URLSearchParams({
      tenantId: this.tenantId,
      userId: this.userId,
      channels: this.channels.join(","),
    });

    this.eventSource = new EventSource(`${baseUrl}/sse/signals?${params}`);

    this.eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.listeners.get(msg.channel)?.forEach((cb) => cb(msg));
        this.listeners.get("*")?.forEach((cb) => cb(msg));
      } catch {}
    };

    this.eventSource.onerror = () => {
      console.warn("[SignalSSE] Connection error — will auto-reconnect");
    };
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  on(channel: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);
    return () => {
      this.listeners.get(channel)?.delete(callback);
    };
  }
}

// ─── React Hook: useSignalStream ─────────────────────────────────────────────

export function createSignalStream(config: {
  tenantId: string;
  userId: string;
  channels?: string[];
  getToken?: () => string | null;
}): SignalStream {
  return new SignalStream(
    config.tenantId,
    config.userId,
    config.channels || ["signal.*"],
    config.getToken
  );
}

/**
 * PlatformProvider — the explicit boundary between the universal front-end and
 * the IntegrateWise platform gateway.
 *
 * Responsibilities:
 *  - Own the platform identity mode (demo / provided-token / platform).
 *  - Expose a single typed `GatewayClient` to the rest of the app.
 *  - Live-probe the gateway connection state (honest: checking / connected /
 *    not_authenticated / offline) and never claim a session that isn't real.
 *
 * Doctrine: the connection state reflects the ACTUAL gateway, probed at runtime.
 * Demo mode is reported as "not connected", not disguised as live.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createGatewayClient,
  GatewayError,
  type GatewayClient,
} from "./gateway-client";
import {
  getStoredToken,
  resolveMode,
  setStoredToken,
  userFromToken,
  type PlatformAuthMode,
  type PlatformUser,
} from "./token-provider";

export type GatewayConnState =
  | "checking"
  | "connected"
  | "not_authenticated"
  | "offline";

export interface GatewayConnection {
  baseUrl: string;
  state: GatewayConnState;
  detail: string;
  lastChecked: number | null;
  /** `ts` from the gateway's /health payload, when reachable. */
  serviceTs: number | null;
}

interface PlatformContextValue {
  mode: PlatformAuthMode;
  user: PlatformUser | null;
  hasToken: boolean;
  client: GatewayClient;
  gateway: GatewayConnection;
  /** Dev affordance: connect using a manually-supplied platform JWT. */
  signInWithToken: (token: string) => void;
  /** Drop the stored token and return to demo. */
  signOut: () => void;
  /** Re-run the connection probe. */
  refresh: () => void;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

const GATEWAY_BASE_URL: string =
  (import.meta.env.VITE_GATEWAY_URL as string) || "https://gateway.integratewise.ai";

// Authenticated probe target used to confirm a real session before ever
// reporting "connected". Defaults to the gateway's auth-walled health endpoint
// (empirically 401s without a JWT, so a 200 means the edge accepted the token).
// Override once the real identity endpoint is pinned (e.g. /api/v1/me).
const GATEWAY_SESSION_PATH: string =
  (import.meta.env.VITE_GATEWAY_SESSION_PATH as string) || "/api/v1/health";

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [mode, setMode] = useState<PlatformAuthMode>(() => resolveMode());
  const [gateway, setGateway] = useState<GatewayConnection>({
    baseUrl: GATEWAY_BASE_URL,
    state: "checking",
    detail: "Checking platform gateway…",
    lastChecked: null,
    serviceTs: null,
  });

  // The client reads the latest token via a ref so it is never recreated when
  // the token changes (recreating would churn React Query consumers later).
  const tokenRef = useRef<string | null>(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Probe concurrency control: a monotonic id + shared controller ensure a
  // stale probe (e.g. an old manual refresh) can never overwrite newer state.
  const probeIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const client = useMemo<GatewayClient>(
    () => createGatewayClient({ baseUrl: GATEWAY_BASE_URL, getToken: () => tokenRef.current }),
    [],
  );

  const user = useMemo<PlatformUser | null>(
    () => (token ? userFromToken(token) : null),
    [token],
  );

  const probe = useCallback(async () => {
    // Cancel any in-flight probe and claim a fresh id; only the newest probe
    // is allowed to write state.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const id = ++probeIdRef.current;
    const { signal } = controller;

    const apply = (next: GatewayConnection) => {
      if (id === probeIdRef.current) setGateway(next);
    };
    const isStale = (err: unknown) =>
      signal.aborted ||
      id !== probeIdRef.current ||
      (err instanceof GatewayError && err.isAborted);

    apply({
      baseUrl: GATEWAY_BASE_URL,
      state: "checking",
      detail: "Checking platform gateway…",
      lastChecked: null,
      serviceTs: null,
    });

    // 1) Public liveness probe.
    let serviceTs: number | null = null;
    try {
      const health = await client.health(signal);
      serviceTs = typeof health?.ts === "number" ? health.ts : null;
    } catch (err) {
      if (isStale(err)) return;
      apply({
        baseUrl: GATEWAY_BASE_URL,
        state: "offline",
        detail: err instanceof GatewayError ? err.message : "Gateway unreachable.",
        lastChecked: Date.now(),
        serviceTs: null,
      });
      return;
    }

    // 2) No credential → reachable but not a real session.
    if (!tokenRef.current) {
      apply({
        baseUrl: GATEWAY_BASE_URL,
        state: "not_authenticated",
        detail: "Gateway reachable. No platform session — running on demo/local data.",
        lastChecked: Date.now(),
        serviceTs,
      });
      return;
    }

    // 3) Verify the credential against the auth-walled session endpoint.
    try {
      await client.get(GATEWAY_SESSION_PATH, { signal });
      apply({
        baseUrl: GATEWAY_BASE_URL,
        state: "connected",
        detail: "Gateway accepted your platform session.",
        lastChecked: Date.now(),
        serviceTs,
      });
    } catch (err) {
      if (isStale(err)) return;
      if (err instanceof GatewayError && err.isUnauthorized) {
        apply({
          baseUrl: GATEWAY_BASE_URL,
          state: "not_authenticated",
          detail: `Token rejected by gateway (${err.status}). Provide a valid platform session.`,
          lastChecked: Date.now(),
          serviceTs,
        });
        return;
      }
      if (err instanceof GatewayError && err.isUnreachable) {
        apply({
          baseUrl: GATEWAY_BASE_URL,
          state: "offline",
          detail: err.message,
          lastChecked: Date.now(),
          serviceTs: null,
        });
        return;
      }
      // health OK but the session check failed for another reason — the gateway
      // is up, so report not-connected rather than offline.
      apply({
        baseUrl: GATEWAY_BASE_URL,
        state: "not_authenticated",
        detail:
          err instanceof GatewayError
            ? `Gateway reachable, session check failed: ${err.message}`
            : "Gateway reachable, session check failed.",
        lastChecked: Date.now(),
        serviceTs,
      });
    }
  }, [client]);

  useEffect(() => {
    void probe();
    return () => controllerRef.current?.abort();
  }, [probe, token]);

  const signInWithToken = useCallback((next: string) => {
    setStoredToken(next);
    setToken(getStoredToken());
    setMode(resolveMode());
  }, []);

  const signOut = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setMode(resolveMode());
  }, []);

  const refresh = useCallback(() => {
    void probe();
  }, [probe]);

  const value = useMemo<PlatformContextValue>(
    () => ({
      mode,
      user,
      hasToken: Boolean(token),
      client,
      gateway,
      signInWithToken,
      signOut,
      refresh,
    }),
    [mode, user, token, client, gateway, signInWithToken, signOut, refresh],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within a PlatformProvider");
  return ctx;
}

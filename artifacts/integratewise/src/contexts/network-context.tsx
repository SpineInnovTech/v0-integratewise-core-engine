/**
 * Network Context — Online/Offline detection + write failure tracking
 *
 * Combines browser online/offline events with gatewayClient.onOfflineChange()
 * for gateway-level detection. Shows an offline banner when disconnected and
 * surfaces write failures that need user action via pendingFailures.
 *
 * Requirements: R9 (Error Handling and Offline Resilience)
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { gatewayClient, type GatewayRequestError } from "../lib/gateway-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PendingFailure {
  id: string;
  timestamp: number;
  path: string;
  method: "POST" | "PATCH" | "DELETE";
  error: GatewayRequestError;
  /** Optional description for UI display */
  description?: string;
}

export interface NetworkContextValue {
  /** Whether the app is currently offline (browser + gateway-level) */
  isOffline: boolean;
  /** Write operations that failed and require user attention */
  pendingFailures: PendingFailure[];
  /** Last error encountered (network or gateway) */
  lastError: GatewayRequestError | null;
  /** Clear the last error */
  clearError: () => void;
  /** Dismiss a specific pending failure by id */
  dismissFailure: (id: string) => void;
  /** Dismiss all pending failures */
  dismissAllFailures: () => void;
  /** Report a write failure that needs user action */
  reportWriteFailure: (failure: Omit<PendingFailure, "id" | "timestamp">) => void;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator !== "undefined") return !navigator.onLine;
    return false;
  });
  const [pendingFailures, setPendingFailures] = useState<PendingFailure[]>([]);
  const [lastError, setLastError] = useState<GatewayRequestError | null>(null);
  const failureIdRef = useRef(0);

  // ── Online/Offline Detection ────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Subscribe to gateway-level offline detection
    const unsubGateway = gatewayClient.onOfflineChange((offline) => {
      setIsOffline(offline);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubGateway();
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const dismissFailure = useCallback((id: string) => {
    setPendingFailures((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const dismissAllFailures = useCallback(() => {
    setPendingFailures([]);
  }, []);

  const reportWriteFailure = useCallback((failure: Omit<PendingFailure, "id" | "timestamp">) => {
    const id = `wf_${Date.now()}_${++failureIdRef.current}`;
    const entry: PendingFailure = {
      ...failure,
      id,
      timestamp: Date.now(),
    };
    setPendingFailures((prev) => [...prev, entry]);
    setLastError(failure.error);
  }, []);

  // ── Context Value ───────────────────────────────────────────────────────

  const value: NetworkContextValue = {
    isOffline,
    pendingFailures,
    lastError,
    clearError,
    dismissFailure,
    dismissAllFailures,
    reportWriteFailure,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
      {isOffline && <OfflineBanner />}
    </NetworkContext.Provider>
  );
}

// ─── Offline Banner ─────────────────────────────────────────────────────────

function OfflineBanner() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: "10px 16px",
        backgroundColor: "#d4ac5a",
        color: "#5e4a1f",
        textAlign: "center",
        fontSize: "14px",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zM8 11.5a.75.75 0 110-1.5.75.75 0 010 1.5z"
          fill="currentColor"
        />
      </svg>
      You're offline. Changes will sync when connectivity is restored.
    </div>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error("useNetwork must be used within <NetworkProvider>");
  }
  return ctx;
}

export { NetworkContext };

/**
 * Auth Context — CF Gateway OAuth 2.0 via AuthManager
 *
 * Wraps the singleton AuthManager (apps/web/src/lib/auth-manager.ts) in a React context.
 * Provides reactive auth state to the component tree and exposes signIn/signOut/user.
 *
 * Requirements: R2 (Authentication via CF Gateway), R10 (Migration — onAuthStateChange contract)
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authManager, type AuthUser, type AuthSession, type AuthEvent } from "@/lib/auth-manager";

// ─── Context Types ──────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Current authenticated user or null */
  user: AuthUser | null;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether the initial session check is in progress */
  isLoading: boolean;
  /** Last auth error message, or null */
  error: string | null;
  /** Sign in (no args = show form signal; with args = direct login) */
  signIn: (email?: string, password?: string) => Promise<void>;
  /** Sign in with email + password directly */
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  /** Sign up with email + password */
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  /** Sign out — clear tokens */
  signOut: () => Promise<void>;
  /** Current access token (for direct use if needed) */
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from authManager on mount + subscribe to changes
  useEffect(() => {
    let mounted = true;

    // Check for an existing session on mount
    const initSession = async () => {
      try {
        const session = await authManager.getSession();
        if (mounted) {
          if (session) {
            setUser(session.user);
            setAccessToken(session.accessToken);
          } else {
            setUser(null);
            setAccessToken(null);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error("[AuthProvider] Session init failed:", err);
          setError(err instanceof Error ? err.message : "Failed to restore session");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    // Subscribe to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const unsubscribe = authManager.onAuthStateChange(
      (event: AuthEvent, session: AuthSession | null) => {
        if (!mounted) return;

        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
            if (session) {
              setUser(session.user);
              setAccessToken(session.accessToken);
              setError(null);
            }
            break;
          case "SIGNED_OUT":
            setUser(null);
            setAccessToken(null);
            break;
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────

  const signIn = useCallback(async (email?: string, password?: string) => {
    setError(null);
    try {
      await authManager.signIn(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      setError(message);
      throw err;
    }
  }, []);

  const signInWithCredentials = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await authManager.signInWithCredentials(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      setError(message);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    setError(null);
    try {
      await authManager.signUp(email, password, name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-up failed";
      setError(message);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await authManager.signOut();
      setUser(null);
      setAccessToken(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-out failed";
      setError(message);
    }
  }, []);

  // ── Context Value ───────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    signIn,
    signInWithCredentials,
    signUp,
    signOut,
    accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}

export { AuthContext };
export type { AuthContextValue };

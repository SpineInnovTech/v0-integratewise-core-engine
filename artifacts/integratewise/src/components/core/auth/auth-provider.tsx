/**
 * auth-provider.tsx — CF Auth Shim (Compatibility Layer)
 *
 * Maintains the legacy useAuth() API surface so all components work unchanged.
 * Backed entirely by CF OAuth (auth.integratewise.ai) via authManager + authContext.
 *
 * Architecture:
 *   CF OAuth (auth.integratewise.ai) → CF D1 / KV  (current — CF only)
 *   localStorage iw_onboarding_${id} → onboarding metadata cache
 *
 * Supabase Bridge (roadmap):
 *   When the CF ↔ Supabase bridge is ready, swap auth-context.tsx internals.
 *   This shim stays untouched — callers see no difference.
 */
import React, { useCallback } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { authManager } from "@/lib/auth-manager";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OnboardingMetadata {
  onboarding_complete: boolean;
  domain?: string;
  userName?: string;
  userRole?: string;
  workspacePreference?: "WORK" | "PERSONAL" | "BOTH";
  department?: string;
  connectors?: { crm?: string; task?: string; workspace?: string };
  useCase?: "personal" | "work" | "business";
}

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  tenant_id?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Partial<OnboardingMetadata>;
}

interface Session {
  access_token: string;
  user: User;
  expires_at?: number;
}

// ─── Onboarding metadata helpers (localStorage cache) ────────────────────────

function readOnboardingMeta(userId: string): Partial<OnboardingMetadata> | undefined {
  try {
    const raw = localStorage.getItem(`iw_onboarding_${userId}`);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function saveOnboardingMeta(userId: string, data: Partial<OnboardingMetadata>): void {
  try {
    const existing = readOnboardingMeta(userId) || {};
    localStorage.setItem(`iw_onboarding_${userId}`, JSON.stringify({ ...existing, ...data }));
  } catch {
    /* ignore */
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// ─── AuthProvider — passthrough (real AuthProvider is at App root) ────────────
// auth-context.tsx AuthProvider wraps the entire app in App.tsx.
// This is a no-op wrapper kept for backward compat with AppShell.

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ─── useAuth — CF auth adapter ────────────────────────────────────────────────

export function useAuth() {
  const {
    user: cfUser,
    isLoading,
    error,
    signInWithCredentials: cfSignInCreds,
    signUp: cfSignUp,
    signOut: cfSignOut,
    accessToken,
  } = useAuthContext();

  // Map CF AuthUser → legacy User shape (user_metadata from localStorage cache)
  const user: User | null = cfUser
    ? {
        id: cfUser.id,
        email: cfUser.email,
        name: cfUser.name,
        role: cfUser.role,
        tenant_id: cfUser.tenant_id,
        // app_metadata carries tenant_id so provisioning loop exits immediately
        app_metadata: { tenant_id: cfUser.tenant_id },
        // user_metadata from localStorage onboarding cache
        user_metadata: readOnboardingMeta(cfUser.id),
      }
    : null;

  const session: Session | null = user ? { access_token: accessToken || "", user } : null;

  // updateUser: write localStorage (instant) + sync to CF Gateway (best-effort)
  const updateUser = useCallback(
    async (data: Partial<OnboardingMetadata>): Promise<boolean> => {
      // 1. Local cache — instant, used by AppShell + components on next render
      if (cfUser?.id) {
        saveOnboardingMeta(cfUser.id, data);
      }

      // 2. CF Gateway sync — best-effort, non-blocking
      try {
        const token = await authManager.getAccessToken();
        if (token && API_BASE) {
          await fetch(`${API_BASE}/api/v1/auth/update`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });
        }
      } catch {
        // Non-fatal: localStorage cache is authoritative for now
      }

      return true;
    },
    [cfUser?.id]
  );

  // refreshSession: refreshes CF token, returns session with tenant_id
  // The provisioning loop in AppShell checks refreshed.user.app_metadata.tenant_id
  // — tenant_id is already in the CF JWT so this exits on first attempt.
  const refreshSession = useCallback(async (): Promise<Session | null> => {
    try {
      await authManager.refreshToken().catch(() => {});
      const s = await authManager.getSession();
      if (!s || !user) return null;
      return { access_token: s.accessToken, user };
    } catch {
      return null;
    }
  }, [user]);

  // signIn / signUp — direct credential auth via CF Gateway (no OAuth redirect)
  const signIn = useCallback(
    async (email?: string, password?: string): Promise<void> => {
      if (email && password) {
        await cfSignInCreds(email, password);
      }
    },
    [cfSignInCreds]
  );

  const signUp = useCallback(
    async (name?: string, email?: string, password?: string): Promise<boolean> => {
      if (email && password) {
        await cfSignUp(email, password, name);
        return true;
      }
      return false;
    },
    [cfSignUp]
  );

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      const token = await authManager.getAccessToken().catch(() => "");
      await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email }),
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  // Social login — redirect to the CF Gateway OAuth start endpoint.
  // Gateway exchanges the code, issues our RS256 JWT, and redirects back to
  // /auth/callback#token=... (handled by AuthCallback).
  const startSocialLogin = useCallback(async (provider: "google" | "github"): Promise<void> => {
    const base = API_BASE || "https://gateway.integratewise.ai";
    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = `${base}/api/v1/auth/oauth/${provider}/start?redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
  }, []);
  const signInWithGoogle = useCallback(() => startSocialLogin("google"), [startSocialLogin]);
  const signInWithGitHub = useCallback(() => startSocialLogin("github"), [startSocialLogin]);

  return {
    session,
    user,
    loading: isLoading,
    error: error || "",
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signOut: cfSignOut,
    updateUser,
    resetPassword,
    refreshSession,
    clearError: useCallback(() => {}, []),
    accessToken,
  };
}

// ─── Re-exports for compatibility ─────────────────────────────────────────────
export type { Session as SpineSession, User as SpineUser };

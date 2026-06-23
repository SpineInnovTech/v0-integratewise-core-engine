/**
 * AppShell — The Authenticated Workspace
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ L0→L1→L2→L3 WIRING                                            │
 * ├─────────────┬───────────────────────────────────────────────────┤
 * │ L0 Onboard  │ OnboardingFlowNew (6-step foundation gate)        │
 * │ L1 Workspace│ WorkspaceShellNew → ContentRouter (lazy modules) │
 * │ L2 Cognitive│ Bottom Cognitive Drawer (event-driven, ⌘J)        │
 * │ L3 Backend  │ API client → Gateway → Workers (6 services)      │
 * ├─────────────┴───────────────────────────────────────────────────┤
 * │ Provider Stack (outermost → innermost):                        │
 * │   ErrorBoundary → AuthProvider → SpineProvider →               │
 * │   GoalProvider → HydrationFabric → WorkspaceShellNew           │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Stage Flow:                                                    │
 * │   login → signup → onboarding (L0) → loading → workspace (L1) │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ L2 Events (dispatched → CognitiveLayer listener):              │
 * │   iw:evidence:open  — open evidence panel                      │
 * │   iw:cognitive:open — open specific cognitive surface           │
 * │   open-cognitive-layer — generic open (defaults to signals)     │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Auth: Supabase PKCE (Google SSO, GitHub SSO, email/password)
 * Data: Spine SSOT via BFF Worker → Cloudflare → Supabase PostgreSQL
 * State: Hydration Fabric with 5 providers (Spine, REST, Doppler, KV, Static)
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// ─── Query Client ──────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

// ─── Mock Workspace App (for local development testing) ──────

// Auth
import {
  AuthProvider,
  useAuth,
  type OnboardingMetadata,
} from "@/components/core/auth/auth-provider";

// API Client (v3.5 wiring)
import { initApiClient, apiFetch } from "@/lib/api-client";

// Realtime action status watcher
import { useActionRealtime } from "@/hooks/use-action-realtime";

// Spine + Goal Framework
import { SpineProvider, useSpine } from "@/components/l2/spine/spine-client";
import { GoalProvider } from "@/components/_deprecated/l2-removed/goal-framework/goal-context";

// Core App Components
import { LoginPage } from "@/components/core/auth/login-page";
import { SignUpPage } from "@/components/core/auth/signup-page";
// Onboarding Flow (Clean Architecture)
import { OnboardingFlow } from "@/components/activation/onboarding/OnboardingFlow";
import { LoaderPhase1 } from "@/components/l1/workspace/loader-phase1";
import { WorkspaceShellNew } from "@/components/l1/workspace/workspace-shell-new";
import { UnifiedShell } from "@/components/shells/UnifiedShell";
import { HydrationFabric } from "@/components/core/hydration";
import { HelpWidget } from "@/components/common/support/help-widget";
import { TenantProvider } from "@/contexts/tenant-context";

// Types
import type { Domain } from "@/components/l1/workspace/workspace-config";
import { resolveContext } from "@/lib/projection/context-resolver";

// ─── Domain/Department → View Context (CTX) ────────────────────────────────
// In IntegrateWise's 12×11 model, Department (trait) drives the CTX. Domain is the
// workspace shell key and can collapse multiple departments (e.g. SUPPORT + SERVICE_OPS → SERVICE).
// Context resolution flows through the single source of truth (context-resolver),
// so department, domain, and CTX can never diverge (per spec: work view is single chosen domain, no universal default for work; only personal domain has default).
function resolveViewContext(domain: string, department?: string): string {
  return resolveContext({ domain, department }).ctx;
}

type ConnectorSelections = {
  crm?: string;
  task?: string;
  workspace?: string;
  collaboration?: string;
  email?: string;
  analytics?: string;
};

// ─── Error Boundary ──────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#0e1410,#1a3a2a)] text-white flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-5">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-sm text-gray-400">
              An unexpected error occurred. You can try again or return to the dashboard.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                  Show error details
                </summary>
                <pre className="mt-2 text-xs bg-black/30 p-3 rounded overflow-auto max-h-32 text-slate-300">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 bg-[#B8943F] text-white rounded-lg hover:opacity-90 min-h-[44px] font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  window.location.href = "/app/work/dashboard";
                }}
                className="px-4 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/15 min-h-[44px] font-medium border border-white/20"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Workspace App (Core authenticated experience) ───────────
type WorkspaceStage = "login" | "signup" | "provisioning" | "onboarding" | "loading" | "workspace";

function WorkspaceApp() {
  const spine = useSpine();
  const auth = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialStage: WorkspaceStage = searchParams.get("signup") === "1" ? "signup" : "login";
  const domainFromUrl = searchParams.get("domain");
  const [stage, setStage] = useState<WorkspaceStage>(initialStage);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [userName, setUserName] = useState("User");
  const [useCase, setUseCase] = useState<"personal" | "work" | "business">("work");
  const [domain, setDomain] = useState<Domain>("CUSTOMER_SUCCESS");
  const [userRole, setUserRole] = useState<string>("CUSTOMER_SUCCESS");
  const [workspacePreference, setWorkspacePreference] = useState<"WORK" | "PERSONAL" | "BOTH">(
    "WORK" // per spec: start with work view (the chosen domain one); personal switchable
  );
  const [department, setDepartment] = useState<string | undefined>();
  const [connectors, setConnectors] = useState<{
    crm?: string;
    task?: string;
    workspace?: string;
    collaboration?: string;
    email?: string;
    analytics?: string;
  }>({});

  // ── Wire API client with auth accessors (v3.5) ─────────────────────
  const domainRef = useRef(domain);
  domainRef.current = domain;
  const departmentRef = useRef(department);
  departmentRef.current = department;

  const authRef = useRef(auth);
  authRef.current = auth;

  useEffect(() => {
    initApiClient({
      getAccessToken: () => authRef.current.accessToken,
      getTenantId: () => {
        const user = authRef.current.user;
        return user?.tenant_id || "";
      },
      getUserId: () => authRef.current.user?.id || null,
      getViewContext: () => {
        return resolveViewContext(domainRef.current, departmentRef.current);
      },
    });
  }, []);

  // Auto-detect authenticated session — skip onboarding for returning users
  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user || (stage !== "login" && stage !== "signup")) return;

    const meta = auth.user.user_metadata as Partial<OnboardingMetadata> | undefined;
    const storageKey = `iw_onboarding_${auth.user.id}`;
    let stored: Partial<OnboardingMetadata> | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      stored = raw ? JSON.parse(raw) : null;
    } catch {
      /* ignore */
    }

    const isReturningUser =
      meta?.onboarding_complete === true || stored?.onboarding_complete === true;

    if (isReturningUser) {
      const source = meta?.onboarding_complete ? meta : stored;
      const validDomains = [
        "CUSTOMER_SUCCESS",
        "SALES",
        "REVOPS",
        "MARKETING",
        "PRODUCT_ENGINEERING",
        "FINANCE",
        "SERVICE",
        "PROCUREMENT",
        "IT_ADMIN",
        "STUDENT_TEACHER",
        "PERSONAL",
        "BIZOPS",
      ] as const;
      // Per spec: no default domain for work; only personal has default (PERSONAL).
      // Work domain strictly from chosen onboarding value or D1 profile reconcile below.
      let restoredDomain: Domain | undefined = source?.domain as Domain | undefined;
      if (!validDomains.includes(restoredDomain as any)) {
        restoredDomain = source?.useCase === "personal" ? "PERSONAL" : undefined;
      }
      setUserName(source?.userName || auth.user.name || auth.user.email?.split("@")[0] || "User");
      setUseCase(source?.useCase || "work");
      setDomain(
        resolveContext({
          role: source?.userRole,
          department: source?.department,
          domain: restoredDomain,
        }).domain
      );
      setUserRole(source?.userRole || source?.domain || restoredDomain || "");
      // Per spec: only personal + one work view. Differentiate L1 and memory; shared Twin etc.
      const pref = source?.useCase === "personal" ? "PERSONAL" : "WORK";
      setWorkspacePreference(pref);
      setDepartment(source?.department);
      setConnectors(source?.connectors || {});
      const connectedApps = Object.values(source?.connectors || {}).filter(Boolean) as string[];
      spine
        .initialize({
          connectedApps,
          userName: source?.userName || "User",
          role: source?.userRole || source?.domain || restoredDomain || "",
        })
        .catch((err) => console.error("[AppShell] Spine init for returning user:", err));
      setStage("workspace");

      // ── D1 authoritative domain reconciliation ─────────────────────────────
      // localStorage/JWT metadata domain may be stale.
      // Fetch the D1 Spine profile (written during onboarding initialize-spine)
      // as the source of truth and silently correct domain + department if D1
      // has a more specific value. Workspace renders first with the cached value,
      // then re-renders with the authoritative one if they differ.
      // Per spec: work view is strictly one chosen domain (no universal default for work; only personal has default).
      apiFetch<{
        domain?: string;
        department?: string;
        spine?: { domain?: string; department?: string };
      }>("/api/v1/workspace/profile", {}, "WorkspaceProfileRestore")
        .then((profile) => {
          const d1Domain = (profile.domain || profile.spine?.domain)?.toUpperCase() as
            | Domain
            | undefined;
          const d1Department = profile.department || profile.spine?.department;
          // Only override if D1 has a specific domain
          if (d1Domain && validDomains.includes(d1Domain as any)) {
            setDomain(d1Domain);
          }
          if (d1Department) {
            setDepartment(d1Department);
          }
        })
        .catch(() => {
          // Non-fatal: workspace renders fine with the localStorage-restored domain.
          console.warn(
            "[AppShell] D1 profile reconciliation skipped (offline or not hydrated yet)"
          );
        });
    } else {
      // New user — go through provisioning to ensure tenant_id is resolved
      // before entering onboarding. This handles both email/password signup
      // (where signUp already does a refresh loop) and OAuth signup (where
      // the user returns via redirect and tenant_id may not be in the JWT yet).
      setUserName(
        auth.user.name ||
          (auth.user.user_metadata as any)?.full_name ||
          auth.user.email?.split("@")[0] ||
          "User"
      );
      setStage("provisioning");
    }
  }, [auth.loading, auth.user, stage]);

  // ── Tenant provisioning (new users) ───────────────────────────────────
  // Robust wait for tenant_id (from D1 write in signup) to appear in the JWT/app_metadata.
  // Polls refresh + /me until tenant_id is present. Covers email signup and OAuth redirect cases.
  // Everything for tenant isolation (spine, connectors, projections) depends on this.
  useEffect(() => {
    if (stage !== "provisioning") return;
    let cancelled = false;

    (async () => {
      const MAX_ATTEMPTS = 15; // ~12-15s max for slow D1/CF propagation
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !cancelled; attempt++) {
        try {
          const refreshed = await authRef.current.refreshSession();
          const tid = refreshed?.user?.app_metadata?.tenant_id || authRef.current.user?.tenant_id;
          if (tid) {
            console.log(
              "[AppShell] tenant_id resolved during provisioning, attempt",
              attempt + 1,
              tid
            );
            break;
          }
        } catch (e) {
          // ignore transient
        }
        await new Promise((r) => setTimeout(r, 800));
      }
      if (!cancelled) {
        setStage("onboarding");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stage]);

  // Email/Password Login — session-restore effect handles stage (onboarding vs workspace)
  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setLoginLoading(true);
      auth.clearError();
      await auth.signIn(email, password);
      setLoginLoading(false);
    },
    [auth]
  );

  // Email/Password Sign Up — session-restore effect handles stage
  const handleSignUp = useCallback(
    async (name: string, email: string, password: string) => {
      setSignUpLoading(true);
      auth.clearError();
      await auth.signUp(name, email, password);
      setSignUpLoading(false);
    },
    [auth]
  );

  // Google OAuth
  const handleGoogleAuth = useCallback(async () => {
    setGoogleLoading(true);
    auth.clearError();
    await auth.signInWithGoogle();
  }, [auth]);

  // GitHub OAuth
  const handleGitHubAuth = useCallback(async () => {
    setGithubLoading(true);
    auth.clearError();
    await auth.signInWithGitHub();
  }, [auth]);

  // Forgot Password
  const handleForgotPassword = useCallback(
    async (email: string): Promise<boolean> => {
      setForgotLoading(true);
      auth.clearError();
      const success = await auth.resetPassword(email);
      setForgotLoading(false);
      return success;
    },
    [auth]
  );

  // Onboarding complete → Loader Phase 1
  const handleOnboardingComplete = useCallback(async () => {
    // Re-hydrate local state from persisted onboarding metadata so Workspace launches
    // with the right domain/department (important for correct CTX + schema gating).
    if (auth.user) {
      const meta = auth.user.user_metadata as Partial<OnboardingMetadata> | undefined;
      const storageKey = `iw_onboarding_${auth.user.id}`;
      let stored: Partial<OnboardingMetadata> | null = null;
      try {
        const raw = localStorage.getItem(storageKey);
        stored = raw ? JSON.parse(raw) : null;
      } catch {
        /* ignore */
      }

      const source = stored?.onboarding_complete ? stored : meta;
      const validDomains = [
        "CUSTOMER_SUCCESS",
        "SALES",
        "REVOPS",
        "MARKETING",
        "PRODUCT_ENGINEERING",
        "FINANCE",
        "SERVICE",
        "PROCUREMENT",
        "IT_ADMIN",
        "STUDENT_TEACHER",
        "PERSONAL",
        "BIZOPS",
      ] as const;
      // Per spec: no default domain for work; only personal has default (PERSONAL).
      let restoredDomain: Domain | undefined = source?.domain as Domain | undefined;
      if (!validDomains.includes(restoredDomain as any)) {
        restoredDomain = source?.useCase === "personal" ? "PERSONAL" : undefined;
      }

      setUserName(source?.userName || auth.user.name || "User");
      setUseCase(source?.useCase || "work");
      setDomain(
        resolveContext({
          role: source?.userRole,
          department: source?.department,
          domain: restoredDomain,
        }).domain
      );
      setUserRole(source?.userRole || source?.domain || restoredDomain || "");
      // Per spec: only personal + one work view.
      const pref = source?.useCase === "personal" ? "PERSONAL" : "WORK";
      setWorkspacePreference(pref);
      setDepartment(source?.department);
      setConnectors(source?.connectors || {});

      const connectedApps = Object.values(source?.connectors || {}).filter(Boolean) as string[];
      spine
        .initialize({
          connectedApps,
          userName: source?.userName || "User",
          role: source?.userRole || source?.domain || restoredDomain || "",
        })
        .catch((err) => console.error("[AppShell] Spine init after onboarding:", err));
    }

    setStage("workspace"); // AILoader + WorkplaceLoading (normalizer) already ran inside OnboardingFlow
  }, [auth.user, spine]);

  // Loader complete → Workspace
  const handleLoaderComplete = useCallback(() => {
    setStage("workspace");
  }, []);

  // Logout → back to login
  const handleLogout = useCallback(async () => {
    await auth.signOut();
    setStage("login");
    setUserName("User");
    setDomain("CUSTOMER_SUCCESS");
    setUserRole("CUSTOMER_SUCCESS");
    setWorkspacePreference("BOTH");
    setConnectors({});
  }, [auth]);

  // Auth loading screen
  if (auth.loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#0e1410,#1a3a2a)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: "#B8943F" }}
          />
          <p className="text-white/60 text-sm">Restoring session...</p>
        </div>
      </div>
    );
  }

  // Render by stage
  switch (stage) {
    case "login":
      return (
        <LoginPage
          onLogin={handleLogin}
          onSignUp={() => {
            auth.clearError();
            setStage("signup");
          }}
          onForgotPassword={handleForgotPassword}
          onGoogleLogin={handleGoogleAuth}
          onGitHubLogin={handleGitHubAuth}
          error={auth.error}
          loading={loginLoading}
          googleLoading={googleLoading}
          githubLoading={githubLoading}
          forgotLoading={forgotLoading}
        />
      );
    case "signup":
      return (
        <SignUpPage
          onSignUp={handleSignUp}
          onGoToLogin={() => {
            auth.clearError();
            setStage("login");
          }}
          onGoogleSignUp={handleGoogleAuth}
          onGitHubSignUp={handleGitHubAuth}
          error={auth.error}
          loading={signUpLoading}
          googleLoading={googleLoading}
          githubLoading={githubLoading}
        />
      );
    case "provisioning":
      return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#0e1410,#1a3a2a)] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: "#B8943F" }}
            />
            <p className="text-white/60 text-sm">Setting up your workspace...</p>
          </div>
        </div>
      );
    case "onboarding":
      return <OnboardingFlow onComplete={handleOnboardingComplete} />;
    case "loading":
      return (
        <LoaderPhase1 domain={domain} connectors={connectors} onComplete={handleLoaderComplete} />
      );
    case "workspace": {
      const p = location.pathname;

      // ── Option C: UnifiedShell at /app/unified/* ───────────────────────
      // Parallel route — zero impact on existing /app/work/* shell.
      // Kill switch: remove this block and the import above.
      if (p.startsWith("/app/unified")) {
        return (
          <GoalProvider initialOrgType="PRODUCT">
            <TenantProvider initialTenantId={auth.user?.tenant_id || undefined}>
              <HydrationFabric
                initialContext={{
                  domain,
                  role: userRole,
                  department,
                  userName,
                  connectedApps: Object.values(connectors).filter(Boolean) as string[],
                  tenantId: auth.user?.tenant_id || "default",
                }}
              >
                <UnifiedShell
                  domain={domain}
                  userName={userName}
                  department={department}
                  userRole={userRole}
                  onLogout={handleLogout}
                  useCase={useCase}
                />
              </HydrationFabric>
            </TenantProvider>
          </GoalProvider>
        );
      }

      // ── Existing shell (untouched) ─────────────────────────────────────
      let initialPath: string | undefined;
      if (p === "/app/settings") {
        initialPath = "/work/settings";
      } else if (p.startsWith("/app/work/") || p.startsWith("/app/personal/")) {
        initialPath = p.slice(4);
      } else {
        initialPath = undefined;
      }
      return (
        <GoalProvider initialOrgType="PRODUCT">
          <TenantProvider initialTenantId={auth.user?.tenant_id || undefined}>
            <HydrationFabric
              initialContext={{
                domain,
                role: userRole,
                department,
                userName,
                connectedApps: Object.values(connectors).filter(Boolean) as string[],
                tenantId: auth.user?.tenant_id || "default",
              }}
            >
              <WorkspaceShellNew
                domain={domain}
                userName={userName}
                department={department}
                userRole={userRole}
                initialView={workspacePreference === "PERSONAL" ? "PERSONAL" : "WORK"}
                initialPath={initialPath}
                onLogout={handleLogout}
                useCase={useCase}
              />
              <HelpWidget />
              <ActionRealtimeWatcher />
            </HydrationFabric>
          </TenantProvider>
        </GoalProvider>
      );
    }
  }
}

/** Mounts Supabase Realtime subscription for action status changes (toast + cache invalidation). */
function ActionRealtimeWatcher() {
  useActionRealtime();
  return null;
}

// ─── Mock Workspace App (for local development testing) ──────
function MockWorkspaceApp() {
  const [stage, setStage] = useState<"workspace">("workspace");
  const [userName] = useState("Test User");
  const [useCase] = useState<"personal" | "work" | "business">("work");
  const [domain] = useState<Domain>("CUSTOMER_SUCCESS");
  const [userRole] = useState("CUSTOMER_SUCCESS");
  const [workspacePreference] = useState<"WORK" | "PERSONAL" | "BOTH">("WORK");
  const [department] = useState<string | undefined>(undefined);
  const [connectors] = useState<{ crm?: string; task?: string; workspace?: string }>({});

  // Mock logout for testing
  const handleLogout = useCallback(() => {
    console.log("[MockWorkspaceApp] Logout clicked - staying in mock mode");
  }, []);

  if (stage === "workspace") {
    return (
      <GoalProvider initialOrgType="PRODUCT">
        <TenantProvider initialTenantId="mock-tenant">
          <HydrationFabric
            initialContext={{
              domain,
              role: userRole,
              department,
              userName,
              connectedApps: Object.values(connectors).filter(Boolean) as string[],
              tenantId: "mock-tenant",
            }}
          >
            <WorkspaceShellNew
              domain={domain}
              userName={userName}
              department={department}
              userRole={userRole}
              initialView={workspacePreference === "PERSONAL" ? "PERSONAL" : "WORK"}
              initialPath={undefined}
              onLogout={handleLogout}
              useCase={useCase}
            />
          </HydrationFabric>
        </TenantProvider>
      </GoalProvider>
    );
  }

  return null;
}

// ─── Mock Unified Shell (auth-free dev preview) ──────────────
// Accessible at /dev/unified/* — no login required.
// Shows UnifiedShell with Nirmal / CUSTOMER_SUCCESS defaults.
export function MockUnifiedShell() {
  const handleLogout = useCallback(() => {
    console.log("[MockUnifiedShell] Logout clicked");
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GoalProvider initialOrgType="PRODUCT">
          <TenantProvider initialTenantId="mock-tenant">
            <HydrationFabric
              initialContext={{
                domain: "CUSTOMER_SUCCESS",
                role: "CUSTOMER_SUCCESS",
                department: "Customer Success",
                userName: "Nirmal",
                connectedApps: [],
                tenantId: "mock-tenant",
              }}
            >
              <UnifiedShell
                domain="CUSTOMER_SUCCESS"
                userName="Nirmal"
                department="Customer Success"
                userRole="CUSTOMER_SUCCESS"
                onLogout={handleLogout}
                useCase="business"
              />
            </HydrationFabric>
          </TenantProvider>
        </GoalProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// ─── AppShell (exported as default for lazy loading) ─────────
// Export ErrorBoundary for use in routes
export { ErrorBoundary };

export default function AppShell() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SpineProvider>
            <WorkspaceApp />
          </SpineProvider>
        </AuthProvider>
      </QueryClientProvider>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: "var(--iw-bg-secondary, #fff)",
            border: "1px solid var(--iw-border, #e9e5dd)",
            color: "var(--iw-text-primary, #0c0c0c)",
          },
        }}
      />
    </ErrorBoundary>
  );
}

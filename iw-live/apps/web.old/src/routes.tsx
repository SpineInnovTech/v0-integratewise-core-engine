/**
 * IntegrateWise App Router
 *
 * Clean separation: App only (no marketing landing).
 * Marketing lives at integratewise.ai (separate codebase).
 * This app lives at app.integratewise.ai
 */

import { createBrowserRouter, Navigate } from "react-router";
import React from "react";

// Import ErrorBoundary from AppShell
import { ErrorBoundary } from "@/AppShell";

const AppShell = React.lazy(() => import("@/AppShell"));
const MockUnifiedShellPage = React.lazy(() =>
  import("@/AppShell").then((m) => ({ default: m.MockUnifiedShell }))
);
const OAuthCallbackPage = React.lazy(
  () => import("@/components/connectivity/connectors/oauth-callback")
);
const AuthCallbackPage = React.lazy(() => import("@/pages/AuthCallback"));
const MetricsPage = React.lazy(() => import("@/pages/Metrics"));
const LandingPage = React.lazy(() => import("@/pages/Landing"));
const FounderDashboardPage = React.lazy(() => import("@/pages/FounderDashboard"));

// Simple 404 for app domain
const NotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center font-iw-sans">
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <a href="/app" className="text-primary font-bold hover:underline">
        Go to app
      </a>
    </div>
  </div>
);

export const router = createBrowserRouter([
  // Root: Landing page (public, no auth required)
  // GTM motion: schema hydration via identity provider on first auth,
  // then MCP/Twin/Normalizer work seamlessly. First tool connection uses
  // same identity provider (single "authorize" click).
  {
    path: "/",
    element: (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[var(--iw-paper)] flex items-center justify-center">
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--iw-forest)" }}
            />
          </div>
        }
      >
        <LandingPage />
      </React.Suspense>
    ),
  },

  // App entry point
  {
    path: "/app",
    element: <Navigate to="/app/workspace" replace />,
  },

  // Main app shell - handles its own auth gating (login/signup/onboarding/workspace stages)
  {
    path: "/app/*",
    element: (
      <ErrorBoundary>
        <React.Suspense
          fallback={
            <div className="min-h-screen bg-background flex items-center justify-center font-iw-sans">
              <div className="text-center space-y-4">
                <div
                  className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                  style={{ borderColor: "var(--iw-forest)" }}
                />
                <p className="text-muted-foreground text-sm font-iw-mono">
                  Loading IntegrateWise...
                </p>
              </div>
            </div>
          }
        >
          <AppShell />
        </React.Suspense>
      </ErrorBoundary>
    ),
  },

  // Auth callback (CF Gateway OAuth 2.0)
  {
    path: "/auth/callback",
    element: (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--iw-forest)" }}
            />
          </div>
        }
      >
        <AuthCallbackPage />
      </React.Suspense>
    ),
  },

  // OAuth callbacks (connector-level)
  {
    path: "/oauth/callback/:provider",
    element: (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--iw-forest)" }}
            />
          </div>
        }
      >
        <OAuthCallbackPage />
      </React.Suspense>
    ),
  },

  // Dev-only: UnifiedShell preview — NO AUTH REQUIRED
  // Navigate to /dev/unified/work/dashboard to preview the new shell.
  // Remove this route before going to production.
  {
    path: "/dev/unified/*",
    element: (
      <React.Suspense
        fallback={
          <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: "#1A3A2A" }}
          >
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "#B8943F" }}
            />
          </div>
        }
      >
        <MockUnifiedShellPage />
      </React.Suspense>
    ),
  },

  // Founder · Cloudflare stack monitoring (Tenant 0). Auth handled by gatewayClient
  // (JWT) + founder-scoped admin endpoints; page degrades gracefully if unauthorized.
  {
    path: "/metrics",
    element: (
      <ErrorBoundary>
        <React.Suspense
          fallback={
            <div className="min-h-screen bg-background flex items-center justify-center font-iw-sans">
              <div
                className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--iw-forest)" }}
              />
            </div>
          }
        >
          <MetricsPage />
        </React.Suspense>
      </ErrorBoundary>
    ),
  },

  // Founder dashboard (public) — real-time metrics + system health
  {
    path: "/dashboard",
    element: (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[var(--iw-paper)] flex items-center justify-center">
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--iw-forest)" }}
            />
          </div>
        }
      >
        <FounderDashboardPage />
      </React.Suspense>
    ),
  },

  // 404 - app only
  { path: "*", Component: NotFound },
]);

/**
 * IntegrateWise — IW Continuity Bridge over the Spine, empowered by AI
 *
 * Unified entry point merging:
 *   - Marketing site (Anti-Gravity design, Dir 1)
 *   - Workspace app (Business Operations, Dir 2)
 *   - Backend services (integratewise-complete, Dir 3)
 *
 * "AI That Thinks in Context, Waits for Approvals."
 */

import React from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "@/contexts/auth-context";

function RootFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "#0e1410",
        color: "var(--iw-text-faint)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div className="text-center">
        <div
          className="w-10 h-10 border-2 border-iw-forest-bright border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p>Loading IntegrateWise...</p>
      </div>
    </div>
  );
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{
            background: "#0e1410",
            color: "var(--cloud)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div className="max-w-lg">
            <h1 className="text-xl font-semibold mb-2 text-red-400">Something went wrong</h1>
            <pre className="text-sm text-[var(--iw-text-faint)] overflow-auto rounded bg-black/30 p-4">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <RootErrorBoundary>
      <AuthProvider>
        <React.Suspense fallback={<RootFallback />}>
          <RouterProvider router={router} />
        </React.Suspense>
      </AuthProvider>
    </RootErrorBoundary>
  );
}

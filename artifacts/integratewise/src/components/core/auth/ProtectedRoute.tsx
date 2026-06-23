/**
 * ProtectedRoute — Gate protected content behind authentication.
 *
 * Wraps protected content and checks authentication state from AuthProvider.
 * - If loading: shows a spinner/skeleton
 * - If not authenticated: stores return URL and renders nothing (AppShell shows LoginPage)
 * - If authenticated: renders children
 *
 * Auth is credential-based via CF Gateway (no OAuth redirect).
 */
import { type ReactNode, useEffect } from "react";
import { useLocation } from "react-router";
import { useAuthContext } from "@/contexts/auth-context";

const RETURN_URL_KEY = "iw_auth_return_url";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  // Not authenticated — store the intended destination for post-login redirect
  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    const currentPath = location.pathname + location.search;
    if (currentPath) {
      sessionStorage.setItem(RETURN_URL_KEY, currentPath);
    }
  }, [isLoading, isAuthenticated, location.pathname, location.search]);

  // Still checking auth state — show loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-iw-sans">
        <div className="text-center space-y-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: "var(--iw-forest, #1A3A2A)" }}
          />
          <p className="text-muted-foreground text-sm font-iw-mono">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — render nothing; AppShell renders the LoginPage
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated — render the protected content
  return <>{children}</>;
}

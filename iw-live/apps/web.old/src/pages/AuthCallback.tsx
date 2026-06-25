/**
 * AuthCallback — OAuth 2.0 callback handler page.
 *
 * Route: /auth/callback
 *
 * Extracts `code` and `state` from URL search params, calls
 * authManager.handleCallback(code, state) to exchange for a token pair.
 * On success: redirects to the dashboard (or stored returnUrl).
 * On failure: shows an error with a link back to login.
 *
 * Requirements: R2 (Authentication via CF Gateway)
 */
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { authManager } from "@/lib/auth-manager";

const RETURN_URL_KEY = "iw_auth_return_url";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const handleOAuthCallback = async () => {
      // Social OAuth (Google/GitHub): gateway redirects back with the JWT in the
      // URL fragment (#token=...) or an ?auth_error=... on failure.
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const fragToken = hash.get("token");
      const authError = searchParams.get("auth_error") || hash.get("auth_error");
      if (authError) {
        setError(`Sign-in failed: ${authError.replace(/_/g, " ")}. Please try again.`);
        setProcessing(false);
        return;
      }
      if (fragToken) {
        try {
          authManager.adoptToken(fragToken);
          // Strip the token from the URL before navigating.
          window.history.replaceState({}, "", window.location.pathname);
          if (cancelled) return;
          const ru = sessionStorage.getItem(RETURN_URL_KEY);
          sessionStorage.removeItem(RETURN_URL_KEY);
          navigate(ru || "/app", { replace: true });
        } catch (err) {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : "Authentication failed");
          setProcessing(false);
        }
        return;
      }

      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        setError("Missing authorization code or state parameter. Please try signing in again.");
        setProcessing(false);
        return;
      }

      try {
        await authManager.handleCallback(code, state);

        if (cancelled) return;

        // Redirect to stored return URL or default to dashboard
        const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
        sessionStorage.removeItem(RETURN_URL_KEY);

        const destination = returnUrl || "/app";
        navigate(destination, { replace: true });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Authentication failed";
        setError(message);
        setProcessing(false);
      }
    };

    handleOAuthCallback();

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate]);

  // ── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-iw-sans p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="text-5xl">⚠️</div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">Authentication Failed</h1>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/app", { replace: true })}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium min-h-[44px]"
            >
              Back to Login
            </button>
            <button
              onClick={() => {
                // Restart the full OAuth flow from scratch
                authManager.signIn();
              }}
              className="px-5 py-2.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 font-medium min-h-[44px] border border-border"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Processing state ────────────────────────────────────────────────────
  if (processing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-iw-sans">
        <div className="text-center space-y-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: "var(--iw-forest, #1A3A2A)" }}
          />
          <p className="text-muted-foreground text-sm font-iw-mono">Completing sign-in...</p>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * OAuth Callback Page
 * Catches ?code=&state= from OAuth provider redirect,
 * exchanges for tokens via Gateway, then redirects to integrations page.
 *
 * Route: /oauth/callback/:provider
 */

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { connector } from "@/lib/api-client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type CallbackStatus = "processing" | "success" | "error";

export function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [message, setMessage] = useState("Connecting your account...");
  const onboardingResume = sessionStorage.getItem("iw_onboarding_resume") === "1";
  const onboardingResumeUrl = sessionStorage.getItem("iw_onboarding_resume_url") || "/app";

  const finishRedirect = useCallback(
    (qs: string) => {
      if (onboardingResume) {
        sessionStorage.removeItem("iw_onboarding_resume");
        sessionStorage.removeItem("iw_onboarding_resume_url");
        setTimeout(() => navigate(`${onboardingResumeUrl}${qs}`), 1200);
        return;
      }
      setTimeout(() => navigate(`/app/work/integrations${qs}`), 1200);
    },
    [navigate, onboardingResume, onboardingResumeUrl]
  );

  useEffect(() => {
    async function exchangeCode() {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`Authorization denied: ${error}`);
        finishRedirect("?error=" + encodeURIComponent(error));
        return;
      }

      if (!code || !provider) {
        setStatus("error");
        setMessage("Missing authorization code or provider");
        finishRedirect("?error=missing_code");
        return;
      }

      const storedState =
        sessionStorage.getItem(`iw_oauth_state_${provider}`) ||
        sessionStorage.getItem("oauth_state");
      sessionStorage.removeItem(`iw_oauth_state_${provider}`);
      sessionStorage.removeItem("oauth_state");
      if (!state || state !== storedState) {
        setStatus("error");
        setMessage("Invalid OAuth state — possible CSRF attack");
        finishRedirect("?error=csrf_mismatch");
        return;
      }

      try {
        const result = await connector.callback(provider, code, state || "");
        if (result) {
          setStatus("success");
          setMessage(`${provider} connected successfully!`);
          // Hint onboarding flow to mark this provider as connected after redirect.
          sessionStorage.setItem("iw_onboarding_last_connected_provider", provider);
          sessionStorage.setItem("iw_onboarding_last_connected_at", String(Date.now()));
          finishRedirect("?connected=" + encodeURIComponent(provider));
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Failed to complete OAuth exchange");
        finishRedirect("?error=exchange_failed");
      }
    }

    exchangeCode();
  }, [finishRedirect, provider, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-iw-sans">
      <div className="text-center space-y-4 max-w-md px-6">
        {status === "processing" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-iw-forest mx-auto" />
            <h2 className="text-xl text-foreground font-semibold">Connecting {provider}...</h2>
            <p className="text-muted-foreground text-sm font-iw-mono">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-iw-forest mx-auto" />
            <h2 className="text-xl text-foreground font-semibold">Connected!</h2>
            <p className="text-muted-foreground text-sm font-iw-mono">{message}</p>
            <p className="text-muted-foreground/60 text-xs">Redirecting to workspace...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl text-foreground font-semibold">Connection Failed</h2>
            <p className="text-muted-foreground text-sm font-iw-mono">{message}</p>
            <p className="text-muted-foreground/60 text-xs">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuthCallbackPage;

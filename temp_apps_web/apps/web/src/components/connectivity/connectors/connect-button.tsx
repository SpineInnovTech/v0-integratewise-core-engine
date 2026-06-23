"use client";

/**
 * OAuth Connect Button
 * Reusable button that initiates OAuth flow for a given provider.
 *
 * Usage: <ConnectButton provider="hubspot" onConnected={() => refetch()} />
 */

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { connector } from "@/lib/api-client";
import { Loader2, Link2, Unlink, CheckCircle } from "lucide-react";

interface ConnectButtonProps {
  provider: string;
  displayName?: string;
  connected?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  hubspot: "HubSpot",
  slack: "Slack",
  github: "GitHub",
  google: "Google Workspace",
  notion: "Notion",
  salesforce: "Salesforce",
};

export function ConnectButton({
  provider,
  displayName,
  connected = false,
  onConnected,
  onDisconnected,
  size = "default",
  className,
}: ConnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const label = displayName || PROVIDER_LABELS[provider] || provider;

  const handleConnect = useCallback(async () => {
    setLoading(true);
    try {
      const result = await connector.authorize(provider);
      if (result?.authUrl) {
        // Store state for CSRF verification on return
        if (result.state) {
          sessionStorage.setItem(`iw_oauth_state_${provider}`, result.state);
        }
        // Redirect to provider's OAuth consent page
        window.location.href = result.authUrl;
      } else if (result && result.authReady === false) {
        console.warn(
          `[ConnectButton] OAuth not ready for ${provider}: ${result.message || "coming soon"}`
        );
      }
    } catch (err: any) {
      console.error(`[ConnectButton] Failed to initiate OAuth for ${provider}:`, err);
      setLoading(false);
    }
  }, [provider]);

  const handleDisconnect = useCallback(async () => {
    setLoading(true);
    try {
      await connector.disconnect(provider);
      onDisconnected?.();
    } catch (err: any) {
      console.error(`[ConnectButton] Failed to disconnect ${provider}:`, err);
    } finally {
      setLoading(false);
    }
  }, [provider, onDisconnected]);

  if (connected) {
    return (
      <div className={`flex items-center gap-2 ${className || ""}`}>
        <span className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle className="w-3.5 h-3.5" />
          Connected
        </span>
        <Button
          variant="ghost"
          size={size}
          onClick={handleDisconnect}
          disabled={loading}
          className="text-muted-foreground hover:text-destructive"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
          <span className="ml-1">Disconnect</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleConnect}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <Link2 className="w-4 h-4 mr-2" />
      )}
      Connect {label}
    </Button>
  );
}

export default ConnectButton;

/**
 * Platform token seam.
 *
 * The universal front-end can run in three identity modes against the platform
 * gateway:
 *
 *  - "demo"           — no gateway token. The app runs on local/demo data and
 *                       honestly reports the platform as "not connected".
 *  - "provided-token" — a platform JWT supplied for development (stored in
 *                       localStorage, visibly labelled). Lets us light up real
 *                       gateway data before the full OAuth flow is wired.
 *  - "platform"       — full OAuth/PKCE against auth.integratewise.ai. Not yet
 *                       configured; resolved only when VITE_PLATFORM_OAUTH is set.
 *
 * This module owns ONLY token acquisition/storage. It never decides what to
 * render — that is the provider/UI's job.
 */

export type PlatformAuthMode = "platform" | "provided-token" | "demo";

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  tenantId?: string;
}

const TOKEN_KEY = "iw.platform.token.v1";

export function getStoredToken(): string | null {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    return t && t.trim() ? t.trim() : null;
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token && token.trim()) localStorage.setItem(TOKEN_KEY, token.trim());
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — token simply won't persist */
  }
}

/** Whether platform OAuth is configured in this build. */
export function isPlatformOAuthConfigured(): boolean {
  return Boolean(import.meta.env.VITE_PLATFORM_OAUTH);
}

export function resolveMode(): PlatformAuthMode {
  if (getStoredToken()) return "provided-token";
  if (isPlatformOAuthConfigured()) return "platform";
  return "demo";
}

/**
 * Decode a JWT payload for DISPLAY ONLY. This performs no signature
 * verification — the gateway is the only authority on validity. We use it
 * purely to show "who am I presenting as" in the connection panel.
 */
export function decodeJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function userFromToken(token: string): PlatformUser | null {
  const claims = decodeJwtClaims(token);
  if (!claims) return null;
  const email =
    (claims.email as string) ||
    (claims.preferred_username as string) ||
    "";
  const name =
    (claims.name as string) ||
    (claims.given_name as string) ||
    email ||
    "Platform user";
  const id =
    (claims.sub as string) ||
    (claims.user_id as string) ||
    (claims.uid as string) ||
    "platform-user";
  const tenantId =
    (claims.tenant_id as string) ||
    (claims.tid as string) ||
    undefined;
  return { id, email, name, tenantId };
}

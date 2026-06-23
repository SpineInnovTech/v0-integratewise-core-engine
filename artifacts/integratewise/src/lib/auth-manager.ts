/**
 * AuthManager — OAuth 2.0 Token Lifecycle Manager
 *
 * Manages the full OAuth 2.0 flow via auth.integratewise.ai:
 * - Sign-in redirect with PKCE state
 * - Authorization code exchange for token pair
 * - Access token in-memory, refresh token in localStorage
 * - Proactive refresh (exp - 5min timer)
 * - Request coalescing (single refresh for multiple 401s)
 * - Auth state change callbacks
 * - Silent refresh on page load
 *
 * Requirements: R2 (Authentication via CF Gateway), R8 (Token Refresh and Session Continuity)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  tenant_id: string;
  role: string;
  name?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (seconds)
  user: AuthUser;
}

export type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED";

export type Unsubscribe = () => void;

export interface IAuthManager {
  // State
  getSession(): Promise<{ accessToken: string; user: AuthUser } | null>;
  onAuthStateChange(cb: (event: AuthEvent, session: AuthSession | null) => void): Unsubscribe;

  // Actions
  signIn(email?: string, password?: string): Promise<void>;
  signInWithCredentials(email: string, password: string): Promise<AuthSession>;
  signUp(email: string, password: string, name?: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  handleCallback(code: string, state: string): Promise<AuthSession>;
  /** Adopt a JWT issued by the gateway (e.g. social OAuth callback) and start a session. */
  adoptToken(token: string): AuthSession;

  // Internal
  refreshToken(): Promise<string>;
  getAccessToken(): Promise<string>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_URL || "https://gateway.dev.integratewise.ai";
const REFRESH_TOKEN_PREFIX = "iw_rt_";
const ACCESS_TOKEN_KEY = "iw_at";
const PROACTIVE_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random string for OAuth state parameter.
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Decode a JWT payload without external libraries.
 * Only decodes — does NOT verify signature (gateway does that).
 */
function decodeJwtPayload(token: string): Record<string, any> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const payload = parts[1];
  // Base64url → Base64
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const jsonStr = atob(base64);
  return JSON.parse(jsonStr);
}

/**
 * Extract AuthUser from JWT claims.
 */
function extractUserFromToken(token: string): AuthUser {
  const claims = decodeJwtPayload(token);
  return {
    id: claims.sub || claims.user_id || "",
    email: claims.email || "",
    tenant_id: claims.tenant_id || "",
    role: claims.role || "member",
    name: claims.name || claims.preferred_username || undefined,
  };
}

/**
 * Get the expiration timestamp (seconds) from a JWT.
 */
function getTokenExpiry(token: string): number {
  const claims = decodeJwtPayload(token);
  return claims.exp || 0;
}

/**
 * Get the localStorage key for a user's refresh token.
 */
function getRefreshTokenKey(userId: string): string {
  return `${REFRESH_TOKEN_PREFIX}${userId}`;
}

// ─── Local-mock (offline dev) ────────────────────────────────────────────────

const SPINE_PROVIDER = import.meta.env.VITE_SPINE_PROVIDER || "spine-db";
const IS_LOCAL_MOCK = SPINE_PROVIDER === "local-mock";

/** The tenant-zero (god-view) identity Customer Zero operates as offline. */
const LOCAL_MOCK_USER = {
  sub: "iw-customer-zero",
  email: "connect@integratewise.ai",
  tenant_id: "iw-customer-zero",
  role: "admin",
  name: "Customer Zero",
};

/** Base64url-encode a JSON object (no padding) for a decode-only JWT. */
function base64UrlEncode(obj: Record<string, any>): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Build an UNSIGNED, decode-only JWT for offline local-mock dev. The signature
 * segment is a placeholder — this token is never sent to or verified by a real
 * gateway (the spine + gateway clients are fully mocked in local-mock mode).
 */
function createMockJwt(claims: Record<string, any>): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode({ alg: "none", typ: "JWT" });
  const payload = base64UrlEncode({
    iat: nowSec,
    exp: nowSec + 60 * 60 * 24 * 365, // 1 year — refresh is disabled in local-mock
    ...claims,
  });
  return `${header}.${payload}.local-mock`;
}

/**
 * True if a token is one of our offline local-mock tokens (unsigned; the
 * signature segment is the literal "local-mock"). These must NEVER be trusted
 * by, or transmitted to, a real gateway.
 */
function isLocalMockToken(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts[2] === "local-mock";
}

// ─── AuthManager Implementation ─────────────────────────────────────────────

class AuthManagerImpl implements IAuthManager {
  // In-memory token state (volatile — cleared on page unload)
  private _accessToken: string | null = null;
  private _session: AuthSession | null = null;

  // Proactive refresh timer
  private _refreshTimer: ReturnType<typeof setTimeout> | null = null;

  // Request coalescing: single in-flight refresh promise
  private _refreshPromise: Promise<string> | null = null;

  // Auth state change listeners
  private _listeners: Set<(event: AuthEvent, session: AuthSession | null) => void> = new Set();

  // Initialization flag
  private _initialized = false;
  private _initPromise: Promise<void> | null = null;

  constructor() {
    // Offline local-mock boot mints a tenant-zero session with NO network;
    // every other provider attempts a silent refresh from a stored token.
    this._initPromise = IS_LOCAL_MOCK
      ? this._initLocalMockSession()
      : this._silentRefreshOnLoad();
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * 1.8 — Register a callback for auth state changes.
   */
  onAuthStateChange(cb: (event: AuthEvent, session: AuthSession | null) => void): Unsubscribe {
    this._listeners.add(cb);
    // If already authenticated, fire immediately
    if (this._session) {
      setTimeout(() => cb("SIGNED_IN", this._session), 0);
    }
    return () => {
      this._listeners.delete(cb);
    };
  }

  /**
   * 1.2 — Sign in with email + password via CF Gateway.
   * No OAuth redirect — direct API call.
   */
  async signIn(email?: string, password?: string): Promise<void> {
    if (!email || !password) {
      // Signal to UI: show login form (no redirect)
      this._emitEvent("SIGNED_OUT", null);
      return;
    }
    await this.signInWithCredentials(email, password);
  }

  /**
   * Sign in with credentials directly via gateway /api/v1/auth/login
   */
  async signInWithCredentials(email: string, password: string): Promise<AuthSession> {
    const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Login failed" }));
      throw new Error((err as any).error || `Login failed (${response.status})`);
    }

    const data = (await response.json()) as {
      token: string;
      user: { id: string; email: string; tenant_id: string; role: string; name?: string };
    };

    return this._setSession(data.token);
  }

  /**
   * Sign up with email + password via gateway /api/v1/auth/signup
   */
  async signUp(email: string, password: string, name?: string): Promise<AuthSession> {
    const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Signup failed" }));
      throw new Error((err as any).error || `Signup failed (${response.status})`);
    }

    const data = (await response.json()) as {
      token: string;
      user: { id: string; email: string; tenant_id: string; role: string; name?: string };
    };

    return this._setSession(data.token);
  }

  /**
   * Set session from a JWT token (shared by signIn and signUp)
   */
  private _setSession(token: string): AuthSession {
    const user = extractUserFromToken(token);
    const expiresAt = getTokenExpiry(token);

    const session: AuthSession = {
      accessToken: token,
      refreshToken: "", // Gateway doesn't issue refresh tokens yet
      expiresAt,
      user,
    };

    this._accessToken = token;
    this._session = session;
    this._initialized = true;

    // Store token for page reload persistence
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      /* ignore */
    }

    // Schedule proactive refresh
    this._scheduleProactiveRefresh(expiresAt);

    this._emitEvent("SIGNED_IN", session);
    return session;
  }

  /**
   * 1.3 — Handle OAuth callback (legacy compatibility — may still be used by MCP clients)
   */
  async handleCallback(code: string, state: string): Promise<AuthSession> {
    // Validate state matches what we stored (CSRF protection)
    const storedState = sessionStorage.getItem("iw_oauth_state");
    if (!storedState || storedState !== state) {
      throw new Error("OAuth state mismatch — possible CSRF attack. Please try signing in again.");
    }
    sessionStorage.removeItem("iw_oauth_state");

    // Exchange code for tokens
    const response = await fetch(`${AUTH_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: window.location.origin + "/auth/callback",
        client_id: "iw-web-app",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Token exchange failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const session = this._setSession(data.access_token);
    return session;
  }

  /**
   * Adopt a JWT issued by the gateway (social OAuth callback redirects with #token=...).
   * Sets the session synchronously and notifies listeners (SIGNED_IN).
   */
  adoptToken(token: string): AuthSession {
    return this._setSession(token);
  }

  /**
   * 1.4 — Returns a valid access token. Triggers refresh if expired or near-expiry.
   */
  async getAccessToken(): Promise<string> {
    // Wait for initialization if still in progress
    if (this._initPromise) {
      await this._initPromise;
    }

    if (this._accessToken && this._session) {
      const now = Math.floor(Date.now() / 1000);
      // If token is still valid (with buffer), return it
      if (this._session.expiresAt > now + 30) {
        return this._accessToken;
      }
    }

    // Token expired or missing — attempt refresh
    return this.refreshToken();
  }

  /**
   * 1.5 — Refresh the access token using the refresh token.
   * Implements request coalescing: if a refresh is already in-flight,
   * subsequent callers get the same promise.
   */
  async refreshToken(): Promise<string> {
    // Coalescing: return existing in-flight promise if one exists
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._refreshPromise = this._doRefresh();

    try {
      const token = await this._refreshPromise;
      return token;
    } finally {
      this._refreshPromise = null;
    }
  }

  /**
   * 1.7 — Sign out: clear token, clear storage, notify listeners.
   */
  async signOut(): Promise<void> {
    // Clear stored JWT
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      /* ignore */
    }

    this._clearSession();
    this._emitEvent("SIGNED_OUT", null);
  }

  /**
   * Get the current session (access token + user) or null if not authenticated.
   */
  async getSession(): Promise<{ accessToken: string; user: AuthUser } | null> {
    // Wait for initialization if still in progress
    if (this._initPromise) {
      await this._initPromise;
    }

    if (!this._accessToken || !this._session) {
      return null;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (this._session.expiresAt <= now) {
      try {
        await this.refreshToken();
      } catch {
        return null;
      }
    }

    if (!this._accessToken || !this._session) {
      return null;
    }

    return {
      accessToken: this._accessToken,
      user: this._session.user,
    };
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  /**
   * 1.9 — On page load, attempt to find a stored refresh token and silently refresh.
   */
  private async _silentRefreshOnLoad(): Promise<void> {
    try {
      // Restore session from stored JWT (gateway auth — no OAuth refresh tokens yet)
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!storedToken) {
        this._initialized = true;
        return;
      }

      // An offline local-mock token must never be trusted by — or sent to — a
      // real gateway. If one was persisted (e.g. flipping local-mock → gateway),
      // drop it and require a real login.
      if (isLocalMockToken(storedToken)) {
        try {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
        } catch {
          /* ignore */
        }
        this._initialized = true;
        return;
      }

      // Check if token is still valid (not expired)
      const expiresAt = getTokenExpiry(storedToken);
      const nowSec = Math.floor(Date.now() / 1000);
      if (expiresAt <= nowSec) {
        // Token expired — clear and require re-login
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        this._initialized = true;
        return;
      }

      // Token still valid — restore session
      this._setSession(storedToken);

      // Validate the restored token against the server in the background. A local
      // `exp` decode proves the token isn't expired — NOT that it's still accepted
      // (e.g. revoked/rotated server-side). Non-blocking: fast boot is preserved and
      // the session is cleared only if the gateway explicitly rejects the token.
      void this._validateSessionWithServer(storedToken);
    } catch {
      this._clearSession();
    } finally {
      this._initialized = true;
      this._initPromise = null;
    }
  }

  /**
   * Offline local-mock boot. Adopts a stored token if present and unexpired
   * (session continuity), otherwise mints a synthetic tenant-zero
   * (iw-customer-zero) session. Performs NO network calls — never hits /auth/me.
   */
  private async _initLocalMockSession(): Promise<void> {
    try {
      // Only adopt a persisted *mock* token (continuity across reloads). A real
      // token from a prior gateway session is ignored — minting a fresh mock
      // token below overwrites it so local-mock never runs under a real tenant.
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (storedToken && isLocalMockToken(storedToken)) {
        try {
          if (getTokenExpiry(storedToken) > Math.floor(Date.now() / 1000)) {
            this._setSession(storedToken);
            return;
          }
        } catch {
          /* malformed stored token — fall through and mint a fresh mock session */
        }
      }
      this._setSession(createMockJwt(LOCAL_MOCK_USER));
    } catch {
      this._clearSession();
    } finally {
      this._initialized = true;
      this._initPromise = null;
    }
  }

  /**
   * Validate the restored session token against the gateway (`GET /api/v1/auth/me`).
   * Runs in the background on load. Clears the session ONLY on an explicit auth
   * rejection (401/403); tolerates offline / 5xx so the app stays usable.
   */
  private async _validateSessionWithServer(token: string): Promise<void> {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        try {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
        } catch {
          /* ignore */
        }
        this._clearSession();
        this._emitEvent("SIGNED_OUT", null);
      }
      // 200 (valid) or network/5xx (transient) → keep the locally-restored session.
    } catch {
      // Network error — keep the locally-restored session (offline-friendly).
    }
  }

  /**
   * Perform token refresh. Gateway doesn't issue refresh tokens yet,
   * so this validates the current token via /api/v1/auth/me.
   * If invalid, the session is cleared and re-login is required.
   */
  private async _doRefresh(): Promise<string> {
    // Offline local-mock: never validate against a real gateway. The minted
    // session is long-lived — hand back the current token (mint one if missing).
    if (IS_LOCAL_MOCK) {
      const existing = this._accessToken || localStorage.getItem(ACCESS_TOKEN_KEY);
      if (existing) {
        if (!this._session) this._setSession(existing);
        this._emitEvent("TOKEN_REFRESHED", this._session);
        return existing;
      }
      return this._setSession(createMockJwt(LOCAL_MOCK_USER)).accessToken;
    }

    const token = this._accessToken || localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      throw new Error("No access token available");
    }

    // Validate token is still accepted by the gateway
    const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      // Token rejected — clear session, user must re-authenticate
      this._clearSession();
      this._emitEvent("SIGNED_OUT", null);
      throw new Error(`Token validation failed (${response.status})`);
    }

    // Token still valid — keep current session
    this._emitEvent("TOKEN_REFRESHED", this._session);
    return token;
  }

  /**
   * Schedule proactive token validation (exp - 5 minutes).
   */
  private _scheduleProactiveRefresh(expiresAt: number): void {
    // Offline local-mock: never schedule a network-bound token refresh.
    if (IS_LOCAL_MOCK) return;

    // Clear any existing timer
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }

    const now = Date.now();
    const expiresAtMs = expiresAt * 1000;
    const refreshAt = expiresAtMs - PROACTIVE_REFRESH_BUFFER_MS;
    const delay = refreshAt - now;

    if (delay <= 0) {
      this.refreshToken().catch(() => {});
      return;
    }

    this._refreshTimer = setTimeout(() => {
      this.refreshToken().catch(() => {});
    }, delay);
  }

  /**
   * Store refresh token in localStorage.
   */
  private _storeRefreshToken(userId: string, token: string): void {
    try {
      localStorage.setItem(getRefreshTokenKey(userId), token);
    } catch {
      // localStorage not available (incognito, storage full) — degrade gracefully
    }
  }

  /**
   * Retrieve stored refresh token. Searches by known user ID or scans prefix.
   */
  private _getStoredRefreshToken(): string | null {
    try {
      // If we have a session, use the user's specific key
      if (this._session?.user.id) {
        return localStorage.getItem(getRefreshTokenKey(this._session.user.id));
      }

      // On cold start, scan for any iw_rt_ key
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(REFRESH_TOKEN_PREFIX)) {
          return localStorage.getItem(key);
        }
      }
    } catch {
      // localStorage not available
    }
    return null;
  }

  /**
   * Clear all session state (memory + localStorage).
   */
  private _clearSession(): void {
    // Clear proactive refresh timer
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }

    // Clear in-memory state
    this._accessToken = null;

    // Remove refresh token from localStorage
    if (this._session?.user.id) {
      try {
        localStorage.removeItem(getRefreshTokenKey(this._session.user.id));
      } catch {
        // ignore
      }
    }

    this._session = null;
  }

  /**
   * Emit auth state change event to all registered listeners.
   */
  private _emitEvent(event: AuthEvent, session: AuthSession | null): void {
    for (const listener of this._listeners) {
      try {
        listener(event, session);
      } catch {
        // Don't let a bad listener break the auth flow
      }
    }
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────────

export const authManager = new AuthManagerImpl();
export type { IAuthManager as AuthManager };

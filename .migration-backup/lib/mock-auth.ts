// Mock authentication for development/demo purposes
// No login required - always accessible

export const MOCK_USER = {
  id: "demo-user-001",
  email: "demo@integratewise.online",
  user_metadata: {
    full_name: "Demo User",
    avatar_url: null,
  },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00.000Z",
}

export const MOCK_SESSION = {
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: MOCK_USER,
}

export const DEMO_CREDENTIALS = {
  email: "demo@integratewise.online",
  password: "demo123",
}

// Always return true - no auth required
export function isMockAuthEnabled() {
  return true
}

// Always return true - demo session always active
export function isDemoSession(cookieHeader: string | null): boolean {
  return true
}

// All routes allowed - no restrictions
export function isDemoRouteAllowed(pathname: string): { allowed: boolean; viewOnly: boolean } {
  return { allowed: true, viewOnly: false }
}

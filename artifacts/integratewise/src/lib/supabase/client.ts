// Temporary stub — no Supabase in the stack.
// Backend is Cloudflare Workers (integratewise-live).
// This exists only to silence migration artifacts in demo mode.
// Replace individual view calls with /api/... fetch calls as routes are built.

type MockUser = {
  id: string
  email: string
  user_metadata: { full_name: string; avatar_url: null }
  app_metadata: Record<string, unknown>
  aud: string
  created_at: string
}

type MockSession = {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: string
  user: MockUser
}

const MOCK_USER: MockUser = {
  id: "demo-user-001",
  email: "demo@integratewise.online",
  user_metadata: { full_name: "Demo User", avatar_url: null },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00.000Z",
}

const MOCK_SESSION: MockSession = {
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: MOCK_USER,
}

// A chainable query builder that returns empty data for any call chain.
// Supports arbitrary depth: .from().select().eq().order().limit().single() etc.
function makeQueryBuilder(singleMode = false): unknown {
  const terminal = singleMode
    ? { data: null, error: null }
    : { data: [], error: null, count: 0 }

  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") return undefined // not a Promise
      if (prop === "data") return terminal.data
      if (prop === "error") return terminal.error
      if (prop === "count") return 0
      // .single() and .maybeSingle() resolve immediately with null data
      if (prop === "single" || prop === "maybeSingle") {
        return () => ({ data: null, error: null })
      }
      // Any other method returns another chainable builder
      return (..._args: unknown[]) => makeQueryBuilder(prop === "single" || prop === "maybeSingle")
    },
  }
  return new Proxy({}, handler)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stubClient: any = {
  auth: {
    getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
    getSession: async () => ({ data: { session: MOCK_SESSION }, error: null }),
    signInWithPassword: async () => ({ data: { user: MOCK_USER, session: MOCK_SESSION }, error: null }),
    signUp: async () => ({ data: { user: MOCK_USER, session: MOCK_SESSION }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (_callback: unknown) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: MOCK_USER }, error: null }),
  },
  from: (_table: string) => makeQueryBuilder(),
  rpc: (_fn: string, _args?: unknown) => makeQueryBuilder(),
  storage: {
    from: (_bucket: string) => ({
      upload: async () => ({ data: null, error: null }),
      download: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
      remove: async () => ({ data: null, error: null }),
      list: async () => ({ data: [], error: null }),
    }),
  },
  channel: (_name: string) => ({
    on: () => ({ subscribe: () => {} }),
    subscribe: () => {},
  }),
  removeChannel: () => {},
}

export function createClient() {
  return stubClient
}

export function createBrowserClient() {
  return stubClient
}

export function createServerClient() {
  return stubClient
}

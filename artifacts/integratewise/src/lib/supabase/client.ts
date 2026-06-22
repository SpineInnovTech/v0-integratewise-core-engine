// Stub supabase client - app runs in demo/mock mode, no real Supabase needed

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
  },
  from: (_table: string) => ({
    select: (_cols: string) => ({
      eq: (_col: string, _val: unknown) => ({ data: [], error: null }),
      order: (_col: string) => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
      limit: (_n: number) => ({ data: [], error: null }),
    }),
    insert: (_data: unknown) => ({ data: null, error: null }),
    update: (_data: unknown) => ({
      eq: (_col: string, _val: unknown) => ({ data: null, error: null }),
    }),
    delete: () => ({
      eq: (_col: string, _val: unknown) => ({ data: null, error: null }),
    }),
  }),
}

export function createClient() {
  return stubClient
}

export function createBrowserClient() {
  return stubClient
}

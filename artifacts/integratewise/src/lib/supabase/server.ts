// Stub server client - app runs in demo/mock mode
export function createServerClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  }
}
export function createClient() {
  return createServerClient()
}

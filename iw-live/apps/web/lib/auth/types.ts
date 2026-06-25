/**
 * Auth Provider Abstraction Layer
 * Supports: Supabase Auth, Clerk Auth
 */

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  emailVerified?: boolean
  createdAt?: Date
}

export interface Session {
  user: User
  expiresAt: Date
  accessToken?: string
  refreshToken?: string
}

export interface AuthProvider {
  /**
   * Get current session (server-side)
   */
  getSession(): Promise<Session | null>

  /**
   * Get current user (server-side)
   */
  getCurrentUser(): Promise<User | null>

  /**
   * Sign up with email and password
   */
  signUp(email: string, password: string, name?: string): Promise<User>

  /**
   * Sign in with email and password
   */
  signIn(email: string, password: string): Promise<Session>

  /**
   * Sign out current user
   */
  signOut(): Promise<void>

  /**
   * Get user by ID
   */
  getUserById(userId: string): Promise<User | null>

  /**
   * Update user profile
   */
  updateUser(userId: string, updates: Partial<User>): Promise<User>

  /**
   * Delete user
   */
  deleteUser(userId: string): Promise<void>

  /**
   * Provider name identifier
   */
  provider: 'supabase' | 'clerk'
}

/**
 * Supabase Auth Provider Implementation
 */

import { createClient } from '@supabase/supabase-js'
import type { AuthProvider, User, Session } from '../types'
import { env } from '../env'

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const supabaseAuthProvider: AuthProvider = {
  provider: 'supabase',

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession()
    
    if (error || !data.session) return null

    return {
      user: {
        id: data.session.user.id,
        email: data.session.user.email || '',
        name: data.session.user.user_metadata?.name,
        avatar: data.session.user.user_metadata?.avatar_url,
        emailVerified: data.session.user.email_confirmed_at ? true : false,
        createdAt: new Date(data.session.user.created_at),
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date(data.session.expires_at ? data.session.expires_at * 1000 : 0),
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser()
    
    if (error || !data.user) return null

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name,
      avatar: data.user.user_metadata?.avatar_url,
      emailVerified: data.user.email_confirmed_at ? true : false,
      createdAt: new Date(data.user.created_at),
    }
  },

  async signUp(email: string, password: string, name?: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) throw error
    if (!data.user) throw new Error('Sign up failed')

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name,
      avatar: data.user.user_metadata?.avatar_url,
    }
  },

  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.session) throw new Error('Sign in failed')

    return {
      user: {
        id: data.session.user.id,
        email: data.session.user.email || '',
        name: data.session.user.user_metadata?.name,
        avatar: data.session.user.user_metadata?.avatar_url,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date(data.session.expires_at ? data.session.expires_at * 1000 : 0),
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('auth.users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      email: data.email,
      name: data.user_metadata?.name,
      avatar: data.user_metadata?.avatar_url,
      emailVerified: data.email_confirmed_at ? true : false,
      createdAt: new Date(data.created_at),
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const metadata: Record<string, any> = {}
    if (updates.name) metadata.name = updates.name
    if (updates.avatar) metadata.avatar_url = updates.avatar

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    })

    if (error) throw error
    if (!data.user) throw new Error('Update failed')

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name,
      avatar: data.user.user_metadata?.avatar_url,
    }
  },

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error
  },
}

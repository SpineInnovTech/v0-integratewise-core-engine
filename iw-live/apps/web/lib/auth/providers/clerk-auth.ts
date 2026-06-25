/**
 * Clerk Auth Provider Implementation
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import type { AuthProvider, User, Session } from '../types'

export const clerkAuthProvider: AuthProvider = {
  provider: 'clerk',

  async getSession(): Promise<Session | null> {
    const { userId, sessionId } = await auth()

    if (!userId) return null

    const user = await currentUser()
    if (!user) return null

    return {
      user: {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
        avatar: user.imageUrl,
        emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
        createdAt: user.createdAt,
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const { userId } = await auth()

    if (!userId) return null

    const user = await currentUser()
    if (!user) return null

    return {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
      avatar: user.imageUrl,
      emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
      createdAt: user.createdAt,
    }
  },

  async signUp(email: string, password: string, name?: string): Promise<User> {
    // Clerk sign up is typically handled client-side
    // This is a server-side helper for API-based sign ups
    const user = await clerkClient().users.createUser({
      emailAddress: [email],
      password,
      firstName: name?.split(' ')[0],
      lastName: name?.split(' ').slice(1).join(' '),
    })

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: `${user.firstName} ${user.lastName}`.trim(),
      avatar: user.imageUrl,
    }
  },

  async signIn(_email: string, _password: string): Promise<Session> {
    // Clerk sign in is handled client-side
    // This is a placeholder for server-side sign in
    throw new Error('Use Clerk client-side sign in instead')
  },

  async signOut(): Promise<void> {
    // Clerk sign out is typically handled client-side
    // Server-side sign out via API if needed
    await clerkClient().sessions.getSessionList()
  },

  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await clerkClient().users.getUser(userId)

      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: `${user.firstName} ${user.lastName}`.trim(),
        avatar: user.imageUrl,
        emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
        createdAt: user.createdAt,
      }
    } catch {
      return null
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = await clerkClient().users.updateUser(userId, {
      firstName: updates.name?.split(' ')[0],
      lastName: updates.name?.split(' ').slice(1).join(' '),
    })

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: `${user.firstName} ${user.lastName}`.trim(),
      avatar: user.imageUrl,
    }
  },

  async deleteUser(userId: string): Promise<void> {
    await clerkClient().users.deleteUser(userId)
  },
}

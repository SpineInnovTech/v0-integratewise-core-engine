import { auth, currentUser } from "@clerk/nextjs/server"

export interface Session {
  user: {
    id: string
    email: string
    name?: string
    avatar?: string
  }
}

/**
 * Get the current Clerk session
 * Returns null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return null
    }

    const user = await currentUser()

    if (!user) {
      return null
    }

    return {
      user: {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : undefined,
        avatar: user.imageUrl || undefined,
      },
    }
  } catch (error) {
    console.error("[clerk-auth] Error getting session:", error)
    return null
  }
}

/**
 * Get current user ID or throw if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  return userId
}

/**
 * Get current user with all details or throw if not authenticated
 */
export async function requireUser(): Promise<Session["user"]> {
  const session = await getSession()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  return session.user
}

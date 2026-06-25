import type React from "react"
import { getSession, isAdminUser } from "@/lib/clerk-auth"
import { AppShell } from "@/components/app-shell"
import { SidebarMailerLite } from "@/components/sidebar-mailerlite"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  const userEmail = session?.user?.email || "demo@integratewise.online"
  const userName = session?.user?.user_metadata?.full_name || "Demo User"
  const isAdmin = isAdminUser(userEmail)

  if (isAdmin) {
    return (
      <div className="flex h-screen bg-background">
        <SidebarMailerLite
          user={{
            name: userName,
            email: userEmail,
            initials: userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase(),
            isAdmin: true,
          }}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    )
  }

  // Regular users get standard AppShell
  return (
    <AppShell
      user={{
        name: userName,
        email: userEmail,
      }}
    >
      {children}
    </AppShell>
  )
}

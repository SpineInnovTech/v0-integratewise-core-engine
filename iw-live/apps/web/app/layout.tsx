import type React from "react"
import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider"
import { RBACProvider } from "@/lib/rbac/context"
import { DepartmentProvider } from "@/lib/department/context"
import "./globals.css"
import { Inter } from "next/font/google"

export const dynamic = "force-dynamic"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "IntegrateWise — One workspace. All your tools. AI-powered.",
  description:
    "Stop working in your tools. Start working on top of them. The AI-powered workspace that unifies all your business operations.",
  icons: {
    icon: [
      { url: "/logo-icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    shortcut: "/logo-icon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "IntegrateWise — One workspace. All your tools. AI-powered.",
    description: "Stop working in your tools. Start working on top of them.",
    type: "website",
    url: "https://app.integratewise.ai",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <body className="font-sans antialiased">
          <ThemeProvider defaultTheme="system" storageKey="integratewise-theme">
            <RBACProvider defaultRole="member">
              <DepartmentProvider defaultDepartment="personal">
                {children}
              </DepartmentProvider>
            </RBACProvider>
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  )
}

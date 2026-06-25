import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Inter } from "next/font/google"
import "../../app/globals.css"
import "../../styles/theme.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "IntegrateWise OS — One workspace. All your tools. AI-powered.",
  description:
    "Stop working in your tools. Start working on top of them. The AI-powered workspace that unifies all your business operations.",
  openGraph: {
    title: "IntegrateWise OS — One workspace. All your tools. AI-powered.",
    description: "Stop working in your tools. Start working on top of them.",
    type: "website",
    url: "https://os.integratewise.online",
  },
}

export default function OSLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body data-theme="os" className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

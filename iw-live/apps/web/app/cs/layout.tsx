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
  title: "IntegrateWise CS — Customer Success Intelligence & Automation",
  description:
    "AI-powered customer success platform. Automate workflows, gain insights, and deliver exceptional customer experiences.",
  openGraph: {
    title: "IntegrateWise CS — Customer Success Intelligence & Automation",
    description: "AI-powered customer success platform.",
    type: "website",
    url: "https://os.integratewise.online/cs",
  },
}

export default function CSLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body data-theme="cs" className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

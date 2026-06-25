"use client"

import type React from "react"

import Navbar from "@/components/navbar"
import { BusinessSidebar } from "@/components/sidebars/business-sidebar"

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <BusinessSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

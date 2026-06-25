"use client"

import type React from "react"

import Navbar from "@/components/navbar"
import { CSSidebar } from "@/components/sidebars/cs-sidebar"

export default function CSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <CSSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

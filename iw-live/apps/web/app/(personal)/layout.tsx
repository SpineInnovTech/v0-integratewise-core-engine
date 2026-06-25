"use client"

import type React from "react"

import Navbar from "@/components/navbar"
import { PersonalSidebar } from "@/components/sidebars/personal-sidebar"

export default function PersonalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <PersonalSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

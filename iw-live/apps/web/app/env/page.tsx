import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Environment | IntegrateWise OS",
  description: "Environment configuration and health status",
}

/**
 * Environment Preview Page
 *
 * Displays runtime configuration and health status.
 * Shows only public variables; server-only values are fetched via API.
 */
export default function EnvPage() {
  redirect("/settings")
}

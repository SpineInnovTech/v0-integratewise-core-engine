import { redirect } from "next/navigation"

export default function DataSourcesPage() {
  redirect("/settings?tab=integrations")
}

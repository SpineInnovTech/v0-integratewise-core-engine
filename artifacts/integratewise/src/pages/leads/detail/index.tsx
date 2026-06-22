import { AppShell } from "@/components/app-shell"
import { LeadDetailView } from "@/components/views/lead-detail-view"
import { useParams } from "wouter"

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <AppShell>
      <LeadDetailView leadId={id || ""} />
    </AppShell>
  )
}

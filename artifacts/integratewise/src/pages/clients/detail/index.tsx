import { AppShell } from "@/components/app-shell"
import { ClientDetailView } from "@/components/views/client-detail-view"
import { useParams } from "wouter"

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <AppShell>
      <ClientDetailView clientId={id || ""} />
    </AppShell>
  )
}

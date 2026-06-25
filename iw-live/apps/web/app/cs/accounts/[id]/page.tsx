import { AppShell } from "@/components/app-shell"
import { CSAccountDetailView } from "@/components/views/cs-account-detail-view"

export default function AccountDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <CSAccountDetailView accountId={params.id} />
    </AppShell>
  )
}

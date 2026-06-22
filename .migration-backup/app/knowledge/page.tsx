import { AppShell } from "@/components/app-shell"
import { KnowledgeView } from "@/components/views/knowledge-view"

export const metadata = {
  title: "Knowledge Hub | IntegrateWise OS",
  description: "Create and manage internal documentation and playbooks",
}

export default function KnowledgePage() {
  return (
    <AppShell>
      <KnowledgeView />
    </AppShell>
  )
}

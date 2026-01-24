import { AppShell } from "@/components/app-shell"
import { KnowledgeView } from "@/components/views/knowledge-view"

export default async function KnowledgeCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  return (
    <AppShell>
      <KnowledgeView category={category} />
    </AppShell>
  )
}

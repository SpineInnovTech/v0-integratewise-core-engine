import { AppShell } from "@/components/app-shell"
import { KnowledgeView } from "@/components/views/knowledge-view"
import { useParams } from "wouter"

export default function KnowledgeCategoryPage() {
  const { category } = useParams<{ category: string }>()
  return (
    <AppShell>
      <KnowledgeView category={category || ""} />
    </AppShell>
  )
}

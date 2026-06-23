/**
 * Knowledge Hub — Personal Domain View
 *
 * Delegates to the full KnowledgeHub component which has 5 functional tabs:
 * Sessions | Memories | Triage | Topics | Search
 * All wired to the Knowledge service backend via apiFetch.
 *
 * Previously: stub with 3 hardcoded items. Now: full functional view.
 */
import { KnowledgeHub } from "@/components/l1/views/knowledge-hub";

export function KnowledgeHubView() {
  return <KnowledgeHub />;
}

export default KnowledgeHubView;

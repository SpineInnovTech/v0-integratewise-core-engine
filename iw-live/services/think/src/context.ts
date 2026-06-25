export interface EvidenceRef {
  source_plane: "structured" | "unstructured" | "ai_chat";
  source_type: string;
  source_id: string;
  display_label: string;
  tool_name: string;
  trust_level: "model_inferred" | "medium" | "high";
  metadata: Record<string, any>;
}

export async function getRelevantAiMemories(
  knowledgeServiceUrl: string,
  tenantId: string,
  entityId?: string
): Promise<EvidenceRef[]> {
  const response = await fetch(`${knowledgeServiceUrl}/search_memories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      entity_id: entityId,
      top_k: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(`Knowledge service failed: ${response.statusText}`);
  }

  const { results } = (await response.json()) as { results: any[] };

  return results.map((m) => ({
    source_plane: "ai_chat",
    source_type: "ai_memory",
    source_id: m.memory_id,
    display_label: `${m.tool_source} memory (C): ${m.text.substring(0, 50)}...`,
    tool_name: `IQ Hub / ${m.tool_source}`,
    trust_level: m.scoring_source_trust_level as any,
    metadata: {
      session_id: m.session_id,
      memory_type: m.memory_type,
    },
  }));
}

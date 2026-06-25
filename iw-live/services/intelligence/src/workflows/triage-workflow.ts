import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";
import { IntelligenceEnv } from "../agents/types";
import { TriageAgent } from "../agents/specialized/triage";

type TriageParams = {
  taskId: string;
  payload: string;
  tenantId: string;
};

function mapClassificationToCategory(classification: any): string {
  if (!classification) return "General";
  const docType = (classification.doc_type || "").toLowerCase();
  const workflowType = (classification.workflow_type || "").toLowerCase();

  if (
    docType.includes("lead") ||
    workflowType.includes("sales") ||
    workflowType.includes("marketing")
  ) {
    return "Sales & Marketing";
  }
  if (docType.includes("document") || docType.includes("policy") || docType.includes("wiki")) {
    return "Operations & Wiki";
  }
  if (
    docType.includes("code") ||
    docType.includes("api") ||
    workflowType.includes("engineering") ||
    workflowType.includes("development")
  ) {
    return "Engineering";
  }

  return classification.doc_type || classification.workflow_type || "General";
}

export class TriageWorkflow extends WorkflowEntrypoint<IntelligenceEnv, TriageParams> {
  async run(event: WorkflowEvent<TriageParams>, step: WorkflowStep) {
    const { taskId, payload, tenantId } = event.payload;

    // Step 1: Initialize the Cognitive Triage Agent
    const triageAgent = new TriageAgent(this.env);

    // Step 2: Execute Cognitive Evaluation durably
    const evaluationResult: any = await step.do("execute-triage", async () => {
      const res = await triageAgent.execute(
        {
          taskId,
          objective: payload,
          tenantId,
          userId: "system",
          priority: "high",
          context: {
            tenantId,
            correlationId: taskId,
          },
        },
        step
      );
      return res as any; // Cast to bypass Serializable strictness
    });

    // Step 3: Handle Routing based on Agent's Governance Decision
    if (evaluationResult.output.status === "pending_approval") {
      // Route to Human-In-The-Loop DLQ
      await step.do("route-to-human-approval", async () => {
        if (this.env.OPS_DLQ_QUEUE) {
          await this.env.OPS_DLQ_QUEUE.send({
            type: "triage_approval_required",
            taskId,
            tenantId,
            payload,
            evaluation: evaluationResult.output.evaluation,
            reasoning: evaluationResult.reasoning,
          });
        }
      });
    } else if (evaluationResult.output.status === "approved") {
      // Auto-approved by the Agent. Route straight to Spine write queue
      await step.do("route-to-spine-write", async () => {
        if (this.env.PIPELINE_QUEUE) {
          await this.env.PIPELINE_QUEUE.send({
            type: "triage_approved_write",
            taskId,
            tenantId,
            payload,
            linked_entities: evaluationResult.output.evaluation.linking,
          });
        }
      });

      // Promotion: Governed atomic write — R2 (content) + Vectorize (index) + Supabase (metadata) + D1 (mirror)
      // DOC-09 Section 3: content lives in R2. Supabase holds governance metadata only.
      await step.do("promote-to-org-memory", async () => {
        const evaluation = evaluationResult.output.evaluation;
        const category = mapClassificationToCategory(evaluation.classification);
        const id = `om:triage:${taskId}`;
        const now = new Date().toISOString();
        const lineageId = taskId;

        // 1. R2: Store raw content (cold, source of truth)
        if (this.env.FILES) {
          try {
            const r2Key = `memory/${tenantId}/${category}/${id}.md`;
            await this.env.FILES.put(r2Key, payload, {
              customMetadata: {
                tenant_id: tenantId,
                category,
                governance_state: "approved",
                created_at: now,
              },
            });
          } catch (err: any) {
            console.warn("[TriageWorkflow] R2 write failed (non-blocking):", err.message);
          }
        }

        // 2. Supabase: metadata only (NOT content — content is in R2)
        const metadataRecord = {
          id,
          tenant_id: tenantId,
          topic: evaluation.classification.intent || "triage-approved",
          category,
          governance_state: "approved",
          confidence: evaluationResult.confidence || 0.8,
          source_session_id: taskId,
          lineage_id: lineageId,
          entity_refs: JSON.stringify(evaluation.linking?.entity_refs || []),
          metadata: JSON.stringify({
            source: "triage_workflow",
            classification: evaluation.classification,
            linking: evaluation.linking,
            governance: evaluation.governance,
            r2_key: `memory/${tenantId}/${category}/${id}.md`,
            content_length: payload.length,
          }),
          created_at: now,
          updated_at: now,
        };

        if (this.env.PIPELINE) {
          const res = await this.env.PIPELINE.fetch(
            new Request("http://pipeline/v1/memory/write", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                table: "org_memory",
                operation: "upsert",
                data: metadataRecord,
              }),
            })
          );
          if (!res.ok) {
            console.warn(
              "[TriageWorkflow] Pipeline org_memory metadata write failed:",
              await res.text()
            );
          }
        } else if (this.env.D1) {
          // Fallback: D1 metadata mirror directly
          await this.env.D1.prepare(
            `INSERT INTO org_memory (id, tenant_id, topic, category, governance_state, confidence, source_session_id, metadata, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               confidence = excluded.confidence,
               governance_state = 'approved',
               updated_at = excluded.updated_at`
          )
            .bind(
              id,
              tenantId,
              metadataRecord.topic,
              category,
              metadataRecord.confidence,
              taskId,
              metadataRecord.metadata,
              now,
              now
            )
            .run();
        }
      });

      // 3. Vectorize (AI Search): chunk + embed + index with full metadata per DOC-09 Section 5
      await step.do("index-to-ai-search", async () => {
        const evaluation = evaluationResult.output.evaluation;
        const category = mapClassificationToCategory(evaluation.classification);
        const id = `om:triage:${taskId}`;
        const entityRefs = evaluation.linking?.entity_refs || [];

        if (this.env.AI_SEARCH) {
          try {
            const aiSearch = this.env.AI_SEARCH.get("integratewise-knowledge");
            if (aiSearch) {
              // DOC-09 Section 5.2: full metadata per vector
              await aiSearch.items.upload(id, payload, {
                tenant_id: tenantId,
                memory_id: id,
                category,
                entity_refs: entityRefs,
                governance_state: "approved",
                confidence: evaluationResult.confidence || 0.8,
                lineage_id: taskId,
                created_at: new Date().toISOString(),
                chunk_index: 0,
                chunk_total: 1, // single chunk for short entries; chunking logic for long entries TBD
              });
              console.log(`[TriageWorkflow] Indexed ${id} to AI Search (Vectorize)`);
            }
          } catch (err: any) {
            console.warn("[TriageWorkflow] AI Search indexing failed:", err.message);
          }
        }
      });
    }

    return {
      success: true,
      status: evaluationResult.output.status,
      governance: evaluationResult.output.evaluation.governance,
    };
  }
}

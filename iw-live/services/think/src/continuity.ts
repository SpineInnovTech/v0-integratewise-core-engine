import { D1Database, Fetcher } from "@cloudflare/workers-types";
import { ProposedAction } from "./actions";

export interface ContinuityWriteOptions {
  sessionId: string;
  tenantId: string;
  agentType: string;
  result: any;
  correlationId: string;
}

export class ContinuityLedger {
  constructor(
    private db: D1Database,
    private govern?: Fetcher
  ) {}

  /**
   * Phase 3 — Result Capture: Writes output to session ledger.
   * If the agent proposed actions, pushes them to the Triage queue (Govern).
   */
  async captureAgentResult(opts: ContinuityWriteOptions): Promise<void> {
    const { sessionId, tenantId, agentType, result, correlationId } = opts;
    const now = new Date().toISOString();

    // 1. Session Write (Continuity Ledger + Evolutionary Memory)
    // We write to conversational_memory to ensure the Twin remembers this agent's action.
    try {
      const memId = `mem_${crypto.randomUUID()}`;
      await this.db
        .prepare(
          `INSERT INTO conversational_memory (id, tenant_id, session_id, role, content, context_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          memId,
          tenantId,
          sessionId,
          "assistant", // The agent acted on behalf of the Twin assistant
          JSON.stringify({
            agent: agentType,
            output: result.output || result,
            confidence: result.confidence,
          }),
          `delegation_result:${agentType}`,
          now
        )
        .run();

      // Trigger Evolutionary Memory compilation (if running in an environment with AI_SEARCH and fetch capability)
      if (typeof globalThis.fetch === "function") {
        // Send a non-blocking background fetch to the /v1/memory/evolution API in the intelligence worker
        fetch("http://internal/v1/memory/evolution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "agent_log",
            topicKey: `session_${sessionId}`,
            topicTitle: `Session Context: ${sessionId}`,
            tenantId: tenantId,
            eventTitle: `Agent Execution: ${agentType}`,
            content:
              typeof result === "string"
                ? result
                : JSON.stringify(result.output || result, null, 2),
            sessionSource: sessionId,
          }),
        }).catch((e) =>
          console.warn(`[ContinuityLedger] Failed to push evolutionary memory:`, e.message)
        );
      }
    } catch (err: any) {
      console.error(`Continuity write failed for session ${sessionId}:`, err.message);
      // We do not throw here, as we want to attempt the govern push even if ledger fails.
    }

    // 2. Triage Hook (If Actions Proposed)
    if (result.actions && Array.isArray(result.actions) && result.actions.length > 0) {
      if (!this.govern) {
        console.warn(
          `[${correlationId}] Triage failed: No Govern fetcher bound for agent ${agentType}`
        );
        return;
      }

      for (const action of result.actions as ProposedAction[]) {
        try {
          const triagePayload = {
            tenant_id: tenantId,
            session_id: sessionId,
            proposed_action: action,
            source: `agent_garden:${agentType}`,
            correlation_id: correlationId,
          };

          await this.govern.fetch("http://internal/v1/triage/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(triagePayload),
          });
        } catch (err: any) {
          console.error(`[${correlationId}] Failed to push action to Triage:`, err.message);
        }
      }
    }
  }
}

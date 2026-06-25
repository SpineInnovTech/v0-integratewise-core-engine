import type { Env, Proposal } from "./types";

// MCP tool invocation envelope
function mcpInvoke(tenantId: string, toolName: string, args: Record<string, unknown>) {
  return {
    request_id: `twin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor: {
      tenant_id: tenantId,
      user_id: "twin-orchestrator",
      roles: ["Admin"] as const,
    },
    tool: {
      name: toolName,
      arguments: args,
    },
  };
}

export async function dispatchApproved(proposals: Proposal[], env: Env): Promise<string[]> {
  const dispatched: string[] = [];

  for (const proposal of proposals) {
    if (proposal.status === "approved" && !proposal.action.requiresApproval) {
      // Direct dispatch to act queue
      await env.ACT_QUEUE.send({
        proposal_id: proposal.id,
        type: proposal.action.type,
        target: proposal.action.target,
        reasoning: proposal.action.reasoning,
      });
      dispatched.push(proposal.id);
    }
  }

  return dispatched;
}

export async function monitorOutcomes(dispatchedIds: string[], env: Env): Promise<void> {
  // Check act queue / MCP for completion status
  for (const id of dispatchedIds) {
    try {
      const status = await env.MCP_CONNECTOR.fetch(
        new Request("http://internal/invoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": "iw-customer-zero",
            "cf-worker": "twin-orchestrator",
          },
          body: JSON.stringify(
            mcpInvoke("iw-customer-zero", "proposal.status", {
              tenant_id: "iw-customer-zero",
              proposal_id: id,
            })
          ),
        })
      );
      const result = await status.json();

      if (result.status === "completed") {
        // Propose memory update (does NOT write directly)
        await env.PROPOSAL_QUEUE.send({
          type: "memory_update",
          source: "twin_outcome",
          data: {
            proposal_id: id,
            outcome: result.outcome,
            timestamp: new Date().toISOString(),
          },
        });
      } else if (result.status === "failed") {
        // Escalate
        await env.PROPOSAL_QUEUE.send({
          type: "escalation",
          source: "twin_monitor",
          data: {
            proposal_id: id,
            error: result.error,
            requires_founder_attention: true,
          },
        });
      }
    } catch (e) {
      console.error(`Failed to monitor proposal ${id}:`, e);
    }
  }
}

import type { Env, Reasoning, Proposal, ProposedAction } from "./types";

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

export async function generateProposals(reasoning: Reasoning, env: Env): Promise<Proposal[]> {
  const proposals: Proposal[] = [];

  for (const action of reasoning.suggestedActions) {
    const proposal = await createProposal(action, env);
    proposals.push(proposal);
  }

  return proposals;
}

async function createProposal(action: ProposedAction, env: Env): Promise<Proposal> {
  const proposal: Proposal = {
    id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // Submit to governance via MCP /invoke
  try {
    await env.MCP_CONNECTOR.fetch(
      new Request("http://internal/invoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "iw-customer-zero",
          "cf-worker": "twin-orchestrator",
        },
        body: JSON.stringify(
          mcpInvoke("iw-customer-zero", "proposal.create", {
            tenant_id: "iw-customer-zero",
            proposal_id: proposal.id,
            type: action.type,
            target: action.target,
            reasoning: action.reasoning,
            impact: action.impact,
            risk: action.risk,
            requires_approval: action.requiresApproval,
            suggested_approver: action.suggestedApprover,
          })
        ),
      })
    );
  } catch (e) {
    console.error("Failed to submit proposal to MCP:", e);
  }

  // Queue for async governance processing
  if (action.requiresApproval) {
    await env.PROPOSAL_QUEUE.send({
      proposal_id: proposal.id,
      action: action.type,
      target: action.target,
      urgency: action.suggestedApprover === "founder" ? "high" : "normal",
    });
  } else {
    // Auto-approved: route directly to act queue
    proposal.status = "approved";
    proposal.approvedBy = "twin-auto";
    proposal.approvedAt = new Date().toISOString();

    await env.ACT_QUEUE.send({
      proposal_id: proposal.id,
      action: action.type,
      target: action.target,
      params: {},
    });
  }

  return proposal;
}

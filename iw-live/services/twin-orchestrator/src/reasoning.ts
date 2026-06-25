import type { Env, TwinContext, Reasoning } from "./types";

export async function reasonAboutContext(context: TwinContext, env: Env): Promise<Reasoning> {
  // Twin does NOT run inference. It delegates to Intelligence worker.
  const systemPrompt = `You are the Twin Cognitive Orchestrator.

You observe system state and reason about what should happen next.
You do NOT execute actions. You reason and propose.

Current context:
- Time: ${context.timestamp}
- Pending signals: ${context.signals.length}
- Pending proposals: ${context.proposals.length}
- Time triggers: ${JSON.stringify(context.timeTriggers)}
- Spine status: ${JSON.stringify(context.spineChanges)}

Respond with JSON:
{
  "observations": ["string"],
  "risks": ["string"],
  "suggestedActions": [
    {
      "type": "memory_update|signal_review|objective_check|governance_action|act_dispatch",
      "target": "what this action targets",
      "reasoning": "why this matters",
      "impact": "expected outcome",
      "risk": "what could go wrong",
      "requiresApproval": true|false,
      "suggestedApprover": "founder|governance_bot|auto"
    }
  ],
  "priority": "critical|high|normal|low"
}`;

  // Use /v1/test/rag which has Workers AI fallback
  const response = await env.INTELLIGENCE.fetch(
    new Request("http://internal/v1/test/rag", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "iw-customer-zero",
        "cf-worker": "twin-orchestrator",
      },
      body: JSON.stringify({
        question: `Analyze this system state and suggest next actions:\n${JSON.stringify(context, null, 2)}\n\nRespond with JSON matching this schema:\n${systemPrompt}`,
        tier: "balanced",
      }),
    })
  );

  if (!response.ok) {
    // Intelligence worker failed. Return safe default reasoning.
    return {
      observations: ["Intelligence worker unavailable"],
      risks: ["Cannot reason about current state"],
      suggestedActions: [],
      priority: "normal",
    };
  }

  const result = await response.json();

  // Parse reasoning from AI response
  try {
    const content =
      result.data?.response || result.data?.content || result.content || result.response || "{}";
    const parsed = JSON.parse(content);
    return {
      observations: parsed.observations || [],
      risks: parsed.risks || [],
      suggestedActions: (parsed.suggestedActions || []).map((a: any, i: number) => ({
        id: `action-${Date.now()}-${i}`,
        type: a.type || "governance_action",
        target: a.target || "unknown",
        reasoning: a.reasoning || "",
        impact: a.impact || "",
        risk: a.risk || "",
        requiresApproval: a.requiresApproval !== false,
        suggestedApprover: a.suggestedApprover || "founder",
      })),
      priority: parsed.priority || "normal",
    };
  } catch (e) {
    return {
      observations: ["Failed to parse reasoning"],
      risks: ["AI response malformed"],
      suggestedActions: [],
      priority: "low",
    };
  }
}

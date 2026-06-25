import type { Env, SessionLogParams } from "../types";

export async function emitTriageInput(
  env: Env,
  tenantId: string,
  params: SessionLogParams & { worker_chain?: string[] },
  sync = false
): Promise<{ status: string; event_id?: string; session_id?: string }> {
  if (!env.CONTINUITY) {
    throw new Error("CONTINUITY service binding is not configured");
  }

  // Map the custom kinds from TwinAgent to the types accepted by the live continuity service
  const typeMap: Record<string, "cognition.event" | "decision.event" | "system.event"> = {
    ai_chat: "cognition.event",
    twin_session: "cognition.event",
    twin_reflection: "cognition.event",
    twin_learning: "cognition.event",
    worker_handoff: "system.event",
    ingest: "system.event",
    manual: "cognition.event",
  };

  const eventType = typeMap[params.kind || "ai_chat"] || "cognition.event";

  try {
    const response = await env.CONTINUITY.fetch("http://internal/v1/continuity/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        session_id: params.session_id,
        type: eventType,
        user_id: params.agent_id || "twin-agent",
        content: {
          log_content: params.content,
          kind: params.kind || "ai_chat",
          worker_chain: params.worker_chain || ["iw-agent-runtime", "twin-agent"],
        },
        source: "iw-agent-runtime",
        metadata: {
          sync_req: sync,
          environment: env.ENVIRONMENT,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Continuity event write failed with status ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      success: boolean;
      data?: { event_id: string; session_id: string };
    };

    return {
      status: data.success ? "success" : "failed",
      event_id: data.data?.event_id,
      session_id: data.data?.session_id,
    };
  } catch (error: any) {
    console.error("[Memory Pipeline] Failed to emit triage/continuity event:", error.message);
    throw new Error(`CONTINUITY_LOG_ERROR: ${error.message}`);
  }
}

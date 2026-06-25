/**
 * Consolidated Intelligence Worker (v3.6 Architecture)
 * Merges: think + act + govern + agents + cognitive-brain
 *
 * Handles all intelligence-layer responsibilities:
 * - Signal analysis and situation detection (think)
 * - Action execution with governance enforcement (act)
 * - Policy engine and approval workflows (govern)
 * - Agent colony orchestration (agents)
 * - Flow C context-to-truth, brainstorm, cognitive routes (cognitive-brain)
 *
 * Queue consumers: intelligence.events, intelligence.act, ops.dlq
 */
import thinkWorker from "../../think/src/index";
import cognitiveBrain from "../../think/src/cognitive-brain";
import actApp from "../../act/src/index";
import governApp from "../../govern/src/index";
import agentsApp from "./agents/index";
import { BulkCleanupSwarmWorkflow } from "./agents/bulk-swarm";
import { TriageWorkflow } from "./workflows/triage-workflow";
import { createSignalAnalyzer, SignalAnalyzeRequest } from "@integratewise/types";
import { routeActionLoop } from "./action-loop";

// Export Durable Object for Cloudflare registration
export { HandoffTimeoutDO } from "./handoff/timeout-do";

// Re-export Swarm and Triage workflows so Wrangler can bind to them
export { BulkCleanupSwarmWorkflow, TriageWorkflow };

type SignalQueueMessage = {
  signal_id?: string;
  spine_id?: string;
  entity_id?: string;
  entity_type?: string;
  workspace_id?: string;
  hydration_bucket?: string;
  priority?: string;
  context?: {
    signals?: unknown[];
    activities?: unknown[];
  };
  payload?: {
    requires_approval?: boolean;
    auto_execute?: boolean;
    ai_analysis?: {
      recommended_action?: string;
      action_proposal_id?: string;
      target_tool?: string;
      confidence?: number;
      reasoning?: string;
      severity?: string;
      category?: string;
      key_indicators?: unknown[];
      requires_approval?: boolean;
      auto_execute?: boolean;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

export interface Env {
  PIPELINE_QUEUE: Queue;
  OPS_DLQ_QUEUE: Queue;
  CONNECTOR: Fetcher;
  WORKFLOW: Fetcher;
  KNOWLEDGE: Fetcher;
  GOVERN?: Fetcher; // Self-reference for Think → Govern routing
  PIPELINE?: Fetcher; // Act service: re-ingestion to pipeline (KT Note §11)
  D1: D1Database;
  FILES?: R2Bucket; // R2 object storage — memory content (DOC-09 Section 3)
  AGENT_COLONY: Workflow;
  TRIAGE_WORKFLOW: Workflow;
  AI: Ai; // Cloudflare Workers AI binding (used by ai-router)
  AI_SEARCH?: any; // Cloudflare AI Search binding (optional — RAG/semantic sink degrades gracefully when absent; all call sites are guarded)
  AI_GATEWAY_ID?: string; // Cloudflare AI Gateway id (OpenRouter proxy)
  MCP_API_KEY?: string; // MCP server bearer key (used by Twin orchestrator Coda/MCP calls)
  OPENROUTER_API_KEY: string; // OpenRouter API key for Twin reasoning
  ENABLE_SIGNALS?: string;
  SERVICE_SECRET?: string;
  /** Spine → Memory promotion queue (for governed Outcome feedback, Phase 12). */
  MEMORY_PROMOTE?: Queue;
}

function truthy(value: unknown, fallback = true): boolean {
  if (value === undefined || value === null) return fallback;
  return String(value).toLowerCase() === "true";
}

function logSignalEvent(event: string, details: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      service: "intelligence",
      event,
      ...details,
    })
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Governed Action Loop: Insight → Proposal → Decision → Execution → Outcome.
    if (url.pathname.startsWith("/api/v1/intelligence/action-loop")) {
      const res = await routeActionLoop(request, env);
      if (res) return res;
    }

    // Health check for consolidated worker
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "intelligence",
          components: ["think", "act", "govern", "agents", "ai-router"],
          ai: {
            workers_ai: "available",
            openrouter: "configured",
            gateway: env.AI_GATEWAY_ID || "not-configured",
          },
          ts: Date.now(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // TEST: Manual morning brief trigger
    if (url.pathname === "/v1/test/morning-brief" && request.method === "POST") {
      try {
        await handleMorningBriefTrigger(env);
        return new Response(
          JSON.stringify({ success: true, message: "Morning brief generated (check logs)" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // TEST: AI Search RAG query
    if (url.pathname === "/v1/test/rag" && request.method === "POST") {
      try {
        const { routeAI } = await import("./lib/ai-router");
        const body = (await request.json()) as { question: string; tier?: string };

        const response = await routeAI(
          {
            prompt: body.question,
            systemPrompt:
              "You are an expert on IntegrateWise. Answer using the provided context from the knowledge base.",
            useRAG: true,
            tier: (body.tier as any) || "fast",
            maxTokens: 500,
          },
          env as any
        );

        return new Response(JSON.stringify({ success: true, data: response }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // OpenAI-compatible chat completions — the canonical reasoning entrypoint.
    // Called internally by the Twin (gatewayChat → INTELLIGENCE.fetch) and by
    // ai-router. Returns native OpenAI shape: { choices: [{ message }], model }.
    // Without this route the Twin silently degraded to the Workers AI fallback
    // model on every turn (ignoring DEFAULT_CHAT_MODEL).
    if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          model?: string;
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
          max_tokens?: number;
        };

        if (!env.OPENROUTER_API_KEY) {
          return new Response(
            JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }

        // Normalize model id: callers pass "openrouter/openai/gpt-5-mini";
        // OpenRouter expects the provider-qualified id without the leading "openrouter/".
        const requestedModel = body.model || "openai/gpt-5-mini";
        const orModel = requestedModel.replace(/^openrouter\//, "");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://integratewise.ai",
            "X-Title": "IntegrateWise Twin",
          },
          body: JSON.stringify({
            model: orModel,
            messages: body.messages,
            temperature: body.temperature ?? 0.7,
            max_tokens: body.max_tokens ?? 1500,
          }),
        });

        if (!response.ok) {
          const detail = await response.text();
          return new Response(
            JSON.stringify({ error: `OpenRouter error ${response.status}`, detail }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }

        // OpenRouter already returns the OpenAI chat/completions shape — pass through.
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // OpenRouter Agent endpoint for Twin orchestration
    if (url.pathname === "/v1/ai/agent" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          model?: string;
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
          max_tokens?: number;
          transforms?: string[];
          route?: string;
        };

        // Use OpenRouter agent routing (ecosystem agent)
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://integratewise.ai",
            "X-Title": "IntegrateWise Twin Orchestrator",
          },
          body: JSON.stringify({
            model: body.model || "openai/gpt-oss-120b:free",
            messages: body.messages,
            temperature: body.temperature || 0.7,
            max_tokens: body.max_tokens || 1000,
            transforms: body.transforms || ["middleware"],
            route: body.route || "ecosystem", // Use ecosystem agent
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter agent failed: ${response.status}`);
        }

        const data = (await response.json()) as any;
        const content = data.choices?.[0]?.message?.content || "";

        return new Response(
          JSON.stringify({
            success: true,
            content,
            model: data.model,
            provider: "openrouter-agent",
            usage: data.usage,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Evolutionary Memory ingestion route
    if (url.pathname === "/v1/memory/evolution" && request.method === "POST") {
      const { uploadEvolutionaryMemory } = await import("./memory/evolutionary-memory");
      try {
        const body = await request.json();
        await uploadEvolutionaryMemory(env, body as any);
        return new Response(
          JSON.stringify({ success: true, message: "Evolutionary memory uploaded" }),
          {
            status: 202,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // Kanban Snapshot Trigger
    if (url.pathname === "/v1/memory/kanban-snapshot" && request.method === "POST") {
      try {
        const tenantId = request.headers.get("x-tenant-id");
        if (!tenantId) throw new Error("x-tenant-id required");

        // 1. Fetch all active tasks
        const tasksResult = await env.D1.prepare(
          "SELECT * FROM task_data WHERE status != 'completed'"
        ).all();

        const tasks = tasksResult.results.map((row: any) => {
          try {
            return JSON.parse(row.data);
          } catch {
            return { name: row.name, id: row.id, status: row.status };
          }
        });

        // 2. Format into Kanban markdown
        const grouped: Record<string, any[]> = { todo: [], in_progress: [], blocked: [] };
        tasks.forEach((t) => {
          if (t.status === "blocked") grouped.blocked.push(t);
          else if (t.status === "active" || t.status === "in_progress") grouped.in_progress.push(t);
          else grouped.todo.push(t);
        });

        let md = `## Kanban Snapshot\\n\\n`;
        md +=
          `### Blocked\\n` +
          grouped.blocked.map((t) => `- [ ] ${t.name} (ID: ${t.id})`).join("\\n") +
          `\\n\\n`;
        md +=
          `### In Progress\\n` +
          grouped.in_progress.map((t) => `- [/] ${t.name} (ID: ${t.id})`).join("\\n") +
          `\\n\\n`;
        md +=
          `### To Do\\n` +
          grouped.todo.map((t) => `- [ ] ${t.name} (ID: ${t.id})`).join("\\n") +
          `\\n`;

        // 3. Upload to Evolutionary Memory
        const { uploadEvolutionaryMemory } = await import("./memory/evolutionary-memory");
        await uploadEvolutionaryMemory(env, {
          type: "kanban_snapshot",
          topicKey: `kanban_snapshot`,
          topicTitle: `Kanban State`,
          tenantId: tenantId,
          eventTitle: `Snapshot Taken`,
          content: md,
          sessionSource: "system_cron",
        });

        return new Response(
          JSON.stringify({ success: true, message: "Kanban snapshot compiled" }),
          {
            status: 202,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // Route to sub-service based on URL path
    // Act routes: /act/*
    if (url.pathname === "/act" || url.pathname.startsWith("/act/")) {
      return actApp.fetch(request, env, ctx);
    }

    // Govern routes: /policies/*, /approve/*, /audit/*, /govern/*, /v1/proposals/*
    if (
      url.pathname === "/policies" ||
      url.pathname.startsWith("/policies/") ||
      url.pathname === "/approve" ||
      url.pathname.startsWith("/approve/") ||
      url.pathname === "/audit" ||
      url.pathname.startsWith("/audit/") ||
      url.pathname === "/govern" ||
      url.pathname.startsWith("/govern/") ||
      url.pathname === "/v1/proposals" ||
      url.pathname.startsWith("/v1/proposals/")
    ) {
      return governApp.fetch(request, env, ctx);
    }

    // Memory routes: /v1/memory/* — edge-fast reads from D1 (personal, conversational, org)
    if (url.pathname === "/v1/memory" || url.pathname.startsWith("/v1/memory/")) {
      return handleMemory(request, env);
    }

    // Ops routes: /v1/ops/* — edge-fast reads/writes for sync status and system metrics
    if (url.pathname === "/v1/ops" || url.pathname.startsWith("/v1/ops/")) {
      return handleOps(request, env);
    }

    // Swarm routes: /v1/swarm/* — Bulk Data Cleanup
    if (url.pathname === "/v1/swarm" || url.pathname.startsWith("/v1/swarm/")) {
      return handleSwarm(request, env);
    }

    // Triage routes: /v1/triage/* — Autonomous Triage Workflow
    if (url.pathname === "/v1/triage" || url.pathname.startsWith("/v1/triage/")) {
      return handleTriage(request, env);
    }

    // Knowledge routes: /v1/knowledge/* — edge-fast reads from D1 org_memory
    if (url.pathname === "/v1/knowledge" || url.pathname.startsWith("/v1/knowledge/")) {
      return handleKnowledge(request, env);
    }

    // Agent routes: /colony/*, /agents/*
    if (
      url.pathname === "/colony" ||
      url.pathname.startsWith("/colony/") ||
      url.pathname === "/agents" ||
      url.pathname.startsWith("/agents/")
    ) {
      return agentsApp.fetch(request, env, ctx);
    }

    // Cognitive routes: Flow C context-to-truth, brainstorm, decisions, trust, simulation, drift
    if (
      url.pathname.startsWith("/v1/cognitive") ||
      url.pathname === "/v1/brainstorm" ||
      url.pathname.startsWith("/v1/decisions") ||
      url.pathname.startsWith("/v1/trust") ||
      url.pathname.startsWith("/v1/simulation") ||
      url.pathname.startsWith("/v1/drift") ||
      url.pathname.startsWith("/v1/twin") ||
      url.pathname === "/v1/insights" ||
      url.pathname.startsWith("/v1/insights/")
    ) {
      const cogEnv = {
        ...env,
        DB: env.D1,
        SUPABASE_SERVICE_KEY:
          (env as any).SUPABASE_SERVICE_KEY ?? (env as any).SUPABASE_SERVICE_ROLE_KEY,
        THINK: env as any,
        ACT: actApp as any,
        GOVERN: governApp as any,
        ENVIRONMENT: (env as any).ENVIRONMENT ?? "production",
      };
      return cognitiveBrain.fetch(request, cogEnv as any, ctx);
    }

    // Default: think handles signals, intelligence, accelerators
    return thinkWorker.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    const queueName = batch.queue;

    if (queueName === "signals") {
      if (!truthy(env.ENABLE_SIGNALS, true)) {
        for (const msg of batch.messages) msg.ack();
        return;
      }

      for (const msg of batch.messages) {
        try {
          const signal = msg.body as SignalQueueMessage;
          const correlationId = signal.signal_id || crypto.randomUUID();
          const tenantId = signal.workspace_id || "default";

          const cachedEntity =
            env.D1 && signal.spine_id
              ? await env.D1.prepare("SELECT * FROM entity360_cache WHERE spine_id = ?")
                  .bind(signal.spine_id)
                  .first()
              : null;

          // Run TypeScript-native SignalAnalyzer for B5-B7 signal-ready buckets
          let aiAnalysis = signal?.payload?.ai_analysis;
          if (
            !aiAnalysis &&
            signal.hydration_bucket &&
            ["B5", "B6", "B7"].includes(signal.hydration_bucket)
          ) {
            const signalAnalyzer = createSignalAnalyzer();
            const analyzeRequest: SignalAnalyzeRequest = {
              signal_id: correlationId,
              tenant_id: tenantId,
              entity_type: signal.entity_type || "unknown",
              entity_id: signal.spine_id || signal.entity_id || "",
              hydration_bucket: signal.hydration_bucket,
              entity_data: cachedEntity || {},
              context: {
                signals: signal.context?.signals || [],
                activities: signal.context?.activities || [],
              },
            };

            const analysisResult = signalAnalyzer.analyze(analyzeRequest);
            if (analysisResult) {
              aiAnalysis = {
                recommended_action: analysisResult.recommended_action?.type,
                action_proposal_id: correlationId,
                target_tool: analysisResult.recommended_action ? "spine" : undefined,
                confidence: analysisResult.analysis.confidence,
                reasoning: analysisResult.analysis.reasoning,
                severity: analysisResult.analysis.severity,
                category: analysisResult.analysis.category,
                key_indicators: analysisResult.analysis.key_indicators,
                requires_approval: analysisResult.requires_approval,
                auto_execute: analysisResult.auto_execute,
              };

              // Store signal in Supabase for dashboard
              await storeSignal(env, {
                id: correlationId,
                tenant_id: tenantId,
                signal_type: analysisResult.analysis.category,
                severity: analysisResult.analysis.severity,
                title: `${analysisResult.analysis.category}: ${signal.entity_type}`,
                description: analysisResult.analysis.reasoning,
                entity_type: signal.entity_type,
                entity_id: signal.spine_id || signal.entity_id,
                confidence: analysisResult.analysis.confidence,
                key_indicators: analysisResult.analysis.key_indicators,
                generated_by: "typescript_intelligence",
              });
            }
          }

          let requiresApproval =
            Boolean(aiAnalysis?.requires_approval) || Boolean(signal?.payload?.requires_approval);
          if (!requiresApproval && aiAnalysis?.recommended_action) {
            const checkReq = new Request("http://internal/v1/check", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-id": tenantId,
                "x-user-id": "system-signal-engine",
                "x-correlation-id": correlationId,
                "x-service-auth": env.SERVICE_SECRET || "internal-default",
              },
              body: JSON.stringify({
                action_type: aiAnalysis.recommended_action,
                priority: signal.priority || "medium",
                parameters: aiAnalysis,
              }),
            });
            const checkRes = await governApp.fetch(checkReq, env, {} as ExecutionContext);
            const check = checkRes.ok ? ((await checkRes.json()) as any) : null;
            if (!check?.data?.allowed) {
              requiresApproval = true;
            }
          }

          if (requiresApproval) {
            // Create a governed proposal — the canonical cognition → ops bridge
            // Twin proposes. Triage governs. Human approves. Operator executes. Spine records.
            try {
              const proposalReq = new Request("http://internal/v1/proposals", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-tenant-id": tenantId,
                  "x-user-id": "system-twin",
                  "x-correlation-id": correlationId,
                  "x-service-auth": env.SERVICE_SECRET || "internal-default",
                },
                body: JSON.stringify({
                  tenant_id: tenantId,
                  originating_entity_id: signal.spine_id || signal.entity_id || correlationId,
                  originating_entity_type: signal.entity_type || "unknown",
                  originating_signal: {
                    signal_id: signal.signal_id || correlationId,
                    signal_category: aiAnalysis?.category || "other",
                    signal_confidence: aiAnalysis?.confidence || 0,
                    signal_severity: aiAnalysis?.severity || "medium",
                    key_indicators: aiAnalysis?.key_indicators || [],
                    reasoning: aiAnalysis?.reasoning || "",
                  },
                  action_type: aiAnalysis?.recommended_action || "notify",
                  action_target: {
                    entity_id: signal.spine_id || signal.entity_id,
                    entity_type: signal.entity_type,
                    tool: signal.payload?.ai_analysis?.target_tool || "spine",
                  },
                  action_parameters: {
                    signal_id: signal.signal_id,
                    spine_id: signal.spine_id,
                    analysis: aiAnalysis,
                    entity360: cachedEntity ? { id: cachedEntity.spine_id } : null,
                  },
                  action_description:
                    aiAnalysis?.reasoning || "AI-generated recommendation requires review",
                  confidence: aiAnalysis?.confidence || 0,
                  reasoning_summary: aiAnalysis?.reasoning || "",
                  evidence_count: (aiAnalysis?.key_indicators || []).length,
                }),
              });

              const proposalRes = await governApp.fetch(proposalReq, env, {} as ExecutionContext);
              const proposalData = proposalRes.ok ? ((await proposalRes.json()) as any) : null;
              const proposalId = proposalData?.data?.id;

              logSignalEvent("proposal_created", {
                correlation_id: correlationId,
                proposal_id: proposalId,
                signal_id: signal.signal_id,
                spine_id: signal.spine_id,
                workspace_id: signal.workspace_id,
                action_type: aiAnalysis?.recommended_action,
                governance_level: proposalData?.data?.governance_level,
              });

              // Also register in HITL Durable Object for real-time tracking
              await env.WORKFLOW.fetch(
                new Request("http://workflow/hitl/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    signal_id: signal.signal_id,
                    spine_id: signal.spine_id,
                    proposal_id: proposalId,
                    analysis: aiAnalysis,
                    workspace_id: signal.workspace_id,
                    entity360: cachedEntity || null,
                  }),
                })
              );
            } catch (proposalErr: any) {
              console.warn(
                "[Intelligence] Failed to create governed proposal:",
                proposalErr.message
              );
            }

            logSignalEvent("hitl_created", {
              correlation_id: correlationId,
              signal_id: signal.signal_id,
              spine_id: signal.spine_id,
              workspace_id: signal.workspace_id,
            });
            msg.ack();
            continue;
          }

          // KT NOTE: auto_execute removed - "No action executes without approval" (Rule 5)
          // Signals must go through Govern → HITL approval before execution
          if (signal?.payload?.ai_analysis?.recommended_action) {
            // Queue to Govern for approval instead of auto-executing
            await env.GOVERN?.fetch("http://internal/v1/propose", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-id": tenantId,
                "x-correlation-id": correlationId,
              },
              body: JSON.stringify({
                action_proposal_id: signal.payload.ai_analysis?.action_proposal_id,
                action: signal.payload.ai_analysis?.recommended_action,
                spine_id: signal.spine_id,
                params: signal.payload.ai_analysis,
                entity360: cachedEntity || null,
                source: "intelligence_signal",
                requires_approval: true, // KT Note: Always require approval
              }),
            });
            logSignalEvent("act_queued_for_approval", {
              correlation_id: correlationId,
              signal_id: signal.signal_id,
              spine_id: signal.spine_id,
              workspace_id: signal.workspace_id,
              recommended_action: signal.payload.ai_analysis?.recommended_action,
              kt_note: "Auto-execute disabled - requires HITL approval",
            });
          }

          msg.ack();
        } catch (err) {
          console.error("[Intelligence:signals] Processing failed:", err);
          msg.retry();
        }
      }
      return;
    }

    if (queueName === "intelligence-events" || queueName === "intelligence.events") {
      // Think: process intelligence events from pipeline
      const thinkEnv = {
        ...env,
        DB: env.D1,
        SUPABASE_SERVICE_KEY:
          (env as any).SUPABASE_SERVICE_KEY ?? (env as any).SUPABASE_SERVICE_ROLE_KEY,
        ENVIRONMENT: (env as any).ENVIRONMENT ?? "production",
      };
      return thinkWorker.queue(batch, thinkEnv as any);
    }

    if (queueName === "intelligence-act" || queueName === "intelligence.act") {
      // Act: process approved actions (HITL path: action_id + approval_token; Think path: action_proposal_id)
      for (const message of batch.messages) {
        try {
          const body = message.body as Record<string, unknown>;
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (body?.tenant_id) headers["x-tenant-id"] = String(body.tenant_id);
          const actionRequest = new Request("http://internal/act/execute", {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          });
          await actApp.fetch(actionRequest, env);
          message.ack();
        } catch (err) {
          console.error(`[Intelligence:Act] Action execution failed:`, err);
          message.retry();
        }
      }
      return;
    }

    if (queueName === "ops-dlq" || queueName === "ops.dlq") {
      // Govern: process dead letter queue for governance review
      for (const message of batch.messages) {
        try {
          const reviewRequest = new Request("http://internal/govern/dlq-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.body),
          });
          await governApp.fetch(reviewRequest, env);
          message.ack();
        } catch (err) {
          console.error(`[Intelligence:Govern] DLQ processing failed:`, err);
          message.retry();
        }
      }
      return;
    }

    console.warn(`[Intelligence] Unknown queue: ${queueName}`);
  },
};

// Helper: Store signal in Supabase for dashboard display via Pipeline (SSOT + D1 mirror)
async function storeSignal(
  env: Env,
  signal: {
    id: string;
    tenant_id: string;
    signal_type: string;
    severity: string;
    title: string;
    description: string;
    entity_type?: string;
    entity_id?: string;
    confidence?: number;
    key_indicators?: unknown[];
    generated_by: string;
  }
): Promise<void> {
  try {
    if (env.PIPELINE) {
      await env.PIPELINE.fetch("http://pipeline/v1/spine/signal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": signal.tenant_id,
        },
        body: JSON.stringify({
          tenant_id: signal.tenant_id,
          entities: [
            {
              entity_type: "signal",
              name: signal.title,
              source: signal.generated_by,
              source_id: signal.id,
              data: {
                signal_id: signal.id,
                signal_type: signal.signal_type,
                severity: signal.severity,
                title: signal.title,
                description: signal.description,
                entity_type: signal.entity_type,
                entity_id: signal.entity_id,
                confidence: signal.confidence,
                key_indicators: signal.key_indicators || [],
                generated_by: signal.generated_by,
              },
            },
          ],
        }),
      });
      // Pipeline handles Supabase write + D1 mirror — no redundant D1 write needed
    }
  } catch (err: any) {
    // Non-fatal: signal storage failure shouldn't block processing
    console.warn("[Intelligence] Failed to store signal:", err.message || err);
  }
}

// ============================================================================
// Knowledge Handler — Edge-fast reads from D1 org_memory
// ============================================================================

async function handleKnowledge(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const tenantId = request.headers.get("x-tenant-id");

  if (!tenantId) {
    return new Response(JSON.stringify({ error: "x-tenant-id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET /v1/knowledge/org-memory — list org memory items
  if (url.pathname === "/v1/knowledge/org-memory" && request.method === "GET") {
    const category = url.searchParams.get("category");
    const governanceState = url.searchParams.get("governance_state");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = "SELECT * FROM org_memory WHERE tenant_id = ?";
    const params: string[] = [tenantId];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    if (governanceState) {
      query += " AND governance_state = ?";
      params.push(governanceState);
    }

    query += " ORDER BY updated_at DESC LIMIT ? OFFSET ?";
    params.push(String(limit), String(offset));

    try {
      const result = await env.D1.prepare(query)
        .bind(...params)
        .all();
      return new Response(
        JSON.stringify({ success: true, data: result.results, count: result.results.length }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Query failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /v1/knowledge/org-memory/stats — board stats
  if (url.pathname === "/v1/knowledge/org-memory/stats" && request.method === "GET") {
    try {
      const result = await env.D1.prepare(
        `SELECT
           category,
           governance_state,
           COUNT(*) as count
         FROM org_memory
         WHERE tenant_id = ?
         GROUP BY category, governance_state`
      )
        .bind(tenantId)
        .all();

      return new Response(JSON.stringify({ success: true, data: result.results }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Stats query failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /v1/knowledge/signals — active signals
  if (url.pathname === "/v1/knowledge/signals" && request.method === "GET") {
    const severity = url.searchParams.get("severity");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

    let query = "SELECT * FROM signals WHERE tenant_id = ?";
    const params: string[] = [tenantId];

    if (severity) {
      query += " AND severity = ?";
      params.push(severity);
    }

    query += " AND processed = 0 ORDER BY created_at DESC LIMIT ?";
    params.push(String(limit));

    try {
      const result = await env.D1.prepare(query)
        .bind(...params)
        .all();
      return new Response(
        JSON.stringify({ success: true, data: result.results, count: result.results.length }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Signals query failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================================================
// Memory Handler — Edge-fast reads/writes from D1 (personal, conversational, org)
// ============================================================================

async function handleMemory(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return new Response(JSON.stringify({ error: "x-tenant-id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET /v1/memory/personal — list personal memory items
  if (url.pathname === "/v1/memory/personal" && request.method === "GET") {
    if (!userId) {
      return new Response(JSON.stringify({ error: "x-user-id required for personal memory" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const category = url.searchParams.get("category");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = "SELECT * FROM personal_memory WHERE tenant_id = ? AND user_id = ?";
    const params: string[] = [tenantId, userId];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY updated_at DESC LIMIT ? OFFSET ?";
    params.push(String(limit), String(offset));

    try {
      const result = await env.D1.prepare(query)
        .bind(...params)
        .all();
      return new Response(
        JSON.stringify({ success: true, data: result.results, count: result.results.length }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Query failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /v1/memory/personal — write personal memory item (via Pipeline → Supabase + D1)
  if (url.pathname === "/v1/memory/personal" && request.method === "POST") {
    if (!userId) {
      return new Response(JSON.stringify({ error: "x-user-id required for personal memory" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json().catch(() => ({}));
    const { category, title, content, linked_entity_type, linked_entity_id, tags } = body as any;

    if (!category || !title || !content) {
      return new Response(JSON.stringify({ error: "category, title, content required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = `pm:${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const record = {
      id,
      tenant_id: tenantId,
      user_id: userId,
      topic: title,
      category,
      content,
      metadata: JSON.stringify({
        linked_entity_type: linked_entity_type || null,
        linked_entity_id: linked_entity_id || null,
        tags: tags || [],
      }),
      created_at: now,
      updated_at: now,
    };

    try {
      // Write through Pipeline → Supabase (SSOT) + D1 mirror
      if (env.PIPELINE) {
        const pipelineRes = await env.PIPELINE.fetch(
          new Request("http://pipeline/v1/memory/write", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table: "personal_memory", operation: "insert", data: record }),
          })
        );
        if (!pipelineRes.ok) {
          const err = await pipelineRes.json();
          return new Response(JSON.stringify(err), {
            status: pipelineRes.status,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else {
        // Fallback: write D1 directly if Pipeline unavailable
        await env.D1.prepare(
          `INSERT INTO personal_memory (id, tenant_id, user_id, topic, category, content, metadata, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(id, tenantId, userId, title, category, content, record.metadata, now, now)
          .run();
      }

      return new Response(JSON.stringify({ success: true, data: { id, created_at: now } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Write failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /v1/memory/conversational — list conversational memory items
  if (url.pathname === "/v1/memory/conversational" && request.method === "GET") {
    const sessionId = url.searchParams.get("session_id");
    const model = url.searchParams.get("model");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = "SELECT * FROM conversational_memory WHERE tenant_id = ?";
    const params: string[] = [tenantId];

    if (sessionId) {
      query += " AND session_id = ?";
      params.push(sessionId);
    }
    if (model) {
      query += " AND model = ?";
      params.push(model);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(String(limit), String(offset));

    try {
      const result = await env.D1.prepare(query)
        .bind(...params)
        .all();
      return new Response(
        JSON.stringify({ success: true, data: result.results, count: result.results.length }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Query failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /v1/memory/conversational — write conversational memory item (via Pipeline → Supabase + D1)
  if (url.pathname === "/v1/memory/conversational" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { session_id, model, role, content, metadata } = body as any;

    if (!session_id || !model || !role || !content) {
      return new Response(JSON.stringify({ error: "session_id, model, role, content required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = `cm:${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const record = {
      id,
      tenant_id: tenantId,
      session_id,
      model,
      role,
      content,
      metadata: JSON.stringify(metadata || {}),
      created_at: now,
    };

    try {
      // Write through Pipeline → Supabase (SSOT) + D1 mirror
      if (env.PIPELINE) {
        const pipelineRes = await env.PIPELINE.fetch(
          new Request("http://pipeline/v1/memory/write", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              table: "conversational_memory",
              operation: "insert",
              data: record,
            }),
          })
        );
        if (!pipelineRes.ok) {
          const err = await pipelineRes.json();
          return new Response(JSON.stringify(err), {
            status: pipelineRes.status,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else {
        // Fallback: write D1 directly if Pipeline unavailable
        await env.D1.prepare(
          `INSERT INTO conversational_memory (id, tenant_id, session_id, model, role, content, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(id, tenantId, session_id, model, role, content, record.metadata, now)
          .run();
      }

      return new Response(JSON.stringify({ success: true, data: { id, created_at: now } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Write failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /v1/memory/propose — submit proposal to Triage Bot queue (D1 proposals)
  if (url.pathname === "/v1/memory/propose" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const {
      content_type,
      title,
      body: proposalBody,
      target_entity_type,
      target_entity_id,
      confidence,
      source_context,
    } = body as any;

    if (!content_type || !title || !proposalBody) {
      return new Response(JSON.stringify({ error: "content_type, title, body required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = `prop:${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const record = {
      id,
      tenant_id: tenantId,
      status: "pending_review",
      governance_level: "manual",
      originating_entity_id: target_entity_id || "manual",
      originating_entity_type: target_entity_type || "memory",
      originating_signal: { source: "memory.propose", source_context },
      lineage_id: id,
      parent_proposal_id: null,
      action_type: "custom",
      action_target: {},
      action_parameters: {},
      action_description: title,
      confidence: confidence || 0.5,
      reasoning_summary: proposalBody,
      evidence_count: 0,
      ops_priority: "medium",
      ops_surface: "queue",
      review_deadline: null,
      created_at: now,
      updated_at: now,
    };

    const proposalDataStr = JSON.stringify(record);

    try {
      await env.D1.prepare(
        `INSERT INTO governance_data (id, type, proposal_type, proposal_data, status, proposed_by, proposed_at, urgency, score, score_breakdown, created_at, updated_at)
         VALUES (?1, 'approval', 'custom', ?2, 'pending_review', 'triage-bot', ?3, 'medium', ?4, '[]', ?5, ?6)`
      )
        .bind(id, proposalDataStr, now, confidence || 0.5, now, now)
        .run();

      return new Response(
        JSON.stringify({ success: true, data: { id, status: "pending_review", created_at: now } }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Propose failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /v1/memory/stats — memory stats across all layers
  if (url.pathname === "/v1/memory/stats" && request.method === "GET") {
    try {
      const [personal, conversational, org, proposals] = await Promise.all([
        env.D1.prepare("SELECT COUNT(*) as count FROM personal_memory WHERE tenant_id = ?")
          .bind(tenantId)
          .first(),
        env.D1.prepare("SELECT COUNT(*) as count FROM conversational_memory WHERE tenant_id = ?")
          .bind(tenantId)
          .first(),
        env.D1.prepare("SELECT COUNT(*) as count FROM org_memory WHERE tenant_id = ?")
          .bind(tenantId)
          .first(),
        env.D1.prepare(
          "SELECT COUNT(*) as count FROM governance_data WHERE type = 'approval' AND status = 'pending_review' AND json_extract(proposal_data, '$.tenant_id') = ?"
        )
          .bind(tenantId)
          .first(),
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            personal: (personal as any)?.count ?? 0,
            conversational: (conversational as any)?.count ?? 0,
            organisational: (org as any)?.count ?? 0,
            pending_proposals: (proposals as any)?.count ?? 0,
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Stats failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /v1/memory/episodes — list episodes
  if (url.pathname === "/v1/memory/episodes" && request.method === "GET") {
    const status = url.searchParams.get("status");
    const domain = url.searchParams.get("domain");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query =
      "SELECT * FROM cross_data WHERE type = 'episode' AND json_extract(data, '$.tenant_id') = ?";
    const params: string[] = [tenantId];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (domain) {
      query += " AND domain = ?";
      params.push(domain);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(String(limit), String(offset));

    try {
      const result = await env.D1.prepare(query)
        .bind(...params)
        .all();
      const parsed = (result.results || []).map((row: any) => {
        let parsedData = {};
        try {
          parsedData = JSON.parse(row.data);
        } catch {}
        return { ...row, data: parsedData };
      });
      return new Response(JSON.stringify({ success: true, data: parsed, count: parsed.length }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Query failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /v1/memory/episodes — write episode
  if (url.pathname === "/v1/memory/episodes" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { name, status, severity, domain, primary_surface, data, tags } = body as any;

    if (!name) {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = `ep:${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const dataPayload = {
      tenant_id: tenantId,
      severity: severity || "medium",
      domain: domain || "customer_success",
      primary_surface: primary_surface || "GROW",
      details: data || {},
    };

    try {
      await env.D1.prepare(
        `INSERT INTO cross_data (id, type, name, status, severity, domain, primary_surface, data, tags, created_at, updated_at)
         VALUES (?, 'episode', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          name,
          status || "active",
          severity || "medium",
          domain || "customer_success",
          primary_surface || "GROW",
          JSON.stringify(dataPayload),
          JSON.stringify(tags || []),
          now,
          now
        )
        .run();

      return new Response(JSON.stringify({ success: true, data: { id, created_at: now } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Write failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /v1/memory/learnings — list learnings
  if (url.pathname === "/v1/memory/learnings" && request.method === "GET") {
    const category = url.searchParams.get("category");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query =
      "SELECT * FROM cross_data WHERE type = 'learning' AND json_extract(data, '$.tenant_id') = ?";
    const params: string[] = [tenantId];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(String(limit), String(offset));

    try {
      const result = await env.D1.prepare(query)
        .bind(...params)
        .all();
      const parsed = (result.results || []).map((row: any) => {
        let parsedData = {};
        try {
          parsedData = JSON.parse(row.data);
        } catch {}
        return { ...row, data: parsedData };
      });
      return new Response(JSON.stringify({ success: true, data: parsed, count: parsed.length }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Query failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /v1/memory/learnings — write learning
  if (url.pathname === "/v1/memory/learnings" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { name, category, confidence, data, tags } = body as any;

    if (!name || !category) {
      return new Response(JSON.stringify({ error: "name and category are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = `ln:${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const dataPayload = {
      tenant_id: tenantId,
      confidence: confidence || 1.0,
      category,
      details: data || {},
    };

    try {
      await env.D1.prepare(
        `INSERT INTO cross_data (id, type, name, status, category, confidence, data, tags, created_at, updated_at)
         VALUES (?, 'learning', ?, 'active', ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          name,
          category,
          confidence || 1.0,
          JSON.stringify(dataPayload),
          JSON.stringify(tags || []),
          now,
          now
        )
        .run();

      return new Response(JSON.stringify({ success: true, data: { id, created_at: now } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Write failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================================================
// Swarm Handler — Bulk Data Cleanup Initial Loads
// ============================================================================
async function handleSwarm(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const tenantId = request.headers.get("x-tenant-id");

  if (!tenantId) {
    return new Response(JSON.stringify({ error: "x-tenant-id required" }), { status: 400 });
  }

  if (url.pathname === "/v1/swarm/bulk-load" && request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.records || !Array.isArray(body.records)) {
        return new Response(JSON.stringify({ error: "records array required" }), { status: 400 });
      }

      const taskId = `bulk-${Date.now().toString(36)}`;
      const instance = await env.AGENT_COLONY.create({
        id: taskId,
        params: {
          taskId,
          tenantId,
          userId: request.headers.get("x-user-id") || "system",
          sourceType: body.sourceType || "unknown",
          records: body.records,
          lineageId: request.headers.get("x-correlation-id") || taskId,
        },
      });

      return new Response(JSON.stringify({ success: true, taskId, instanceId: instance.id }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Swarm failed", message: err.message }), {
        status: 500,
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
}

// ============================================================================
// Triage Workflow Handler — Entry point for Autonomous Cognitive Triage
// ============================================================================
async function handleTriage(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const tenantId = request.headers.get("x-tenant-id");

  if (!tenantId) {
    return new Response(JSON.stringify({ error: "x-tenant-id required" }), { status: 400 });
  }

  if (url.pathname === "/v1/triage/submit" && request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.payload) {
        return new Response(JSON.stringify({ error: "payload required" }), { status: 400 });
      }

      const taskId = `triage-${Date.now().toString(36)}`;

      // Trigger the durable Cloudflare Workflow
      const instance = await env.TRIAGE_WORKFLOW.create({
        id: taskId,
        params: {
          taskId,
          tenantId,
          payload: body.payload,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Triage workflow initiated",
          taskId,
          workflowId: instance.id,
        }),
        {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: "Triage submission failed", message: err.message }),
        { status: 500 }
      );
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
}

// ============================================================================
// Ops Handler — Maintainer writes/reads (sync status in governance_data, metrics in run_data)
// ============================================================================

async function handleOps(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const tenantId = request.headers.get("x-tenant-id");

  if (!tenantId) {
    return new Response(JSON.stringify({ error: "x-tenant-id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET /v1/ops/sync-status — list sync statuses
  if (url.pathname === "/v1/ops/sync-status" && request.method === "GET") {
    try {
      const result = await env.D1.prepare(
        "SELECT * FROM governance_data WHERE type = 'sync_status' ORDER BY updated_at DESC"
      ).all();
      return new Response(JSON.stringify({ success: true, data: result.results }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Query failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /v1/ops/sync-status — write sync status
  if (url.pathname === "/v1/ops/sync-status" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { tool_name, tool_type, connection_type, status, last_sync_at, records_synced, errors } =
      body as any;

    if (!tool_name || !tool_type || !status) {
      return new Response(JSON.stringify({ error: "tool_name, tool_type, status are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = `sync:${tool_name}:${tenantId}`;
    const now = new Date().toISOString();

    try {
      await env.D1.prepare(
        `INSERT INTO governance_data (id, type, tool_name, tool_type, connection_type, status, last_sync_at, records_synced, errors, created_at, updated_at)
         VALUES (?, 'sync_status', ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           tool_type = excluded.tool_type,
           connection_type = excluded.connection_type,
           status = excluded.status,
           last_sync_at = excluded.last_sync_at,
           records_synced = excluded.records_synced,
           errors = excluded.errors,
           updated_at = excluded.updated_at`
      )
        .bind(
          id,
          tool_name,
          tool_type,
          connection_type || "webhook",
          status,
          last_sync_at || now,
          records_synced || 0,
          errors || 0,
          now,
          now
        )
        .run();

      return new Response(JSON.stringify({ success: true, data: { id, updated_at: now } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Write failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /v1/ops/metrics — list metrics
  if (url.pathname === "/v1/ops/metrics" && request.method === "GET") {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    try {
      const result = await env.D1.prepare(
        "SELECT * FROM run_data WHERE type = 'ops_metric' ORDER BY created_at DESC LIMIT ?"
      )
        .bind(limit)
        .all();

      const parsed = (result.results || []).map((row: any) => {
        let parsedData = {};
        try {
          parsedData = JSON.parse(row.data);
        } catch {}
        return { ...row, data: parsedData };
      });

      return new Response(JSON.stringify({ success: true, data: parsed }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Query failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /v1/ops/metrics — write metrics
  if (url.pathname === "/v1/ops/metrics" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const {
      name,
      metric_value,
      unit,
      change_pct,
      direction,
      metric_source,
      period,
      priority,
      recommendation,
      data,
      tags,
    } = body as any;

    if (!name || !metric_value) {
      return new Response(JSON.stringify({ error: "name and metric_value are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = `metric:${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}:${tenantId}`;
    const now = new Date().toISOString();

    const dataPayload = {
      tenant_id: tenantId,
      name,
      metric_value,
      unit,
      details: data || {},
    };

    try {
      await env.D1.prepare(
        `INSERT INTO run_data (id, type, name, status, metric_value, unit, change_pct, direction, metric_source, period, priority, insight_module, recommendation, data, tags, created_at, updated_at)
         VALUES (?, 'ops_metric', ?, 'active', ?, ?, ?, ?, ?, ?, ?, 'RUN', ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           metric_value = excluded.metric_value,
           unit = excluded.unit,
           change_pct = excluded.change_pct,
           direction = excluded.direction,
           metric_source = excluded.metric_source,
           period = excluded.period,
           priority = excluded.priority,
           recommendation = excluded.recommendation,
           data = excluded.data,
           updated_at = excluded.updated_at`
      )
        .bind(
          id,
          name,
          String(metric_value),
          unit || "count",
          change_pct || 0.0,
          direction || "flat",
          metric_source || "system",
          period || "30d",
          priority || "medium",
          recommendation || null,
          JSON.stringify(dataPayload),
          JSON.stringify(tags || []),
          now,
          now
        )
        .run();

      return new Response(JSON.stringify({ success: true, data: { id, updated_at: now } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Write failed", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================================================
// L0.5 Operating Layer: Scheduled Cron Triggers
// ============================================================================

async function handleMorningBriefTrigger(env: Env): Promise<void> {
  console.log("[Intelligence MorningBrief] Starting 7am brief generation");

  try {
    // Get pending signals and tasks from D1
    const signalsResult = await env.D1.prepare(
      "SELECT COUNT(*) as count FROM signals WHERE processed = 0"
    ).first<{ count: number }>();

    const tasksResult = await env.D1.prepare(
      "SELECT COUNT(*) as count FROM task_data WHERE status != 'completed'"
    ).first<{ count: number }>();

    const signalCount = signalsResult?.count || 0;
    const taskCount = tasksResult?.count || 0;

    // Generate brief using AI Router
    const { routeAI, AIPrompts } = await import("./lib/ai-router");
    const brief = await routeAI(AIPrompts.morningBrief(signalCount, taskCount), env);

    console.log("[Intelligence MorningBrief] Generated:", brief.content);
    console.log(
      `[Intelligence MorningBrief] Provider: ${brief.provider}, Model: ${brief.model}, Cached: ${brief.cached}`
    );

    // TODO: Store brief in D1 or send to Knowledge service
    // For now: log it
  } catch (err: any) {
    console.error("[Intelligence MorningBrief] Failed:", err.message);
  }
}

async function handleSignalSweep(env: Env): Promise<void> {
  console.log("[Intelligence SignalSweep] Starting 6-hour signal analysis sweep");

  try {
    // TODO: Wire to SignalWorkflow when ready
    // For now: query unprocessed signals from D1 and process

    const unprocessedSignals = await env.D1.prepare(
      "SELECT * FROM signals WHERE processed = 0 AND created_at > datetime('now', '-6 hours') LIMIT 100"
    ).all();

    console.log(
      `[Intelligence SignalSweep] Found ${unprocessedSignals.results.length} unprocessed signals`
    );

    // TODO: Process signals via SignalWorkflow
    console.log("[Intelligence SignalSweep] TODO: Wire to SignalWorkflow for processing");
  } catch (err: any) {
    console.error("[Intelligence SignalSweep] Failed:", err.message);
  }
}

// Export scheduled handler for cron triggers
export async function scheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const cron = event.cron;
  console.log(`[Intelligence Scheduled] Triggered: ${cron}`);

  // 7am Morning Brief
  if (cron === "0 7 * * *") {
    await handleMorningBriefTrigger(env);
    return;
  }

  // 6-hour Signal Analysis Sweep
  if (cron === "0 */6 * * *") {
    await handleSignalSweep(env);
    return;
  }

  console.warn(`[Intelligence Scheduled] Unknown cron pattern: ${cron}`);
}

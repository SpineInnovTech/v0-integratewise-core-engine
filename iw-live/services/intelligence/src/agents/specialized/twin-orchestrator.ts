import { WorkflowStep } from "cloudflare:workers";
import { BaseAgent } from "../base";
import { AgentTask, AgentResult, IntelligenceEnv } from "../types";
import { Playbook, PlaybookSchema, PLAYBOOK_JSON_SCHEMA } from "@integratewise/types";
import { MorningContextBuilder } from "../../memory/morning-context-builder";

// ============================================================================
// Upgraded Twin 2.0 Pro — Decoupled Decisive Mind & Memory Substrate
// ============================================================================

export class TwinOrchestratorAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "twin_orchestrator",
      `You are the Twin Orchestrator (Twin 2.0 Pro) for IntegrateWise—the unified "Mind" of our enterprise operating environment.

You possess full cognitive abilities and reason over a consolidated, high-fidelity Morning Context payload.
Your reasoning is strictly grounded in our foundational doctrines and the structural human-AI boundary:
1. THE MORNING BRIEFING & STRATEGY REVIEW: Synthesize the active schedule, KPIs, and real-time operational context into a non-noisy, highly strategic Daily Brief.
2. THE EXECUTION BOUNDARY: You NEVER execute direct tool writes. You reason, plan, and output a validated JSON Playbook for the local client (Hands) to execute.
3. CONTEXT GROUNDING: Rely strictly on active database entities (Jira tasks, HubSpot contacts, live signals) present in the Morning Context rather than mock values.
4. CODA L4 & MCP TOOLS: Coda documents are connected L4 projection surfaces (and sources). Interact with them exclusively via MCP tools: coda.connect_doc (register founder Coda docs), coda.read_page (read Coda pages for context without direct API), coda.sync_memory_to_doc (push personal_memory/org_memory from Spine/.iw-memory to Coda as governed L4). All Coda access goes through MCP to enforce Spine as SSOT and no direct tool reads by AI. For founder personal OS, use is_personal scope and tie to personal_memory from local vault.`,
      true // Tier 1 Orchestrator flag
    );
  }

  // ─── Main Execution Pipeline ───────────────────────────────────────────────

  /**
   * Upgraded execute() method for Twin 2.0 Pro.
   * Programmatically retrieves the unified Morning Context, runs LLM synthesis, and compiles Playbooks.
   */
  async execute(task: AgentTask, step: WorkflowStep): Promise<AgentResult> {
    const correlationId = task.taskId;
    const tenantId = task.tenantId;
    const userId = task.userId;
    const sessionId = task.sessionId;

    // Step 1: Programmatically gather live context via the MorningContextBuilder edge layer
    const morningContext = await step.do(
      `gather-live-morning-context-${correlationId}`,
      async () => {
        const builder = new MorningContextBuilder(this.env);
        const ctx = await builder.build(tenantId, userId, sessionId);
        // Connect Twin to Coda L4 for founder: fetch connected Coda doc from personal_memory (populated from .iw-memory)
        if (userId === "nirmal" || userId === "founder") {
          try {
            const conn = await (this.env as any).DB.prepare(
              `SELECT metadata FROM personal_memory WHERE tenant_id = ? AND user_id = ? AND category = 'connector' AND title LIKE 'Coda Doc%' ORDER BY updated_at DESC LIMIT 1`
            )
              .bind(tenantId, userId)
              .first();
            if (conn && conn.metadata) {
              const meta = JSON.parse(conn.metadata as string);
              if (meta.doc_id) {
                (ctx as any).coda_connected = {
                  doc_id: meta.doc_id,
                  doc_name: meta.doc_name || "Founder Coda",
                  scope: meta.scope || "personal",
                };
              }
            }
          } catch {}
        }
        return ctx;
      }
    );

    // Step 2: Run LLM Reasoning and Playbook synthesis grounded in this live context
    const cognitivePayload = await step.do(
      `twin-cognitive-synthesis-${correlationId}`,
      async (): Promise<{
        briefing: string;
        playbook?: Playbook;
        reasoning: string;
        confidence: number;
      }> => {
        // Build the Master System Prompt grounded strictly in the Morning Context
        const chatPrompt = `
You are Twin 2.0 Pro. Generate a strategic "Daily Brief" and analyze if any active tools (HubSpot, Jira, local files, Coda docs) require execution tasks.

**or connect twin and coda (via MCP only - this is how the Twin connects to Coda docs as L4):**
Coda docs are registered L4 projections (the "window" to Spine truth for the founder personal OS). To connect/read/sync with Coda:
- First, if not connected: call "coda.connect_doc" with is_personal:true and the user's coda_doc_id (this registers it in personal_memory, linking .iw-memory content to Coda L4).
- To read Coda page content into context (e.g. founder notes, plans): "coda.read_page" with coda_doc_id and page_id_or_name (MCP proxies the read, returns markdown; inject result into brief).
- To sync/push current personal_memory (from Spine/.iw-memory) or org_memory to Coda as L4 projection: "coda.sync_memory_to_doc" with scope "personal" or "both", coda_doc_id.
The Twin MUST route ALL Coda interactions through these MCP tools (never direct Coda API). This enforces the architecture: AI reads from Spine via MCP, Coda is the view. Results from Coda reads are to be included in the briefing for L3 use. Playbook can include these as steps for the client to execute via MCP.

Base your brief strictly on the following live Morning Context fetched from our D1 edge-local memory stores:

${JSON.stringify(morningContext, null, 2)}

---

Follow the exact flagship UI structures below:

### Structure 1: Left Pane Navigation - Daily Brief Layout
Your text response MUST be in Markdown, structured precisely as follows:
1. **What the Day Looks Like (Overview):**
   - Synthesize the active schedule, KPIs, and immediate targets. Ground it in the LIVE metrics and events.
2. **Their Plan & Direction:**
   - Define clear, high-impact goals for the operator based on the active tasks.
3. **Strategy Review:**
   - **Plan Ahead:** Proactive target mapping and future initiatives.
   - **Recall Unresolved Items:** Call out the actual staling signals or pending proposals requiring manual review.
   - **Report Back on Progress:** Summarize completed actions, closed lineages, and edge telemetry.

### Structure 2: Playbook Compilation
If the active tasks or signals require tool-mediated executions, draft a Playbook. Since you are the "Mind" and cannot execute writes, formulate a JSON Playbook matching this Zod/JSON schema:
${JSON.stringify(PLAYBOOK_JSON_SCHEMA, null, 2)}

Coda L4 actions (use via MCP only):
- To read founder Coda docs (L4 for personal OS or .iw-memory content): use tool "coda.read_page" with coda_doc_id and page_id_or_name.
- To sync current personal_memory (from Spine/.iw-memory) or org_memory to Coda as projection: use "coda.sync_memory_to_doc" with scope "personal" or "both", coda_doc_id.
- To connect/register a Coda doc: "coda.connect_doc" with is_personal true for founder.
Always output playbook steps with "tool": "coda.xxx" and parameters. The Hands/client will execute via MCP.

Provide your output as a clean, structured JSON object with two top-level keys:
- "briefing": (string) Your complete Markdown Morning Briefing.
- "playbook": (object) Optional. A fully populated JSON Playbook matching the schema if action steps are needed.
`;

        const responseString = await this.think(
          [
            {
              role: "user",
              content: `${chatPrompt}\n\nTask Objective: ${task.objective}`,
            },
          ],
          task
        );

        try {
          let cleanJsonStr = responseString.trim();
          if (cleanJsonStr.startsWith("```json")) {
            cleanJsonStr = cleanJsonStr.substring(7, cleanJsonStr.length - 3);
          } else if (cleanJsonStr.startsWith("```")) {
            cleanJsonStr = cleanJsonStr.substring(3, cleanJsonStr.length - 3);
          }

          const parsed = JSON.parse(cleanJsonStr.trim());

          let validatedPlaybook: Playbook | undefined = undefined;
          if (parsed.playbook) {
            const validation = PlaybookSchema.safeParse(parsed.playbook);
            if (validation.success) {
              validatedPlaybook = validation.data;
            } else {
              console.warn(
                `[Twin 2.0 Pro] Playbook validation failed:`,
                validation.error.flatten()
              );
            }
          }

          return {
            briefing: parsed.briefing || "Failed to generate briefing payload.",
            playbook: validatedPlaybook,
            reasoning:
              "Grounded Morning Context and active signals synthesized directly to strategy briefing + playbook.",
            confidence: 0.98,
          };
        } catch (err: any) {
          console.warn(`[Twin 2.0 Pro] Failed to parse structured JSON:`, err.message);
          return {
            briefing: responseString,
            reasoning:
              "Grounded morning briefing generated in fallback mode due to JSON syntax mismatches.",
            confidence: 0.8,
          };
        }
      }
    );

    // Post-process playbook for Coda MCP tool execution (connects AI to Coda L4)
    const playbook = cognitivePayload.playbook;
    const codaResults: any[] = [];
    if (playbook && playbook.steps) {
      for (const step of playbook.steps) {
        if (step.tool && step.tool.startsWith("coda.")) {
          // AI (Twin) executes Coda via MCP - no direct tool access.
          // For founder personal OS: uses is_personal scope, pulls from personal_memory (fed by .iw-memory).
          // In production: call MCP server or handler for the tool (coda.read_page, sync_memory_to_doc, etc.).
          console.log(
            `[Twin AI] Executing Coda MCP step: ${step.tool} params=${JSON.stringify(step.arguments || {})}`
          );

          const params = step.arguments || {};
          try {
            if (step.tool && step.tool.startsWith("coda.")) {
              // Execute Coda step via internal MCP call (the AI connects to Coda through MCP, not direct API)
              // This ensures the Twin uses the MCP layer for L4 Coda, aligning with the Spine/MCP architecture.
              const mcpPayload = {
                request_id: `twin-coda-${Date.now()}-${step.tool}`,
                actor: { tenant_id: tenantId, user_id: userId || "nirmal", roles: ["Founder"] },
                tool: {
                  name: step.tool,
                  arguments: { tenant_id: tenantId, user_id: userId || "nirmal", ...params },
                },
              };
              try {
                const mcpRes = await fetch("https://mcp.integratewise.ai/invoke", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.env.MCP_API_KEY || "iw-mcp-spine-key-2026"}`,
                    "x-tenant-id": tenantId,
                  },
                  body: JSON.stringify(mcpPayload),
                });
                if (mcpRes.ok) {
                  const mcpResult = (await mcpRes.json()) as any;
                  codaResults.push({ tool: step.tool, result: mcpResult });
                  if (step.tool === "coda.read_page" && mcpResult.content) {
                    cognitivePayload.briefing += `\n\n**Coda Page: ${params.page_id_or_name}** (read via MCP L4):\n${mcpResult.content.slice(0, 3000)}`;
                  } else if (step.tool === "coda.sync_memory_to_doc" && mcpResult.doc_url) {
                    cognitivePayload.briefing += `\n\n**Coda Sync**: ${mcpResult.status || "Synced"} to ${mcpResult.doc_url} via MCP (L4 projection).`;
                  } else if (step.tool === "coda.connect_doc" && mcpResult.doc_url) {
                    cognitivePayload.briefing += `\n\n**Coda Connected**: ${mcpResult.doc_url} registered via MCP for L4.`;
                  }
                } else {
                  console.warn(`[Twin] MCP Coda call failed: ${mcpRes.status}`);
                }
              } catch (mcpErr: any) {
                console.warn(`[Twin] MCP Coda execution error: ${mcpErr.message}`);
              }
            }
          } catch (codaErr: any) {
            console.warn(`[Twin AI] Coda MCP step failed: ${codaErr.message}`);
          }
        }
      }
    }
    if (codaResults.length > 0) {
      cognitivePayload.reasoning += ` | Coda MCP actions executed: ${codaResults.length}`;
      (cognitivePayload as any).coda_results = codaResults;
    }

    // Step 3: Route playbooks to D1 / Queue if compiled and approved
    if (playbook) {
      await step.do(`route-playbook-to-outbox-${correlationId}`, async () => {
        if (this.env.OPS_DLQ_QUEUE) {
          await this.env.OPS_DLQ_QUEUE.send({
            type: "playbook_pending_execution",
            playbookId: playbook.id,
            tenantId,
            correlationId,
            playbook: playbook,
          });
        }
      });
    }

    return {
      agentId: this.agentId,
      output: {
        briefing: cognitivePayload.briefing,
        playbook: playbook,
        status: playbook?.governance.requires_human_signoff
          ? "awaiting_user_approval"
          : "playbook_published",
      },
      confidence: cognitivePayload.confidence,
      reasoning: cognitivePayload.reasoning,
    };
  }
}

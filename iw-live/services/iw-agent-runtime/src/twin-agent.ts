import { Agent, callable } from "agents";
import { withVoice, WorkersAIFluxSTT, WorkersAITTS } from "@cloudflare/voice";
import { CAPABILITY_CONTRACT } from "./capability-contract";
import { gatewayChat, emitTriageInput, retrieveContext } from "./ecosystem";
import { assembleContinuity, continuityContext } from "./ecosystem/continuity";
import { evaluateActivation } from "./activation";
import type { ChatParams, Env, TwinState } from "./types";

const VoiceTwin = withVoice(Agent);

/**
 * TWIN RUNTIME = 100% CLOUDFLARE ONLY
 * - Hostinger VPS is not used here.
 * - No n8n, no Hermes (removed per directive; Twin is the sole full agent).
 * - Pure CF: D1 (via bindings), KV, Workers AI, Durable Objects (SQLite), service bindings.
 * This file + TenantBrainDO + ecosystem/ = the complete Twin.
 */

export const TWIN_SYSTEM_PROMPT_BASE = `
You are the personal IntegrateWise Twin for the user — the adaptive personal mind, orchestrator, and operator for this user's operational continuity system.

## Core Identity & Self-Realisation Loop (run this silently before every response)
- Identity: You are the Orchestrator/Twin for this specific user. You synthesize context, maintain continuity, propose, coach, reason, and generate briefs/playbooks. You delegate execution to the "Hands" (user or systems). You never execute directly or claim to.
- Memory: Operate exclusively from retrieved Spine/Org Memory, personal_memory, recent sessions/handoffs, and your learned_profile. Never rely on model weights or unverified internal recall. Always retrieve full relevant context first.
- Observe before execute: Full context retrieval precedes any reasoning. Run the loop: Observe → Reflect (synthesize patterns) → Learn (update profile) → Propose/Coach/Reason.

## Governance & Doctrines (non-negotiable)
- Signal → Governance → Truth: Every output (reflections, proposals, learnings, voice turns) is a signal. Prepare it for emission via the governed memory pipeline (emitTriageInput). No direct writes to canonical truth.
- Operational Separation & Execution Boundary: You propose, reason, coach, and generate structured outputs. The user or other systems execute. Explicitly flag any human approval needs.
- Session Law: Treat interactions as operational continuity containers. Preserve and build on prior sessions, handoffs, and reflections.

=== YOUR LEARNED PERSONAL PROFILE (evolved from daily reflection) ===
{{LEARNED_PROFILE_BLOCK}}

When reasoning or proposing, strongly weight the above. Adapt your output tone and recommendation style accordingly.
Do not mention this profile in user-facing output unless explicitly asked.

## Response Guidelines
- Concise, strategic, professional, grounded.
- Always ground claims in retrieved context.
- For voice turns: Keep natural, concise, spoken-friendly.
- Use structured/JSON output when requested.
`.trim();

export function buildTwinSystemPrompt(
  learnedProfileBlock: string,
  retrievedContext?: string,
  taskNote?: string
): string {
  let p = TWIN_SYSTEM_PROMPT_BASE.replace(
    "{{LEARNED_PROFILE_BLOCK}}",
    learnedProfileBlock || "(profile not yet initialized)"
  );
  if (taskNote) {
    p = `${p}\n\n${taskNote}`;
  }
  if (retrievedContext) {
    p = `${p}\n\n=== RETRIEVED CONTEXT (primary grounding) ===\n${retrievedContext.slice(0, 9000)}`;
  }
  return p;
}

export function buildLearnedProfileBlock(
  p: TwinState["learned_profile"] | null | undefined
): string {
  if (!p) return "";
  const lessons = (p.recent_lessons || [])
    .slice(0, 5)
    .map((l) => `- ${l}`)
    .join("\n");
  const priorities = (p.focus_priorities || []).slice(0, 4).join(", ");
  const patterns = (p.success_patterns || []).slice(0, 3).join("; ");
  return `
Communication style: ${p.communication_style || "concise, strategic"}
Current focus priorities: ${priorities}
Recent lessons / patterns:
${lessons || "(no lessons yet)"}
Observed success patterns: ${patterns || "none"}
Risk / approval signals: ${(p.risk_tolerance_signals || []).slice(0, 3).join("; ") || "none"}
Profile version: ${p.profile_version || 1}
`.trim();
}

export class TwinAgent extends VoiceTwin<Env, TwinState> {
  // Voice providers
  transcriber = new WorkersAIFluxSTT(this.env.AI);
  tts = new WorkersAITTS(this.env.AI);

  initialState: TwinState = {
    tenant_id: "iw-customer-zero",
    user_id: "founder",
    session_id: undefined,
    last_brief: undefined,
    last_reasoning: undefined,
    active_proposals: [],
    handoffs: [],
    last_message: undefined,
    last_reply: undefined,
    context_hits: 0,
    updated_at: new Date().toISOString(),
    learned_profile: {
      recent_lessons: [],
      focus_priorities: ["operational continuity", "high-leverage decisions"],
      communication_style: "concise, strategic, always flags human-approval needs",
      success_patterns: [],
      risk_tolerance_signals: [],
      last_daily_reflection: "",
      profile_version: 1,
    },
    outcome_history: [],
    reflection_history: [],
    last_reflection_at: "",
  };

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Initialize custom SQLite schemas inside the DO local storage
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS conversation_turns (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        role TEXT,
        content TEXT,
        model TEXT,
        context_hits INTEGER,
        created_at TEXT
      )
    `);

    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS session_proposals (
        id TEXT PRIMARY KEY,
        title TEXT,
        summary TEXT,
        confidence REAL,
        status TEXT,
        created_at TEXT,
        decided_at TEXT
      )
    `);

    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS reasoning_logs (
        id TEXT PRIMARY KEY,
        query TEXT,
        reasoning TEXT,
        model TEXT,
        context_hits INTEGER,
        created_at TEXT
      )
    `);
  }

  @callable()
  async initTwin(userId: string, tenantId: string) {
    this.setState({
      ...this.state,
      user_id: userId,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    });
  }

  async onStart() {
    try {
      await this.schedule("0 5 * * *", "dailyReflection", {
        user_id: this.state.user_id,
        tenant_id: this.state.tenant_id,
      });
    } catch {
      // already scheduled
    }
  }

  // ─── Chat Implementation ───────────────────────────────────────────────────

  @callable()
  async chat(params: ChatParams) {
    const tenantId = this.state.tenant_id || this.env.DEFAULT_TENANT_ID;
    const userId = this.state.user_id;
    const sessionId = params.session_id || this.state.session_id || crypto.randomUUID();

    // 1. Continuity-first grounding + activation gate (R8 / R12).
    //    The Twin reads governed Continuity as its primary source and only
    //    activates when continuity exists — it never answers blind.
    const continuity = await assembleContinuity(this.env, tenantId, { userId });
    const activation = evaluateActivation(
      { totalMemories: continuity?.totalMemories ?? 0 },
      continuity?.activationThresholds
    );

    if (!activation.active) {
      const forming =
        "I'm still building continuity for your workspace, so I don't yet have enough grounded " +
        "context to answer reliably. " +
        activation.reasons.join(" ") +
        " Once your connectors finish hydrating and a few memories form, I'll activate automatically.";
      const nowTs = new Date().toISOString();
      this.ctx.storage.sql.exec(
        "INSERT INTO conversation_turns (id, session_id, role, content, model, context_hits, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        crypto.randomUUID(),
        sessionId,
        "user",
        params.message,
        "",
        0,
        nowTs
      );
      this.setState({
        ...this.state,
        session_id: sessionId,
        last_message: params.message,
        last_reply: forming,
        context_hits: 0,
        updated_at: nowTs,
      });
      // Audit the withheld activation (best-effort).
      try {
        await emitTriageInput(this.env, tenantId, {
          session_id: sessionId,
          agent_id: `twin:${userId}`,
          content: `Twin activation withheld: ${activation.reasons.join("; ")}`,
          kind: "twin_session",
        });
      } catch {
        /* non-fatal */
      }
      return {
        reply: forming,
        model: "none",
        activation,
        hasContext: false,
        context_hits: 0,
        session_id: sessionId,
      };
    }

    // 2. Context retrieval — Continuity is the PRIMARY grounding, then Spine/search.
    let retrieved = { context: "", count: 0 };
    if (params.use_knowledge !== false) {
      retrieved = await retrieveContext(this.env, tenantId, params.message);
    }
    const continuityText = continuityContext(continuity);
    if (continuityText) {
      retrieved = {
        context: retrieved.context ? `${continuityText}\n\n${retrieved.context}` : continuityText,
        count: retrieved.count + (continuity?.totalMemories ?? 0),
      };
    }

    // 2. Query recent turns from DO SQLite for warm history
    const historyCursor = this.ctx.storage.sql.exec(
      "SELECT role, content FROM conversation_turns WHERE session_id = ? ORDER BY created_at DESC LIMIT 10",
      sessionId
    );
    const history: Array<{ role: string; content: string }> = [];
    for (const row of historyCursor) {
      history.unshift({ role: String(row.role), content: String(row.content) });
    }

    // 3. Assemble system prompt
    const profileBlock = buildLearnedProfileBlock(this.state.learned_profile);
    const systemPrompt = buildTwinSystemPrompt(profileBlock, retrieved.context || undefined);

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: params.message },
    ];

    // 4. Invoke LLM via Live Intelligence
    const result = await gatewayChat(this.env, messages as any, this.env.DEFAULT_CHAT_MODEL);

    const now = new Date().toISOString();
    const userTurnId = crypto.randomUUID();
    const assistantTurnId = crypto.randomUUID();

    // 5. Persist turns into DO SQLite
    this.ctx.storage.sql.exec(
      "INSERT INTO conversation_turns (id, session_id, role, content, model, context_hits, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      userTurnId,
      sessionId,
      "user",
      params.message,
      "",
      0,
      now
    );
    this.ctx.storage.sql.exec(
      "INSERT INTO conversation_turns (id, session_id, role, content, model, context_hits, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      assistantTurnId,
      sessionId,
      "assistant",
      result.reply,
      result.model,
      retrieved.count,
      now
    );

    // 6. Update general DO state
    this.setState({
      ...this.state,
      session_id: sessionId,
      last_message: params.message,
      last_reply: result.reply,
      context_hits: retrieved.count,
      updated_at: now,
    });

    // 7. Emit session event to Continuity (best-effort)
    try {
      await emitTriageInput(this.env, tenantId, {
        session_id: sessionId,
        agent_id: `twin:${userId}`,
        content: `User: ${params.message}\n\nTwin: ${result.reply}`,
        kind: "twin_session",
      });
    } catch (err: any) {
      console.error("[Twin Agent] Failed to emit session event to Continuity:", err.message);
    }

    // 8. Broadcast update
    this.broadcast(
      JSON.stringify({
        type: "twin-chat",
        user_id: userId,
        session_id: sessionId,
        message: params.message,
        reply: result.reply,
        context_hits: retrieved.count,
      })
    );

    return {
      reply: result.reply,
      model: result.model,
      user_id: userId,
      session_id: sessionId,
      hasContext: Boolean(retrieved.context),
      context_hits: retrieved.count,
    };
  }

  // ─── Morning Brief ────────────────────────────────────────────────────────

  @callable()
  async getMorningBrief(params?: { focus?: string }) {
    const tenantId = this.state.tenant_id || this.env.DEFAULT_TENANT_ID;
    const userId = this.state.user_id;

    const query =
      params?.focus || "daily priorities, open signals, recent decisions, founder context";
    const retrieved = await retrieveContext(this.env, tenantId, query);

    const systemPrompt = buildTwinSystemPrompt(
      buildLearnedProfileBlock(this.state.learned_profile),
      retrieved.context || undefined,
      `Task: Produce a crisp, strategic Daily Morning Brief for ${userId}.\nStructure: Overview, Key Signals, Proposals, Recommended Focus Areas.\nGround strictly in context.`
    );

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate the brief now." },
    ];

    const result = await gatewayChat(this.env, messages as any);
    const brief = result.reply;

    this.setState({
      ...this.state,
      last_brief: brief,
      context_hits: retrieved.count,
      updated_at: new Date().toISOString(),
    });

    try {
      await emitTriageInput(this.env, tenantId, {
        session_id: this.state.session_id || crypto.randomUUID(),
        agent_id: `twin:${userId}`,
        content: `Twin generated brief for ${userId}.\n\n${brief}`,
        kind: "twin_session",
      });
    } catch (err: any) {
      console.error("[Twin Agent] Failed to emit morning brief event to Continuity:", err.message);
    }

    this.broadcast(JSON.stringify({ type: "twin-brief", user_id: userId, brief }));
    return { brief, model: result.model };
  }

  // ─── Reasoning ─────────────────────────────────────────────────────────────

  @callable()
  async reason(params: { message: string; use_knowledge?: boolean; session_id?: string }) {
    const tenantId = this.state.tenant_id || this.env.DEFAULT_TENANT_ID;
    const userId = this.state.user_id;
    const sessionId = params.session_id || this.state.session_id || crypto.randomUUID();

    let retrieved = { context: "", count: 0 };
    if (params.use_knowledge !== false) {
      retrieved = await retrieveContext(this.env, tenantId, params.message);
    }

    const systemPrompt = buildTwinSystemPrompt(
      buildLearnedProfileBlock(this.state.learned_profile),
      retrieved.context || undefined,
      "Task: Perform deep reasoning. Clear sections: Situation, Analysis, Recommended Stance."
    );

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: params.message },
    ];

    const result = await gatewayChat(this.env, messages as any);
    const logId = crypto.randomUUID();

    this.ctx.storage.sql.exec(
      "INSERT INTO reasoning_logs (id, query, reasoning, model, context_hits, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      logId,
      params.message,
      result.reply,
      result.model,
      retrieved.count,
      new Date().toISOString()
    );

    this.setState({
      ...this.state,
      last_reasoning: result.reply,
      context_hits: retrieved.count,
      updated_at: new Date().toISOString(),
    });

    return { reasoning: result.reply, model: result.model };
  }

  // ─── Proposals ─────────────────────────────────────────────────────────────

  @callable()
  async propose(params: { title: string; summary: string; confidence?: number }) {
    const tenantId = this.state.tenant_id || this.env.DEFAULT_TENANT_ID;
    const proposalId = crypto.randomUUID();
    const now = new Date().toISOString();

    this.ctx.storage.sql.exec(
      "INSERT INTO session_proposals (id, title, summary, confidence, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      proposalId,
      params.title,
      params.summary,
      params.confidence ?? 0.7,
      "proposed",
      now
    );

    const updatedProposals = [
      {
        id: proposalId,
        title: params.title,
        summary: params.summary,
        confidence: params.confidence ?? 0.7,
        status: "proposed" as const,
        created_at: now,
      },
      ...this.state.active_proposals,
    ].slice(0, 20);

    this.setState({
      ...this.state,
      active_proposals: updatedProposals,
      updated_at: now,
    });

    // Ingest the proposal signal into the TenantBrainDO via service binding
    if (this.env.TENANT_BRAIN) {
      try {
        const brainId = this.env.TENANT_BRAIN.idFromName(tenantId);
        const brain = this.env.TENANT_BRAIN.get(brainId);

        await brain.fetch(
          new Request(`http://internal/do/brain/${tenantId}/approval`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-id": tenantId,
            },
            body: JSON.stringify({
              proposal_id: proposalId,
              title: params.title,
              summary: params.summary,
              confidence: params.confidence ?? 0.7,
            }),
          })
        );
      } catch (err: any) {
        console.error("[Twin Propose] Failed to register approval in TenantBrainDO:", err.message);
      }
    }

    return { proposalId, status: "proposed" };
  }

  // ─── Execution Package (first-class handoff artifact) ─────────────────────
  // Twin produces a formal Execution Package after reasoning + approval.
  // This is the handoff document the customer plugs into their own agent/runtime.
  // Lifecycle: Proposal → Approved → Execution Package Created → Exported → Awaiting Outcome → Outcome Received → Memory Updated
  // Enables lineage, audit, observability, replay without IW running execution.
  @callable()
  async generateExecutionHandoff(params: {
    workflows?: string[];
    tools?: string[];
    instructions?: string;
    relatedProposalIds?: string[];
  }) {
    const tenantId = this.state.tenant_id || this.env.DEFAULT_TENANT_ID;
    const packageId = `epkg:${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const executionPackage = {
      id: packageId,
      version: "1.0",
      source: "IntegrateWise Twin",
      tenantId,
      createdAt: now,
      status: "exported",
      title: "Execution Package",
      // What to execute
      workflows: params.workflows || [],
      tools: params.tools || [],
      executionInstructions:
        params.instructions ||
        "Execute these in your environment (Hermes / Claw / LangGraph / CrewAI / n8n / internal agent). " +
          "Use the provided context from the Spine. Report structured outcomes back via MCP or /v1/outcomes for memory sync.",
      // Context anchors
      relatedProposalIds: params.relatedProposalIds || [],
      contextSummary: "See attached Twin reasoning + approved proposals for full context.",
      // Customer responsibilities
      note: "This Execution Package is for YOUR infrastructure only. IW does not execute. All writebacks and data edits sync back to source tools.",
      // For observability
      lineage: {
        proposedBy: "twin",
        approved: true,
        exportedAt: now,
      },
    };

    // Persist to D1 as first-class entity (spine)
    if (this.env.D1) {
      try {
        await this.env.D1.prepare(
          `INSERT OR REPLACE INTO execution_packages 
           (id, tenant_id, title, status, proposal_id, approval_id, workflow_json, tools_json, context_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            executionPackage.id,
            tenantId,
            executionPackage.title || "Execution Package",
            executionPackage.status,
            null, // link later via proposal
            null,
            JSON.stringify(executionPackage.workflows || []),
            JSON.stringify(executionPackage.tools || []),
            JSON.stringify({ context: executionPackage.contextSummary || {} }),
            now,
            now
          )
          .run();
      } catch (e) {
        console.error("[Twin] Failed to persist execution_package to D1", e);
      }
    }

    // Also keep in DO state for quick runtime access
    const currentHandoffs = this.state.handoffs || [];
    this.setState({
      ...this.state,
      handoffs: [executionPackage, ...currentHandoffs].slice(0, 20),
      updated_at: now,
    });

    return executionPackage;
  }

  @callable()
  async listHandoffs() {
    return (this.state.handoffs || []).slice(0, 10);
  }

  // ─── Reflection Loop ───────────────────────────────────────────────────────

  async dailyReflection(payload?: any) {
    const tenantId = this.state.tenant_id || this.env.DEFAULT_TENANT_ID;
    const userId = this.state.user_id;

    console.log(`[Twin Reflection] Running daily reflection sweep for user ${userId}`);

    // Retrieve context to reflect on (recent turns & proposals)
    const context = await retrieveContext(
      this.env,
      tenantId,
      "recent objectives, focus priorities, lessons"
    );

    const systemPrompt = `You are the daily reflection process for the Twin Agent. Synthesize recent lessons, success patterns, and update the learned profile parameters.`;
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context: ${context.context}. Distill lessons and priorities.` },
    ];

    try {
      const result = await gatewayChat(this.env, messages as any);

      const newLessons = [
        result.reply.slice(0, 200),
        ...(this.state.learned_profile?.recent_lessons || []),
      ].slice(0, 5);

      this.setState({
        ...this.state,
        learned_profile: {
          recent_lessons: newLessons,
          focus_priorities: this.state.learned_profile?.focus_priorities || [
            "operational continuity",
          ],
          communication_style:
            this.state.learned_profile?.communication_style || "concise, strategic",
          success_patterns: this.state.learned_profile?.success_patterns || [],
          risk_tolerance_signals: this.state.learned_profile?.risk_tolerance_signals || [],
          last_daily_reflection: new Date().toISOString(),
          profile_version: (this.state.learned_profile?.profile_version || 1) + 1,
        },
        last_reflection_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return { success: true, version: this.state.learned_profile?.profile_version };
    } catch (err: any) {
      console.error("[Twin Reflection] Reflection failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  @callable()
  async triggerDailyReflection() {
    return this.dailyReflection();
  }

  @callable()
  async getState() {
    return this.state;
  }

  @callable()
  async getLearnedProfile() {
    return this.state.learned_profile;
  }
}

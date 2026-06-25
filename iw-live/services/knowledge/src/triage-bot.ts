/**
 * Triage Bot — Cloudflare Workers AI + Slack notification
 *
 * Two modes of operation:
 * 1. Cloudflare Workers AI — extracts knowledge from conversations (edge-native)
 * 2. Slack Bot — sends triage items to a Slack channel for review
 *    Customer reacts: ✅ Approve, ❌ Discard, ⏰ Defer
 *
 * AI Provider Priority:
 * 1. Cloudflare Workers AI (env.AI) — edge-native, zero external calls
 * 2. OpenRouter (env.OPENROUTER_API_KEY) — fallback for larger models
 *
 * The Triage Bot NEVER auto-approves. Every extraction requires customer review
 * either in the workspace Triage Inbox or via Slack reactions.
 */

import { neon } from "@neondatabase/serverless";
import { AIProvider } from "@integratewise/lib";

interface TriageBotEnv {
  DB: D1Database;
  DATABASE_URL: string;
  AI?: Ai;
  GITHUB_TOKEN?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  VERCEL_TOKEN?: string;
  XAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OPENCODE_API_KEY?: string;
  SLACK_BOT_TOKEN?: string;
  SLACK_TRIAGE_CHANNEL?: string;
}

interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface TriageExtraction {
  memory_type: "insight" | "preference" | "fact" | "decision" | "action_item" | "relationship";
  content: string;
  priority: "high" | "medium" | "low";
  category: string;
  confidence: number;
  sentiment: "positive" | "neutral" | "negative";
  reasoning: string;
}

interface TriageResult {
  extracted: number;
  triageIds: string[];
  slackNotified: boolean;
}

const EXTRACTION_PROMPT = `You are a knowledge extraction bot for a business intelligence platform.

Analyze the following conversation and extract valuable knowledge items.

Extract ONLY items useful as persistent organizational memory. Skip small talk and trivial exchanges.

Categories:
- insight: A business insight or observation
- fact: A concrete fact about a customer, product, market, or process
- decision: A decision that was made
- action_item: A task or follow-up committed to
- preference: A user or customer preference
- relationship: A relationship between entities

For each extraction provide JSON with: memory_type, content (1-3 sentences), priority (high/medium/low), category (short label), confidence (0.0-1.0), sentiment (positive/neutral/negative), reasoning (1 sentence why this matters).

Respond with a JSON array. If nothing worth extracting, return [].`;

/**
 * Extract knowledge from a conversation and write to triage_results.
 * Optionally notifies via Slack for review.
 */
export async function triageConversation(
  conversationId: string,
  tenantId: string,
  userId: string,
  env: TriageBotEnv
): Promise<TriageResult> {
  const { results: messages } = await env.DB.prepare(
    `SELECT id, role, content, created_at FROM ai_messages
     WHERE conversation_id = ? ORDER BY created_at ASC`
  )
    .bind(conversationId)
    .all<ConversationMessage>();

  if (!messages || messages.length < 2) {
    return { extracted: 0, triageIds: [], slackNotified: false };
  }

  const conversationText = messages.map((m) => `[${m.role}]: ${m.content}`).join("\n\n");

  // Extract knowledge using Cloudflare Workers AI
  let extractions: TriageExtraction[] = [];
  try {
    extractions = await callWorkersAI(conversationText, env);
  } catch (err) {
    console.error("[TriageBot] AI extraction failed:", err);
    return { extracted: 0, triageIds: [], slackNotified: false };
  }

  if (extractions.length === 0) {
    return { extracted: 0, triageIds: [], slackNotified: false };
  }

  // Write to triage_results
  const sql = neon(env.DATABASE_URL);
  const triageIds: string[] = [];

  for (const extraction of extractions) {
    const triageId = crypto.randomUUID();
    try {
      await sql`
        INSERT INTO triage_results (
          id, message_id, platform, content, priority, category,
          confidence, reasoning, sentiment, approval_status, metadata, created_at
        ) VALUES (
          ${triageId}, ${conversationId}, ${"ai_conversation"},
          ${extraction.content}, ${extraction.priority}, ${extraction.category},
          ${extraction.confidence}, ${extraction.reasoning}, ${extraction.sentiment},
          ${"pending"},
          ${JSON.stringify({
            tenant_id: tenantId,
            user_id: userId,
            conversation_id: conversationId,
            memory_type: extraction.memory_type,
            message_count: messages.length,
            extracted_at: new Date().toISOString(),
          })},
          ${new Date().toISOString()}
        )
      `;
      triageIds.push(triageId);
    } catch (err) {
      console.error("[TriageBot] Failed to write triage result:", err);
    }
  }

  // Notify via Slack if configured
  let slackNotified = false;
  if (env.SLACK_BOT_TOKEN && env.SLACK_TRIAGE_CHANNEL && triageIds.length > 0) {
    try {
      await notifySlackTriage(env, tenantId, triageIds, extractions);
      slackNotified = true;
    } catch (err) {
      console.warn("[TriageBot] Slack notification failed (non-blocking):", err);
    }
  }

  return { extracted: triageIds.length, triageIds, slackNotified };
}

// ── Cloudflare Workers AI (primary) ──────────────────────────────────────────

async function callWorkersAI(
  conversationText: string,
  env: TriageBotEnv
): Promise<TriageExtraction[]> {
  const userMessage = `Here is the conversation to analyze:\n\n${conversationText.slice(0, 8000)}`;

  // 1. Try Cloudflare Workers AI first (edge-native, no external API calls)
  if (env.AI) {
    try {
      const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct" as any, {
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2000,
      });
      const parsed = parseExtractions((response as any).response || "");
      if (parsed.length > 0) return parsed;
    } catch (err) {
      console.warn("[TriageBot] Workers AI failed, trying Universal Fallback:", err);
    }
  }

  // 2. Universal AI Fallback
  const aiProvider = new AIProvider({
    githubToken: env.GITHUB_TOKEN,
    openaiApiKey: env.OPENAI_API_KEY,
    googleApiKey: env.GOOGLE_API_KEY,
    vercelToken: env.VERCEL_TOKEN,
    xaiApiKey: env.XAI_API_KEY,
    openrouterApiKey: env.OPENROUTER_API_KEY,
    opencodeApiKey: env.OPENCODE_API_KEY,
  });

  if (aiProvider.isConfigured) {
    try {
      const response = await aiProvider.complete(
        [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: userMessage },
        ],
        {
          max_tokens: 2000,
        }
      );

      const parsed = parseExtractions(response.content || "");
      if (parsed.length > 0) return parsed;
    } catch (err) {
      console.error("[TriageBot] Universal AI Fallback failed:", err);
    }
  }

  return [];
}

// ── Slack Triage Notification ────────────────────────────────────────────────

const PRIORITY_EMOJI: Record<string, string> = {
  high: "🔴",
  medium: "🟡",
  low: "🔵",
};

const TYPE_EMOJI: Record<string, string> = {
  insight: "💡",
  fact: "📌",
  decision: "⚖️",
  action_item: "✅",
  preference: "⭐",
  relationship: "🔗",
};

async function notifySlackTriage(
  env: TriageBotEnv,
  tenantId: string,
  triageIds: string[],
  extractions: TriageExtraction[]
): Promise<void> {
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_TRIAGE_CHANNEL) return;

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🧠 Triage Bot — ${extractions.length} items for review`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `React to approve/discard: ✅ = Approve  ❌ = Discard  ⏰ = Defer`,
        },
      ],
    },
    { type: "divider" },
  ];

  for (let i = 0; i < Math.min(extractions.length, 10); i++) {
    const ext = extractions[i];
    const typeEmoji = TYPE_EMOJI[ext.memory_type] || "📝";
    const priorityEmoji = PRIORITY_EMOJI[ext.priority] || "🔵";

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${typeEmoji} *${ext.memory_type}* ${priorityEmoji} _${ext.priority}_ (${Math.round(ext.confidence * 100)}%)\n${ext.content}\n_${ext.reasoning}_`,
      },
    });

    if (i < extractions.length - 1) {
      blocks.push({ type: "divider" });
    }
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Tenant: \`${tenantId.slice(0, 8)}...\` | IDs: ${triageIds.map((id) => `\`${id.slice(0, 8)}\``).join(", ")}`,
      },
    ],
  });

  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      channel: env.SLACK_TRIAGE_CHANNEL,
      text: `🧠 Triage Bot: ${extractions.length} items for review`,
      blocks,
    }),
  });
}

// ── Parse AI Response ────────────────────────────────────────────────────────

function parseExtractions(raw: string): TriageExtraction[] {
  if (!raw || raw.trim().length === 0) return [];

  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item: any) => item.content && item.memory_type)
      .map((item: any) => ({
        memory_type: item.memory_type || "insight",
        content: String(item.content).slice(0, 1000),
        priority: ["high", "medium", "low"].includes(item.priority) ? item.priority : "medium",
        category: String(item.category || "general").slice(0, 100),
        confidence:
          typeof item.confidence === "number" ? Math.min(1, Math.max(0, item.confidence)) : 0.7,
        sentiment: ["positive", "neutral", "negative"].includes(item.sentiment)
          ? item.sentiment
          : "neutral",
        reasoning: String(item.reasoning || "Extracted from conversation").slice(0, 500),
      }));
  } catch {
    return [];
  }
}

import { D1Database } from "@cloudflare/workers-types";

export interface EvolutionaryEvent {
  type:
    | "agent_log"
    | "session_summary"
    | "task_event"
    | "kanban_snapshot"
    | "plan_registry"
    | "knowledge_evolution";
  topicKey: string; // The canonical ID/slug for this chapter in the Book of Projects (e.g. "adaptive_resolver", "memory_architecture")
  topicTitle: string; // E.g., "Memory As Adaptive Resolver"
  tenantId: string;
  eventTitle: string; // E.g., "Seed Form", "Correction: Memory Is Cache"
  content: string; // The raw content/description of what happened
  metadata?: Record<string, any>;
  sessionSource?: string;
}

export interface IntelligenceEnv {
  D1: D1Database;
  AI_SEARCH?: any; // AI Search Namespace (optional — semantic vector sink is guarded; write skips gracefully when absent)
  OPENROUTER_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

/**
 * Uploads high-level cognitive and execution states to AI Search as the Evolutionary Memory.
 * Strictly adheres to the Book of Projects / Concept Lineage Doctrine.
 */
export async function uploadEvolutionaryMemory(
  env: IntelligenceEnv,
  event: EvolutionaryEvent
): Promise<void> {
  const chapterId = `lineage_${event.topicKey}`;
  const now = new Date();
  const formattedDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // 1. Fetch Existing Chapter from D1 (org_memory)
  let existingContent = "";
  let existingIterationCount = 0;

  try {
    const existingRow = await env.D1.prepare(
      "SELECT content, metadata FROM org_memory WHERE id = ? AND tenant_id = ?"
    )
      .bind(chapterId, event.tenantId)
      .first();

    if (existingRow && existingRow.content) {
      existingContent = existingRow.content as string;
      // Very basic extraction of the iteration count
      const matches = [...existingContent.matchAll(/ITERATION (\d+)/g)];
      if (matches.length > 0) {
        existingIterationCount = Math.max(...matches.map((m) => parseInt(m[1])));
      }
    }
  } catch (err: any) {
    console.warn(
      `[EvolutionaryMemory] Failed to read from D1 for chapter ${chapterId}:`,
      err.message
    );
  }

  const nextIteration = existingIterationCount + 1;
  let newPreface = "";

  // 2. Synthesize New Preface via LLM (if chapter exists)
  if (existingContent && (env.OPENROUTER_API_KEY || env.OPENAI_API_KEY)) {
    try {
      newPreface = await synthesizePreface(env, event.topicTitle, existingContent, event.content);
    } catch (err: any) {
      console.error(`[EvolutionaryMemory] LLM Synthesis failed:`, err.message);
      newPreface = `(Synthesis failed. Appending new iteration statically.)\n\n${event.content.substring(0, 500)}...`;
    }
  } else if (!existingContent) {
    // First pass — the event content essentially forms the baseline preface
    newPreface = `This topic was initialized with the following core event:\n\n${event.content.substring(0, 500)}...\n\n(This overview will evolve as new events are appended).`;
  } else {
    // Fallback if no LLM key
    newPreface = `(LLM unavailable. Manual synthesis required. New event appended below.)`;
  }

  // 3. Construct the Concept Lineage Markdown
  const markdown = constructLineageMarkdown(
    event,
    chapterId,
    nextIteration,
    newPreface,
    existingContent,
    formattedDate
  );

  // 4. Dual-Write to D1 and AI Search

  // A. Write to D1 org_memory (Canonical Truth / Text Store)
  try {
    const combinedMetadata = {
      type: event.type,
      topic_key: event.topicKey,
      topic_title: event.topicTitle,
      latest_iteration: nextIteration,
      updated_at: now.toISOString(),
      ...event.metadata,
    };

    await env.D1.prepare(
      `
      INSERT INTO org_memory (id, tenant_id, category, title, content, governance_state, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'published', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        content = excluded.content,
        updated_at = excluded.updated_at,
        metadata = excluded.metadata
    `
    )
      .bind(
        chapterId,
        event.tenantId,
        "concept_lineage",
        event.topicTitle,
        markdown,
        JSON.stringify(combinedMetadata),
        now.toISOString(),
        now.toISOString()
      )
      .run();

    console.log(`[EvolutionaryMemory] Successfully persisted chapter ${chapterId} to D1.`);
  } catch (err: any) {
    console.error(`[EvolutionaryMemory] Failed to write chapter ${chapterId} to D1:`, err.message);
  }

  // B. Write to AI Search (Semantic Vector Sink)
  if (env.AI_SEARCH) {
    try {
      const aiSearch = env.AI_SEARCH.get("integratewise-knowledge");
      if (aiSearch) {
        await aiSearch.items.upload(chapterId, markdown, {
          type: event.type,
          tenant_id: event.tenantId,
          topic_key: event.topicKey,
          title: event.topicTitle,
          iteration: nextIteration,
        });
        console.log(
          `[EvolutionaryMemory] Successfully uploaded chapter ${chapterId} to AI Search.`
        );
      }
    } catch (err: any) {
      console.error(
        `[EvolutionaryMemory] Failed to upload chapter ${chapterId} to AI Search:`,
        err.message
      );
    }
  }
}

/**
 * Invokes OpenRouter (or OpenAI) to synthesize the existing chapter's context with the new event.
 */
async function synthesizePreface(
  env: IntelligenceEnv,
  title: string,
  existingContent: string,
  newEvent: string
): Promise<string> {
  const apiKey = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY;
  const baseUrl = env.OPENROUTER_API_KEY
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const model = env.OPENROUTER_API_KEY ? "anthropic/claude-3.5-sonnet:beta" : "gpt-4o";

  const prompt = `You are the IntegrateWise Memory Compiler.
You manage the "Book of Projects", maintaining the Evolutionary Memory of the organization.
You are given an existing Chapter (with its history) and a NEW Event that just occurred.

Your ONLY job is to write a NEW Preface/Overview for the chapter. 
The Preface must synthesize the old context with the new development.
Do NOT output the raw new event or the old iterations. Output ONLY the new 2-4 paragraph overview that summarizes the current, evolving state of this topic.

TOPIC: ${title}

--- EXISTING CHAPTER CONTENT ---
${existingContent}

--- NEW EVENT TO INTEGRATE ---
${newEvent}

Please write the updated overview/preface now (output just the text):`;

  const req = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!req.ok) {
    throw new Error(`LLM synthesis failed: ${req.status} ${req.statusText}`);
  }

  const res = (await req.json()) as any;
  return res.choices[0].message.content.trim();
}

/**
 * Assembles the Concept Lineage document strictly adhering to the formatting rules.
 */
function constructLineageMarkdown(
  event: EvolutionaryEvent,
  _chapterId: string,
  nextIteration: number,
  newPreface: string,
  existingContent: string,
  formattedDate: string
): string {
  // If this is the very first pass
  if (nextIteration === 1) {
    return `Concept Lineage — ${event.topicTitle}

First written: ${formattedDate}
Type: ${event.type}
Session source: ${event.sessionSource || "N/A"}

This file grows. Iterations are never removed. Each layer is permanent.

CONCEPT: ${event.topicTitle}

--- OVERVIEW (LATEST SYNTHESIS) ---
${newPreface}

ITERATION 1 — ${event.eventTitle}

Date: ${formattedDate}
Source: ${event.sessionSource || "system"}

${event.content}

CURRENT SETTLED FORM (as of ${formattedDate})
(See Overview above)

FUTURE ITERATIONS
(add below as this concept evolves — never delete above layers)
`;
  }

  // If evolving an existing chapter, we inject the new preface at the top, and append the new iteration at the bottom (before FUTURE ITERATIONS).
  // 1. Strip the old OVERVIEW
  let modifiedHistory = existingContent;
  const overviewRegex = /--- OVERVIEW \(LATEST SYNTHESIS\) ---[\s\S]*?(?=ITERATION 1)/;
  if (overviewRegex.test(modifiedHistory)) {
    modifiedHistory = modifiedHistory.replace(
      overviewRegex,
      `--- OVERVIEW (LATEST SYNTHESIS) ---\n${newPreface}\n\n`
    );
  } else {
    // If it didn't have the overview section, insert it before ITERATION 1
    modifiedHistory = modifiedHistory.replace(
      "CONCEPT: " + event.topicTitle + "\n",
      `CONCEPT: ${event.topicTitle}\n\n--- OVERVIEW (LATEST SYNTHESIS) ---\n${newPreface}\n\n`
    );
  }

  // 2. Append the new iteration right before "CURRENT SETTLED FORM" or "FUTURE ITERATIONS"
  const newIterationBlock = `\nITERATION ${nextIteration} — ${event.eventTitle}\n\nDate: ${formattedDate}\nSource: ${event.sessionSource || "system"}\n\n${event.content}\n`;

  if (modifiedHistory.includes("CURRENT SETTLED FORM")) {
    modifiedHistory = modifiedHistory.replace(/(?=CURRENT SETTLED FORM)/, newIterationBlock + "\n");
  } else if (modifiedHistory.includes("FUTURE ITERATIONS")) {
    modifiedHistory = modifiedHistory.replace(/(?=FUTURE ITERATIONS)/, newIterationBlock + "\n");
  } else {
    modifiedHistory += "\n" + newIterationBlock;
  }

  return modifiedHistory;
}

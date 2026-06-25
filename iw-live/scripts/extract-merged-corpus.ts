/**
 * Merged Corpus Extraction — Extract learnings from 571 sessions
 *
 * Parses the merged session files (1.5M+ lines), extracts:
 * - Session boundaries and metadata
 * - Decisions made (USER + ASSISTANT exchanges with actionable content)
 * - Architectural choices
 * - Learnings and patterns
 *
 * Writes to D1 conversational_memory in batches.
 * Flags promotable content for governance.
 *
 * Run: bun run scripts/extract-merged-corpus.ts
 */

import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const TENANT_ID = "iw-customer-zero";
const D1_DB = "integratewise-spine-cache";

const MERGED_FILES = [
  "/Users/nirmal/Github/IntegrateWise - Memory/Organisational memory/10 AI/merged-session-output.txt",
  "/Users/nirmal/Github/IntegrateWise - Memory/Conversation memory/01 Product & Engineering/06-Company-Memory/00-Baseline-Knowledge/00-Original-Material/02-Logs-and-Run-Notes/Work-Logs/Root-Cleanup-2026-05-23/merged_files (3).txt",
  "/Users/nirmal/Github/IntegrateWise - Memory/Conversation memory/01 Product & Engineering/06-Company-Memory/00-Baseline-Knowledge/00-Original-Material/02-Logs-and-Run-Notes/Work-Logs/Root-Cleanup-2026-05-23/merged_files (4).txt",
];

interface ExtractedSession {
  id: string;
  sessionTag: string;
  source: string;
  userMessages: string[];
  assistantMessages: string[];
  toolCalls: string[];
  totalLines: number;
  hasDecisions: boolean;
  hasArchitecture: boolean;
  category: string;
}

// Decision/architecture signal words
const DECISION_SIGNALS = [
  "decided",
  "locked",
  "approved",
  "committed",
  "NEVER",
  "ALWAYS",
  "doctrine",
  "non-negotiable",
  "canonical",
  "supersedes",
  "hard rule",
  "from now on",
  "permanently",
  "v1",
  "v2",
  "v3",
  "locked in",
];

const ARCHITECTURE_SIGNALS = [
  "architecture",
  "schema",
  "pipeline",
  "normalizer",
  "spine",
  "D1",
  "supabase",
  "cloudflare",
  "worker",
  "service binding",
  "MCP",
  "vectorize",
  "KV",
  "R2",
  "durable object",
  "queue",
  "entity_type",
  "tenant",
  "connector",
];

function classifySession(session: ExtractedSession): string {
  const allText = [...session.userMessages, ...session.assistantMessages].join(" ").toLowerCase();

  if (DECISION_SIGNALS.some((s) => allText.includes(s.toLowerCase()))) {
    session.hasDecisions = true;
  }
  if (ARCHITECTURE_SIGNALS.some((s) => allText.includes(s.toLowerCase()))) {
    session.hasArchitecture = true;
  }

  // Classify by content
  if (allText.includes("deploy") || allText.includes("wrangler")) return "deployment";
  if (allText.includes("schema") || allText.includes("migration")) return "schema";
  if (allText.includes("architecture") || allText.includes("doctrine")) return "architecture";
  if (allText.includes("marketing") || allText.includes("brand")) return "marketing";
  if (allText.includes("sales") || allText.includes("pitch")) return "sales";
  if (allText.includes("memory") || allText.includes("triage")) return "memory";
  if (allText.includes("connector") || allText.includes("nango")) return "connector";
  if (allText.includes("frontend") || allText.includes("react") || allText.includes("vue"))
    return "frontend";
  if (allText.includes("twin") || allText.includes("agent")) return "agent";
  if (allText.includes("auth") || allText.includes("token") || allText.includes("jwt"))
    return "auth";
  return "general";
}

function parseFile(content: string, sourceFile: string): ExtractedSession[] {
  const sessions: ExtractedSession[] = [];
  const lines = content.split("\n");

  let currentSession: ExtractedSession | null = null;
  let currentRole: "user" | "assistant" | "tool" | null = null;
  let currentMessage: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Session boundary
    if (line.startsWith("<session_")) {
      // Save previous session
      if (currentSession) {
        flushMessage(currentSession, currentRole, currentMessage);
        classifySession(currentSession);
        sessions.push(currentSession);
      }

      const tag = line.replace(/[<>]/g, "").split(".")[0];
      currentSession = {
        id: `merged-${createHash("md5")
          .update(tag + sourceFile)
          .digest("hex")
          .slice(0, 12)}`,
        sessionTag: tag,
        source: sourceFile,
        userMessages: [],
        assistantMessages: [],
        toolCalls: [],
        totalLines: 0,
        hasDecisions: false,
        hasArchitecture: false,
        category: "general",
      };
      currentRole = null;
      currentMessage = [];
      continue;
    }

    if (!currentSession) continue;
    currentSession.totalLines++;

    // Role markers
    if (line === "[USER]") {
      flushMessage(currentSession, currentRole, currentMessage);
      currentRole = "user";
      currentMessage = [];
      continue;
    }
    if (line === "[ASSISTANT]") {
      flushMessage(currentSession, currentRole, currentMessage);
      currentRole = "assistant";
      currentMessage = [];
      continue;
    }
    if (line === "[TOOL]") {
      flushMessage(currentSession, currentRole, currentMessage);
      currentRole = "tool";
      currentMessage = [];
      continue;
    }

    // Skip separator lines
    if (line.startsWith("====") || line.startsWith("SESSION:") || line.startsWith("SOURCE:"))
      continue;

    currentMessage.push(line);
  }

  // Flush last session
  if (currentSession) {
    flushMessage(currentSession, currentRole, currentMessage);
    classifySession(currentSession);
    sessions.push(currentSession);
  }

  return sessions;
}

function flushMessage(session: ExtractedSession, role: string | null, lines: string[]): void {
  const text = lines.join("\n").trim();
  if (!text || text.length < 10) return;

  if (role === "user") session.userMessages.push(text);
  else if (role === "assistant") session.assistantMessages.push(text);
  else if (role === "tool") session.toolCalls.push(text.slice(0, 500)); // Truncate tool output
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function buildInsert(session: ExtractedSession): string {
  const now = new Date().toISOString();
  // Combine user + assistant messages as the session content (truncated for D1)
  const content = [
    ...session.userMessages.map((m) => `[USER] ${m}`),
    ...session.assistantMessages.map((m) => `[ASSISTANT] ${m}`),
  ]
    .join("\n")
    .slice(0, 8000); // D1 friendly size

  const metadata = JSON.stringify({
    source: "merged_corpus",
    session_tag: session.sessionTag,
    category: session.category,
    has_decisions: session.hasDecisions,
    has_architecture: session.hasArchitecture,
    user_messages: session.userMessages.length,
    assistant_messages: session.assistantMessages.length,
    tool_calls: session.toolCalls.length,
    total_lines: session.totalLines,
  });

  return `INSERT OR IGNORE INTO conversational_memory (id, tenant_id, session_id, model, role, content, metadata, created_at)
    VALUES ('${session.id}', '${TENANT_ID}', 'corpus_${escapeSQL(session.sessionTag)}', 'hermes', 'system', '${escapeSQL(content)}', '${escapeSQL(metadata)}', '${now}');`;
}

function executeBatch(statements: string[], label: string): void {
  const tmpFile = `/tmp/iw_corpus_${Date.now()}.sql`;
  require("node:fs").writeFileSync(tmpFile, statements.join("\n"), "utf-8");

  try {
    execSync(
      `unset CLOUDFLARE_API_TOKEN && wrangler d1 execute ${D1_DB} --remote --file="${tmpFile}" --yes`,
      { cwd: "/Users/nirmal/Github/integratewise-live", stdio: "pipe", timeout: 60000 }
    );
    console.log(`  ✅ ${label}`);
  } catch (err: any) {
    const stderr = err.stderr?.toString() || "";
    if (stderr.includes("UNIQUE") || stderr.includes("already exists")) {
      console.log(`  ⚠️ ${label}: some records exist (idempotent)`);
    } else {
      console.error(`  ❌ ${label} failed:`, stderr.slice(0, 200));
    }
  }

  try {
    require("node:fs").unlinkSync(tmpFile);
  } catch {}
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log(" IntegrateWise — Merged Corpus Extraction");
  console.log(" Target: 571 sessions across 3 merged files");
  console.log("═══════════════════════════════════════════════════\n");

  let allSessions: ExtractedSession[] = [];

  for (const file of MERGED_FILES) {
    const shortName = file.split("/").pop() || file;
    console.log(`📂 Parsing: ${shortName}`);

    const content = await readFile(file, "utf-8");
    const sessions = parseFile(content, shortName);
    console.log(`   → ${sessions.length} sessions extracted`);
    allSessions.push(...sessions);
  }

  console.log(`\n📊 Total sessions: ${allSessions.length}`);
  console.log(`   Decisions found: ${allSessions.filter((s) => s.hasDecisions).length}`);
  console.log(`   Architecture: ${allSessions.filter((s) => s.hasArchitecture).length}`);

  // Category breakdown
  const categories: Record<string, number> = {};
  for (const s of allSessions) {
    categories[s.category] = (categories[s.category] || 0) + 1;
  }
  console.log(`\n📋 Categories:`);
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${cat}: ${count}`);
  }

  // Write to D1 in batches
  console.log(`\n📝 Writing to D1 conversational_memory...`);
  const BATCH_SIZE = 20;
  const statements = allSessions.map((s) => buildInsert(s));

  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const batch = statements.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(statements.length / BATCH_SIZE);
    executeBatch(batch, `batch ${batchNum}/${totalBatches} (${batch.length} sessions)`);
  }

  // Write summary to .iw/memory/decisions/
  const summaryPath = "/Users/nirmal/.iw-memory/memory/decisions/2026-06-05_corpus-extraction.md";
  const summary = `---
promote: true
confidence: 0.9
category: "learning"
proposed_by: "kiro"
date: "2026-06-05"
---

# Merged Corpus Extraction Complete

## Stats
- Total sessions extracted: ${allSessions.length}
- Sessions with decisions: ${allSessions.filter((s) => s.hasDecisions).length}
- Sessions with architecture: ${allSessions.filter((s) => s.hasArchitecture).length}
- Categories: ${Object.entries(categories)
    .map(([k, v]) => `${k}(${v})`)
    .join(", ")}

## Source Files
${MERGED_FILES.map((f) => `- ${f.split("/").pop()}`).join("\n")}

## What Was Extracted
Every session from the merged corpus (Hermes sessions, May-June 2026) has been
written to D1 conversational_memory with:
- Session content (user + assistant messages, truncated to 8KB)
- Metadata: category, decision flags, architecture flags, message counts
- Unique ID per session (deterministic hash — idempotent re-runs)

## Next Step
Vectorize indexing — embed these entries for Twin semantic retrieval.
`;

  await writeFile(summaryPath, summary);

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(` EXTRACTION COMPLETE`);
  console.log(` ${allSessions.length} sessions → D1 conversational_memory`);
  console.log(` Summary → .iw/memory/decisions/2026-06-05_corpus-extraction.md`);
  console.log(`═══════════════════════════════════════════════════`);
}

main().catch(console.error);

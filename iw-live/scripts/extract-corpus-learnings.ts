/**
 * Merged Corpus Extraction — Extract learnings from 1,440+ sessions
 *
 * Processes the merged session files from IntegrateWise Memory vault:
 * - merged-session-output.txt (Hermes sessions, <session_> markers)
 * - merged_files (3).txt (ChatGPT exports, <filename.md> markers)
 * - merged_files (4).txt (mixed format)
 *
 * Extracts: decisions, architectural insights, learnings, patterns, commitments
 * Outputs: structured markdown files to .iw/memory/org/ for promotion
 *
 * Run with: bun run scripts/extract-corpus-learnings.ts
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const MEMORY_ROOT = "/Users/nirmal/Github/IntegrateWise - Memory";
const OUTPUT_DIR = "/Users/nirmal/.iw-memory/memory/org";

const MERGED_FILES = [
  join(MEMORY_ROOT, "Organisational memory/10 AI/merged-session-output.txt"),
  join(
    MEMORY_ROOT,
    "Conversation memory/01 Product & Engineering/06-Company-Memory/00-Baseline-Knowledge/00-Original-Material/02-Logs-and-Run-Notes/Work-Logs/Root-Cleanup-2026-05-23/merged_files (3).txt"
  ),
  join(
    MEMORY_ROOT,
    "Conversation memory/01 Product & Engineering/06-Company-Memory/00-Baseline-Knowledge/00-Original-Material/02-Logs-and-Run-Notes/Work-Logs/Root-Cleanup-2026-05-23/merged_files (4).txt"
  ),
];

// ─── Extraction Patterns ─────────────────────────────────────────────────────

const DECISION_PATTERNS = [
  /(?:decided|decision|locked|non-negotiable|doctrine|rule|policy|we will|we won't|must not|must always|never|always|hard rule)/i,
];

const ARCHITECTURE_PATTERNS = [
  /(?:architecture|schema|pipeline|normalizer|spine|d1|supabase|vectorize|cloudflare|worker|mcp|entity.?360|memory.?loop|triage|governance)/i,
];

const LEARNING_PATTERNS = [
  /(?:learned|learning|realized|mistake|correction|wrong|right approach|insight|pattern|discovered)/i,
];

const COMMITMENT_PATTERNS = [
  /(?:commit|commitment|promise|deliver|deadline|by|until|target|milestone|week|month|q[1-4])/i,
];

interface ExtractedItem {
  type: "decision" | "architecture" | "learning" | "commitment" | "insight";
  content: string;
  source_session: string;
  source_file: string;
  date?: string;
  confidence: number;
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

function parseHermesSessions(content: string, sourceFile: string): ExtractedItem[] {
  const items: ExtractedItem[] = [];
  const sessions = content.split(/^<session_/m);

  for (const session of sessions) {
    if (!session.trim()) continue;

    const sessionMatch = session.match(/^(.+?)\.txt>/);
    const sessionId = sessionMatch ? sessionMatch[1] : "unknown";
    const dateMatch = sessionId.match(/(\d{8})/);
    const date = dateMatch
      ? `${dateMatch[1].slice(0, 4)}-${dateMatch[1].slice(4, 6)}-${dateMatch[1].slice(6, 8)}`
      : undefined;

    // Extract USER and ASSISTANT blocks
    const blocks = session.split(/^\[(USER|ASSISTANT|TOOL)\]\s*$/m);

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
      if (!block || block.length < 100) continue;
      if (block === "USER" || block === "ASSISTANT" || block === "TOOL") continue;

      // Skip tool output (JSON)
      if (block.startsWith("{") || block.startsWith("[")) continue;

      // Check for decision/architecture/learning content
      const category = categorize(block);
      if (category) {
        // Extract just the key paragraph (not the whole block)
        const keyParagraph = extractKeyParagraph(block);
        if (keyParagraph && keyParagraph.length > 50 && keyParagraph.length < 2000) {
          items.push({
            type: category,
            content: keyParagraph,
            source_session: `session_${sessionId}`,
            source_file: sourceFile,
            date,
            confidence: 0.75,
          });
        }
      }
    }
  }

  return items;
}

function parseChatGPTSessions(content: string, sourceFile: string): ExtractedItem[] {
  const items: ExtractedItem[] = [];
  const sessions = content.split(/^<[^>]+\.md>/m);

  for (const session of sessions) {
    if (!session.trim()) continue;

    const dateMatch = session.match(/message time:\s*(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : undefined;

    // Split into user/assistant turns
    const turns = session.split(/^(?:# you asked|# chatgpt response|---)\s*$/m);

    for (const turn of turns) {
      const block = turn.trim();
      if (!block || block.length < 100) continue;
      if (block.startsWith("message time:")) continue;

      const category = categorize(block);
      if (category) {
        const keyParagraph = extractKeyParagraph(block);
        if (keyParagraph && keyParagraph.length > 50 && keyParagraph.length < 2000) {
          items.push({
            type: category,
            content: keyParagraph,
            source_session: `chatgpt_${date || "unknown"}`,
            source_file: sourceFile,
            date,
            confidence: 0.7,
          });
        }
      }
    }
  }

  return items;
}

// ─── Categorization ──────────────────────────────────────────────────────────

function categorize(block: string): ExtractedItem["type"] | null {
  const lowerBlock = block.toLowerCase();

  // Score each category
  let decisionScore = 0;
  let archScore = 0;
  let learningScore = 0;
  let commitScore = 0;

  for (const p of DECISION_PATTERNS) {
    if (p.test(block)) decisionScore += 2;
  }
  for (const p of ARCHITECTURE_PATTERNS) {
    if (p.test(block)) archScore += 1;
  }
  for (const p of LEARNING_PATTERNS) {
    if (p.test(block)) learningScore += 2;
  }
  for (const p of COMMITMENT_PATTERNS) {
    if (p.test(block)) commitScore += 1;
  }

  // Strong signal keywords
  if (
    lowerBlock.includes("doctrine") ||
    lowerBlock.includes("non-negotiable") ||
    lowerBlock.includes("locked")
  ) {
    decisionScore += 3;
  }
  if (
    lowerBlock.includes("realized") ||
    lowerBlock.includes("mistake") ||
    lowerBlock.includes("wrong approach")
  ) {
    learningScore += 3;
  }

  const maxScore = Math.max(decisionScore, archScore, learningScore, commitScore);
  if (maxScore < 2) return null; // Not interesting enough

  if (decisionScore === maxScore) return "decision";
  if (archScore === maxScore) return "architecture";
  if (learningScore === maxScore) return "learning";
  if (commitScore === maxScore) return "commitment";

  return "insight";
}

function extractKeyParagraph(block: string): string | null {
  // Split into paragraphs, find the most information-dense one
  const paragraphs = block.split(/\n\n+/).filter((p) => p.trim().length > 50);

  if (paragraphs.length === 0) return null;

  // Score paragraphs by keyword density
  let best = paragraphs[0];
  let bestScore = 0;

  for (const p of paragraphs) {
    let score = 0;
    const lower = p.toLowerCase();

    // Favor paragraphs with specific architectural terms
    if (lower.includes("spine")) score += 2;
    if (lower.includes("memory")) score += 2;
    if (lower.includes("twin")) score += 2;
    if (lower.includes("normalizer")) score += 2;
    if (lower.includes("mcp")) score += 2;
    if (lower.includes("governance")) score += 2;
    if (lower.includes("entity")) score += 1;
    if (lower.includes("cloudflare")) score += 1;
    if (lower.includes("d1")) score += 1;
    if (lower.includes("supabase")) score += 1;

    // Favor paragraphs with decision language
    if (lower.includes("must")) score += 2;
    if (lower.includes("never")) score += 2;
    if (lower.includes("always")) score += 2;
    if (lower.includes("locked")) score += 3;
    if (lower.includes("doctrine")) score += 3;

    // Penalize overly long paragraphs
    if (p.length > 1500) score -= 2;

    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return best.trim();
}

// ─── Deduplication ───────────────────────────────────────────────────────────

function deduplicate(items: ExtractedItem[]): ExtractedItem[] {
  const seen = new Set<string>();
  const result: ExtractedItem[] = [];

  for (const item of items) {
    // Create a fingerprint from first 100 chars
    const fingerprint = item.content.slice(0, 100).toLowerCase().replace(/\s+/g, " ");
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    result.push(item);
  }

  return result;
}

// ─── Output ──────────────────────────────────────────────────────────────────

async function writeExtractions(items: ExtractedItem[]): Promise<void> {
  await mkdir(join(OUTPUT_DIR, "decisions-extracted"), { recursive: true });
  await mkdir(join(OUTPUT_DIR, "architecture-extracted"), { recursive: true });
  await mkdir(join(OUTPUT_DIR, "learnings-extracted"), { recursive: true });
  await mkdir(join(OUTPUT_DIR, "commitments-extracted"), { recursive: true });

  const grouped: Record<string, ExtractedItem[]> = {
    decision: [],
    architecture: [],
    learning: [],
    commitment: [],
    insight: [],
  };

  for (const item of items) {
    grouped[item.type].push(item);
  }

  // Write summary files per category
  for (const [type, typeItems] of Object.entries(grouped)) {
    if (typeItems.length === 0) continue;

    const dir = type === "insight" ? "learnings-extracted" : `${type}s-extracted`;
    const outputPath = join(OUTPUT_DIR, dir, `corpus-${type}s.md`);

    let content = `---\npromote: true\nconfidence: 0.75\ncategory: "${type}"\nextracted_from: "merged_corpus"\nextraction_date: "${new Date().toISOString().split("T")[0]}"\ntotal_items: ${typeItems.length}\n---\n\n`;
    content += `# Extracted ${type.charAt(0).toUpperCase() + type.slice(1)}s from Session Corpus\n\n`;
    content += `> ${typeItems.length} items extracted from 1,440+ sessions across Hermes + ChatGPT\n\n---\n\n`;

    for (let i = 0; i < typeItems.length; i++) {
      const item = typeItems[i];
      content += `## ${i + 1}. ${item.source_session}${item.date ? ` (${item.date})` : ""}\n\n`;
      content += `${item.content}\n\n`;
      content += `_Source: ${item.source_file.split("/").pop()} | Confidence: ${item.confidence}_\n\n---\n\n`;
    }

    await writeFile(outputPath, content, "utf-8");
    console.log(`  📝 ${type}: ${typeItems.length} items → ${dir}/corpus-${type}s.md`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log(" Merged Corpus Extraction — 1,440+ Sessions");
  console.log("═══════════════════════════════════════════════════\n");

  let allItems: ExtractedItem[] = [];

  for (const filePath of MERGED_FILES) {
    const fileName = filePath.split("/").pop() || "";
    console.log(`📂 Processing: ${fileName}`);

    try {
      const content = await readFile(filePath, "utf-8");
      console.log(
        `   Size: ${(content.length / 1024 / 1024).toFixed(1)} MB, ${content.split("\n").length} lines`
      );

      let items: ExtractedItem[];

      // Detect format
      if (content.includes("<session_")) {
        items = parseHermesSessions(content, fileName);
      } else if (content.includes("# you asked") || content.includes("# chatgpt response")) {
        items = parseChatGPTSessions(content, fileName);
      } else {
        // Generic: treat each major section as a block
        items = parseChatGPTSessions(content, fileName);
      }

      console.log(`   Extracted: ${items.length} items`);
      allItems.push(...items);
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}`);
    }
  }

  console.log(`\n📊 Total raw items: ${allItems.length}`);

  // Deduplicate
  const unique = deduplicate(allItems);
  console.log(`📊 After dedup: ${unique.length} unique items`);

  // Sort by confidence then by type
  unique.sort((a, b) => b.confidence - a.confidence);

  // Write to .iw/memory/org/
  console.log(`\n📝 Writing to ${OUTPUT_DIR}/...\n`);
  await writeExtractions(unique);

  console.log("\n═══════════════════════════════════════════════════");
  console.log(` EXTRACTION COMPLETE`);
  console.log(` Total unique items: ${unique.length}`);
  console.log(` Output: .iw/memory/org/*-extracted/`);
  console.log("═══════════════════════════════════════════════════");
}

main().catch(console.error);

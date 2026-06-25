/**
 * sync-memory-vault.ts
 *
 * Scans the global memory vault at /Users/nirmal/.iw-memory:
 * - memory/conversational/ for chat session transcripts
 * - memory/decisions/ for decision logs (frontmatter promote: true)
 * - memory/org/ for promoted organizational knowledge
 *
 * For each, generates SQLite D1 insert/update statements and executes them
 * using `wrangler d1 execute` on the remote database `integratewise-spine-cache`.
 * It also regenerates /Users/nirmal/.iw-memory/memory/index.json to keep it in sync.
 *
 * Run with: npx tsx scripts/sync-memory-vault.ts
 */

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, extname, basename } from "node:path";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const TENANT_ID = "iw-customer-zero";
const FOUNDER_USER_ID = "nirmal";
const D1_DB = "integratewise-spine-cache";
const MEMORY_ROOT = "/Users/nirmal/.iw-memory";
const CONV_PATH = join(MEMORY_ROOT, "memory", "conversational");
const DECISIONS_PATH = join(MEMORY_ROOT, "memory", "decisions");
const ORG_PATH = join(MEMORY_ROOT, "memory", "org");
const SPECS_PATH = join(MEMORY_ROOT, "specs");
const STEERING_PATH = join(MEMORY_ROOT, "steering");
const INDEX_JSON_PATH = join(MEMORY_ROOT, "memory", "index.json");

const MCP_URL = "https://mcp.integratewise.ai/invoke";
const MCP_API_KEY = process.env.MCP_API_KEY;
if (!MCP_API_KEY) {
  console.error(
    "❌ MCP_API_KEY env var is required (no hardcoded fallback). Set it before running."
  );
  process.exit(1);
}

// Helper to escape single quotes in SQL
function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function parseFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };
  const fmText = match[1];
  const bodyText = match[2];
  const frontmatter: Record<string, any> = {};
  fmText.split("\n").forEach((line) => {
    const parts = line.split(":");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join(":").trim();
      if (val === "true") frontmatter[key] = true;
      else if (val === "false") frontmatter[key] = false;
      else if (!isNaN(Number(val)) && val !== "") frontmatter[key] = Number(val);
      else if (val.startsWith("[") && val.endsWith("]")) {
        try {
          frontmatter[key] = JSON.parse(val.replace(/'/g, '"'));
        } catch {
          frontmatter[key] = val;
        }
      } else {
        frontmatter[key] = val.replace(/^['"]|['"]$/g, "");
      }
    }
  });
  return { frontmatter, body: bodyText };
}

// walk directory to find files
async function walkDir(dir: string, files: string[] = []): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".")) continue;
        await walkDir(fullPath, files);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if ([".md", ".txt", ".json"].includes(ext) && entry.name !== ".gitkeep") {
          files.push(fullPath);
        }
      }
    }
  } catch (err) {
    // Directory might not exist or be empty
  }
  return files;
}

// execute batch via wrangler d1 execute
function executeBatch(statements: string[], label: string): void {
  if (statements.length === 0) return;
  const tmpFile = `/tmp/iw_sync_batch_${Date.now()}_${Math.floor(Math.random() * 1000)}.sql`;
  const content = statements.join("\n");
  require("node:fs").writeFileSync(tmpFile, content, "utf-8");

  try {
    execSync(
      `unset CLOUDFLARE_API_TOKEN && wrangler d1 execute ${D1_DB} --remote --file="${tmpFile}" --yes`,
      { cwd: "/Users/nirmal/Github/integratewise-live", stdio: "pipe", timeout: 60000 }
    );
    console.log(`  ✅ ${label}: ${statements.length} statements executed successfully`);
  } catch (err: any) {
    const stderr = err.stderr?.toString() || "";
    if (stderr.includes("UNIQUE constraint") || stderr.includes("already exists")) {
      console.log(`  ⚠️ ${label}: some records already exist (idempotent, continuing)`);
    } else {
      console.error(`  ❌ ${label} failed:`, stderr.slice(0, 300));
    }
  } finally {
    try {
      require("node:fs").unlinkSync(tmpFile);
    } catch {}
  }
}

async function ingestViaMcp(toolName: string, args: any, label: string) {
  try {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MCP_API_KEY}`,
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify({
        request_id: `vault-sync-${Date.now()}`,
        actor: { tenant_id: TENANT_ID, user_id: FOUNDER_USER_ID, roles: ["Founder"] },
        tool: {
          name: toolName,
          arguments: { tenant_id: TENANT_ID, user_id: FOUNDER_USER_ID, ...args },
        },
      }),
    });
    if (response.ok) {
      console.log(`   ✅ MCP ingest ${label}`);
    } else {
      console.warn(`   ⚠️ MCP ${label} returned ${response.status}`);
    }
  } catch (e: any) {
    console.warn(`   ⚠️ MCP ingest failed for ${label}: ${e.message}`);
  }
}

async function main() {
  console.log("===================================================");
  console.log(" IntegrateWise — Sync Memory Vault to D1 + MCP/Spine");
  console.log(` Vault Path: ${MEMORY_ROOT}`);
  console.log(
    " (Local high-velocity substrate for founder personal OS → Spine → L1/L2/L3/L4 Coda)"
  );
  console.log("===================================================\n");

  const sqlStatements: string[] = [];
  const indexData: any = {
    version: "1.0",
    generated_at: new Date().toISOString(),
    note: "This file is auto-generated by sync-memory-vault script. Do not edit manually. Feeds Spine via direct D1 (fast path) + MCP (Loader/Normalizer path) for ideal state.",
    total_decisions: 0,
    total_conversational: 0,
    total_org: 0,
    total_personal: 0,
    decisions: {},
    conversational: {},
    org: {},
    personal: {},
  };

  // 1. Process Decisions
  console.log("🔍 Scanning decisions...");
  const decisionFiles = await walkDir(DECISIONS_PATH);
  let decisionCount = 0;
  for (const file of decisionFiles) {
    const content = await readFile(file, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);
    const filename = basename(file);

    // Only promote if promote: true is in frontmatter
    if (frontmatter.promote === true) {
      // Parse individual decisions
      const sections = body.split(/(?=^##? D-\d{4}-\d{2}-\d{2}-\d{3}:)/gm);
      const fileTopics: string[] = [];
      let fileDecisionCount = 0;

      for (const section of sections) {
        if (!section.trim()) continue;
        const match = section.match(/^##? (D-\d{4}-\d{2}-\d{2}-\d{3}): (.*)\r?\n([\s\S]*)$/m);
        if (match) {
          const id = match[1];
          const title = match[2].trim();
          const desc = match[3].trim();
          const now = new Date().toISOString();

          fileTopics.push(title.substring(0, 30));
          fileDecisionCount++;
          decisionCount++;

          const metadata = {
            source: "decisions_log",
            file_name: filename,
            proposed_by: frontmatter.proposed_by || "system",
            date: frontmatter.date || now.split("T")[0],
            session: frontmatter.session || "manual",
            entity_refs: frontmatter.entity_refs || [],
          };

          const stmt = `INSERT OR REPLACE INTO org_memory (id, tenant_id, topic, category, content, source_session_id, governance_state, version, metadata, created_at, updated_at)
            VALUES ('${escapeSQL(id)}', '${TENANT_ID}', '${escapeSQL(title)}', 'decision', '${escapeSQL(desc)}', '${escapeSQL(metadata.session)}', 'approved', 1, '${escapeSQL(JSON.stringify(metadata))}', '${now}', '${now}');`;
          sqlStatements.push(stmt);
        }
      }

      indexData.decisions[filename] = {
        date: frontmatter.date || new Date().toISOString().split("T")[0],
        agent: frontmatter.proposed_by || "system",
        decision_count: fileDecisionCount,
        topics: fileTopics,
      };
    }
  }
  indexData.total_decisions = decisionCount;
  console.log(`   Found ${decisionCount} decisions across promoted log files.`);

  // 2. Process Conversational Memory
  console.log("🔍 Scanning conversational transcripts...");
  const convFiles = await walkDir(CONV_PATH);
  let convCount = 0;
  for (const file of convFiles) {
    const content = await readFile(file, "utf-8");
    const filename = basename(file);
    const hash = createHash("sha256").update(content).digest("hex");
    const id = `cm-${hash.slice(0, 16)}`;
    const now = new Date().toISOString();

    const sessionId = filename.replace(/\.(md|txt|json)$/i, "");
    const stmt = `INSERT OR IGNORE INTO conversational_memory (id, tenant_id, session_id, model, role, content, metadata, created_at)
      VALUES ('${escapeSQL(id)}', '${TENANT_ID}', '${escapeSQL(sessionId)}', 'session_ingest', 'user', '${escapeSQL(content)}', '${escapeSQL(JSON.stringify({ source: "conversational_vault", file_name: filename }))}', '${now}');`;
    sqlStatements.push(stmt);
    convCount++;

    indexData.conversational[filename] = {
      id,
      session_id: sessionId,
      size_bytes: content.length,
      synced_at: now,
    };
  }
  indexData.total_conversational = convCount;
  console.log(`   Found ${convCount} conversational transcripts.`);

  // 3. Process Org Memory (direct files)
  console.log("🔍 Scanning promoted organizational documents...");
  const orgFiles = await walkDir(ORG_PATH);
  let orgCount = 0;
  for (const file of orgFiles) {
    const content = await readFile(file, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);
    const filename = basename(file);
    const hash = createHash("sha256").update(content).digest("hex");
    const id = `om-${hash.slice(0, 16)}`;
    const now = new Date().toISOString();
    const title = frontmatter.title || filename.replace(/\.(md|txt)$/i, "").replace(/[-_]/g, " ");

    const category = frontmatter.category || "insight";
    const department = frontmatter.department || "general";

    const stmt = `INSERT OR REPLACE INTO org_memory (id, tenant_id, topic, category, content, source_session_id, governance_state, version, metadata, created_at, updated_at)
      VALUES ('${escapeSQL(id)}', '${TENANT_ID}', '${escapeSQL(title)}', '${escapeSQL(category)}', '${escapeSQL(body)}', 'manual_ingest', 'approved', 1, '${escapeSQL(JSON.stringify({ source: "org_vault", file_name: filename, frontmatter }))}', '${now}', '${now}');`;
    sqlStatements.push(stmt);
    orgCount++;

    indexData.org[filename] = {
      id,
      title,
      category,
      department,
      size_bytes: content.length,
      synced_at: now,
    };
  }
  indexData.total_org = orgCount;
  console.log(`   Found ${orgCount} organizational memory documents.`);

  // 4. Process Personal high-value content (specs, steering, founder notes) via MCP for normalization to personal_memory
  console.log("🔍 Scanning personal specs and steering (founder personal OS)...");
  const personalFiles = [...(await walkDir(SPECS_PATH)), ...(await walkDir(STEERING_PATH))];
  let personalCount = 0;
  for (const file of personalFiles) {
    const content = await readFile(file, "utf-8");
    const filename = basename(file);
    const rel = relative(MEMORY_ROOT, file);
    const category = file.includes("/specs/") ? "spec" : "steering";
    const title = filename.replace(/\.(md|txt|json)$/i, "").replace(/[-_]/g, " ");

    await ingestViaMcp(
      "memory.write_personal",
      {
        category,
        title,
        content: content.slice(0, 8000),
        source: "local_vault",
        metadata: { file: rel, path: file },
      },
      `personal:${rel}`
    );

    personalCount++;
    indexData.personal[filename] = { category, title, path: rel, synced_via_mcp: true };
  }
  indexData.total_personal = personalCount;
  console.log(
    `   Ingested ${personalCount} personal files via MCP to personal_memory (for L2/L3/Coda L4).`
  );

  // Also ensure key decisions/org are available as personal context for the founder
  for (const file of decisionFiles) {
    if (file.includes("founder") || file.includes("nirmal") || file.includes("personal")) {
      const content = await readFile(file, "utf-8");
      await ingestViaMcp(
        "memory.write_personal",
        {
          category: "decision",
          title: basename(file),
          content,
          source: "decisions_vault",
        },
        `personal-decision:${basename(file)}`
      );
    }
  }

  // 5. Update index.json in the memory vault
  console.log("\n💾 Updating index.json...");
  await writeFile(INDEX_JSON_PATH, JSON.stringify(indexData, null, 2), "utf-8");
  console.log("   ✅ index.json updated successfully.");

  // 5. Execute SQL statements in batches
  if (sqlStatements.length > 0) {
    console.log(`\n⚡ Executing ${sqlStatements.length} SQL sync statements in batches...`);
    const BATCH_SIZE = 20;
    for (let i = 0; i < sqlStatements.length; i += BATCH_SIZE) {
      const batch = sqlStatements.slice(i, i + BATCH_SIZE);
      executeBatch(
        batch,
        `Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(sqlStatements.length / BATCH_SIZE)}`
      );
    }
  } else {
    console.log("\n✓ No database sync statements needed.");
  }

  console.log("\n🎉 Memory Vault Sync Completed successfully!");
  console.log("   Local .iw-memory content is now in Spine (fast D1 + MCP normalization path).");
  console.log("   Available in: User Workbench / L2 / L3 OWUI (personal handoff) / L4 Coda.");
}

main().catch(console.error);

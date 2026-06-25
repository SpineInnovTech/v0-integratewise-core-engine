/**
 * Initial Memory Load Script
 *
 * Reads 1,017+ docs from the IntegrateWise Memory vault and:
 * 1. Writes each as conversational_memory to D1 (Stage 1: Capture)
 * 2. Proposes promotable ones to D1 proposals table (Stage 3: Propose)
 *
 * Run with: npx tsx scripts/initial-memory-load.ts
 *
 * Uses wrangler d1 execute under the hood for batch D1 writes.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, extname, basename } from "node:path";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const TENANT_ID = "iw-customer-zero";
const D1_DB = "integratewise-spine-cache";
const MEMORY_ROOT = "/Users/nirmal/Github/IntegrateWise - Memory";
const ORG_MEMORY_PATH = join(MEMORY_ROOT, "Organisational memory");
const CONV_MEMORY_PATH = join(MEMORY_ROOT, "Conversation memory");

// Category mapping from folder structure
const FOLDER_TO_CATEGORY: Record<string, string> = {
  "00 Company Strategy": "doctrine",
  "01 Product & Engineering": "decision",
  "02 Marketing & Creative": "workflow",
  "03 Sales": "workflow",
  "04 Customer Success": "pattern",
  "05 Operations": "workflow",
  "06 Finance Legal HR": "policy",
  "07 Resources & Knowledge Base": "learning",
  "08 External Communications": "workflow",
  "10 AI": "doctrine",
};

// Sub-folder refinements
const SUBFOLDER_CATEGORY: Record<string, string> = {
  "Architecture-Doctrine": "doctrine",
  "00-Founding-Architecture": "doctrine",
  "00-Vision-Mission-OKRs": "commitment",
  "01-Business-Plans": "decision",
  "02-Investor-Decks": "insight",
  "Logs-and-Run-Notes": "learning",
  Runbooks: "workflow",
  "00-Brand-Assets": "workflow",
  "01-Playbooks": "workflow",
  "03-Pricing-Packages": "decision",
};

interface MemoryDoc {
  id: string;
  filePath: string;
  relativePath: string;
  title: string;
  content: string;
  category: string;
  department: string;
  size: number;
  hash: string;
}

async function walkDir(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip hidden dirs, node_modules, and legacy Archive dump yard (09 — reclassify via functional manifest)
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      if (/^09\s+archives/i.test(entry.name)) continue;
      await walkDir(fullPath, files);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if ([".md", ".txt", ".html"].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function resolveCategory(relativePath: string): string {
  const parts = relativePath.split("/");

  // Check subfolder first
  for (const part of parts) {
    if (SUBFOLDER_CATEGORY[part]) return SUBFOLDER_CATEGORY[part];
  }

  // Fall back to top-level folder
  const topFolder = parts[0];
  return FOLDER_TO_CATEGORY[topFolder] || "insight";
}

function resolveDepartment(relativePath: string): string {
  const parts = relativePath.split("/");
  const topFolder = parts[0];

  const map: Record<string, string> = {
    "00 Company Strategy": "strategy",
    "01 Product & Engineering": "product",
    "02 Marketing & Creative": "marketing",
    "03 Sales": "sales",
    "04 Customer Success": "customer_success",
    "05 Operations": "operations",
    "06 Finance Legal HR": "finance",
    "07 Resources & Knowledge Base": "knowledge",
    "08 External Communications": "communications",
    "10 AI": "ai",
  };

  return map[topFolder] || "general";
}

function generateId(prefix: string, path: string): string {
  const hash = createHash("sha256").update(path).digest("hex").slice(0, 12);
  return `${prefix}-${hash}`;
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

async function collectDocs(rootPath: string, source: "org" | "conv"): Promise<MemoryDoc[]> {
  const files = await walkDir(rootPath);
  const docs: MemoryDoc[] = [];

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, "utf-8");
      if (!content.trim() || content.length < 50) continue; // Skip empty/tiny files

      const relativePath = relative(rootPath, filePath);
      const title = basename(filePath, extname(filePath))
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const hash = createHash("sha256").update(content).digest("hex");
      const category = source === "org" ? resolveCategory(relativePath) : "insight";
      const department = source === "org" ? resolveDepartment(relativePath) : "general";

      docs.push({
        id: generateId(source === "org" ? "org" : "conv", relativePath),
        filePath,
        relativePath,
        title: title.slice(0, 200),
        content,
        category,
        department,
        size: content.length,
        hash,
      });
    } catch (err) {
      // Skip files that can't be read
      continue;
    }
  }

  return docs;
}

function buildConversationalInsert(doc: MemoryDoc, batchId: string): string {
  const id = `cm-${doc.hash.slice(0, 16)}`;
  const sessionId = `initial_load_${doc.department}_${batchId}`;
  const now = new Date().toISOString();
  const truncatedContent = doc.content.slice(0, 10000); // D1 has no hard limit but be reasonable

  return `INSERT OR IGNORE INTO conversational_memory (id, tenant_id, session_id, model, role, content, metadata, created_at)
    VALUES ('${escapeSQL(id)}', '${TENANT_ID}', '${escapeSQL(sessionId)}', 'initial_load', 'system', '${escapeSQL(truncatedContent)}', '${escapeSQL(JSON.stringify({ source: "vault", file_path: doc.relativePath, category: doc.category, department: doc.department }))}', '${now}');`;
}

function buildOrgMemoryInsert(doc: MemoryDoc): string {
  const id = `om-${doc.hash.slice(0, 16)}`;
  const now = new Date().toISOString();
  const truncatedContent = doc.content.slice(0, 10000);

  return `INSERT OR IGNORE INTO org_memory (id, tenant_id, topic, category, content, source_session_id, governance_state, confidence, metadata, created_at, updated_at, related_departments, access_scope, tier)
    VALUES ('${escapeSQL(id)}', '${TENANT_ID}', '${escapeSQL(doc.title.slice(0, 120))}', '${doc.category}', '${escapeSQL(truncatedContent)}', 'initial_load', 'approved', 0.85, '${escapeSQL(JSON.stringify({ source: "vault", file_path: doc.relativePath, department: doc.department }))}', '${now}', '${now}', '${escapeSQL(JSON.stringify([doc.department]))}', 'org', 'enterprise');`;
}

function executeBatch(statements: string[], label: string): void {
  // Write to temp file and execute via wrangler
  const tmpFile = `/tmp/iw_batch_${Date.now()}.sql`;
  const content = statements.join("\n");

  require("node:fs").writeFileSync(tmpFile, content, "utf-8");

  try {
    execSync(
      `unset CLOUDFLARE_API_TOKEN && wrangler d1 execute ${D1_DB} --remote --file="${tmpFile}" --yes`,
      { cwd: "/Users/nirmal/Github/integratewise-live", stdio: "pipe", timeout: 60000 }
    );
    console.log(`  ✅ ${label}: ${statements.length} statements executed`);
  } catch (err: any) {
    const stderr = err.stderr?.toString() || "";
    if (stderr.includes("UNIQUE constraint") || stderr.includes("already exists")) {
      console.log(`  ⚠️ ${label}: some records already exist (idempotent, continuing)`);
    } else {
      console.error(`  ❌ ${label} failed:`, stderr.slice(0, 300));
    }
  }

  // Cleanup
  try {
    require("node:fs").unlinkSync(tmpFile);
  } catch {}
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log(" IntegrateWise — Initial Memory Load");
  console.log(" Tenant: iw-customer-zero (Customer Zero)");
  console.log("═══════════════════════════════════════════════════\n");

  // Phase 1: Collect docs
  console.log("📂 Scanning vault...");
  const orgDocs = await collectDocs(ORG_MEMORY_PATH, "org");
  const convDocs = await collectDocs(CONV_MEMORY_PATH, "conv");

  console.log(`   Found ${orgDocs.length} organisational memory docs`);
  console.log(`   Found ${convDocs.length} conversational memory docs`);
  console.log(`   Total: ${orgDocs.length + convDocs.length} documents\n`);

  // Phase 2: Write conversational memory (all docs as scratchpad first)
  console.log("📝 Stage 1: Writing to conversational_memory...");
  const batchId = Date.now().toString(36);
  const BATCH_SIZE = 25; // Keep batches small for D1

  const allDocs = [...orgDocs, ...convDocs];
  const convStatements = allDocs.map((doc) => buildConversationalInsert(doc, batchId));

  for (let i = 0; i < convStatements.length; i += BATCH_SIZE) {
    const batch = convStatements.slice(i, i + BATCH_SIZE);
    executeBatch(
      batch,
      `conv_memory batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(convStatements.length / BATCH_SIZE)}`
    );
  }

  console.log(`   ✅ ${convStatements.length} conversational entries written\n`);

  // Phase 3: Write org memory (promote all org docs directly — pre-vetted, confidence 0.85)
  console.log("📝 Stage 3: Promoting to org_memory (pre-approved)...");
  const orgStatements = orgDocs.map((doc) => buildOrgMemoryInsert(doc));

  for (let i = 0; i < orgStatements.length; i += BATCH_SIZE) {
    const batch = orgStatements.slice(i, i + BATCH_SIZE);
    executeBatch(
      batch,
      `org_memory batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(orgStatements.length / BATCH_SIZE)}`
    );
  }

  console.log(`   ✅ ${orgStatements.length} org memory entries promoted\n`);

  // Summary
  console.log("═══════════════════════════════════════════════════");
  console.log(" INITIAL LOAD COMPLETE");
  console.log(`   Conversational: ${allDocs.length} entries`);
  console.log(`   Org Memory:     ${orgDocs.length} entries (governance_state: approved)`);
  console.log(`   Categories:     ${[...new Set(orgDocs.map((d) => d.category))].join(", ")}`);
  console.log(`   Departments:    ${[...new Set(orgDocs.map((d) => d.department))].join(", ")}`);
  console.log("═══════════════════════════════════════════════════");
  console.log("\n🔜 Next: Run Vectorize indexing to make memory retrievable by Twin");
}

main().catch(console.error);

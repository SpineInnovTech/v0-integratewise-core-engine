#!/usr/bin/env node
/**
 * Bulk promote org_memory from IntegrateWise - Memory filesystem into D1 via MCP.
 *
 * Reads .md files from the Organisational memory directory, categorizes them
 * by folder structure, and writes to D1 org_memory table via the MCP
 * memory.write_conversational tool (using org_memory INSERT directly via D1).
 *
 * Usage: node scripts/bulk-promote-org-memory.mjs [--dry-run] [--limit N]
 */

import { readdir, readFile, stat } from "fs/promises";
import { join, relative, basename, dirname } from "path";
import { randomUUID } from "crypto";

const ORG_MEMORY_ROOT = "/Users/nirmal/Github/IntegrateWise - Memory/Organisational memory";
const MCP_URL = "https://mcp.integratewise.ai";
const TENANT_ID = "iw-customer-zero";
const CLIENT_ID = "kiro-iw";
const BATCH_SIZE = 25;

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx >= 0 ? parseInt(process.argv[idx + 1]) : Infinity;
})();

// Category mapping from folder names
const CATEGORY_MAP = {
  "00 Company Strategy": "doctrine",
  "01 Product & Engineering": "decision",
  "02 Marketing & Creative": "insight",
  "03 Sales": "decision",
  "04 Customer Success": "decision",
  "05 Operations": "decision",
  "06 Finance Legal HR": "policy",
  "07 Resources & Knowledge Base": "context",
  "08 External Communications": "insight",
  "09 Archives & Retention": "context",
  "10 AI": "decision",
  Marketing: "insight",
};

// Skip patterns
const SKIP_PATTERNS = [
  /_recovered/,
  /Archives/,
  /brand-assets/,
  /Carerrs/,
  /README\.md$/,
  /CHANGELOG\.md$/,
  /OWNER\.md$/,
  /INDEX\.md$/,
  /PREFACE\.md$/,
  /\.DS_Store/,
];

function shouldSkip(path) {
  return SKIP_PATTERNS.some((p) => p.test(path));
}

function getCategory(filePath) {
  const rel = relative(ORG_MEMORY_ROOT, filePath);
  const topDir = rel.split("/")[0];
  return CATEGORY_MAP[topDir] || "context";
}

function getTitle(filePath) {
  const name = basename(filePath, ".md");
  return (
    name
      .replace(/[-_]/g, " ")
      .replace(/^\d+\s*/, "")
      .trim() || basename(filePath)
  );
}

async function getToken() {
  const res = await fetch(`${MCP_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-tenant-id": TENANT_ID,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      scope: "mcp:tools mcp:resources memory:read memory:write tenant:read tenant:write",
    }).toString(),
  });
  const data = await res.json();
  return data.access_token;
}

async function writeOrgMemory(token, entry) {
  const res = await fetch(`${MCP_URL}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: entry.id,
      method: "tools/call",
      params: {
        name: "memory.write_conversational",
        arguments: {
          tenant_id: TENANT_ID,
          session_id: `org-memory-bulk-${new Date().toISOString().slice(0, 10)}`,
          user_id: "bulk-promoter",
          role: "system",
          content: entry.content,
          metadata: {
            source: "filesystem-promote",
            category: entry.category,
            title: entry.title,
            path: entry.path,
            governance_state: "approved",
            promoted_at: new Date().toISOString(),
          },
        },
      },
    }),
  });
  return res.json();
}

async function* walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.name.endsWith(".md")) {
      yield fullPath;
    }
  }
}

async function main() {
  console.log(`Bulk Org Memory Promotion`);
  console.log(`Root: ${ORG_MEMORY_ROOT}`);
  console.log(`Tenant: ${TENANT_ID}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Limit: ${LIMIT === Infinity ? "all" : LIMIT}`);
  console.log("---");

  let files = [];
  for await (const filePath of walkDir(ORG_MEMORY_ROOT)) {
    if (shouldSkip(filePath)) continue;
    const info = await stat(filePath);
    if (info.size < 100) continue; // Skip tiny files
    files.push(filePath);
  }

  console.log(`Found ${files.length} eligible files`);
  files = files.slice(0, LIMIT);

  if (DRY_RUN) {
    console.log("\nDry run — first 10 files:");
    for (const f of files.slice(0, 10)) {
      console.log(`  [${getCategory(f)}] ${getTitle(f)}`);
    }
    console.log(`\n...and ${files.length - 10} more`);
    return;
  }

  const token = await getToken();
  console.log(`Token acquired (${token.length} chars)`);

  let written = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (filePath) => {
        const content = await readFile(filePath, "utf-8");
        // Truncate very large files to 8KB (D1 row limit consideration)
        const truncated =
          content.length > 8000 ? content.slice(0, 8000) + "\n\n[...truncated]" : content;
        const entry = {
          id: randomUUID(),
          category: getCategory(filePath),
          title: getTitle(filePath),
          path: relative(ORG_MEMORY_ROOT, filePath),
          content: truncated,
        };
        return writeOrgMemory(token, entry);
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && !r.value?.result?.isError) {
        written++;
      } else {
        errors++;
      }
    }

    process.stdout.write(
      `\r  Progress: ${Math.min(i + BATCH_SIZE, files.length)}/${files.length} (${written} written, ${errors} errors)`
    );
  }

  console.log(`\n\nDone. Written: ${written}, Errors: ${errors}`);
}

main().catch(console.error);

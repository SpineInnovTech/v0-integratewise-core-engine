/**
 * Sync Org Memory + Founder Personal Memory → Coda Projection
 *
 * For the founder (Nirmal / iw-customer-zero):
 * - All tools connected once → Loader + Normalizer → Spine (SSOT)
 * - Data available in:
 *   - User Workbench (L1/L2 surfaces in main app)
 *   - L2 cognitive layer (insights, spine panels, Twin proposals)
 *   - L3 OWUI Twin (full deep reasoning at twin.operations.integratewise.ai)
 *   - Coda (L4 projection — this sync)
 *
 * This script syncs both:
 * - org_memory (company-wide, governed)
 * - personal_memory (founder-specific: preference | behavior | context | decision)
 *
 * Coda becomes the VIEW surface. Spine remains the TRUTH.
 * Personal tools (Gmail, personal Coda, etc.) flow to personal_memory and appear here.
 *
 * Structure in Coda (founder doc):
 *   Table: "Org Memory" + "Personal Memory"
 *   Views: By Category, Timeline, Founder Daily Operating View
 *
 * Usage (founder personal + org):
 *   CODA_API_TOKEN=xxx CODA_DOC_ID=xxx MCP_API_KEY=xxx npx tsx sync-org-memory.ts --personal
 *
 * This enables the founder's ideal loop:
 *   All tools (Gmail, Slack, Coda, HubSpot, Jira, ...) → connected once
 *   → Loader + Normalizer + MCP → Spine (personal_memory + org_memory)
 *   → surfaced in:
 *     - User Workbench (L1/L2 in main app)
 *     - L2 cognitive layer (Spine/Context/Twin insights panels)
 *     - L3 OWUI Twin (twin.operations.integratewise.ai with personal handoff)
 *     - Coda (this sync — L4 living document)
 */

const CODA_BASE = "https://coda.io/apis/v1";
const MCP_URL = "https://mcp.integratewise.ai/invoke";

// Category → Functional quadrant mapping
const CATEGORY_TO_FUNCTION: Record<string, string> = {
  doctrine: "How We Think",
  pattern: "How We Think",
  insight: "How We Think",
  decision: "How We Decide",
  commitment: "How We Decide",
  policy: "How We Decide",
  workflow: "How We Work",
  learning: "How We Learn",
};

interface OrgMemoryEntry {
  id: string;
  topic: string;
  category: string;
  content: string;
  confidence: number;
  governance_state: string;
  metadata: any;
  created_at: string;
}

async function fetchOrgMemory(): Promise<OrgMemoryEntry[]> {
  const apiKey = process.env.MCP_API_KEY || "iw-mcp-spine-key-2026";

  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "x-tenant-id": "iw-customer-zero",
    },
    body: JSON.stringify({
      request_id: `sync-${Date.now()}`,
      actor: { tenant_id: "iw-customer-zero", user_id: "sync-agent", roles: ["Admin"] },
      tool: { name: "memory.search_org", arguments: { tenant_id: "iw-customer-zero", limit: 100 } },
    }),
  });

  const data: any = await response.json();
  return data?.result?.items || [];
}

async function fetchPersonalMemory(categories?: string[]): Promise<any[]> {
  const apiKey = process.env.MCP_API_KEY || "iw-mcp-spine-key-2026";
  const catFilter = categories?.length
    ? categories
    : ["preference", "behavior", "context", "decision"];

  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "x-tenant-id": "iw-customer-zero",
    },
    body: JSON.stringify({
      request_id: `sync-personal-${Date.now()}`,
      actor: { tenant_id: "iw-customer-zero", user_id: "nirmal", roles: ["Founder"] },
      tool: {
        name: "memory.read_personal",
        arguments: {
          tenant_id: "iw-customer-zero",
          user_id: "nirmal",
          categories: catFilter,
          limit: 50,
        },
      },
    }),
  });

  const data: any = await response.json();
  return data?.result?.items || [];
}

interface PersonalMemoryEntry {
  id: string;
  user_id: string;
  category: string;
  title: string;
  content: string;
  confidence: number;
  source: string;
  created_at: string;
  metadata?: any;
}

async function codaRequest(method: string, path: string, body?: any): Promise<any> {
  const token = process.env.CODA_API_TOKEN;
  if (!token) throw new Error("CODA_API_TOKEN not set");

  const url = `${CODA_BASE}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Coda API ${res.status}: ${err}`);
  }
  return res.json();
}

async function ensureTable(docId: string, tableName: string, columns: any[]): Promise<string> {
  // Check if table exists
  const tables = await codaRequest("GET", `/docs/${docId}/tables`);
  const existing = tables.items?.find((t: any) => t.name === tableName);

  if (existing) return existing.id;

  // Create table
  const result = await codaRequest("POST", `/docs/${docId}/tables`, {
    name: tableName,
    columns,
  });
  return result.id;
}

async function syncToTable(
  docId: string,
  tableId: string,
  entries: OrgMemoryEntry[]
): Promise<number> {
  const rows = entries.map((entry) => ({
    cells: [
      { column: "Node ID", value: entry.id },
      { column: "Title", value: entry.topic },
      { column: "Category", value: entry.category },
      { column: "Function", value: CATEGORY_TO_FUNCTION[entry.category] || "Uncategorized" },
      { column: "Department", value: entry.metadata?.department || extractDepartment(entry) },
      { column: "Content", value: entry.content?.slice(0, 5000) },
      { column: "Confidence", value: entry.confidence },
      { column: "State", value: entry.governance_state },
      { column: "Proposed By", value: entry.metadata?.proposed_by || "system" },
      { column: "Date", value: entry.created_at },
      { column: "Entity Refs", value: JSON.stringify(entry.metadata?.entity_refs || []) },
    ],
  }));

  // Upsert rows in batches of 10
  const BATCH = 10;
  let synced = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await codaRequest("POST", `/docs/${docId}/tables/${tableId}/rows`, {
      rows: batch,
      keyColumns: ["Node ID"],
    });
    synced += batch.length;
  }
  return synced;
}

async function syncPersonalToTable(
  docId: string,
  tableId: string,
  entries: PersonalMemoryEntry[]
): Promise<number> {
  const rows = entries.map((entry) => ({
    cells: [
      { column: "Memory ID", value: entry.id },
      { column: "User ID", value: entry.user_id },
      { column: "Category", value: entry.category },
      { column: "Title / Subject", value: entry.title || entry.subject || "Untitled" },
      { column: "Content", value: entry.content?.slice(0, 5000) },
      { column: "Confidence", value: entry.confidence || 0.8 },
      { column: "Source", value: entry.source || "spine" },
      { column: "Date", value: entry.created_at },
      { column: "Metadata", value: JSON.stringify(entry.metadata || {}) },
    ],
  }));

  const BATCH = 10;
  let synced = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await codaRequest("POST", `/docs/${docId}/tables/${tableId}/rows`, {
      rows: batch,
      keyColumns: ["Memory ID"],
    });
    synced += batch.length;
  }
  return synced;
}

function extractDepartment(entry: OrgMemoryEntry): string {
  const deps = entry.metadata?.related_departments;
  if (Array.isArray(deps) && deps.length > 0) return deps[0];
  // Infer from content keywords
  const content = (entry.topic + " " + entry.content).toLowerCase();
  if (content.includes("product") || content.includes("architecture"))
    return "Product & Engineering";
  if (content.includes("sales") || content.includes("pricing")) return "Sales";
  if (content.includes("marketing") || content.includes("brand")) return "Marketing";
  if (content.includes("customer") || content.includes("account")) return "Customer Success";
  if (content.includes("operation") || content.includes("deploy")) return "Operations";
  if (content.includes("finance") || content.includes("revenue")) return "Finance";
  if (content.includes("agent") || content.includes("memory") || content.includes("spine"))
    return "AI & Platform";
  return "Strategy & Leadership";
}

export async function syncOrgMemoryToCoda(
  docId?: string
): Promise<{ synced: number; doc_url: string }> {
  const targetDocId = docId || process.env.CODA_DOC_ID;
  if (!targetDocId) throw new Error("CODA_DOC_ID not set");

  console.log("[Coda Sync] Fetching org memory from MCP...");
  const entries = await fetchOrgMemory();
  console.log(`[Coda Sync] Got ${entries.length} entries`);

  if (entries.length === 0) {
    return { synced: 0, doc_url: `https://coda.io/d/${targetDocId}` };
  }

  // Ensure table exists
  const columns = [
    { name: "Node ID", type: "text" },
    { name: "Title", type: "text" },
    { name: "Category", type: "text" },
    { name: "Function", type: "text" },
    { name: "Department", type: "text" },
    { name: "Content", type: "text" },
    { name: "Confidence", type: "number" },
    { name: "State", type: "text" },
    { name: "Proposed By", type: "text" },
    { name: "Date", type: "text" },
    { name: "Entity Refs", type: "text" },
  ];

  console.log("[Coda Sync] Ensuring Org Memory table...");
  const tableId = await ensureTable(targetDocId, "Org Memory", columns);

  console.log("[Coda Sync] Syncing entries...");
  const synced = await syncToTable(targetDocId, tableId, entries);

  console.log(`[Coda Sync] Done. ${synced} entries synced to Coda.`);
  return { synced, doc_url: `https://coda.io/d/${targetDocId}` };
}

export async function syncPersonalMemoryToCoda(
  docId?: string,
  categories?: string[]
): Promise<{ synced: number; doc_url: string }> {
  const targetDocId = docId || process.env.CODA_DOC_ID;
  if (!targetDocId) throw new Error("CODA_DOC_ID not set");

  console.log("[Coda Sync] Fetching personal memory from MCP (founder mode)...");
  const entries = (await fetchPersonalMemory(categories)) as PersonalMemoryEntry[];
  console.log(`[Coda Sync] Got ${entries.length} personal entries`);

  if (entries.length === 0) {
    return { synced: 0, doc_url: `https://coda.io/d/${targetDocId}` };
  }

  const columns = [
    { name: "Memory ID", type: "text" },
    { name: "User ID", type: "text" },
    { name: "Category", type: "text" },
    { name: "Title / Subject", type: "text" },
    { name: "Content", type: "text" },
    { name: "Confidence", type: "number" },
    { name: "Source", type: "text" },
    { name: "Date", type: "text" },
    { name: "Metadata", type: "text" },
  ];

  console.log("[Coda Sync] Ensuring Personal Memory table...");
  const tableId = await ensureTable(targetDocId, "Personal Memory", columns);

  console.log("[Coda Sync] Syncing personal entries...");
  const synced = await syncPersonalToTable(targetDocId, tableId, entries);

  console.log(`[Coda Sync] Done. ${synced} personal entries synced to Coda.`);
  return { synced, doc_url: `https://coda.io/d/${targetDocId}` };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const doPersonal = args.includes("--personal") || args.includes("-p");

  (async () => {
    try {
      if (doPersonal) {
        const personalResult = await syncPersonalMemoryToCoda();
        console.log(`\n✅ Personal synced ${personalResult.synced} entries`);
        console.log(`📄 Doc: ${personalResult.doc_url}`);
      } else {
        const orgResult = await syncOrgMemoryToCoda();
        console.log(`\n✅ Org synced ${orgResult.synced} entries`);
        console.log(`📄 Doc: ${orgResult.doc_url}`);
      }

      if (doPersonal) {
        // Also sync org when doing personal for founder convenience
        const orgResult = await syncOrgMemoryToCoda();
        console.log(`\n✅ Also synced org ${orgResult.synced} entries`);
      }
    } catch (err: any) {
      console.error("❌ Sync failed:", err.message);
      process.exit(1);
    }
  })();
}

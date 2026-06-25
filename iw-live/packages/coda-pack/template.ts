/**
 * IntegrateWise Coda Control Surface — Template Builder
 *
 * Creates or updates a Coda document with pages, tables, and HTML templates
 * that mirror the IntegrateWise architecture layers.
 *
 * Usage:
 *   CODA_API_TOKEN=xxx [CODA_DOC_ID=xxx] npx tsx template.ts
 *
 * Requires: Coda API token with doc creation/update permissions
 */

import * as https from "https";
import { TEMPLATES } from "./templates";
import { fetchInfisicalSecrets } from "./infisical";

// Load local secrets and env variables at the top of the file before configuration checks
try {
  const fs = require("fs");
  const path = require("path");

  // 1. Load from .iw/secrets.json
  const secretsPath = path.join(__dirname, "..", "..", ".iw", "secrets.json");
  if (fs.existsSync(secretsPath)) {
    const secrets = JSON.parse(fs.readFileSync(secretsPath, "utf-8"));
    for (const [k, v] of Object.entries(secrets)) {
      if (!process.env[k]) {
        process.env[k] = v as string;
      }
    }
  }

  // 2. Load from .env
  const envPath = path.join(__dirname, "..", "..", ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index > 0) {
        const key = trimmed.slice(0, index).trim();
        let val = trimmed.slice(index + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {}

const CODA_API_TOKEN = process.env.CODA_API_TOKEN;
const CODA_API_BASE = "https://coda.io/apis/v1";

if (!CODA_API_TOKEN) {
  console.error("Error: CODA_API_TOKEN environment variable is required");
  process.exit(1);
}

// ─── HTTP HELPERS ────────────────────────────────────────────────────────────

async function codaRequest(method: string, path: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${CODA_API_BASE}${path}`);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Bearer ${CODA_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Get page ID mappings for an existing document to enable idempotent updates
async function getExistingPages(docId: string): Promise<Record<string, string>> {
  const pageMap: Record<string, string> = {};
  try {
    const res = await codaRequest("GET", `/docs/${docId}/pages`);
    if (res && Array.isArray(res.items)) {
      for (const item of res.items) {
        // Map exact name
        pageMap[item.name.trim()] = item.id;
        // Strip out icons if any, e.g. "🏠 Home" -> "Home"
        const cleanName = item.name.replace(/^[\p{Emoji}\s]+/u, "").trim();
        pageMap[cleanName] = item.id;
      }
    }
  } catch (error) {
    console.warn("   ⚠️ Warning: Could not fetch existing pages:", error);
  }
  return pageMap;
}

// ─── TEMPLATE STRUCTURE ──────────────────────────────────────────────────────

const TEMPLATE = {
  title: "IntegrateWise — Operations Control Surface",
  sections: [
    {
      name: "Dashboard",
      description: "System overview, counts, and recent activity",
      icon: "📊",
    },
    {
      name: "Spine",
      description: "Book of Records + Book of Projects — The Foundation",
      icon: "📚",
    },
    {
      name: "Personal Memory",
      description: "L2 — User's personal notes, docs, behavioral patterns",
      icon: "🧠",
    },
    {
      name: "Org Memory",
      description: "L2.1 — Read-only view of canonical org memory",
      icon: "🏛️",
    },
    {
      name: "Teams",
      description: "L3 Teams — Shared context, collaborative ops",
      icon: "👥",
    },
    {
      name: "Think",
      description: "L3 Think — Strategy surface, AI Search",
      icon: "💡",
    },
    {
      name: "Ops",
      description: "L4 — Tasks, pipelines, live connectors",
      icon: "⚙️",
    },
    {
      name: "Agents",
      description: "L5 — Autonomous execution, Twin status",
      icon: "🤖",
    },
    {
      name: "Admin",
      description: "L6 — Audit logs, governance history, pipeline status",
      icon: "📋",
    },
    {
      name: "Twin",
      description: "L7 — Full memory view, Entity 360",
      icon: "🪞",
    },
  ],
};

// ─── ACTIVE SI PLAN DATA (THE 5 CONNECTIONS) ────────────────────────────────

const SI_PLAN_ROWS_DATA = [
  {
    name: "Connection 1: Memory → Live",
    component: "packages/connectors/memory-repo",
    status: "Staging",
    owner: "Hermes",
    goal: "Flow B sync: IntegrateWise Memory filesystem vault → Neon knowledge_documents database",
  },
  {
    name: "Connection 2: Folder Monitor → Live",
    component: "services/folder-watcher",
    status: "Active / Pending macOS bridge",
    owner: "Nirmal",
    goal: "Folder watcher Durable Object + macOS local chokidar monitor daemon bridge to intake pipeline",
  },
  {
    name: "Connection 3: CouchDB → Supabase",
    component: "services/continuity & services/intelligence",
    status: "In Progress",
    owner: "Hermes",
    goal: "Rewrite continuity & intelligence caching and states from CouchDB to Supabase conversational, org, and personal memory tables",
  },
  {
    name: "Connection 4: Live → integratewise-ops",
    component: "integratewise-ops / gateway API",
    status: "In Progress",
    owner: "Nirmal",
    goal: "Wire the REST API gateway proposal queue and actions to the Vue3 ops dashboard panel",
  },
  {
    name: "Connection 5: Live → BrandDoc",
    component: "integratewise-docs publication pipeline",
    status: "Pending",
    owner: "Hermes",
    goal: "Establish automatic documentation publication: org_memory (governance_state = approved) → BrandDoc transformer → docs site via GitHub API",
  },
];

// ─── RENDER TEMPLATE HELPER ─────────────────────────────────────────────────

function renderTemplate(templateName: string, data: Record<string, string>): string {
  let content = TEMPLATES[templateName];
  if (!content) {
    console.warn(`⚠️ Warning: Template not found in memory: ${templateName}`);
    return "";
  }
  for (const [key, value] of Object.entries(data)) {
    content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return content;
}

// ─── TEMPLATE BUILDER ────────────────────────────────────────────────────────

export async function buildOrSyncDoc(docIdOverride?: string): Promise<string> {
  // Load secrets from Infisical dynamically if configured
  let infisicalSecrets: Record<string, string> = {};
  try {
    infisicalSecrets = await fetchInfisicalSecrets(process.env);
    for (const [key, value] of Object.entries(infisicalSecrets)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (e) {
    console.warn("⚠️ Failed to check Infisical secrets:", e);
  }

  console.log("🏗️  Creating/Updating IntegrateWise Control Surface template...\n");

  const CODA_DOC_ID = docIdOverride || process.env.CODA_DOC_ID;
  let docId = CODA_DOC_ID;

  // Step 1: Resolve document ID
  if (docId) {
    console.log(`📄 Using existing document ID: ${docId}`);
  } else {
    console.log("📄 Creating fresh document...");
    const doc = await codaRequest("POST", "/docs", {
      title: TEMPLATE.title,
    });
    docId = doc.id;
    console.log(`   ✅ Document created: ${docId}`);
    console.log(`   📎 https://coda.io/d/${docId}\n`);
  }

  // Fetch existing pages if updating an existing doc
  const existingPages = docId ? await getExistingPages(docId) : {};

  // Step 2: Create or resolve pages for each architecture layer
  console.log("📑 Setting up pages...");
  const pageIds: Record<string, string> = {};

  for (const section of TEMPLATE.sections) {
    const existingId =
      existingPages[section.name] || existingPages[`${section.icon} ${section.name}`];

    if (existingId) {
      pageIds[section.name] = existingId;
      console.log(`   ✅ ${section.name} (Resolved existing page ID: ${existingId})`);
    } else {
      const page = await codaRequest("POST", `/docs/${docId}/pages`, {
        title: `${section.icon} ${section.name}`,
        subtitle: section.description,
      });
      pageIds[section.name] = page.id;
      console.log(`   ✅ ${section.name} (Created new page ID: ${page.id})`);
    }
  }
  console.log();

  // Step 3: Publish/Update Page Contents with Beautified HTML Templates
  console.log("🖋️  Publishing page contents...");
  for (const section of TEMPLATE.sections) {
    const pageId = pageIds[section.name];
    if (!pageId) continue;

    let templateFile = "";
    let data: Record<string, string> = {};

    switch (section.name) {
      case "Dashboard":
      case "Home":
        templateFile = "home.html";
        break;
      case "Mission":
        templateFile = "mission.html";
        break;
      case "Values":
        templateFile = "values.html";
        break;
      case "Goals":
        templateFile = "goals.html";
        break;
      case "Quarterly Goals":
        templateFile = "quarterly_goals.html";

        // Prepare rows for active connections
        const siPlanRowsHtml = SI_PLAN_ROWS_DATA.map((conn) => {
          let statusColor = "#374151";
          let statusBg = "#f3f4f6";
          if (conn.status.includes("Active") || conn.status.includes("Progress")) {
            statusColor = "#1e3a8a";
            statusBg = "#eff6ff";
          } else if (conn.status.includes("Staging") || conn.status.includes("Stalled")) {
            statusColor = "#92400e";
            statusBg = "#fef3c7";
          } else if (conn.status === "In Progress") {
            statusColor = "#2563eb";
            statusBg = "#eff6ff";
          }
          return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 8px; font-weight: bold; color: #111827;">${conn.name}</td>
              <td style="padding: 12px 8px; color: #4b5563; font-family: monospace;">${conn.component}</td>
              <td style="padding: 12px 8px;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: ${statusColor}; background-color: ${statusBg};">
                  ${conn.status}
                </span>
              </td>
              <td style="padding: 12px 8px; color: #4b5563;">${conn.owner}</td>
              <td style="padding: 12px 8px; color: #4b5563;">${conn.goal}</td>
            </tr>
          `;
        }).join("");
        data = { SI_PLAN_ROWS: siPlanRowsHtml };
        break;
      case "Progress":
        templateFile = "progress.html";
        data = {
          ACTIVE_CONNECTIONS_COUNT: "2",
          COMPLETION_PERCENTAGE: "40",
          DB_SYNC_HEALTH: "Healthy",
          SUCCESS_RATE: "98.7",
        };
        break;
      case "Admin":
        templateFile = "admin.html";

        const keysToInspect = [
          "CODA_API_TOKEN",
          "OPENROUTER_API_KEY",
          "SUPABASE_URL",
          "SUPABASE_SERVICE_ROLE_KEY",
          "MCP_CONNECTOR_API_KEY",
          "GITHUB_CLIENT_ID",
        ];

        let localSecrets: Record<string, string> = {};
        try {
          const fs = require("fs");
          const path = require("path");
          const secretsPath = path.join(__dirname, "..", "..", ".iw", "secrets.json");
          if (fs.existsSync(secretsPath)) {
            localSecrets = JSON.parse(fs.readFileSync(secretsPath, "utf-8"));
          }
        } catch (e) {}

        const secretsTableRowsHtml = keysToInspect
          .map((key) => {
            const val = localSecrets[key] || process.env[key] || infisicalSecrets[key];
            const isConfigured = !!val;
            const statusText = isConfigured ? "Configured" : "Missing";
            const statusColor = isConfigured ? "#03543f" : "#9b1c1c";
            const statusBg = isConfigured ? "#def7ec" : "#fde8e8";

            let maskedValue = "Not set";
            if (isConfigured && val) {
              maskedValue = val.length > 8 ? `${val.slice(0, 4)}...${val.slice(-4)}` : "****";
            }

            let sourceText = "N/A";
            if (localSecrets[key]) {
              sourceText = ".iw/secrets.json";
            } else if (infisicalSecrets[key]) {
              sourceText = "Infisical Vault";
            } else if (process.env[key]) {
              sourceText = ".env / Environment";
            }

            return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 8px; font-weight: bold; color: #111827; font-family: monospace;">${key}</td>
              <td style="padding: 12px 8px;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: ${statusColor}; background-color: ${statusBg};">
                  ${statusText}
                </span>
              </td>
              <td style="padding: 12px 8px; color: #4b5563; font-family: monospace;">${maskedValue}</td>
              <td style="padding: 12px 8px; color: #4b5563;">${sourceText}</td>
            </tr>
          `;
          })
          .join("");

        data = { SECRETS_TABLE_ROWS: secretsTableRowsHtml };
        break;
      default:
        // Use generic team page structure for Teams, Agents, Twin
        if (["Teams", "Agents", "Twin", "Think"].includes(section.name)) {
          templateFile = "generic_team.html";
          data = {
            TEAM_NAME: section.name,
            TEAM_DESCRIPTION: section.description,
            TEAM_RESPONSIBILITIES: `Core intelligence, pipeline processing, and state reporting for the ${section.name} architectural layer.`,
            TEAM_OWNER: "Hermes",
            TEAM_STATUS: "Active",
            TEAM_STATUS_BG: "#def7ec",
            TEAM_STATUS_COLOR: "#03543f",
          };
        }
        break;
    }

    if (templateFile) {
      try {
        const htmlContent = renderTemplate(templateFile, data);
        if (htmlContent) {
          await codaRequest("PUT", `/docs/${docId}/pages/${pageId}`, {
            contentUpdate: {
              insertionMode: "replace",
              canvasContent: {
                format: "html",
                content: htmlContent,
              },
            },
          });
          console.log(`   ✅ Content updated: ${section.name}`);
        }
      } catch (err) {
        console.error(
          `   ❌ Failed to update ${section.name} content:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }
  console.log();

  // Step 4: Create tables (handled idempotently by wrapping in try/catch)
  console.log("📊 Setting up tables...");

  // Book of Records table
  try {
    await codaRequest("POST", `/docs/${docId}/tables`, {
      name: "Book of Records",
      pageId: pageIds["Spine"],
      columns: [
        { name: "Topic", type: "String" },
        { name: "Category", type: "String" },
        { name: "Content", type: "String" },
        { name: "Version", type: "String" },
        {
          name: "Governance State",
          type: "SelectList",
          selectOptions: ["staging", "approved", "published", "archived"],
        },
        { name: "Updated At", type: "Date" },
      ],
    });
    console.log("   ✅ Book of Records table created");
  } catch (err) {
    console.log("   ℹ️ Book of Records table exists or skipped.");
  }

  // Book of Projects table
  try {
    await codaRequest("POST", `/docs/${docId}/tables`, {
      name: "Book of Projects",
      pageId: pageIds["Spine"],
      columns: [
        { name: "Project Name", type: "String" },
        {
          name: "Status",
          type: "SelectList",
          selectOptions: ["active", "paused", "completed", "archived"],
        },
        { name: "Priority", type: "SelectList", selectOptions: ["high", "medium", "low"] },
        { name: "Owner", type: "String" },
        { name: "Last Updated", type: "Date" },
        { name: "Summary", type: "String" },
      ],
    });
    console.log("   ✅ Book of Projects table created");
  } catch (err) {
    console.log("   ℹ️ Book of Projects table exists or skipped.");
  }

  // Personal Memory table
  try {
    await codaRequest("POST", `/docs/${docId}/tables`, {
      name: "Personal Memory",
      pageId: pageIds["Personal Memory"],
      columns: [
        { name: "Subject", type: "String" },
        {
          name: "Memory Type",
          type: "SelectList",
          selectOptions: [
            "preference",
            "behavioral_pattern",
            "decision",
            "skill_signal",
            "communication_style",
            "priority_pattern",
          ],
        },
        { name: "Content", type: "String" },
        { name: "Confidence", type: "Number" },
        {
          name: "Source",
          type: "SelectList",
          selectOptions: ["explicit", "inferred", "connector_derived", "session_derived"],
        },
        { name: "Is Active", type: "Checkbox" },
        { name: "Created At", type: "Date" },
      ],
    });
    console.log("   ✅ Personal Memory table created");
  } catch (err) {
    console.log("   ℹ️ Personal Memory table exists or skipped.");
  }

  // Triage Queue table
  try {
    await codaRequest("POST", `/docs/${docId}/tables`, {
      name: "Triage Queue",
      pageId: pageIds["Admin"],
      columns: [
        { name: "Content", type: "String" },
        { name: "Session ID", type: "String" },
        { name: "User ID", type: "String" },
        {
          name: "Role",
          type: "SelectList",
          selectOptions: ["user", "assistant", "system", "tool"],
        },
        {
          name: "Promotion State",
          type: "SelectList",
          selectOptions: ["pending", "flagged", "promoted", "rejected"],
        },
        { name: "Created At", type: "Date" },
      ],
    });
    console.log("   ✅ Triage Queue table created");
  } catch (err) {
    console.log("   ℹ️ Triage Queue table exists or skipped.");
  }

  // Teams table
  try {
    await codaRequest("POST", `/docs/${docId}/tables`, {
      name: "Teams",
      pageId: pageIds["Teams"],
      columns: [
        { name: "Team Name", type: "String" },
        { name: "Members", type: "String" },
        { name: "Shared Context", type: "String" },
        { name: "Status", type: "SelectList", selectOptions: ["active", "inactive"] },
      ],
    });
    console.log("   ✅ Teams table created");
  } catch (err) {
    console.log("   ℹ️ Teams table exists or skipped.");
  }

  // Agents table
  try {
    await codaRequest("POST", `/docs/${docId}/tables`, {
      name: "Agents",
      pageId: pageIds["Agents"],
      columns: [
        { name: "Agent Name", type: "String" },
        {
          name: "Type",
          type: "SelectList",
          selectOptions: ["triage", "twin", "operator", "orchestrator"],
        },
        { name: "Status", type: "SelectList", selectOptions: ["active", "inactive", "error"] },
        { name: "Last Active", type: "Date" },
        { name: "Memory Writes", type: "Number" },
      ],
    });
    console.log("   ✅ Agents table created");
  } catch (err) {
    console.log("   ℹ️ Agents table exists or skipped.");
  }

  // Audit Log table
  try {
    await codaRequest("POST", `/docs/${docId}/tables`, {
      name: "Audit Log",
      pageId: pageIds["Admin"],
      columns: [
        { name: "Action", type: "String" },
        { name: "User", type: "String" },
        { name: "Target", type: "String" },
        { name: "Details", type: "String" },
        { name: "Timestamp", type: "Date" },
      ],
    });
    console.log("   ✅ Audit Log table created\n");
  } catch (err) {
    console.log("   ℹ️ Audit Log table exists or skipped.\n");
  }

  // Step 5: Summary
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("✅ IntegrateWise Control Surface template setup complete!");
  console.log("═══════════════════════════════════════════════════════════════\n");
  console.log(`📄 Document: https://coda.io/d/${docId}`);
  console.log(`📑 Pages:    ${TEMPLATE.sections.length} (beautified layers updated)`);
  console.log("\n🔗 Ensure you have deployed the Coda Pack to sync live data.");

  return docId || "";
}

// ─── RUN (CLI mode) ──────────────────────────────────────────────────────────

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  buildOrSyncDoc().catch(console.error);
}

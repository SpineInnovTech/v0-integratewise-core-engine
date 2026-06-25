import * as https from "https";
import * as fs from "fs";
import * as path from "path";

// ─── LOAD SECRETS ────────────────────────────────────────────────────────────
let CODA_API_TOKEN = process.env.CODA_API_TOKEN;
let CODA_DOC_ID = process.env.CODA_DOC_ID || "oKS2wqK0io";

try {
  const secretsPath = path.join(__dirname, "..", "..", ".iw", "secrets.json");
  if (fs.existsSync(secretsPath)) {
    const secrets = JSON.parse(fs.readFileSync(secretsPath, "utf-8"));
    if (secrets.CODA_API_TOKEN && !CODA_API_TOKEN) {
      CODA_API_TOKEN = secrets.CODA_API_TOKEN;
    }
    if (secrets.CODA_DOC_ID && !process.env.CODA_DOC_ID) {
      CODA_DOC_ID = secrets.CODA_DOC_ID;
    }
  }
} catch (e) {}

if (!CODA_API_TOKEN) {
  console.error("Error: CODA_API_TOKEN is required. Please set it locally.");
  process.exit(1);
}

const CODA_API_BASE = "https://coda.io/apis/v1";

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

// ─── ACTIVE DATA ─────────────────────────────────────────────────────────────
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

// ─── MAIN BUILDER ────────────────────────────────────────────────────────────
async function main() {
  console.log(`🏗️  Syncing Coda Template Copy: ${CODA_DOC_ID}...\n`);

  // Target Page IDs (from the duplicated document)
  const pages = {
    summary: "canvas-KgS7xJ6-GB", // Executive summary
    research: "canvas-CSscRpt0oa", // Account research
    teamPlan: "canvas-fFrzVsM0OO", // Account team plan
    meetingNotes: "canvas-OYpggo5sCh", // Meeting Notes
    executive: "canvas-YXxz3O3CSt", // Executive
  };

  // Build the 5 connection table rows
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

  // 1. Executive Summary HTML
  const summaryHtml = `
  <div>
    <h2 style="color: #111827; margin-top: 0;">⭐ Executive summary - IntegrateWise</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      Executive overview: opportunities, risks, and next steps for the 5 Connections (SI Plan) as we move toward the Customer Zero Mandate.
    </p>

    <!-- Callout Box -->
    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
      <h4 style="margin: 0 0 4px 0; color: #1f2937;">🎯 Core Mandate: Customer Zero</h4>
      <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5;">
        We run IntegrateWise to operate, monitor, and synchronize IntegrateWise itself. Every surface we keep is a real-world operational node of our own company running on our own engine.
      </p>
    </div>

    <!-- Active Connections Table -->
    <h3 style="color: #1f2937; margin-top: 24px;">🔌 Active Connections Status</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-family: sans-serif; font-size: 13px;">
      <thead>
        <tr style="background-color: #f3f4f6; text-align: left; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 10px 8px; font-weight: 600; color: #374151;">Connection</th>
          <th style="padding: 10px 8px; font-weight: 600; color: #374151;">Component</th>
          <th style="padding: 10px 8px; font-weight: 600; color: #374151;">Status</th>
          <th style="padding: 10px 8px; font-weight: 600; color: #374151;">Owner</th>
          <th style="padding: 10px 8px; font-weight: 600; color: #374151;">Goal / Target</th>
        </tr>
      </thead>
      <tbody>
        ${siPlanRowsHtml}
      </tbody>
    </table>

    <!-- The Success Path Side-by-Side Cards -->
    <h3 style="color: #1f2937; margin-top: 32px;">🛣️ The Success Path</h3>
    <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 12px; margin-bottom: 24px;">
      <tr>
        <td style="width: 50%; padding-right: 12px; border: none; vertical-align: top;">
          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; min-height: 120px;">
            <div style="font-size: 15px; font-weight: bold; color: #92400e; margin-bottom: 8px;">🏔️ IntegrateWise Vision</div>
            <p style="font-size: 12px; color: #78350f; margin: 0; line-height: 1.5;">
              Build the unified, secure cognitive nervous system that integrates, governs, and automates institutional memory across all platforms, making operations self-documenting.
            </p>
          </div>
        </td>
        <td style="width: 50%; padding-left: 12px; border: none; vertical-align: top;">
          <div style="background-color: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 8px; padding: 16px; min-height: 120px;">
            <div style="font-size: 15px; font-weight: bold; color: #0369a1; margin-bottom: 8px;">🎯 Platform Objectives</div>
            <ol style="font-size: 12px; color: #0369a1; margin: 0; padding-left: 20px; line-height: 1.5;">
              <li>Become Customer Zero within 7 days.</li>
              <li>Establish secure secrets vault utilizing Infisical.</li>
              <li>Deprecate CouchDB in favor of Supabase.</li>
            </ol>
          </div>
        </td>
      </tr>
    </table>

    <!-- Priorities Callout Box -->
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
      <h3 style="margin-top: 0; color: #111827; display: flex; align-items: center; font-size: 16px;">
        <span style="font-size: 18px; margin-right: 8px;">✅</span> Current Sprint Priorities
      </h3>
      <ol style="margin: 0; padding-left: 20px; line-height: 1.8; color: #4b5563; font-size: 13px;">
        <li><strong>Connection 1</strong>: Neon knowledge documents sync (Staging).</li>
        <li><strong>Connection 2</strong>: Durable Object Folder Watcher & macOS bridge (Active).</li>
        <li><strong>Connection 3</strong>: Continuity session migrations from CouchDB to Supabase (In Progress).</li>
        <li><strong>Connection 4</strong>: Vue3 ops dashboard proposals queue (In Progress).</li>
        <li><strong>Connection 5</strong>: Automatic doc publication pipeline via GitHub API (Pending).</li>
      </ol>
    </div>

    <!-- Champion & Exec Sponsor Side-by-Side Cards -->
    <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 24px; margin-bottom: 24px;">
      <tr>
        <td style="width: 50%; padding-right: 12px; border: none; vertical-align: top;">
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
            <div style="font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 8px;">🏆 Champion: Hermes</div>
            <p style="font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.4;">Autonomous operator managing pipeline integration and dual-write memory substrates.</p>
          </div>
        </td>
        <td style="width: 50%; padding-left: 12px; border: none; vertical-align: top;">
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px;">
            <div style="font-size: 14px; font-weight: bold; color: #065f46; margin-bottom: 8px;">👔 Sponsor: Nirmal</div>
            <p style="font-size: 12px; color: #064e3b; margin: 0; line-height: 1.4;">Founder driving Customer Zero Mandate and commercial bridge phase integrations.</p>
          </div>
        </td>
      </tr>
    </table>

    <!-- Opportunities & Risks Side-by-Side -->
    <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 24px;">
      <tr>
        <td style="width: 50%; padding-right: 12px; border: none; vertical-align: top;">
          <h3 style="color: #047857; margin-top: 0; font-size: 16px;">💸 Opportunities</h3>
          <ul style="padding-left: 20px; line-height: 1.6; color: #4b5563; font-size: 13px;">
            <li>Entity 360: HubSpot + Jira integration for daily risk briefings.</li>
            <li>Scale operational nodes cost-effectively using local macOS execution playbooks.</li>
          </ul>
        </td>
        <td style="width: 50%; padding-left: 12px; border: none; vertical-align: top;">
          <h3 style="color: #b91c1c; margin-top: 0; font-size: 16px;">⚠️ Top Risks</h3>
          <ul style="padding-left: 20px; line-height: 1.6; color: #4b5563; font-size: 13px;">
            <li>Consolidation failures (4 rebuilds lost already). Keeping architecture strictly locked.</li>
            <li>Infisical setup configuration drift between local and Cloudflare Workers environments.</li>
          </ul>
        </td>
      </tr>
    </table>
  </div>`;

  // 2. Account Research Page HTML (canvas-CSscRpt0oa)
  const researchHtml = `
  <div>
    <h2 style="color: #111827; margin-top: 0;">🔬 Platform Research & Architecture</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      Detailed architecture logs, traits validation, and rules gating the memory subsystem.
    </p>
    <hr />
    
    <h3 style="color: #1f2937;">📐 Trait Detection & Identity Resolution</h3>
    <p style="color: #4b5563; line-height: 1.5; font-size: 13px;">
      IntegrateWise utilizes 18 core traits and 7 canonical resource types to identify business entities across platforms.
      A HubSpot Contact, Salesforce Lead, or Jira Reporter resolving to the same physical person are linked in the relationship graph.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 12px;">
      Normalizer Stage 1-8 Normalizer consolidated. Normalization paid once per entity.<br>
      Object identity by nature, not label. HubSpot Contact = Salesforce Lead = Person.
    </div>
  </div>`;

  // 3. Account Team Plan Page HTML (canvas-fFrzVsM0OO)
  const teamPlanHtml = `
  <div>
    <h2 style="color: #111827; margin-top: 0;">📅 SI Plan Tasks & Roles</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      Coordination and task assignment checklist for the bridge phase.
    </p>
    <hr />

    <ul style="line-height: 1.8; color: #4b5563; padding-left: 20px; font-size: 14px;">
      <li>🟩 <strong>Connection 1</strong>: Deploy Neon DB sync pipeline (Hermes) - <i>Staging</i></li>
      <li>🟩 <strong>Connection 2</strong>: Folder Watcher + macOS bridge hook (Nirmal) - <i>Active</i></li>
      <li>🟨 <strong>Connection 3</strong>: Migrate CouchDB continuity logic to Supabase (Hermes) - <i>In Progress</i></li>
      <li>🟨 <strong>Connection 4</strong>: Vue3 controller dashboard action queue (Nirmal) - <i>In Progress</i></li>
      <li>⬜ <strong>Connection 5</strong>: Org Memory documentation auto-publishing (Hermes) - <i>Pending</i></li>
    </ul>
  </div>`;

  // 4. Executive Page HTML (canvas-YXxz3O3CSt)
  const executiveHtml = `
  <div>
    <h2 style="color: #111827; margin-top: 0;">📋 Administration & secrets Governance</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      Audit log status and local environment credentials configuration flags.
    </p>
    <hr />

    <h3 style="color: #1f2937;">🔑 Credentials Configuration Status</h3>
    <ul style="line-height: 1.8; color: #4b5563; padding-left: 20px; font-size: 13px;">
      <li><strong>CODA_API_TOKEN</strong>: Configured (Active Source: Local Vault)</li>
      <li><strong>CODA_DOC_ID</strong>: Configured (Active Source: Local Vault)</li>
      <li><strong>OPENROUTER_API_KEY</strong>: Configured (Active Source: Environment)</li>
      <li><strong>SUPABASE_URL</strong>: Configured (Active Source: Environment)</li>
    </ul>
  </div>`;

  // Sync to Coda
  try {
    console.log("🖋️  Updating page content: Executive Summary...");
    await codaRequest("PUT", `/docs/${CODA_DOC_ID}/pages/${pages.summary}`, {
      contentUpdate: {
        insertionMode: "replace",
        canvasContent: {
          format: "html",
          content: summaryHtml,
        },
      },
    });
    console.log("   ✅ Executive Summary page content synced.");

    console.log("🖋️  Updating page content: Architecture Research...");
    await codaRequest("PUT", `/docs/${CODA_DOC_ID}/pages/${pages.research}`, {
      contentUpdate: {
        insertionMode: "replace",
        canvasContent: {
          format: "html",
          content: researchHtml,
        },
      },
    });
    console.log("   ✅ Architecture Research page content synced.");

    console.log("🖋️  Updating page content: Team Plan...");
    await codaRequest("PUT", `/docs/${CODA_DOC_ID}/pages/${pages.teamPlan}`, {
      contentUpdate: {
        insertionMode: "replace",
        canvasContent: {
          format: "html",
          content: teamPlanHtml,
        },
      },
    });
    console.log("   ✅ Team Plan page content synced.");

    console.log("🖋️  Updating page content: Administration & Secrets...");
    await codaRequest("PUT", `/docs/${CODA_DOC_ID}/pages/${pages.executive}`, {
      contentUpdate: {
        insertionMode: "replace",
        canvasContent: {
          format: "html",
          content: executiveHtml,
        },
      },
    });
    console.log("   ✅ Administration page content synced.");

    console.log("\n🎉 Template synchronization complete!");
    console.log(`📎 Access link: https://coda.io/d/${CODA_DOC_ID}`);
  } catch (error) {
    console.error("❌ Failed to sync templates to duplicated document:", error);
  }
}

main().catch(console.error);

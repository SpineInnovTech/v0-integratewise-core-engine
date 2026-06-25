/**
 * knowledge-sync.ts
 * Instant dual-write: Open WebUI Knowledge + Firestore knowledge_entries
 * Triggered by: Hermes session writes, Cloudflare Workflows, continuity events
 * Maintainer: Kimi
 * Doctrine: TypeScript only, no Python
 */

import { execSync } from "child_process";
import * as https from "https";
import * as http from "http";

const WEBUI_LOCAL = process.env.WEBUI_URL || "http://localhost:3000";
const WEBUI_EMAIL = "connect@integratewise.ai";
const WEBUI_PASS = process.env.WEBUI_PASS;
if (!WEBUI_PASS) {
  throw new Error("CRITICAL: WEBUI_PASS environment variable is not set.");
}
const GCP_PROJECT = "integratewise-4a649";

export const KB_IDS = {
  session: "fb05c6ae-8be9-4079-8612-a4f097b610a5",
  doctrine: "6cd17faa-d62c-4ff9-b08d-64b75dbf6083",
};

function req(
  url: string,
  opts: { method: string; headers?: Record<string, string>; body?: string }
): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const r = lib.request(
      {
        hostname: u.hostname,
        port: u.port || undefined,
        path: u.pathname + u.search,
        method: opts.method,
        headers: opts.headers,
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch {
            resolve(d);
          }
        });
      }
    );
    r.on("error", reject);
    if (opts.body) r.write(opts.body);
    r.end();
  });
}

async function webuiToken(): Promise<string> {
  const r = await req(`${WEBUI_LOCAL}/api/v1/auths/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: WEBUI_EMAIL, password: WEBUI_PASS }),
  });
  if (!r.token) throw new Error(`WebUI auth failed: ${JSON.stringify(r)}`);
  return r.token;
}

async function gcpToken(): Promise<string> {
  return execSync("gcloud auth print-access-token 2>/dev/null").toString().trim();
}

export async function writeKnowledge(opts: {
  title: string;
  content: string;
  kb: "session" | "doctrine" | "both";
  source?: string;
  spineWorthy?: boolean;
}): Promise<{ webui: Record<string, string>; firestore: string }> {
  const { title, content, kb, source = "hermes", spineWorthy = false } = opts;
  const ts = new Date().toISOString();
  const results: Record<string, string> = {};

  console.log(`[knowledge-sync] "${title}" → ${kb}`);

  // 1. Open WebUI write
  const token = await webuiToken();
  const kbIds = kb === "both" ? Object.values(KB_IDS) : [KB_IDS[kb]];

  for (const kbId of kbIds) {
    const boundary = `----IWBoundary${Date.now()}`;
    const md = `# ${title}\n\n_Source: ${source} | Written: ${ts}_\n\n${content}`;
    const filename = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.md`;
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: text/markdown\r\n\r\n${md}\r\n--${boundary}--`;

    const file = await req(`${WEBUI_LOCAL}/api/v1/files/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(Buffer.byteLength(body)),
      },
      body,
    });

    if (!file?.id) {
      results[kbId] = `FAIL: ${JSON.stringify(file).slice(0, 100)}`;
      continue;
    }

    const add = await req(`${WEBUI_LOCAL}/api/v1/knowledge/${kbId}/file/add`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: file.id }),
    });
    results[kbId] = add?.id ? `OK:${file.id}` : `FAIL: ${JSON.stringify(add).slice(0, 100)}`;
    console.log(`[knowledge-sync] WebUI KB ${kbId.slice(0, 8)}: ${results[kbId]}`);
  }

  // 2. Firestore write
  let fsResult = "SKIP";
  try {
    const gToken = await gcpToken();
    const docId = `ke-${Date.now()}`;
    const fs = await req(
      `https://firestore.googleapis.com/v1/projects/${GCP_PROJECT}/databases/(default)/documents/knowledge_entries/${docId}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${gToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            title: { stringValue: title },
            content: { stringValue: content },
            source: { stringValue: source },
            kb: { stringValue: kb },
            spineWorthy: { booleanValue: spineWorthy },
            approved: { booleanValue: false },
            createdAt: { stringValue: ts },
            updatedAt: { stringValue: ts },
          },
        }),
      }
    );
    fsResult = fs?.name ? `OK:${docId}` : `FAIL:${JSON.stringify(fs).slice(0, 100)}`;
    console.log(`[knowledge-sync] Firestore: ${fsResult}`);
  } catch (e: any) {
    fsResult = `FAIL:${e.message}`;
  }

  return { webui: results, firestore: fsResult };
}

// CLI
if (require.main === module) {
  const argv = process.argv.slice(2);
  const get = (f: string) => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : "";
  };
  writeKnowledge({
    title: get("--title") || `Note ${new Date().toISOString()}`,
    content: get("--content") || "No content",
    kb: (get("--kb") || "session") as any,
    source: get("--source") || "hermes_cli",
  })
    .then((r) => {
      console.log("\nDone:", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

#!/usr/bin/env npx ts-node
/**
 * knowledge-write.ts
 * Instant knowledge write to Open WebUI + Firestore knowledge_entries simultaneously.
 * Usage: npx ts-node knowledge-write.ts --title "..." --content "..." --kb "session|doctrine|both"
 *
 * Doctrine: TypeScript only. No Python.
 * Maintainer: Kimi
 */

import * as https from "https";
import * as http from "http";

// ── Config ──────────────────────────────────────────────────────────────────
const WEBUI_LOCAL = "http://localhost:3000";
const WEBUI_EMAIL = "connect@integratewise.ai";
const WEBUI_PASS = process.env.WEBUI_PASS;
if (!WEBUI_PASS) {
  console.error("CRITICAL: WEBUI_PASS environment variable is not set. Exiting.");
  process.exit(1);
}
const GCP_PROJECT = "integratewise-4a649";

const KNOWLEDGE_BASES: Record<string, string> = {
  session: "fb05c6ae-8be9-4079-8612-a4f097b610a5", // 3 Day Session History
  doctrine: "6cd17faa-d62c-4ff9-b08d-64b75dbf6083", // IW Architecture Doctrine
};

// ── HTTP helper ──────────────────────────────────────────────────────────────
function request(
  url: string,
  opts: { method: string; headers?: Record<string, string>; body?: string }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: opts.method,
        headers: opts.headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function writeKnowledge(
  title: string,
  content: string,
  target: "session" | "doctrine" | "both"
) {
  const timestamp = new Date().toISOString();
  const results: Record<string, string> = {};

  console.log(`[knowledge-write] Writing: "${title}" → ${target}`);

  // 1. Get Open WebUI JWT
  const authResp = await request(`${WEBUI_LOCAL}/api/v1/auths/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: WEBUI_EMAIL, password: WEBUI_PASS }),
  });
  const { token } = JSON.parse(authResp);
  if (!token) throw new Error("WebUI auth failed");

  // 2. Create a file in Open WebUI
  const kbIds = target === "both" ? Object.values(KNOWLEDGE_BASES) : [KNOWLEDGE_BASES[target]];

  for (const kbId of kbIds) {
    // Upload file to WebUI files
    const boundary = `----FormBoundary${Date.now()}`;
    const fileContent = `# ${title}\n\n_Written: ${timestamp}_\n\n${content}`;
    const fileName = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.md`;

    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
      `Content-Type: text/markdown`,
      "",
      fileContent,
      `--${boundary}--`,
    ].join("\r\n");

    const fileResp = await request(`${WEBUI_LOCAL}/api/v1/files/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(Buffer.byteLength(body)),
      },
      body,
    });

    const fileData = JSON.parse(fileResp);
    const fileId = fileData?.id;
    if (!fileId) {
      console.error("[knowledge-write] File upload failed:", fileResp.slice(0, 200));
      results[kbId] = "FAIL";
      continue;
    }
    console.log(`[knowledge-write] File uploaded: ${fileId}`);

    // Add file to knowledge base
    const addResp = await request(`${WEBUI_LOCAL}/api/v1/knowledge/${kbId}/file/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_id: fileId }),
    });
    const addData = JSON.parse(addResp);
    results[kbId] = addData?.id ? "OK" : `FAIL: ${addResp.slice(0, 100)}`;
    console.log(`[knowledge-write] KB ${kbId}: ${results[kbId]}`);
  }

  // 3. Write to Firestore knowledge_entries
  try {
    const gcpToken = await getGCPToken();
    const docId = `he-${Date.now()}`;
    const firestoreBody = JSON.stringify({
      fields: {
        title: { stringValue: title },
        content: { stringValue: content },
        source: { stringValue: "hermes_session" },
        target: { stringValue: target },
        approved: { booleanValue: false },
        spineWorthy: { booleanValue: false },
        createdAt: { stringValue: timestamp },
        updatedAt: { stringValue: timestamp },
      },
    });

    const fsResp = await request(
      `https://firestore.googleapis.com/v1/projects/${GCP_PROJECT}/databases/(default)/documents/knowledge_entries/${docId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${gcpToken}`,
          "Content-Type": "application/json",
        },
        body: firestoreBody,
      }
    );
    const fsData = JSON.parse(fsResp);
    results["firestore"] = fsData?.name ? "OK" : "FAIL";
    console.log(`[knowledge-write] Firestore: ${results["firestore"]}`);
  } catch (e) {
    results["firestore"] = `FAIL: ${e}`;
    console.error("[knowledge-write] Firestore write failed:", e);
  }

  console.log("\n[knowledge-write] Results:", results);
  return results;
}

async function getGCPToken(): Promise<string> {
  const { execSync } = await import("child_process");
  return execSync("gcloud auth print-access-token").toString().trim();
}

// ── CLI ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : "";
};

const title = get("--title") || `Session Note ${new Date().toISOString()}`;
const content = get("--content") || "No content provided";
const target = (get("--kb") || "session") as "session" | "doctrine" | "both";

writeKnowledge(title, content, target).catch(console.error);

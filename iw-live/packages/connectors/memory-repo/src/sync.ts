import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as dotenv from "dotenv";

// Load the environment variables from the monorepo root .env file
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const VAULT_PATH = process.env.VAULT_PATH || "/Users/nirmal/.iw-memory";
const PIPELINE_URL = process.env.PIPELINE_URL || "https://pipeline.integratewise.ai";
const TENANT_ID = process.env.TENANT_ID || "11111111-1111-1111-1111-111111111111";
const API_KEY = process.env.PIPELINE_API_KEY || "";

function generateUUID(str: string): string {
  const hash = crypto.createHash("md5").update(str).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    `4${hash.substring(13, 16)}`, // Version 4 UUID
    `8${hash.substring(17, 20)}`, // Variant 1 UUID
    hash.substring(20, 32),
  ].join("-");
}

interface MemoryDocument {
  id: string;
  path: string;
  category: string;
  topic: string;
  content: string;
  version: string;
  author: string;
  governanceState: string;
  lastModified: string;
  sizeBytes: number;
}

function parseMetadata(content: string, key: string): string | null {
  const lines = content.split("\n").slice(0, 15);
  const regex = new RegExp(`(?:^|>|\\*|-)\\s*${key}\\s*:\\s*(.+)`, "i");
  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      return match[1].trim().replace(/^['"\`]+|['"\`]+$/g, "");
    }
  }
  return null;
}

function scanVault(vaultPath: string): MemoryDocument[] {
  const documents: MemoryDocument[] = [];
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault path not found: ${vaultPath}`);
  }

  const scanDirectory = (dirPath: string) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        entry.name !== "README.md" &&
        entry.name !== "SEED_MANIFEST.md"
      ) {
        try {
          const stats = fs.statSync(fullPath);
          const content = fs.readFileSync(fullPath, "utf-8");

          const relativePath = path.relative(vaultPath, fullPath);
          const relativeDir = path.dirname(relativePath);
          const category = relativeDir === "." ? "Uncategorized" : relativeDir;

          const topic = path.basename(entry.name, ".md");
          const version = parseMetadata(content, "version") || "1.0.0";
          const author = parseMetadata(content, "author") || "nirmal@integratewise.ai";
          const governanceState = parseMetadata(content, "status") || "approved";

          const docId = generateUUID(relativePath);
          documents.push({
            id: docId,
            path: fullPath,
            category,
            topic,
            content,
            version,
            author,
            governanceState,
            lastModified: stats.mtime.toISOString(),
            sizeBytes: stats.size,
          });
        } catch (err) {
          console.error(`Failed to parse document ${entry.name}:`, err);
        }
      }
    }
  };

  scanDirectory(vaultPath);
  return documents;
}

async function syncToPipeline(documents: MemoryDocument[]) {
  const endpoint = `${PIPELINE_URL}/v1/spine/org_memory`;

  // Pipeline maps these directly into the org_memory table columns + metadata JSONB column
  const entities = documents.map((doc) => {
    // Map relativeDir category to valid memory.knowledge_category enum value
    let dbCategory = "insight";
    const catLower = doc.category.toLowerCase();
    if (
      catLower.includes("strategy") ||
      catLower.includes("doctrine") ||
      catLower.includes("origin") ||
      catLower.includes("ai")
    ) {
      dbCategory = "doctrine";
    } else if (
      catLower.includes("engineering") ||
      catLower.includes("architecture") ||
      catLower.includes("spec") ||
      catLower.includes("standard") ||
      catLower.includes("policy")
    ) {
      dbCategory = "policy";
    } else if (catLower.includes("department") || catLower.includes("departments")) {
      dbCategory = "pattern";
    } else if (catLower.includes("conversation") || catLower.includes("session")) {
      dbCategory = "episode";
    } else if (catLower.includes("decision")) {
      dbCategory = "decision";
    } else if (catLower.includes("commitment")) {
      dbCategory = "commitment";
    } else if (catLower.includes("learning")) {
      dbCategory = "learning";
    } else if (catLower.includes("workflow")) {
      dbCategory = "workflow";
    }

    return {
      entity_type: "org_memory",
      name: doc.topic,
      source: "memory-repo",
      source_id: doc.id,
      data: {
        id: doc.id,
        category: dbCategory,
        title: doc.topic,
        body: doc.content,
        governance_state: doc.governanceState,
        version: 1,
        source_flow: "manual_promotion",
        confidence_score: 1.0,
        metadata: {
          // Saved as JSON B
          path: doc.path,
          original_category: doc.category,
          version: doc.version,
          author: doc.author,
          last_modified: doc.lastModified,
          size_bytes: doc.sizeBytes,
        },
      },
    };
  });

  const BATCH_SIZE = 25;
  console.log(`Syncing ${entities.length} documents in batches of ${BATCH_SIZE} to ${endpoint}...`);

  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    const batch = entities.slice(i, i + BATCH_SIZE);
    const batchNum = i / BATCH_SIZE + 1;
    const totalBatches = Math.ceil(entities.length / BATCH_SIZE);

    console.log(`[Batch ${batchNum}/${totalBatches}] Sending ${batch.length} documents...`);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": TENANT_ID,
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          tenant_id: TENANT_ID,
          entities: batch,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Failed to sync batch. Status: ${response.status} ${errText}`);
      } else {
        const data = await response.json();
        console.log(`[Batch ${batchNum}/${totalBatches}] Synced successfully!`, data);
      }
    } catch (error) {
      console.error(`Error connecting to pipeline API for batch ${batchNum}:`, error);
    }

    // Add a small 100ms pause to respect Cloudflare rate limits and control TCP backpressure
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function run() {
  console.log(`Scanning vault at ${VAULT_PATH}...`);
  const docs = scanVault(VAULT_PATH);
  console.log(`Found ${docs.length} markdown documents.`);
  await syncToPipeline(docs);
}

run().catch(console.error);

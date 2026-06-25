#!/usr/bin/env node
/**
 * macOS Folder Monitor Bridge
 *
 * Watches IntegrateWise - Memory/Conversation memory/ for file changes
 * and forwards events to Cloudflare Folder Watcher Durable Object.
 *
 * This bridges the gap between local filesystem and CF edge processing,
 * enabling real-time session log processing and audit trail capture.
 *
 * Installation:
 *   npm install chokidar node-fetch@2
 *
 * Usage:
 *   export FOLDER_WATCHER_KEY="your-secret-key"
 *   node scripts/folder-monitor-bridge.js
 *
 * Production (PM2):
 *   pm2 start scripts/folder-monitor-bridge.js --name iw-folder-monitor
 *   pm2 save
 *   pm2 startup
 */

const chokidar = require("chokidar");
const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");

// Configuration
const WATCH_DIR = path.resolve(__dirname, "../../IntegrateWise - Memory/Conversation memory/");
const FOLDER_WATCHER_URL =
  process.env.FOLDER_WATCHER_URL || "https://folder-watcher.connect-a1b.workers.dev/api/ingest";
const AUTH_TOKEN = process.env.FOLDER_WATCHER_KEY;
const TENANT_ID = "iw-internal";

// Validation
if (!AUTH_TOKEN) {
  console.error("[ERROR] FOLDER_WATCHER_KEY environment variable not set");
  console.error("Usage: export FOLDER_WATCHER_KEY='your-secret-key'");
  process.exit(1);
}

if (!fs.existsSync(WATCH_DIR)) {
  console.error(`[ERROR] Watch directory does not exist: ${WATCH_DIR}`);
  console.error("Please ensure IntegrateWise - Memory repository is cloned at correct location");
  process.exit(1);
}

// Event sequence counter
let seq = 0;

// Watcher configuration
const watcher = chokidar.watch(WATCH_DIR, {
  ignored: [
    /(^|[\/\\])\../, // Ignore dotfiles
    /node_modules/,
    /\.DS_Store$/,
    /~$/, // Ignore temp files
  ],
  persistent: true,
  ignoreInitial: true, // Don't send events for existing files
  awaitWriteFinish: {
    stabilityThreshold: 1000, // Wait 1s after last change
    pollInterval: 100,
  },
  depth: 10, // Watch subdirectories
});

console.log(`[${new Date().toISOString()}] 🚀 Folder Monitor Bridge started`);
console.log(`[${new Date().toISOString()}] 📂 Watching: ${WATCH_DIR}`);
console.log(`[${new Date().toISOString()}] 🎯 Target: ${FOLDER_WATCHER_URL}`);
console.log(`[${new Date().toISOString()}] 🔐 Auth: ${AUTH_TOKEN.substring(0, 10)}...`);
console.log(`[${new Date().toISOString()}] 👤 Tenant: ${TENANT_ID}`);
console.log("");

// Event handlers
watcher
  .on("add", (filePath) => sendEvent("add", filePath))
  .on("change", (filePath) => sendEvent("change", filePath))
  .on("unlink", (filePath) => sendEvent("unlink", filePath))
  .on("error", (error) => {
    console.error(`[${new Date().toISOString()}] ❌ Watcher error:`, error.message);
  });

/**
 * Send file change event to Cloudflare Folder Watcher
 */
async function sendEvent(action, absolutePath) {
  const relativePath = path.relative(WATCH_DIR, absolutePath);

  // Read file content for add/change events
  let content = undefined;
  if (action !== "unlink") {
    try {
      content = fs.readFileSync(absolutePath, "utf8");
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] ❌ Failed to read file ${relativePath}:`,
        error.message
      );
      return;
    }
  }

  // Build event payload
  const payload = {
    tenant_id: TENANT_ID,
    seq: ++seq,
    events: [
      {
        action,
        path: relativePath,
        content,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  // Send to Folder Watcher
  try {
    const response = await fetch(FOLDER_WATCHER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      timeout: 10000, // 10s timeout
    });

    if (response.ok) {
      const actionEmoji = action === "add" ? "➕" : action === "change" ? "✏️" : "🗑️";
      console.log(
        `[${new Date().toISOString()}] ${actionEmoji} ${action.padEnd(7)} ${relativePath}`
      );
    } else {
      const errorText = await response.text();
      console.error(
        `[${new Date().toISOString()}] ❌ Failed ${action} ${relativePath}: HTTP ${response.status}`
      );
      console.error(`[${new Date().toISOString()}]    Response: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] ❌ Error sending ${action} ${relativePath}:`,
      error.message
    );
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("");
  console.log(`[${new Date().toISOString()}] 🛑 Shutting down...`);
  await watcher.close();
  console.log(`[${new Date().toISOString()}] ✅ Folder Monitor Bridge stopped`);
  console.log(`[${new Date().toISOString()}] 📊 Total events processed: ${seq}`);
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("");
  console.log(`[${new Date().toISOString()}] 🛑 Received SIGTERM, shutting down...`);
  await watcher.close();
  process.exit(0);
});

// Health check logging
setInterval(() => {
  console.log(`[${new Date().toISOString()}] 💓 Health check - events processed: ${seq}`);
}, 60000); // Every minute

require("dotenv").config({ path: require("path").resolve(process.env.HOME, ".iw/secrets.env") });
const chokidar = require("chokidar");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// Configuration
const WATCH_DIR = process.env.IW_MEMORY_DIR || "/Users/nirmal/.iw-memory";
const WEBHOOK_URL =
  process.env.WEBHOOK_INGRESS_URL || "http://localhost:8799/webhooks/folder-monitor";
const AUTH_KEY = process.env.FOLDER_WATCHER_KEY; // Must match the secret in webhook-ingress
const TENANT_ID = process.env.IW_TENANT_ID || "default";

let sequenceNum = 1;

// Debounce map
const pendingEvents = new Map();
const DEBOUNCE_MS = 1000;

function sendEvents(events) {
  if (!AUTH_KEY) {
    console.warn("⚠️ Warning: FOLDER_WATCHER_KEY is not set in ~/.iw/secrets.env");
  }

  const payload = {
    seq: sequenceNum++,
    tenant_id: TENANT_ID,
    events,
  };

  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AUTH_KEY ? { Authorization: `Bearer ${AUTH_KEY}` } : {}),
    },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) =>
      console.log(
        `[${new Date().toISOString()}] Synced ${events.length} event(s) to pipeline`,
        data
      )
    )
    .catch((err) => console.error(`[${new Date().toISOString()}] Sync failed:`, err.message));
}

function processEvent(action, filePath) {
  // Ignore system files and node_modules
  if (
    filePath.includes(".DS_Store") ||
    filePath.includes(".git/") ||
    filePath.includes("node_modules/")
  ) {
    return;
  }

  // Use relative path from the WATCH_DIR root
  const relPath = path.relative(WATCH_DIR, filePath);
  let content = undefined;

  if (action !== "unlink") {
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch (e) {
      console.error(`Could not read ${filePath}:`, e.message);
      return;
    }
  }

  const eventData = {
    action,
    path: relPath,
    content,
    timestamp: new Date().toISOString(),
  };

  // Debounce multiple fast edits to the same file
  if (pendingEvents.has(relPath)) {
    clearTimeout(pendingEvents.get(relPath).timer);
  }

  pendingEvents.set(relPath, {
    data: eventData,
    timer: setTimeout(() => {
      const e = pendingEvents.get(relPath).data;
      pendingEvents.delete(relPath);
      sendEvents([e]);
    }, DEBOUNCE_MS),
  });
}

console.log(`\n👁️  IntegrateWise Local Folder Monitor`);
console.log(`==========================================`);
console.log(`Watching: ${WATCH_DIR}`);
console.log(`Target:   ${WEBHOOK_URL}`);
console.log(`Tenant:   ${TENANT_ID}`);
console.log(`Status:   Active\n`);

const watcher = chokidar.watch(WATCH_DIR, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true, // Do not trigger add events for existing files on startup
});

watcher
  .on("add", (path) => processEvent("add", path))
  .on("change", (path) => processEvent("change", path))
  .on("unlink", (path) => processEvent("unlink", path));

// Handle graceful shutdown
process.on("SIGINT", () => {
  watcher.close().then(() => {
    console.log("\nMonitor stopped.");
    process.exit(0);
  });
});

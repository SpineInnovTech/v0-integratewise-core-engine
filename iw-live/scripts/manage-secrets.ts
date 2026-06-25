import * as fs from "fs";
import * as path from "path";
import { fetchInfisicalSecrets, pushInfisicalSecret } from "../packages/coda-pack/infisical";

const SECRETS_DIR = path.join(__dirname, "..", ".iw");
const SECRETS_FILE = path.join(SECRETS_DIR, "secrets.json");

// Simple zero-dependency .env loader
function loadEnv() {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const index = trimmed.indexOf("=");
        if (index > 0) {
          const key = trimmed.slice(0, index).trim();
          let val = trimmed.slice(index + 1).trim();
          // Strip quotes
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
  } catch (e) {
    console.warn("⚠️ Warning: Failed to read .env file:", e);
  }
}

// Load env values first
loadEnv();

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function loadSecrets(): Record<string, string> {
  if (!fs.existsSync(SECRETS_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(SECRETS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("⚠️ Error reading secrets store. Creating a new one.");
    return {};
  }
}

function saveSecrets(secrets: Record<string, string>) {
  try {
    ensureDirectoryExistence(SECRETS_FILE);
    fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2), "utf-8");
  } catch (error) {
    console.error("❌ Failed to write secrets file:", error);
  }
}

function isInfisicalConfigured(): boolean {
  const secrets = loadSecrets();
  const clientId = process.env.INFISICAL_CLIENT_ID || secrets.INFISICAL_CLIENT_ID;
  const clientSecret = process.env.INFISICAL_CLIENT_SECRET || secrets.INFISICAL_CLIENT_SECRET;
  const projectId = process.env.INFISICAL_PROJECT_ID || secrets.INFISICAL_PROJECT_ID;
  return !!(clientId && clientSecret && projectId);
}

function getInfisicalEnv() {
  const secrets = loadSecrets();
  return {
    INFISICAL_CLIENT_ID: process.env.INFISICAL_CLIENT_ID || secrets.INFISICAL_CLIENT_ID,
    INFISICAL_CLIENT_SECRET: process.env.INFISICAL_CLIENT_SECRET || secrets.INFISICAL_CLIENT_SECRET,
    INFISICAL_PROJECT_ID: process.env.INFISICAL_PROJECT_ID || secrets.INFISICAL_PROJECT_ID,
    INFISICAL_ENV: process.env.INFISICAL_ENV || secrets.INFISICAL_ENV || "dev",
    INFISICAL_SITE_URL:
      process.env.INFISICAL_SITE_URL || secrets.INFISICAL_SITE_URL || "https://app.infisical.com",
  };
}

async function run() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help") {
    console.log(`
🔒 IntegrateWise Secrets Manager (with Infisical Vault Integration)

Usage:
  npx tsx scripts/manage-secrets.ts set <key> <value>    Set a secret locally (and syncs to Infisical if configured)
  npx tsx scripts/manage-secrets.ts get <key>            Retrieve a secret value locally
  npx tsx scripts/manage-secrets.ts list                 Compare and list local, environment & Infisical secrets status
  npx tsx scripts/manage-secrets.ts pull                 Pull all raw secrets from Infisical vault to .iw/secrets.json
  npx tsx scripts/manage-secrets.ts push                 Push all local .iw/secrets.json secrets to Infisical vault
  npx tsx scripts/manage-secrets.ts delete <key>         Delete a secret locally
`);
    process.exit(0);
  }

  const secrets = loadSecrets();

  switch (command) {
    case "set": {
      const key = args[1];
      const value = args[2];
      if (!key || !value) {
        console.error(
          "❌ Error: Both key and value are required. Example: set CODA_API_TOKEN ts_12345"
        );
        process.exit(1);
      }

      const targetKey = key.toUpperCase();
      secrets[targetKey] = value;
      saveSecrets(secrets);
      console.log(`✅ Local secret "${targetKey}" set in .iw/secrets.json.`);

      // Sync to Infisical if configured
      if (isInfisicalConfigured()) {
        console.log(`🔒 Infisical configured. Syncing "${targetKey}" to remote vault...`);
        try {
          await pushInfisicalSecret(targetKey, value, getInfisicalEnv());
          console.log(`✅ Successfully synced "${targetKey}" to Infisical Vault.`);
        } catch (e) {
          console.error(
            `⚠️ Failed to sync "${targetKey}" to Infisical:`,
            e instanceof Error ? e.message : String(e)
          );
        }
      } else {
        console.log(`ℹ️ Infisical not configured. Secret is local-only.`);
      }
      break;
    }
    case "get": {
      const key = args[1];
      if (!key) {
        console.error("❌ Error: Key is required. Example: get CODA_API_TOKEN");
        process.exit(1);
      }
      const targetKey = key.toUpperCase();
      const val = secrets[targetKey] || process.env[targetKey];
      if (val) {
        console.log(val);
      } else {
        console.error(`❌ Error: Secret "${targetKey}" not found locally or in environment.`);
        process.exit(1);
      }
      break;
    }
    case "pull": {
      if (!isInfisicalConfigured()) {
        console.error(
          "❌ Error: Infisical is not configured. Please set INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET, and INFISICAL_PROJECT_ID."
        );
        process.exit(1);
      }
      console.log("🔒 Connecting to Infisical Vault to pull secrets...");
      try {
        const remoteSecrets = await fetchInfisicalSecrets(getInfisicalEnv());
        const count = Object.keys(remoteSecrets).length;
        if (count === 0) {
          console.log("ℹ️ No secrets found in remote Infisical vault.");
        } else {
          for (const [k, v] of Object.entries(remoteSecrets)) {
            secrets[k] = v;
          }
          saveSecrets(secrets);
          console.log(`✅ Successfully pulled and saved ${count} secrets to .iw/secrets.json.`);
        }
      } catch (e) {
        console.error(
          "❌ Failed to pull secrets from Infisical:",
          e instanceof Error ? e.message : String(e)
        );
        process.exit(1);
      }
      break;
    }
    case "push": {
      if (!isInfisicalConfigured()) {
        console.error("❌ Error: Infisical is not configured. Set client credentials first.");
        process.exit(1);
      }
      const localKeys = Object.keys(secrets).filter((k) => !k.startsWith("INFISICAL_"));
      if (localKeys.length === 0) {
        console.log("ℹ️ No local secrets to push (excluding Infisical config keys).");
        break;
      }
      console.log(`🔒 Pushing ${localKeys.length} local secrets to Infisical Vault...`);
      let successCount = 0;
      for (const k of localKeys) {
        try {
          await pushInfisicalSecret(k, secrets[k], getInfisicalEnv());
          console.log(`  ✅ Synced: ${k}`);
          successCount++;
        } catch (e) {
          console.error(`  ... Failed to sync: ${k} -`, e instanceof Error ? e.message : String(e));
        }
      }
      console.log(
        `\n🎉 Push completed: ${successCount}/${localKeys.length} secrets successfully uploaded.`
      );
      break;
    }
    case "list": {
      const localKeys = Object.keys(secrets);
      let remoteSecrets: Record<string, string> = {};
      let remoteConnected = false;

      if (isInfisicalConfigured()) {
        try {
          remoteSecrets = await fetchInfisicalSecrets(getInfisicalEnv());
          remoteConnected = true;
        } catch (e) {
          console.warn("⚠️ Warning: Could not fetch secrets from Infisical.");
        }
      }

      // Collect all keys from all sources
      const allKeys = new Set([
        ...localKeys,
        ...Object.keys(process.env).filter(
          (k) =>
            k.startsWith("CODA_") ||
            k.startsWith("OPENROUTER_") ||
            k.startsWith("SUPABASE_") ||
            k.startsWith("GITHUB_") ||
            k.startsWith("MCP_")
        ),
        ...Object.keys(remoteSecrets),
      ]);

      const sortedKeys = Array.from(allKeys).sort();

      console.log("\n🔑 IntegrateWise Secrets Status:\n");
      console.log(`Local Store: .iw/secrets.json (${localKeys.length} keys)`);
      if (isInfisicalConfigured()) {
        console.log(
          `Infisical Vault: Connected & Configured (${Object.keys(remoteSecrets).length} keys)`
        );
      } else {
        console.log("Infisical Vault: Not Configured");
      }
      console.log();

      // Print table header
      const colWidth = 28;
      const statusWidth = 25;
      const valWidth = 14;
      const srcWidth = 18;

      console.log("-".repeat(colWidth + statusWidth + valWidth + srcWidth + 9));
      console.log(
        `${"Secret Key".padEnd(colWidth)} | ${"Status / Location".padEnd(statusWidth)} | ${"Masked Value".padEnd(valWidth)} | ${"Active Source".padEnd(srcWidth)}`
      );
      console.log("-".repeat(colWidth + statusWidth + valWidth + srcWidth + 9));

      for (const k of sortedKeys) {
        const inLocal = secrets[k] !== undefined;
        const inEnv = process.env[k] !== undefined;
        const inRemote = remoteSecrets[k] !== undefined;

        let statusText = "Missing";
        let activeSource = "N/A";
        let rawVal = "";

        if (inLocal) {
          rawVal = secrets[k];
          activeSource = ".iw/secrets.json";
        }
        if (inEnv) {
          rawVal = process.env[k] || "";
          activeSource = "Environment (.env)";
        }
        if (inRemote && !rawVal) {
          rawVal = remoteSecrets[k];
          activeSource = "Infisical Vault";
        }

        const isConfigured = inLocal || inEnv || inRemote;

        if (isConfigured) {
          const locations: string[] = [];
          if (inLocal) locations.push("Local");
          if (inEnv) locations.push("Env");
          if (inRemote) locations.push("Remote");

          statusText = `Active (${locations.join(", ")})`;
        }

        // Check synchronicity
        if (remoteConnected && !k.startsWith("INFISICAL_")) {
          if (inLocal && !inRemote) {
            statusText = "Local Only (needs push)";
          } else if (!inLocal && inRemote) {
            statusText = "Remote Only (needs pull)";
          } else if (inLocal && inRemote && secrets[k] !== remoteSecrets[k]) {
            statusText = "Out of Sync (mismatch)";
          }
        }

        let maskedValue = "Not configured";
        if (isConfigured && rawVal) {
          maskedValue = rawVal.length > 8 ? `${rawVal.slice(0, 4)}...${rawVal.slice(-4)}` : "****";
        }

        console.log(
          `${k.padEnd(colWidth)} | ${statusText.padEnd(statusWidth)} | ${maskedValue.padEnd(valWidth)} | ${activeSource.padEnd(srcWidth)}`
        );
      }
      console.log("-".repeat(colWidth + statusWidth + valWidth + srcWidth + 9));
      console.log();
      break;
    }
    case "delete": {
      const key = args[1];
      if (!key) {
        console.error("❌ Error: Key is required. Example: delete CODA_API_TOKEN");
        process.exit(1);
      }
      const target = key.toUpperCase();
      if (secrets[target]) {
        delete secrets[target];
        saveSecrets(secrets);
        console.log(`✅ Secret "${target}" deleted locally.`);
      } else {
        console.error(`❌ Error: Secret "${target}" not found locally.`);
        process.exit(1);
      }
      break;
    }
    default:
      console.error(`❌ Unknown command: ${command}. Run "help" for options.`);
      process.exit(1);
  }
}

run().catch(console.error);

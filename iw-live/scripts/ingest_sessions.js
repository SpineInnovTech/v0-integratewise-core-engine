const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables from .env
function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hrrbciljsqxnmuwwnrnt.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error("Error: Supabase service key is not configured.");
  process.exit(1);
}

const DEFAULT_TENANT_ID = "fe10c88c-1f82-4793-83b4-e698678a5ae3";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      "x-tenant-id": DEFAULT_TENANT_ID,
    },
  },
});

// Helper to generate deterministic UUID version 5 style from string
function getDeterministicUuid(str) {
  const hash = crypto.createHash("sha1").update(str).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "5" + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join("-");
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ----------------------------------------------------
// 1. Ingest Pastes: .hermes/pastes/*.txt ──► chat_messages
// ----------------------------------------------------
async function ingestPastes() {
  console.log("\n--- Starting Ingest: Pastes (.hermes/pastes/*.txt) ---");
  const pastesDir = "/Users/nirmal/.hermes/pastes";
  if (!fs.existsSync(pastesDir)) {
    console.log(`Pastes directory ${pastesDir} does not exist. Skipping.`);
    return;
  }
  const files = fs.readdirSync(pastesDir).filter((f) => f.endsWith(".txt"));
  console.log(`Found ${files.length} paste files.`);

  for (const file of files) {
    const filePath = path.join(pastesDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    if (!content.trim()) continue;

    // Check if already exists in chat_messages by platform_id
    const { data: existing, error: checkErr } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("platform", "hermes-paste")
      .eq("platform_id", file)
      .limit(1);

    if (checkErr) {
      console.error(`Error checking paste ${file}:`, checkErr);
      continue;
    }
    if (existing && existing.length > 0) {
      // Already ingested
      continue;
    }

    const stat = fs.statSync(filePath);
    const { error: insertErr } = await supabase.from("chat_messages").insert({
      platform: "hermes-paste",
      platform_id: file,
      channel_name: "local-paste",
      user_name: "hermes",
      content: content,
      is_bot: true,
      sent_at: stat.mtime.toISOString(),
      created_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error(`Error inserting paste ${file}:`, insertErr);
    } else {
      console.log(`Ingested paste: ${file}`);
    }
  }
}

// Helper to recursively find wire.jsonl files
function findWireJsonlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findWireJsonlFiles(filePath, fileList);
    } else if (file === "wire.jsonl") {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// ----------------------------------------------------
// 2. Ingest Kimi Sessions: .kimi/sessions/**/wire.jsonl ──► sessions & triage_results
// ----------------------------------------------------
async function ingestKimiSessions() {
  console.log("\n--- Starting Ingest: Kimi Sessions (.kimi/sessions/**/wire.jsonl) ---");
  const sessionsDir = "/Users/nirmal/.kimi/sessions";
  if (!fs.existsSync(sessionsDir)) {
    console.log(`Kimi sessions directory ${sessionsDir} does not exist. Skipping.`);
    return;
  }
  const files = findWireJsonlFiles(sessionsDir);
  console.log(`Found ${files.length} wire.jsonl files recursively.`);

  for (const filePath of files) {
    const parts = filePath.split("/");
    // Get session_id and check if subagent
    // Format: .../.kimi/sessions/<hash>/<session_id>/wire.jsonl
    // Or: .../.kimi/sessions/<hash>/<session_id>/subagents/<subagent_id>/wire.jsonl
    const wireIndex = parts.indexOf("wire.jsonl");
    if (wireIndex < 2) continue;

    const isSubagent = parts[wireIndex - 2] === "subagents";
    const folderName = parts[wireIndex - 1];
    const sessionUuid = uuidRegex.test(folderName)
      ? folderName.toLowerCase()
      : getDeterministicUuid(filePath);

    // Parse JSONL turns
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    let turns = [];
    let firstTimestamp = null;
    let lastTimestamp = null;
    let currentTurn = null;

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const ts = obj.timestamp ? new Date(obj.timestamp * 1000) : null;
        if (ts) {
          if (!firstTimestamp) firstTimestamp = ts;
          lastTimestamp = ts;
        }

        if (obj.message) {
          const type = obj.message.type;
          const payload = obj.message.payload;

          if (type === "TurnBegin") {
            if (currentTurn) {
              turns.push(currentTurn);
            }
            currentTurn = {
              user_input: payload.user_input || "",
              thoughts: [],
              responses: [],
              timestamp: ts || new Date(),
            };
          } else if (type === "ContentPart") {
            if (currentTurn) {
              if (payload.type === "think" && payload.think) {
                currentTurn.thoughts.push(payload.think);
              } else if (payload.type === "text" && payload.text) {
                currentTurn.responses.push(payload.text);
              }
            }
          }
        }
      } catch (e) {
        // Ignore malformed JSON lines
      }
    }
    if (currentTurn) {
      turns.push(currentTurn);
    }

    if (turns.length === 0) continue;

    // Check if session already exists
    const { data: existingSession, error: checkSessErr } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionUuid)
      .limit(1);

    if (checkSessErr) {
      console.error(`Error checking session ${sessionUuid}:`, checkSessErr);
      continue;
    }

    const firstInput =
      typeof turns[0].user_input === "string"
        ? turns[0].user_input
        : JSON.stringify(turns[0].user_input || "");
    const title = firstInput.substring(0, 50).trim() || `Kimi Session ${folderName}`;
    let transcript = "";
    for (const turn of turns) {
      const inputStr =
        typeof turn.user_input === "string"
          ? turn.user_input
          : JSON.stringify(turn.user_input || "");
      transcript += `### User\n\n${inputStr}\n\n`;
      if (turn.thoughts.length > 0) {
        transcript += `> **Thought**\n> ${turn.thoughts.join("\n> ")}\n\n`;
      }
      if (turn.responses.length > 0) {
        transcript += `### Agent\n\n${turn.responses.join("\n\n")}\n\n`;
      }
      transcript += `---\n\n`;
    }

    if (!existingSession || existingSession.length === 0) {
      // Insert session
      const { error: insertSessErr } = await supabase.from("sessions").insert({
        id: sessionUuid,
        title: title,
        type: isSubagent ? "kimi-subagent" : "kimi-session",
        status: "completed",
        scheduled_at: (firstTimestamp || new Date()).toISOString(),
        duration_minutes:
          lastTimestamp && firstTimestamp
            ? Math.round((lastTimestamp - firstTimestamp) / 60000)
            : 0,
        location: "local-workspace",
        attendees: ["user", "kimi"],
        agenda: firstInput.substring(0, 500),
        summary: transcript,
        metadata: {
          path: filePath,
          turn_count: turns.length,
          is_subagent: isSubagent,
          folder_name: folderName,
        },
        created_at: (firstTimestamp || new Date()).toISOString(),
        updated_at: (lastTimestamp || new Date()).toISOString(),
      });

      if (insertSessErr) {
        console.error(`Error inserting session ${sessionUuid}:`, insertSessErr);
        continue;
      }
      console.log(`Ingested session: ${sessionUuid} (${title})`);
    }

    // Ingest each turn into triage_results
    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const turnMsgId = `${sessionUuid}-turn-${i}`;

      const { data: existingTriage, error: checkTriageErr } = await supabase
        .from("triage_results")
        .select("id")
        .eq("message_id", turnMsgId)
        .limit(1);

      if (checkTriageErr || (existingTriage && existingTriage.length > 0)) {
        continue;
      }

      // Insert triage result (omitting enum columns priority, sentiment, category to avoid validation constraint errors)
      const { error: insertTriageErr } = await supabase.from("triage_results").insert({
        message_id: turnMsgId,
        platform: "kimi",
        content: `User: ${typeof turn.user_input === "string" ? turn.user_input : JSON.stringify(turn.user_input || "")}\n\nAgent thoughts: ${turn.thoughts.join("\n")}\n\nAgent response: ${turn.responses.join("\n")}`,
        requires_immediate_attention: false,
        confidence: 1.0,
        reasoning: "Ingested from local Kimi sessions",
        keywords: [],
        metadata: {
          session_id: sessionUuid,
          turn_index: i,
          timestamp: turn.timestamp.toISOString(),
        },
        approval_status: "pending",
        created_at: turn.timestamp.toISOString(),
        updated_at: turn.timestamp.toISOString(),
      });

      if (insertTriageErr) {
        console.error(`Error inserting triage result for turn ${turnMsgId}:`, insertTriageErr);
      }
    }
  }
}

// ----------------------------------------------------
// 3. Ingest Monitor Logs: .iw/logs/*.log ──► audit_log
// ----------------------------------------------------
async function ingestMonitorLogs() {
  console.log("\n--- Starting Ingest: Monitor Logs (.iw/logs/*.log) ---");
  const logsDir = "/Users/nirmal/.iw/logs";
  if (!fs.existsSync(logsDir)) {
    console.log(`Monitor logs directory ${logsDir} does not exist. Skipping.`);
    return;
  }
  const files = fs.readdirSync(logsDir).filter((f) => f.endsWith(".log"));
  console.log(`Found ${files.length} monitor log files.`);

  for (const file of files) {
    const filePath = path.join(logsDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    // Find latest entry for this file
    const { data: latestEntry, error: queryErr } = await supabase
      .from("audit_log")
      .select("created_at")
      .eq("entity_type", "system_log")
      .eq("entity_id", file)
      .order("created_at", { ascending: false })
      .limit(1);

    if (queryErr) {
      console.error(`Error checking latest logs for ${file}:`, queryErr);
      continue;
    }
    const latestTime =
      latestEntry && latestEntry.length > 0 ? new Date(latestEntry[0].created_at) : null;
    console.log(
      `Latest entry time in DB for ${file}:`,
      latestTime ? latestTime.toISOString() : "None"
    );

    let toInsert = [];
    for (const line of lines) {
      if (!line.trim()) continue;

      // Regex parse [2026-05-12 02:26:40 IST] [ZOMBIE] Zombie processes detected: ...
      const match = line.match(/^\[(.*?)\]\s+\[(.*?)\]\s+(.*)$/);
      if (match) {
        const tsStr = match[1];
        const action = match[2];
        const details = match[3];

        let cleanTsStr = tsStr.replace(" IST", " +0530");
        const ts = new Date(cleanTsStr);
        if (isNaN(ts.getTime())) continue;

        if (latestTime && ts <= latestTime) continue;

        toInsert.push({
          tenant_id: DEFAULT_TENANT_ID,
          action: action,
          entity_type: "system_log",
          entity_id: file,
          details: { raw_line: line, message: details },
          source: "system-monitor",
          created_at: ts.toISOString(),
        });
      } else {
        // Simple log line without bracketed type
        const matchSimple = line.match(/^\[(.*?)\]\s+(.*)$/);
        if (matchSimple) {
          const tsStr = matchSimple[1];
          const details = matchSimple[2];

          let cleanTsStr = tsStr.replace(" IST", " +0530");
          const ts = new Date(cleanTsStr);
          if (isNaN(ts.getTime())) continue;

          if (latestTime && ts <= latestTime) continue;

          toInsert.push({
            tenant_id: DEFAULT_TENANT_ID,
            action: "INFO",
            entity_type: "system_log",
            entity_id: file,
            details: { raw_line: line, message: details },
            source: "system-monitor",
            created_at: ts.toISOString(),
          });
        }
      }
    }

    if (toInsert.length > 0) {
      console.log(`Inserting ${toInsert.length} new log entries for ${file}`);
      const chunkSize = 500;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error: insertErr } = await supabase.from("audit_log").insert(chunk);

        if (insertErr) {
          console.error(`Error inserting chunk for ${file}:`, insertErr);
          break;
        }
      }
    }
  }
}

// ----------------------------------------------------
// 4. Ingest Hermes Sync Log: logs/hermes-sync.log ──► consolidated_memories
// ----------------------------------------------------
async function ingestHermesSync() {
  console.log("\n--- Starting Ingest: Hermes Sync (logs/hermes-sync.log) ---");
  const syncLogPath = "/Users/nirmal/logs/hermes-sync.log";
  if (!fs.existsSync(syncLogPath)) {
    console.log(`Hermes sync log file ${syncLogPath} does not exist. Skipping.`);
    return;
  }
  const content = fs.readFileSync(syncLogPath, "utf8");
  const lines = content.split("\n");
  console.log(`Found ${lines.length} lines in hermes-sync.log`);

  const { data: latestSync, error: queryErr } = await supabase
    .from("consolidated_memories")
    .select("time_range_start")
    .eq("consolidation_type", "hermes-sync")
    .order("time_range_start", { ascending: false })
    .limit(1);

  if (queryErr) {
    console.error("Error querying latest hermes-sync session:", queryErr);
  }
  const latestSyncTime =
    latestSync && latestSync.length > 0 ? new Date(latestSync[0].time_range_start) : null;
  console.log(
    `Latest hermes-sync run time in DB:`,
    latestSyncTime ? latestSyncTime.toISOString() : "None"
  );

  let sessions = [];
  let currentSession = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const startMatch = line.match(/^(.*?) === Hermes sync start ===$/);
    const endMatch = line.match(/^(.*?) === Hermes sync done ===$/);

    if (startMatch) {
      if (currentSession) {
        sessions.push(currentSession);
      }
      const dateStr = startMatch[1].replace(" IST ", " ");
      const startTs = new Date(dateStr);
      currentSession = {
        start: startTs,
        end: null,
        logs: [],
        raw_start_line: line,
      };
    } else if (endMatch) {
      if (currentSession) {
        const dateStr = endMatch[1].replace(" IST ", " ");
        currentSession.end = new Date(dateStr);
        currentSession.logs.push(line);
        sessions.push(currentSession);
        currentSession = null;
      }
    } else {
      if (currentSession) {
        currentSession.logs.push(line);
      }
    }
  }
  if (currentSession) {
    sessions.push(currentSession);
  }

  const newSessions = sessions.filter((s) => {
    if (isNaN(s.start.getTime())) return false;
    if (latestSyncTime && s.start <= latestSyncTime) return false;
    return true;
  });

  console.log(`Found ${sessions.length} total sync sessions, ${newSessions.length} are new.`);

  for (const s of newSessions) {
    const endTs = s.end && !isNaN(s.end.getTime()) ? s.end : s.start;
    const duration = s.end && !isNaN(s.end.getTime()) ? Math.round((s.end - s.start) / 1000) : 0;

    const errors = s.logs.filter(
      (l) =>
        l.toLowerCase().includes("error") ||
        l.toLowerCase().includes("failed") ||
        l.toLowerCase().includes("unrecognized option")
    );
    const warnings = s.logs.filter(
      (l) =>
        l.toLowerCase().includes("warning") ||
        l.toLowerCase().includes("receiver has empty file list")
    );

    const summary = `Hermes synchronization run starting at ${s.start.toLocaleString()} IST. Duration: ${duration} seconds. Status: ${errors.length > 0 ? "Failed" : "Success"}.`;

    const { error: insertErr } = await supabase.from("consolidated_memories").insert({
      tenant_id: DEFAULT_TENANT_ID,
      consolidation_type: "hermes-sync",
      topic: "Hermes Sync: " + s.start.toISOString().split("T")[0],
      user_id: "system",
      account_id: "local-ops",
      summary: summary,
      key_insights: errors.slice(0, 10),
      recurring_themes: warnings.slice(0, 10),
      action_patterns: s.logs.slice(0, 50),
      session_count: 1,
      time_range_start: s.start.toISOString(),
      time_range_end: endTs.toISOString(),
      created_at: s.start.toISOString(),
    });

    if (insertErr) {
      console.error(
        `Error inserting sync session starting at ${s.start.toISOString()}:`,
        insertErr
      );
    } else {
      console.log(`Ingested sync session: ${s.start.toISOString()}`);
    }
  }
}

async function main() {
  console.log("=== Starting session log ingestion to Supabase ===");
  await ingestPastes();
  await ingestKimiSessions();
  await ingestMonitorLogs();
  await ingestHermesSync();
  console.log("\n=== Ingestion Complete! ===");
}

main().catch((err) => {
  console.error("Fatal error during ingestion:", err);
  process.exit(1);
});

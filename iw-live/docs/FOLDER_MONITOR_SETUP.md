# macOS Folder Monitor Bridge — Setup Guide

**Status:** Ready for deployment
**Created:** 2026-06-09
**Purpose:** Bridge local filesystem events to Cloudflare Folder Watcher for real-time session log processing

---

## Overview

The macOS Folder Monitor Bridge watches the `IntegrateWise - Memory/Conversation memory/` directory for file changes and forwards events to the Cloudflare Folder Watcher Durable Object. This enables:

- Real-time session log processing
- Spine audit log ingestion to D1 + AI Search
- Triage Bot handoff document processing
- Agent continuity protocol enforcement

## Architecture

```
IntegrateWise - Memory/Conversation memory/
    ↓ (file change detected)
chokidar watcher (macOS process)
    ↓ (HTTP POST)
Cloudflare Folder Watcher DO
    ↓ (audit-handler.ts)
D1 spine_audit_log + AI Search
```

---

## Prerequisites

- **Node.js:** v18+ installed
- **IntegrateWise - Memory:** Cloned at `/Users/$USER/Github/IntegrateWise - Memory/`
- **Cloudflare Folder Watcher:** Deployed with audit-handler.ts
- **D1 Database:** `integratewise-spine-cache` with `spine_audit_log` table
- **PM2 (optional):** For production daemon mode

---

## Installation

### Step 1: Run Setup Script

```bash
cd /Users/nirmal/Github/integratewise-live
./scripts/setup-folder-monitor.sh
```

This will:

- Check prerequisites
- Install dependencies (chokidar, node-fetch@2)
- Verify IntegrateWise - Memory location
- Display next steps

### Step 2: Set Environment Variable

**Option A: Session-only (temporary)**

```bash
export FOLDER_WATCHER_KEY="your-secret-key-here"
```

**Option B: Persistent (recommended)**

```bash
echo 'export FOLDER_WATCHER_KEY="your-secret-key"' >> ~/.zshrc
source ~/.zshrc
```

**Generate a secure key:**

```bash
openssl rand -hex 32
```

### Step 3: Test Run (Foreground)

```bash
node scripts/folder-monitor-bridge.js
```

**Expected output:**

```
[2026-06-09T18:30:00.000Z] 🚀 Folder Monitor Bridge started
[2026-06-09T18:30:00.000Z] 📂 Watching: /Users/nirmal/Github/IntegrateWise - Memory/Conversation memory
[2026-06-09T18:30:00.000Z] 🎯 Target: https://folder-watcher.connect-a1b.workers.dev/api/ingest
[2026-06-09T18:30:00.000Z] 🔐 Auth: 8a3f9e2c1b...
[2026-06-09T18:30:00.000Z] 👤 Tenant: iw-internal
```

**Test by creating a file:**

```bash
echo "test" > "../IntegrateWise - Memory/Conversation memory/test-$(date +%s).txt"
```

**Expected output:**

```
[2026-06-09T18:30:05.000Z] ➕ add     test-1781025005.txt
```

**Stop with:** `Ctrl+C`

---

## Production Deployment (PM2)

### Install PM2

```bash
npm install -g pm2
```

### Start as Daemon

```bash
pm2 start scripts/folder-monitor-bridge.js --name iw-folder-monitor
```

**Expected output:**

```
┌────┬────────────────────────┬──────────┬──────┬───────────┐
│ id │ name                   │ mode     │ ↺    │ status    │
├────┼────────────────────────┼──────────┼──────┼───────────┤
│ 0  │ iw-folder-monitor      │ fork     │ 0    │ online    │
└────┴────────────────────────┴──────────┴──────┴───────────┘
```

### Save Process List

```bash
pm2 save
```

### Enable Autostart on Boot

```bash
pm2 startup
# Follow the instructions printed (will require sudo)
```

---

## Monitoring & Management

### Check Status

```bash
pm2 status
```

### View Logs

```bash
# Live logs (tail -f)
pm2 logs iw-folder-monitor

# Last 100 lines
pm2 logs iw-folder-monitor --lines 100

# Error logs only
pm2 logs iw-folder-monitor --err
```

### Restart

```bash
pm2 restart iw-folder-monitor
```

### Stop

```bash
pm2 stop iw-folder-monitor
```

### Delete (remove from PM2)

```bash
pm2 delete iw-folder-monitor
```

### View Monitoring Dashboard

```bash
pm2 monit
```

---

## Configuration

### Environment Variables

| Variable             | Required | Default                                                     | Description                                 |
| -------------------- | -------- | ----------------------------------------------------------- | ------------------------------------------- |
| `FOLDER_WATCHER_KEY` | ✅       | -                                                           | Authentication token for Folder Watcher API |
| `FOLDER_WATCHER_URL` | ❌       | `https://folder-watcher.connect-a1b.workers.dev/api/ingest` | Folder Watcher endpoint URL                 |

### Watch Directory

Default: `/Users/nirmal/Github/IntegrateWise - Memory/Conversation memory/`

To change, edit `scripts/folder-monitor-bridge.js`:

```javascript
const WATCH_DIR = path.resolve(__dirname, "../../IntegrateWise - Memory/Conversation memory/");
```

### Ignored Patterns

- Dotfiles (`.DS_Store`, `.git/`, etc.)
- `node_modules/`
- Temp files (`~$`)

To modify, edit the `ignored` array in `scripts/folder-monitor-bridge.js`.

---

## Event Types

The bridge sends three event types:

### 1. Add (new file created)

```json
{
  "tenant_id": "iw-internal",
  "seq": 1,
  "events": [
    {
      "action": "add",
      "path": "2026-06-09/session-kiro-20260609-handoff.md",
      "content": "# Agent Session Handoff...",
      "timestamp": "2026-06-09T18:30:00.000Z"
    }
  ]
}
```

### 2. Change (file modified)

```json
{
  "action": "change",
  "path": "2026-06-09/session-kiro-20260609-handoff.md",
  "content": "# Updated content...",
  "timestamp": "2026-06-09T18:35:00.000Z"
}
```

### 3. Unlink (file deleted)

```json
{
  "action": "unlink",
  "path": "2026-06-09/test-file.txt",
  "content": null,
  "timestamp": "2026-06-09T18:40:00.000Z"
}
```

---

## Folder Watcher API

### Endpoint

```
POST https://folder-watcher.connect-a1b.workers.dev/api/ingest
```

### Headers

```
Authorization: Bearer {FOLDER_WATCHER_KEY}
Content-Type: application/json
```

### Response (Success)

```json
{
  "success": true,
  "processed": 1,
  "audit_events": 0
}
```

### Response (Error)

```json
{
  "error": "Unauthorized: Invalid bearer token"
}
```

---

## Troubleshooting

### "FOLDER_WATCHER_KEY environment variable not set"

**Solution:**

```bash
export FOLDER_WATCHER_KEY="your-secret-key"
```

### "Watch directory does not exist"

**Solution:**
Ensure IntegrateWise - Memory is cloned at:

```bash
/Users/$USER/Github/IntegrateWise - Memory/
```

Or update `WATCH_DIR` in `scripts/folder-monitor-bridge.js`.

### "Failed to send event: ECONNREFUSED"

**Causes:**

- Folder Watcher not deployed
- Incorrect `FOLDER_WATCHER_URL`
- Network connectivity issue

**Solution:**

```bash
# Verify Folder Watcher is deployed
wrangler deployments list --name folder-watcher

# Test endpoint manually
curl -X POST https://folder-watcher.connect-a1b.workers.dev/api/ingest \
  -H "Authorization: Bearer $FOLDER_WATCHER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"test","seq":1,"events":[]}'
```

### "Failed to send event: HTTP 401"

**Cause:** Invalid `FOLDER_WATCHER_KEY`

**Solution:**
Verify the key matches the one configured in Folder Watcher's environment variables.

### PM2 process keeps restarting

**Diagnosis:**

```bash
pm2 logs iw-folder-monitor --err
```

**Common causes:**

- Invalid environment variable
- Permission issues on watch directory
- Node.js version incompatibility

---

## Testing End-to-End Pipeline

### 1. Create a test audit log

```bash
cat > "../IntegrateWise - Memory/Conversation memory/2026-06-09/audit-spine-test-$(date +%s).jsonl" << 'EOF'
{"timestamp":"2026-06-09T18:00:00Z","session_id":"test-session-123","event":"spine_read","entity_type":"account","entity_id":"acc_test123","via":"mcp","tool":"spine.entityget","tenant_id":"iw-internal","result":"success","duration_ms":45}
{"timestamp":"2026-06-09T18:00:05Z","session_id":"test-session-123","event":"spine_write","entity_type":"contact","entity_id":"cont_test456","via":"pipeline","operation":"update","fields_changed":["email","phone"],"tenant_id":"iw-internal","result":"success","duration_ms":120}
EOF
```

### 2. Check folder monitor logs

```bash
pm2 logs iw-folder-monitor --lines 20
```

**Expected:**

```
➕ add     2026-06-09/audit-spine-test-1781025123.jsonl
```

### 3. Verify D1 ingestion

```bash
wrangler d1 execute integratewise-spine-cache \
  --command="SELECT * FROM spine_audit_log WHERE session_id = 'test-session-123';" \
  --remote
```

**Expected:** 2 rows returned

### 4. Query AI Search (semantic)

Via Twin or ops dashboard:

```
"Show me all Spine operations in session test-session-123"
```

**Expected:** Returns both audit events with semantic context

---

## Performance & Limits

- **Watch latency:** ~1 second (awaitWriteFinish stabilityThreshold)
- **Max file size:** Unlimited (entire file content sent)
- **Event queue:** In-memory (not persisted across restarts)
- **Concurrency:** Single-threaded (events sent sequentially)
- **Network timeout:** 10 seconds per request
- **Retry logic:** None (failed events logged, not retried)

**Recommendations:**

- For large files (>1MB), consider streaming or chunking
- For high-volume scenarios, implement event batching
- For reliability, implement persistent queue (e.g., SQLite)

---

## Security Considerations

- **FOLDER_WATCHER_KEY:** Store securely, rotate periodically
- **File content:** Entire file content sent over network (use HTTPS only)
- **Audit logs:** May contain sensitive data (ensure CF Folder Watcher is properly isolated)
- **PM2 logs:** May contain file content snippets (review log retention policies)

---

## Maintenance

### Update Dependencies

```bash
npm update chokidar node-fetch
pm2 restart iw-folder-monitor
```

### Rotate Authentication Key

1. Generate new key: `openssl rand -hex 32`
2. Update Folder Watcher environment variable
3. Update local `FOLDER_WATCHER_KEY`
4. Restart: `pm2 restart iw-folder-monitor`

### Log Rotation (PM2)

PM2 automatically rotates logs. To configure:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Integration with Agent Continuity Protocol

The folder monitor is a critical component of the Agent Continuity Protocol (AGENTS.md Rule 8 + Rule 9):

1. **Agent writes handoff document** → `Conversation memory/[YYYY-MM-DD]/session-*.md`
2. **Folder monitor detects change** → POST to Folder Watcher
3. **Folder Watcher processes** → Routes to audit-handler.ts or triage pipeline
4. **Audit events** → D1 `spine_audit_log` + AI Search indexing
5. **Triage Bot** → Classifies handoff → `conversational_memory` → HITL → `org_memory`

**Result:** Zero manual intervention, full audit trail, semantic search over all agent sessions.

---

## References

- Agent Continuity Protocol: `/Users/nirmal/Github/AGENTS.md`
- Folder Watcher Service: `services/folder-watcher/`
- Audit Handler: `services/folder-watcher/src/audit-handler.ts`
- D1 Migration: `services/intelligence/migrations/d1_spine_audit_log.sql`
- Pipeline Wiring Guide: `Conversation memory/2026-06-09/PIPELINE_WIRING_COMPLETE.md`

---

**Questions or issues?** See KANBAN.md TODO section or consult next agent handoff.

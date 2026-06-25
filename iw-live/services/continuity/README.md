# Continuity Service — CouchDB Memory Layer

**Role**: Ephemeral conversational memory (sessions, events, checkpoints)  
**Technology**: CouchDB (external) + Cloudflare Worker (service wrapper)  
**Canon Rule**: Nothing written here is canonical truth until promoted.

## Architecture Position

```
Raw AI cognition / User sessions
→ CouchDB (THIS SERVICE) — ephemeral continuity buffer
→ Triage + Classification (Knowledge Service)
→ Promotion / Governance
→ Postgres (canonical entity truth + knowledge canon)
→ Surface Projection
```

## Endpoints

| Method | Path                                 | Purpose                         |
| ------ | ------------------------------------ | ------------------------------- |
| GET    | `/health`                            | Service health                  |
| POST   | `/v1/continuity/events`              | Append event to session         |
| GET    | `/v1/continuity/sessions`            | List sessions (filterable)      |
| GET    | `/v1/continuity/sessions/:id`        | Read session + all events       |
| POST   | `/v1/continuity/sessions/:id/resume` | Resume session (AI context)     |
| POST   | `/v1/continuity/sessions/:id/close`  | Close session, queue for triage |
| POST   | `/v1/continuity/sessions/:id/triage` | Apply triage decision           |
| POST   | `/v1/continuity/search`              | Search events by content        |
| DELETE | `/v1/continuity/sessions/:id`        | Purge session (GDPR)            |

## Document Model

### SessionEvent (append-only)

- `_id`: `event:{type}:{timestamp}-{rand}`
- `session_id`, `user_id`, `timestamp`, `source`, `content`
- `_exp`: TTL timestamp (auto-purged by cron)

### SessionContainer (mutable index)

- `_id`: `sess:{timestamp}-{rand}`
- `event_count`, `status`, `last_event_at`, `triage_status`
- Updated on every new event

### ContinuityCheckpoint (periodic snapshot)

- `_id`: `checkpoint:{session}:{timestamp}`
- `compressed_state`: JSON summary for fast AI resumption
- `event_range`: [first_event, last_event] IDs

## Tenant Isolation

- One CouchDB database per tenant: `session_memory_{tenantId}`
- Lazy-created on first write
- Strict separation — no cross-tenant queries

## Triage Integration

When a session closes or reaches `MAX_EVENTS_PER_SESSION`:

1. `triage_status` set to `"pending"`
2. Message sent to `TASKS_QUEUE`
3. Knowledge service (or Triage Bot) picks it up
4. Human approves → `promote_to_knowledge` → sent to Knowledge ingest
5. Human rejects → `retain_ephemeral` or `archive` → stays in CouchDB until TTL

## Deployment

```bash
# Set secrets
wrangler secret put COUCHDB_URL
wrangler secret put COUCHDB_USER
wrangler secret put COUCHDB_PASSWORD

# Deploy
wrangler deploy
```

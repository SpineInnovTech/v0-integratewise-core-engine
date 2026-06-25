# CouchDB Setup for Hermes Spine Memory

## Host

- **URL**: `http://<MEMORY_VPS_HOST>:5984`
- **Environment**: VPS (external to Cloudflare)
- **Access**: Basic Auth via `COUCHDB_USER` / `COUCHDB_PASSWORD`

> Note: set the host via `COUCHDB_URL` (Doppler / Wrangler secret). Do not hardcode
> host IPs or credentials in source or docs.

## Required Configuration

### 1. CORS (Critical for Browser / Vite Dev)

CouchDB must accept cross-origin requests from the IntegrateWise web app.

```ini
[httpd]
enable_cors = true

[cors]
origins = *
credentials = true
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin, referer, x-request-id, x-tenant-id, x-user-id
```

Apply via `local.ini` or HTTP `_config`:

```bash
curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@<MEMORY_VPS_HOST>:5984/_config/httpd/enable_cors -d '"true"'
curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@<MEMORY_VPS_HOST>:5984/_config/cors/origins -d '"*"'
curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@<MEMORY_VPS_HOST>:5984/_config/cors/credentials -d '"true"'
curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@<MEMORY_VPS_HOST>:5984/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@<MEMORY_VPS_HOST>:5984/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-request-id, x-tenant-id, x-user-id"'
```

### 2. Authentication

Ensure at least one admin user exists:

```bash
curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@<MEMORY_VPS_HOST>:5984/_config/admins/hermes -d '"<STRONG_PASSWORD>"'
```

Store credentials in Doppler / Wrangler secrets:

- `COUCHDB_URL`
- `COUCHDB_USER`
- `COUCHDB_PASSWORD`

### 3. Database-per-Tenant / Namespace

The memory substrate creates databases on demand:

- `iw_mem_personal_{userId}` — personal twin memory
- `iw_mem_org_{tenantId}` — shared org memory

No manual DB creation is required; the client calls `ensureDatabase` lazily.

### 4. Compaction & TTL

CouchDB Community does not support native TTL. Cleanup strategies:

1. **App-level TTL**: Documents include `_exp` (epoch seconds). A scheduled Worker
   queries Mango for `createdAt < cutoff` and bulk-deletes.
2. **Compaction**: Run `_compact` periodically to reclaim space:
   ```bash
   curl -X POST http://$COUCHDB_USER:$COUCHDB_PASSWORD@<MEMORY_VPS_HOST>:5984/{db}/_compact
   ```

### 5. Indexes (Mango)

The `ContinuityObjectStore.ensureStore()` method creates required indexes:

- `idx-type-domain` — query by object type + domain
- `idx-updated` — recent objects
- `idx-user-scope` — user-scoped lookups
- `idx-references` — cross-reference queries

MapReduce views are created by `services/continuity/src/couchdb.ts` for session events.

## Network Notes

- The VPS is **not** behind Cloudflare Tunnel. Firewall rules must
  allow port 5984 from Cloudflare Worker IP ranges (or open to internet with
  strong Basic Auth).
- For local dev, Vite proxies `/couchdb` → the host set in `VITE_COUCHDB_PROXY_TARGET`.
- In production, Workers talk directly to the VPS over HTTPS (upgrade required).

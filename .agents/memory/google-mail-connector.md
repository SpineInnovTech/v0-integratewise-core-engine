---
name: Google-mail connector
description: How to use the installed google-mail Replit connector from the api-server backend
---

The `google-mail` Replit connector is installed and healthy in this project.

**Connection ID:** `conn_google-mail_01KVRRN45F8TK736FG3D3ZTWKX`  
**Status:** healthy (as of 2026-06-24)  
**Scopes:** gmail.readonly, gmail.send, gmail.labels, gmail.addons.*

**Backend usage (`@replit/connectors-sdk`):**
```typescript
import { ReplitConnectors } from "@replit/connectors-sdk";

// NEVER cache this — tokens expire; create fresh on every request
function getConnectors() {
  return new ReplitConnectors();
}

const connectors = getConnectors();
const response = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages?labelIds=INBOX", { method: "GET" });
const data = await response.json(); // proxy returns raw Response — must call .json()
```

**Key API paths (Gmail REST API):**
- `GET /gmail/v1/users/me/messages?labelIds=INBOX&maxResults=N` — list message IDs
- `GET /gmail/v1/users/me/messages/{id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject` — get metadata
- `POST /gmail/v1/users/me/messages/send` — send
- `GET /gmail/v1/users/me/labels` — list labels

**Label IDs to watch:**
- `UNREAD` — message is unread
- `STARRED` — message is starred
- `INBOX` — inbox (not archive)

**Error handling:** API errors come back as JSON `{ error: { code, message } }` — check for this before processing results. Filter out messages where `internalDate` is missing (failed metadata fetches return partial objects).

**Where it's wired:**
- `artifacts/api-server/src/connectors/gmail.ts` — server module
- `artifacts/api-server/src/routes/email.ts` — `GET /api/email/inbox`
- `artifacts/integratewise/src/platform/gateway-email.ts` — frontend hook `useGmailInbox()`

# Firebase Architecture Spec — SMB Layer

> Separate project. Integrates with main repo via API.
> Context transfer this doc when ready to wire.

---

## PROJECT STRUCTURE

```
integratewise-firebase/              ← SEPARATE REPO
├── functions/                       ← Cloud Functions
│   ├── src/
│   │   ├── triggers/
│   │   │   ├── onEntityWrite.ts     ← Twin trigger evaluation
│   │   │   ├── onTriageCreate.ts    ← Genkit AI extraction
│   │   │   ├── onApprovalUpdate.ts  ← Execute approved actions
│   │   │   └── onConnectorSync.ts   ← Pipeline processing
│   │   ├── api/
│   │   │   ├── entity360.ts         ← Entity 360 assembly
│   │   │   ├── connectors.ts        ← OAuth + sync
│   │   │   └── triage.ts            ← Triage endpoints
│   │   ├── ai/
│   │   │   ├── triage-bot.ts        ← Genkit triage (Gemini)
│   │   │   ├── memory-consolidator.ts
│   │   │   └── twin-engine.ts       ← Twin trigger evaluation
│   │   └── index.ts
│   └── package.json
├── firestore.rules                  ← Security rules (tenant isolation)
├── firestore.indexes.json
├── firebase.json
└── .firebaserc
```

## FIRESTORE SCHEMA

```
tenants/{tenantId}/
├── config/
│   ├── schema          { domain, industry, entity_types[], priority_fields{} }
│   ├── flow_c          { auto_approve_sources[], min_confidence, ... }
│   └── triggers        { enabled_triggers[], max_per_day }
│
├── entities/{entityId}
│   ├── entity_type: string
│   ├── display_name: string
│   ├── truth: { data{}, source, updated_at, freshness }
│   ├── health_score: number
│   ├── sources: string[]
│   └── meta: { hydration_bucket, department }
│
├── context/{contextId}
│   ├── entity_id: string
│   ├── type: "email" | "document" | "meeting" | "note"
│   ├── title: string
│   ├── summary: string
│   ├── source: string
│   └── created_at: timestamp
│
├── signals/{signalId}
│   ├── entity_id: string
│   ├── type: string
│   ├── severity: "critical" | "high" | "medium" | "low" | "info"
│   ├── title: string
│   ├── evidence: array
│   ├── confidence: number
│   └── status: "active" | "resolved"
│
├── memories/{memoryId}
│   ├── entity_id: string
│   ├── type: "decision" | "preference" | "insight" | "action" | "rule" | "fact"
│   ├── content: string
│   ├── confidence: number
│   ├── source: string (which AI)
│   ├── approved_by: string
│   └── status: "approved" | "revoked"
│
├── triage/{triageId}
│   ├── content: string
│   ├── source: string (AI provider)
│   ├── confidence: number
│   ├── entities_mentioned: string[]
│   ├── status: "pending" | "approved" | "rejected"
│   ├── reviewed_by: string
│   └── created_at: timestamp
│
├── insights/{insightId}
│   ├── entity_id: string
│   ├── trigger_id: string
│   ├── severity: string
│   ├── title: string
│   ├── what: string
│   ├── why: string
│   ├── action: string
│   ├── risk_if_ignored: string
│   ├── evidence: array
│   ├── confidence: number
│   └── created_at: timestamp
│
├── approvals/{approvalId}
│   ├── action_type: string
│   ├── entity_id: string
│   ├── proposed_by: string (system/AI)
│   ├── status: "pending" | "approved" | "rejected"
│   ├── reviewed_by: string
│   ├── reason: string
│   └── created_at: timestamp
│
├── connectors/{connectorId}
│   ├── provider: string
│   ├── status: "connected" | "error" | "syncing"
│   ├── tokens: { encrypted }
│   ├── last_sync: timestamp
│   └── entity_count: number
│
└── audit/{auditId}
    ├── action: string
    ├── actor: string
    ├── details: map
    └── created_at: timestamp
```

## FIRESTORE SECURITY RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tenant isolation — user can only access their tenant
    match /tenants/{tenantId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.tenant_id == tenantId;
    }
  }
}
```

## CLOUD FUNCTIONS

### onEntityWrite — Twin Trigger Evaluation

```
Trigger: Firestore onWrite on tenants/{tenantId}/entities/{entityId}
Logic:
  1. Read entity data (truth, context, signals, memory, goals)
  2. Evaluate 10 Twin triggers
  3. If triggered, write to tenants/{tenantId}/insights/{insightId}
  4. Check max 3 insights/entity/day
  5. Send FCM push notification if critical/high
```

### onTriageCreate — Genkit AI Extraction

```
Trigger: Firestore onCreate on tenants/{tenantId}/triage/{triageId}
Logic:
  1. Read triage content
  2. Call Genkit with Gemini model
  3. Extract: entities, sentiment, key facts, confidence
  4. Check flow_c_config rules
  5. If auto-approve: move to memories collection
  6. If HITL: keep in triage with status "pending"
  7. Send FCM notification for HITL review
```

### onApprovalUpdate — Execute Approved Actions

```
Trigger: Firestore onUpdate on tenants/{tenantId}/approvals/{approvalId}
Logic:
  1. Check if status changed to "approved"
  2. Execute the approved action (merge, update, etc.)
  3. Write to audit collection
  4. Send FCM confirmation
```

## INTEGRATION WITH MAIN REPO

```
Main repo (Cloudflare)                Firebase project
─────────────────────                 ─────────────────
Gateway Worker                   →    Firebase Cloud Functions (HTTP)
  /api/v1/firebase/*                  Proxied to Firebase endpoints

OR

Frontend (apps/web)              →    Firebase SDK directly
  import { getFirestore } from 'firebase/firestore'
  import { getAuth } from 'firebase/auth'
  import { getMessaging } from 'firebase/messaging'

Connector Workers               →    Write to Firestore via Admin SDK
  After pipeline processing,
  write entity to Firestore
  in addition to Spine DB
```

## WHAT STAYS ON CLOUDFLARE

- Gateway (edge routing, CORS)
- Connector OAuth flows (already built)
- Static hosting (Cloudflare Pages)
- Enterprise tenant data (Spine DB RLS for SQL queries)

## WHAT MOVES TO FIREBASE

- SMB auth (phone OTP)
- SMB entity data (Firestore, real-time, offline)
- Push notifications (FCM)
- Triage bot (Genkit + Gemini)
- Workflow triggers (Firestore triggers)
- Analytics (Firebase Analytics)

## CONTEXT TRANSFER TEMPLATE

When Firebase project is ready, transfer this to main repo:

```
CONTEXT TRANSFER: Firebase Integration

Firebase Project ID: [your-project-id]
Region: [asia-south1 for India, me-central1 for UAE]

Endpoints:
- Auth: Firebase Auth (phone OTP enabled)
- Firestore: tenants/{tenantId}/entities, memories, triage, insights
- Functions: onEntityWrite, onTriageCreate, onApprovalUpdate
- FCM: configured for web + mobile push

Frontend changes needed:
1. Add firebase SDK to apps/web/package.json
2. Initialize Firebase in apps/web/src/lib/firebase.ts
3. Add Firestore hooks for real-time entity updates
4. Add FCM service worker for push notifications
5. Add phone OTP option to login page

Backend changes needed:
1. After pipeline S8 (sectorize), also write to Firestore
2. Gateway proxy /api/v1/firebase/* to Cloud Functions
3. Connector sync writes to both Spine DB and Firestore
```

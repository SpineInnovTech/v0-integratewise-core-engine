---
name: Apollo as the real lead source
description: The Leads workspace is populated from the user's saved Apollo contacts, not synthetic seed data
---

Real CRM leads for iwa-customer-zero come from the **user's saved Apollo contacts** (Apollo MCP `apolloContactsSearch`), not a synthetic seed. They were imported by **dogfooding the real `POST /api/leads` create path** (mapping Apollo fields → `LeadInput`, deduping by linkedinUrl/email/name), which both validates the endpoint and keeps data honest. Lead `score` is a **data-completeness heuristic** (email/phone/title/linkedin/company), and `source` is set to `"apollo"`.

**Why:** The project's whole premise is a real, executable workspace, not a demo shell — so the flagship Leads vertical had to use the user's actual pipeline. The originally planned synthetic seed was dropped in favor of this. Clients/deals/activities start empty and fill in only as the user qualifies/converts/logs.

**How to apply:** To refresh or extend leads, pull from Apollo and POST through `/api/leads` rather than writing to the DB directly. Keep the completeness-based scoring unless a real qualification signal replaces it.

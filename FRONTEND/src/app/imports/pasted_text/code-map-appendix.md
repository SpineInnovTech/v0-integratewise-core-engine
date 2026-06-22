Agreed. Add this as the appendix.

Appendix A — Code Map

This appendix maps the canonical data flow to the main implementation files so engineers can trace behavior in code.

1. Onboarding and tenant schema resolution

Column 1	Column 2
Responsibility	File / Area
L0 onboarding flow and tenant activation	apps/web/src/components/onboarding/
Tenant schema resolution	packages/types/src/adaptive-schema.ts
Tenant runtime configuration	tenant_spine_config usage across workflow / onboarding services


What to trace

* how department + industry resolve the tenant schema
* how onboarding completion unlocks workspace readiness
* how connector setup is tied to tenant context

---

2. Connector auth and sync kickoff

Column 1	Column 2
Responsibility	File / Area
Connector auth and sync production	services/connector/src/sync-producer.ts
Connector-specific handlers	services/loader/src/handlers/


What to trace

* connector installation binding to tenant
* creamy / needed / delta sync behavior
* initial queue dispatch after auth success

---

3. Structured data flow (Flow A)

Column 1	Column 2
Responsibility	File / Area
Structured ingestion handlers	services/loader/src/handlers/hubspot.ts, salesforce.ts, etc.
Canonical field mapping	services/loader/src/pipeline-stages.ts
Pipeline orchestration	services/loader/src/pipeline.ts
8-stage normalization	services/normalizer/src/index.ts
Spine write routing	services/spine-v2/src/index.ts


What to trace

* raw webhook / poll payload enters loader
* payload goes through canonical mapping
* run8StagePipeline() executes
* normalized entity is routed to the correct Spine table
* resulting truth becomes available to workspace and cognitive layers

---

4. The 8-stage pipeline

Column 1	Column 2	Column 3
Stage	Meaning	Main file
Analyze	inspect raw payload	services/normalizer/src/index.ts
Classify	determine entity / flow	services/normalizer/src/index.ts
Filter	tenant/schema filtering	services/normalizer/src/index.ts
Refine	normalize field shapes	services/normalizer/src/index.ts
Extract	pull canonical entity data	services/normalizer/src/index.ts
Validate	schema + required field checks	services/normalizer/src/index.ts
Sanity	business/data integrity checks	services/normalizer/src/index.ts
Sectorize	final destination routing	services/normalizer/src/index.ts, services/spine-v2/src/index.ts


Developer note
This is the mandatory path for truth creation. No connector should bypass it.

---

5. Spine / SSOT routing

Column 1	Column 2
Responsibility	File / Area
Entity type to table routing	services/spine-v2/src/index.ts
Canonical truth persistence	services/spine-v2/src/index.ts


What to trace

* ENTITY_TYPE_TO_TABLE
* destination table resolution
* structured truth writes
* prevention of non-canonical write paths

---

6. Unstructured content flow (Flow B)

Column 1	Column 2
Responsibility	File / Area
Chunking	services/knowledge/src/chunking/
Embeddings	services/knowledge/src/embedding/
Knowledge ingestion	services/knowledge/src/
Entity linking / metadata projection	knowledge + Spine-linked context paths


What to trace

* file or content enters ingest
* text extraction / chunking happens
* embeddings are created
* searchable content lands in Knowledge
* linked metadata / references are attached to Spine entities

Rule reminder
Flow B enriches context and evidence. It does not replace structured truth.

---

7. Entity 360 read model

Column 1	Column 2
Responsibility	File / Area
Read-time fusion	services/workflow/src/views.ts
Workspace transforms	services/workflow/src/transformers/


What to trace

* Spine truth fetch
* Knowledge/context fetch
* signal fetch
* fusion into a read model for workspace and cognitive use

Rule reminder
Entity 360 is read-only fusion, not a write surface.

---

8. Cognitive loop

Column 1	Column 2
Responsibility	File / Area
Proposal generation / reasoning	services/think/src/
Policy and approval rules	services/govern/src/
Action execution	services/act/src/


What to trace

* Think creates grounded proposals
* Govern evaluates policy
* approval token / approval state is enforced
* Act only runs after approval
* outcome is returned for re-ingestion

---

9. Flow C (AI sessions, MCP, governed AI memory)

Column 1	Column 2
Responsibility	File / Area
MCP ingress	services/mcp-connector/src/
AI reasoning / triage patterns	services/think/src/
Governed proposal path	services/govern/src/, services/act/src/


What to trace

* AI session capture
* proposal creation instead of direct truth write
* user review / governance path
* approved action execution
* result re-enters normal pipeline path

Rule reminder
Flow C never writes directly to Spine truth.

---

10. Approval and action

Column 1	Column 2
Responsibility	File / Area
Approval policy enforcement	services/govern/src/index.ts, services/govern/src/policies.ts
Action execution logic	services/act/src/index.ts, services/act/src/lib/execution.ts


What to trace

* approval requirement checks
* x-approval-token validation
* connector execution
* auditability of action path

---

11. Re-ingestion after action

Column 1	Column 2
Responsibility	File / Area
Action result queue-back	services/act/src/index.ts
Pipeline re-entry	pipeline queue consumers


What to trace

* approved action executes externally
* result is not trusted as final truth immediately
* result is queued back into pipeline
* Spine is refreshed through the same canonical path

Rule reminder
Truth must be refreshed through re-ingestion, not assumed from outbound execution alone.

---

12. Quick trace path for developers

Use this sequence when debugging any end-to-end issue:

1. apps/web/... — where the user initiated the action
2. services/gateway/... — how the request was routed
3. services/connector/... or services/loader/... — how source data entered
4. services/normalizer/... — how it was normalized
5. services/spine-v2/... — where truth was written
6. services/workflow/... — how it appeared in workspace / Entity 360
7. services/think/... — how intelligence was generated
8. services/govern/... — how approval policy was checked
9. services/act/... — how action executed
10. queue / pipeline path again — how result re-entered truth

---

13. One-line developer rule

If you cannot point to the ingest path, the pipeline path, the Spine write path, and the re-ingestion path, the feature is not fully wired.

If you want, I can also merge this directly into the KT note and produce a final KT v1.0 document in one piece.

The 12 departments part is correct, but the entity counts in your table do not match the live DOMAIN_SPINE_CONFIG arrays exactly. The schema file confirms the 12 active department configs, but several of the counts shown here are lower than what is currently defined in packages/types/src/schema.ts.

What is safe to state canonically

Use this wording instead:

12 Departments Active

Total: 12 primary runtime department configs are defined in packages/types/src/schema.ts under DOMAIN_SPINE_CONFIG. Each department defines its own:

* entity types — what records are allowed in the Spine path
* priority fields — what fields the pipeline prioritizes during extraction
* organic capabilities — what the BFF/UI exposes instead of raw entity types
* workspace emphasis — what modules and views are emphasized in L1
* cognitive relevance — what signals and reasoning patterns become meaningful in L2

Active department configs

1. CUSTOMER_SUCCESS
2. REVOPS
3. SALES
4. MARKETING
5. PRODUCT_ENGINEERING
6. FINANCE
7. SERVICE
8. PROCUREMENT
9. IT_ADMIN
10. STUDENT_TEACHER
11. BIZOPS
12. PERSONAL

Important runtime note

Department selection is not cosmetic. It determines:

* which entity_types are allowed by schema
* which fields are prioritized in extraction
* which organic capabilities appear in the UI
* which workspace modules are emphasized
* which signals and reasoning paths become active downstream

Also add this note

Some tenant-facing department labels resolve into shared base configs through DEPARTMENT_TO_CONFIG_KEY, for example:

* SUPPORT → SERVICE
* ENGINEERING → PRODUCT_ENGINEERING
* PRODUCT → PRODUCT_ENGINEERING
* LEGAL → BIZOPS
* HR → BIZOPS
* SUPPLY_CHAIN → PROCUREMENT
* SERVICE_OPS → SERVICE

Best KT-safe replacement for your last paragraph

Each department has its own schema-driven runtime behavior: allowed entity types, priority fields, organic capability mapping, workspace emphasis, and downstream cognitive relevance. These are defined in packages/types/src/schema.ts through DOMAIN_SPINE_CONFIG, DEPARTMENT_TO_CONFIG_KEY, and ORGANIC_CAPABILITY_MAP.
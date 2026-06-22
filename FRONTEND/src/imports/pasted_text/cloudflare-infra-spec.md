Requirements Document
Spec: Cloudflare Infrastructure Consolidation & Development Standard

Introduction
The Cloudflare account has drifted into sprawl: 96 Workers (three naming lineages per service — integratewise-<svc> → <svc> → <svc>-prod), ~22 orphan *-staging/*-test Workers, template/experiment junk, 20 KV namespaces, 10 D1 databases (several empty), 12 Queues, 2 Vectorize indexes, 3 R2 buckets, 0 Hyperdrive (correct under DECISION 22). The root cause is the absence of a Cloudflare development standard: no environment model, no single deploy path (CI and laptop deploys coexist), no teardown discipline, bindings IDs copied per-service, and secrets in files.

This spec does two things, in order:

Establishes a Cloudflare development standard (the convention to consolidate toward) so sprawl cannot regrow.
Consolidates the account using a create-new → wire-in-code → migrate-data → cut-over → retire strategy (NOT delete-in-place). Clean canonical resources are stood up, code is pointed at them, data is migrated old→new via a migration agent, traffic is cut over, and only then are legacy resources retired — each gated by verification and explicit founder sign-off.
Constitutional constraints (non-negotiable):

HARD RULE 1: no "clean up"/"reorganize"/"consolidate" of the product without explicit instruction. This spec IS that instruction, and it gates every destructive step behind verification + sign-off.
DECISION 22: Cloudflare-only product plane (D1/KV/R2/Vectorize/AI Search/DO). No new Supabase/Postgres → Hyperdrive stays at 0.
DECISION 32: every endpoint/resource registered in the living registry.
No autonomous deletion. Legacy resources are retired only after migrated data is verified and the founder approves the bucket.
Customer Zero is not a separate plane. This spec targets production readiness. There is no Customer-Zero carve-out, no CZ-specific resource set, and no CZ exemption bucket. Once the production product plane is clean and ready, Customer Zero exists automatically as a tenant within it. Resources are classified purely by whether they serve the production product (keep), need consolidating into it (migrate), are dead/duplicate (retire), or belong to a genuinely different repo/product (out of scope) — proven by the audit, not by name.

Grounding — the production lifecycle drives the manifest. The canonical KEEP set is NOT "whatever exists today"; it is the exact set of resources each step of the live product lifecycle requires:

1. Clerk creates tenant (Identity)                  → gateway auth, tenants svc, D1 tenants/tenant_users
2. Tenant record written to D1                       → D1 Spine (canonical truth)
3. Schema AI seeds tenant-domain default schemas     → Schema AI (intelligence), D1 schema_pool, resolveSpineSchema allotment (DEC 33)
4. Nango connector connect fires                     → connector svc, Nango credential wall, webhook-ingress
5. Schema AI derives connector schema from payload   → Schema AI, normalizer/pipeline
6. Spine hydration begins against active schema      → pipeline (Spine writer), Queues (pipeline-process), D1 domain partitions, Vectorize, AI Search
7. First entity written to D1 under validated schema → D1 Spine, KV hot cache
8. Twin voice (Grok) + agent needs + real work       → iw-agent-runtime (TwinAgent/TenantBrainDO), continuity (memory), governance gate, execution/handoff
Every canonical resource must trace to a step above. Anything that traces to no step is a retire or other-product candidate. The manifest is organized by the target architecture layers (Surface · Gateway[one worker] · Core Services[Connector/Spine/Continuity/Twin/Governance] · Data Layer[D1/DO/KV/R2/Vectorize/AI Search/Queues] · Identity[Clerk] · External[Nango] · Registry), not by the accidental sprawl.

Scope inclusions:

CF development standard (naming, env model, CI-only deploy, bindings manifest, secrets, lifecycle/tagging).
A canonical resource manifest (the KEEP set) for Workers, KV, D1, Queues, Vectorize, R2.
Read-only route/binding audit to classify live vs dark resources.
Create-new canonical resources where the standard requires a rename; adopt healthy existing resources as canonical otherwise.
Agent-driven data migration old→new with verification (row counts/checksums).
Cutover (routes/custom domains → canonical Workers) and phased retirement of legacy resources.
Out of scope:

Product feature work (other specs).
Resources belonging to genuinely different repos/products (v1-portfolio-hire, *marketingsite, hub-* if confirmed a separate product by the audit). These are left untouched, not because they are a "Customer Zero plane," but because they are not this product.
Acceptance criteria use EARS notation.

Requirements
Requirement 1: Cloudflare Development Standard (the convention)
User Story: As the founder, I want a written, enforced Cloudflare development standard, so that the account converges on one convention and sprawl cannot regrow after consolidation.

Acceptance Criteria
THE SYSTEM SHALL define one naming convention: production Worker = integratewise-<svc>; non-production environments via wrangler named environments (integratewise-<svc>-staging), never as separate top-level Worker names.
THE SYSTEM SHALL define one environment model: a single wrangler.toml per service with [env.production] / [env.staging] blocks; deploys always use --env <name>.
THE SYSTEM SHALL mandate CI as the only deploy path; manual wrangler deploy from developer machines is prohibited by policy and documented.
THE SYSTEM SHALL require unset CLOUDFLARE_API_TOKEN (OAuth session wins) in every deploy context.
THE SYSTEM SHALL require all secrets in Cloudflare Secrets Store / wrangler secret; zero secrets committed in .toml/.dev.vars/.env.
THE SYSTEM SHALL define a resource lifecycle policy: every resource carries owner + status; orphans (no route + deprecated) are retired on schedule.
THE standard SHALL be recorded as a steering doc AND a numbered AGENTS.md DECISION, and SHALL be the reference for all subsequent tasks in this spec.
Requirement 2: Canonical Resource Manifest (the KEEP set)
User Story: As an operator, I want a single manifest naming every canonical resource and its bindings, so that code and reality have one shared source of truth.

Acceptance Criteria
THE manifest SHALL enumerate the canonical Workers (~18 — the v3.7 engine), KV (~15), D1 (~3), Queues (~11), Vectorize (2), R2 (3) with id, binding name, owner service, and status.
THE manifest SHALL mark every other live resource as migrate, retire, or other-product (different repo/product, left untouched).
THE manifest SHALL be machine-readable (committed file) and projected into the endpoint/infra registry (DECISION 32).
WHEN a binding id appears in more than one service config, THE manifest SHALL be the single source and configs SHALL reference it.
EACH canonical resource SHALL carry a lifecycle_stage tag (1–8 from the production lifecycle) tracing it to the step it serves; a resource tracing to no stage SHALL NOT be marked canonical.
Requirement 10: Lifecycle Completeness & Schema AI
User Story: As the founder, I want the canonical set to fully support the production lifecycle end-to-end, so that a real tenant can go Clerk→tenant→schema→connect→hydrate→first entity→Twin without a missing piece.

Acceptance Criteria
THE manifest SHALL include a resource (service + data) for every lifecycle stage 1–8; any stage with no backing resource SHALL be flagged as a gap, not silently omitted.
THE SYSTEM SHALL identify Schema AI (stages 3 & 5) as a required capability and record whether it is built, partial, or missing (currently not built — packages/types schema foundation exists; services/intelligence/schema_ai + D1 schema_pool do not). A gap here SHALL be surfaced as a follow-up, not assumed present.
THE SYSTEM SHALL confirm the Twin voice path (Grok, DECISION 29) and agent runtime (iw-agent-runtime) are in the canonical set for stage 8.
WHEN a lifecycle stage's resource is missing/partial, THE SYSTEM SHALL NOT retire any legacy resource that currently serves that stage until the canonical replacement is verified.
Requirement 3: Read-Only Route & Binding Audit
User Story: As a security owner, I want an evidence-based dark-vs-live classification before any deletion, so that no Worker serving traffic is ever removed.

Acceptance Criteria
THE SYSTEM SHALL produce, via read-only API calls, the set of routes/custom domains bound to each Worker.
THE SYSTEM SHALL classify each retire-candidate Worker as live (has route) or dark (no route).
THE SYSTEM SHALL classify each D1/KV/R2/Queue as bound (referenced by a canonical Worker) or unbound.
THE audit SHALL be written to the spec workspace and referenced by retirement tasks; no resource is retired without an audit entry.
Requirement 4: Provision Clean Canonical Resources
User Story: As an operator, I want clean canonical resources stood up where the standard requires a rename, so that we migrate into known-good targets rather than mutating live ones.

Acceptance Criteria
WHERE a canonical resource already exists and is healthy (e.g., integratewise-spine-cache), THE SYSTEM SHALL adopt it in place as canonical and SHALL NOT create a duplicate.
WHERE the standard requires a new name or a clean store, THE SYSTEM SHALL create the new resource per the naming convention before any data migration.
THE SYSTEM SHALL apply current schema/migrations to any newly created D1 before migration.
THE creation of any new data-bearing resource SHALL be recorded in the manifest and registry with status provisioned.
Requirement 5: Wire Code to Canonical Resources
User Story: As a developer, I want service code and wrangler configs pointed at the canonical resources, so that the new resources are exercised before legacy is retired.

Acceptance Criteria
THE SYSTEM SHALL update each service wrangler.toml binding to the canonical resource id from the manifest.
THE SYSTEM SHALL pass typecheck and the service test suite after rewiring.
THE SYSTEM SHALL deploy rewired services via CI to staging, then production, with smoke tests at each step.
IF a smoke test fails, THEN THE SYSTEM SHALL halt promotion and SHALL NOT proceed to retirement.
Requirement 6: Agent-Driven Data Migration (old → new) with Verification
User Story: As the founder, I want data migrated from legacy stores to canonical ones by an automated migration agent with verification, so that nothing is lost and the cutover is provable.

Acceptance Criteria
THE migration agent SHALL copy data old→new per store type: D1 (table export/import or cross-DB INSERT…SELECT), KV (bulk key copy), R2 (object copy), preserving tenant isolation.
THE migration agent SHALL run idempotently and SHALL be safe to re-run without duplicating rows/keys/objects.
AFTER migration, THE SYSTEM SHALL verify equivalence (row counts per table, key counts, object counts, and spot checksums) old vs new, and SHALL record the result.
IF verification fails, THEN THE SYSTEM SHALL halt and SHALL NOT cut over or retire the legacy resource.
THE migration SHALL be reversible: the legacy resource remains intact and readable until retirement is approved.
Requirement 7: Cutover
User Story: As an operator, I want traffic moved to canonical Workers only after data is verified, so that customers never hit a half-migrated surface.

Acceptance Criteria
THE SYSTEM SHALL repoint routes/custom domains to the canonical Worker only after Requirement 6 verification passes for its data dependencies.
THE SYSTEM SHALL verify the canonical surface end-to-end (health + representative endpoints) post-cutover.
IF post-cutover verification fails, THEN THE SYSTEM SHALL roll the route back to the prior Worker.
Requirement 8: Phased Retirement (gated)
User Story: As the founder, I want legacy resources retired in approved buckets after cutover, so that the account shrinks to the canonical set without risk.

Acceptance Criteria
THE SYSTEM SHALL retire only resources classified dark/unbound (Requirement 3) AND whose data (if any) is verified-migrated (Requirement 6).
THE SYSTEM SHALL require explicit founder approval per bucket before any deletion.
THE SYSTEM SHALL retire in order: templates/experiments → orphan staging/test → deprecated merged services → superseded Twin lineage → env-duplicate lineages.
THE SYSTEM SHALL record each retired resource (id, type, last route, migration ref) in the registry before deletion.
THE SYSTEM SHALL NOT delete any resource classified other-product (a genuinely different repo/product confirmed by the audit).
WHEN a bucket is retired, THE SYSTEM SHALL re-run the inventory and update the manifest/registry counts.
Requirement 9: Drift Prevention
User Story: As the founder, I want guardrails that stop the sprawl from returning, so that this consolidation is permanent.

Acceptance Criteria
THE SYSTEM SHALL enforce CI-only deploy (Requirement 1.3) via repository policy/workflow.
THE SYSTEM SHALL provide a periodic inventory check that flags any Worker/KV/D1/Queue not present in the manifest.
WHEN an unmanifested resource is detected, THE SYSTEM SHALL surface it for triage rather than silently allowing it.
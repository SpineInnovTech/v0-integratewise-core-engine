# IntegrateWise Doctrine Sync and Source Map

> Use this document to keep the IntegrateWise doctrine surfaces aligned across source docs, internal publication, BrandDocumentations, and Org Memory.

## Purpose

IntegrateWise now has multiple documentation surfaces that serve different roles.
They must stay connected, but they must not become competing canons.

This document defines:

- the current canon hierarchy
- the final product/component model to propagate
- the update order across repositories and surfaces
- the key file paths that must stay linked

## Canon hierarchy

### Cross-surface folder taxonomy (must be followed everywhere)

Use this canonical departmental taxonomy across internal docs, source docs, BrandDocumentations continuity/runtime surfaces, and Org Memory references whenever a folder, information architecture, or documentation grouping model is needed.

| Prefix | Department                 | What Lives Here                                                                                                                                                                           | What Does NOT Live Here                                    |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **00** | Company Strategy           | Vision, mission, OKRs, business plans, investor decks, roadmaps, board materials, governance, business continuity policy                                                                  | Engineering specs, marketing campaigns, sales proposals    |
| **01** | Product & Engineering      | Roadmaps, PRDs, design files, architecture docs, API specs, code references, release notes, deployment guides, QA reports, R&D experiments, MLOps model registry, knowledge memory schema | Financial budgets, HR policies, press releases             |
| **02** | Marketing & Creative       | Brand assets, campaigns, content hub, social media, performance marketing, media library, presentations                                                                                   | Website code, external press distribution, sales playbooks |
| **03** | Sales                      | Leads, playbooks, proposals, contracts, pricing, account management, forecasts, commission plans                                                                                          | Marketing creative, customer support tickets               |
| **04** | Customer Success           | Support knowledge base, onboarding guides, customer feedback, case studies, testimonials, SLAs, renewal playbooks                                                                         | Sales leads, product PRDs                                  |
| **05** | Operations                 | Platform SRE, service runbooks, DR plans, incident response, integrations connectors, observability telemetry, IT systems, facilities, business continuity execution                      | Company strategy, product development                      |
| **06** | Finance, Legal, HR         | Budgets, P&L, invoices, expense reports, contracts, NDAs, IP filings, compliance certificates, employee handbook, payroll, performance reviews                                            | Engineering code, marketing assets                         |
| **07** | Resources & Knowledge Base | Templates, training materials, tool guides, internal playbooks, onboarding checklists                                                                                                     | Live documents, active campaigns                           |
| **08** | External Communications    | Website content, press releases, media kit, events, conferences, community advocacy                                                                                                       | Internal strategy, internal training                       |
| **09** | Archives & Retention       | Yearly archives, legal hold, retention policies, deletion logs, stale documents                                                                                                           | Active work, current projects                              |

### 1. Company OS v1.0

- `book:iw:company-os-v1`
- This is the business/company doctrine canon.
- It is the long-form source for company, product, governance, and operating worldview.

### 2. Agent runtime doctrine

- `/Users/nirmal/.hermes/skills/software-development/integratewise-architecture/SKILL.md`
- `/Users/nirmal/.hermes/skills/software-development/integratewise-architecture/references/may2026-doctrine-consolidation.md`
- These define how agents should interpret and apply the doctrine while working.

### 3. Source prose layer for repo-readable docs

- `/Users/nirmal/Github/integratewise-live/docs`
- This is the editable source layer for readable product, GTM, architecture, operations, design, playbook, and runbook documentation.
- `integratewise-docs` should sync from here, not invent a parallel prose canon.

### 4. Internal publication layer

- `/Users/nirmal/Github/integratewise-docs/docs/internal`
- This is the readable internal publication mirror for the team.
- It should sync from `integratewise-live/docs` wherever a source doc exists.
- Internal-only index/guide pages can be maintained directly here.

### 5. BrandDocumentations runtime/continuity surface

- `/Users/nirmal/Github/BrandDocumentations`
- This is the governed continuity/runtime documentation surface.
- Within this repo, `src/imports/pasted_text/integratewise-overview.md` is the app-import source.
- It must align upward to Company OS v1.0 and the May 2026 doctrine consolidation.

### 6. Org Memory mirror/reference corpus

- `/Users/nirmal/Github/IntegrateWise - Org Memory`
- This is the organized local continuity/reference mirror.
- It should preserve full-body mirrors and durable link maps, not drift into a separate competing canon.

## Final product/component model to propagate

Use this as the current final architecture model when reconciling docs.

1. Adaptive Spine
   - Substrate, truth, memory, routing, continuity base.

2. User Workbench
   - Projection-native customer/product shell.
   - The primary human operating surface.

3. Twin Workbench
   - Cognitive workbench.
   - OpenWebUI is the primary Twin runtime surface.

4. governance layer
   - Separate approval, policy, trust, lineage, and truth-mutation surface.

5. Operating Surface Ecosystem
   - External tools, packs, templates, publication adapters, and distribution surfaces.

6. Execution Layer (Claw)
   - Deterministic execution path.
   - Operational flow remains Twin → Governance → Claw → workflows/tools → evidence.

## Durable terminology guardrails

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library)
- Governance is embedded at every layer — not a separate workbench
- OpenWebUI is not the customer-facing product shell
- Twin / OpenWebUI runtime uses Forest + Paper
- Midnight Executive is investor-deck / fundraising language only

## Cross-repo update order

When doctrine changes need to propagate broadly, update in this order:

1. Patch source-of-truth readable docs in `integratewise-live/docs`
2. Run `/Users/nirmal/Github/integratewise-docs/scripts/sync-docs.sh`
3. Patch internal-only docs in `integratewise-docs/docs/internal/` such as:
   - `index.md`
   - `guide.md`
   - legacy internal-only doctrine notes without sync source mirrors
4. Patch BrandDocumentations app-import doctrine files:
   - `src/imports/pasted_text/integratewise-overview.md`
   - `src/imports/pasted_text/README.md`
   - repo `README.md` if source-role wording changes
5. Mirror the update into Org Memory with a full-body summary or doctrine link map
6. Verify all surfaces still point back to the same canon hierarchy

## Key linked files

### Agent/runtime doctrine

- `/Users/nirmal/.hermes/skills/software-development/integratewise-architecture/references/may2026-doctrine-consolidation.md`
- `/Users/nirmal/.hermes/skills/software-development/integratewise-architecture/references/operational-doctrine-may2026.md`

### Source prose layer

- `/Users/nirmal/Github/integratewise-live/docs/POSITIONING_AND_PRODUCT_CONTEXT.md`
- `/Users/nirmal/Github/integratewise-live/docs/tech/INTEGRATEWISE_SYSTEM_OVERVIEW.md`
- `/Users/nirmal/Github/integratewise-live/docs/tech/L2_TWIN_SURFACE_CONTRACT.md`
- `/Users/nirmal/Github/integratewise-live/docs/tech/DOCTRINE_SYNC_AND_SOURCE_MAP.md`

### Internal publication layer

- `/Users/nirmal/Github/integratewise-docs/docs/internal/index.md`
- `/Users/nirmal/Github/integratewise-docs/docs/internal/guide.md`
- `/Users/nirmal/Github/integratewise-docs/docs/internal/architecture/doctrine-sync-and-source-map.md`

### BrandDocumentations continuity/runtime layer

- `/Users/nirmal/Github/BrandDocumentations/README.md`
- `/Users/nirmal/Github/BrandDocumentations/src/imports/pasted_text/README.md`
- `/Users/nirmal/Github/BrandDocumentations/src/imports/pasted_text/integratewise-overview.md`

### Org Memory mirror/reference layer

- `/Users/nirmal/Github/IntegrateWise - Org Memory/10-Knowledge-Intake/Consolidated-Doctrine/01-Consolidated-Hermes-Sessions-Doctrine.md`

## Final rule

These surfaces should stay connected by explicit links, shared terminology, and a stable update order.
They should not stay connected by accidental duplication or silent drift.

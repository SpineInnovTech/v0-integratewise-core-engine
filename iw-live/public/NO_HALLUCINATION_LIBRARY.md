# No-Hallucination Library

> Canonical grounding assets so AI assistants answer about IntegrateWise from **source of truth only** — no hallucination without citation.

## What it is

The **No-Hallucination Library** is the set of static, versioned files that AI agents (Claude, ChatGPT, Cursor, Perplexity, Gemini, MCP clients) **must** read before answering questions about IntegrateWise. Every claim about product, architecture, or process should be traceable to these files or to cited Spine/evidence.

## Canonical files (this repo)

| File                              | Purpose                                                                                                                                 | URL (production)                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **`llm.txt`**                     | Human- and AI-readable grounding: identity, product definition, data flows, governance, connectors, data commitments, forbidden claims. | `https://app.integratewise.ai/llm.txt`                     |
| **`context.json`**                | Machine-readable structured data: identity, Spine definition, product layers, data flows, connectors, differentiation, grounding rules. | `https://app.integratewise.ai/context.json`                |
| **`.well-known/ai-context.json`** | AI agent discovery: schema version, product identity, MCP server, grounding file URLs, memory reference instructions.                   | `https://app.integratewise.ai/.well-known/ai-context.json` |

All three live under **`public/`** at repo root. **Copies** must also exist in **`apps/web/public/`** (and `apps/web/public/.well-known/ai-context.json`) so the Cloudflare Pages build serves them at `/llm.txt`, `/context.json`, `/.well-known/ai-context.json`.

## Public vs Internal Boundary

**CRITICAL:** These files are **public-facing** — served to any AI agent or crawler that fetches them. They must NEVER expose:

| Never Expose Publicly                                          | Why                                          |
| -------------------------------------------------------------- | -------------------------------------------- |
| 8-stage pipeline names (Analyzer, Classifier, etc.)            | Internal IP — the "how" behind normalization |
| Normalizer stages (NA0–NA5, S1–S8, S7.5)                       | Internal implementation detail               |
| Hydration buckets (B0–B7) or "creamy load"                     | Internal data loading strategy               |
| Domain agent names (SuccessPilot, ChurnShield, etc.)           | Pre-launch product IP                        |
| Colony system / multi-agent orchestration details              | Architecture IP                              |
| Twin trigger engine mechanics                                  | Internal reasoning implementation            |
| Identity resolution internals                                  | Competitive advantage                        |
| Worker-level architecture (Cloudflare Workers, D1, KV, queues) | Infrastructure IP                            |
| Python Intelligence API details                                | Internal processing layer                    |
| n8n workflow URLs or specifics                                 | Operational detail                           |
| Doppler secret counts or config                                | Security concern                             |
| Firebase SMB architecture                                      | Legacy detail                                |

**What IS safe to expose:** Product identity (Knowledge Workspace), the Spine concept, data flows at a high level (A/B/C), governance philosophy, connector list, data commitments, and the L1/L2 layer descriptions.

## How Browser-Based AI Agents Should Use These Files

The `ai-context.json` file includes a `memory_reference` section that instructs browser-based AI agents:

1. **Discover** — Fetch `/.well-known/ai-context.json` to find grounding files
2. **Read** — Fetch `llm.txt` for human-readable context and `context.json` for structured data
3. **Ground** — Use these files as the sole source for product/architecture claims
4. **Enforce** — Follow the `grounding_rules` in `context.json` (identity, forbidden labels, no internal exposure)
5. **Extend** — Use the Spine via MCP (if available) for entity-level, tenant-specific data

## How In-Repo Agents Should Use These Files

In-repo agents (Cursor, Claude via CLAUDE.md, OpenClaw) have access to the full codebase. They should:

1. Read `CLAUDE.md` and `AGENTS.md` for the repo navigation and product identity
2. Use the Library files as the **external-facing** truth — if writing code that touches public descriptions (manifest, onboarding copy, AI system prompts, API responses), align to these files
3. For internal work (architecture decisions, pipeline code, service wiring), use the internal docs in `docs/` and `docs/architecture/`

## Updating the Library

- **llm.txt:** Edit `public/llm.txt`. Keep it public-safe. Update the version and date line.
- **context.json:** Edit `public/context.json`. Additive changes only for compatibility. Bump `version` and `updated`.
- **.well-known/ai-context.json:** Edit `public/.well-known/ai-context.json`. Update `last_updated` and `architecture_version`.

After edits:

1. Update files in repo root `public/`
2. Copy the same files to `apps/web/public/` and `apps/web/public/.well-known/`
3. Verify no internal architecture details leaked into public files

## Relation to Spine and Evidence

- **Spine** = source of truth for **domain data** (accounts, deals, tickets, etc.). Entity 360 and L2 reason over Spine only.
- **Evidence drawer / evidence_refs** = source of truth for **why** a recommendation was made (citations).
- **No-Hallucination Library** = source of truth for **what IntegrateWise is** (product, architecture at public level, governance, identity). No AI should describe IntegrateWise from memory alone.

Together: **Library (identity) + Spine (data) + Evidence (citations)** = no hallucination with attribution.

## References

- **Product identity:** `AGENTS.md` § Product Identity
- **Architecture (internal):** `docs/architecture/` (NOT for public exposure)
- **Connector catalog:** `packages/connectors/src/catalog.ts`
- **AI context integration:** `docs/INTEGRATING_AI_CONTEXT_AND_PYTHON_WITH_SPINE.md`

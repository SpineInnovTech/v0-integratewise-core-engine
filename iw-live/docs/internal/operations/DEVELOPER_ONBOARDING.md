# Developer Onboarding

## Repository Structure

```
integratewise-live/
├── apps/web/          # React SPA (Vite + TailwindCSS)
├── apps/desktop/      # Electron app
├── apps/mobile/       # React Native (Expo)
├── packages/          # Shared packages
│   ├── types/         # TypeScript types (schema, entity360, sync)
│   ├── lib/           # Shared utilities
│   ├── connectors/    # 70+ connector implementations
│   ├── accelerators/  # Domain accelerator sync scopes
│   ├── config/        # Shared config
│   ├── rbac/          # Role-based access control
│   └── spineDb/      # Spine DB client wrappers
├── services/          # Cloudflare Workers (21 services)
│   ├── gateway/       # API gateway + routing
│   ├── spine-v2/      # SSOT + Entity 360 API
│   ├── normalizer/    # 8-stage pipeline + identity resolution
│   ├── pipeline/      # Pipeline orchestration
│   ├── knowledge/     # Context + memory + triage
│   ├── think/         # AI reasoning + Twin triggers
│   ├── act/           # Action execution
│   ├── govern/        # Policy + approval gate
│   ├── workflow/      # Real-time signals + Durable Objects
│   ├── connector/     # Connector management
│   ├── tenants/       # Tenant + OAuth management
│   └── ...            # billing, admin, agents, etc.
└── docs/              # Documentation
```

## Key Concepts

1. **Schema as Backend IP**: Frontend never sees entity_type names. BFF transforms to organic labels.
2. **Three Flows**: A (structured → Spine), B (context → Spine + Knowledge), C (AI → Knowledge only)
3. **Entity 360**: Single unified view. Twin reads only from here.
4. **8-Stage Pipeline**: Every record passes through all 8 stages. No shortcuts.
5. **Govern Gate**: Every autonomous action requires approval.

## Surface Boundaries

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- The Twin is Cloudflare-native (`iw-agent-runtime`); there is no OpenWebUI in the product.
- Twin runtime surfaces use Forest + Paper.

## First Steps

```bash
# 1. Clone and install
git clone git@github.com:NirmalPrinceJ/integratewise-live.git
cd integratewise-live
pnpm install

# 2. Verify build
pnpm typecheck  # 31/31

# 3. Run tests
pnpm test

# 4. Start dev
pnpm dev

# 5. Open web app
open http://localhost:3000
```

## Making Changes

1. Create feature branch from main
2. Make changes
3. Run `pnpm typecheck` (must pass 31/31)
4. Run `pnpm test`
5. Push and create PR
6. OpenClaw triage reviews
7. Merge to main → auto-deploy

## Important Files

| File                                                      | Purpose                                     |
| --------------------------------------------------------- | ------------------------------------------- |
| `packages/types/src/schema.ts`                            | 12 domain spine configs, entity types       |
| `packages/types/src/entity360.ts`                         | Entity 360 type definitions                 |
| `services/spine-v2/src/index.ts`                          | Entity type → table routing (150+ types)    |
| `services/think/src/twin-triggers.ts`                     | 10 Twin trigger definitions                 |
| `services/normalizer/src/index.ts`                        | 8-stage pipeline + S7.5 identity resolution |
| `apps/web/src/components/l1/workspace/content-router.tsx` | All UI module routing                       |

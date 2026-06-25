# IntegrateWise Configuration Management

**Purpose**: Centralized configuration organization for the monorepo

---

## Directory Structure

```
configs/
├── README.md                   # This file
├── root/                       # Root-level configurations
│   ├── tsconfig.base.json     # Shared TypeScript config
│   ├── turbo.json             # Turborepo pipeline
│   ├── pnpm-workspace.yaml    # Workspace definition
│   ├── vercel.json            # Vercel deployment config
│   └── firebase.json          # Firebase configuration
│
├── templates/                  # Templates for new services/packages
│   ├── services/
│   │   ├── wrangler.toml      # Cloudflare Worker template
│   │   └── tsconfig.json      # TypeScript config for services
│   └── packages/
│       ├── tsconfig.json      # TypeScript config for packages
│       └── tsup.config.ts     # TSUP build config
│
└── scripts/                    # Configuration utilities
    └── sync-tsconfig-refs.ts  # Sync TypeScript references
```

---

## Root Configurations

These are linked from the repository root (symlinks):

| File                  | Original Location                  | Purpose                       |
| --------------------- | ---------------------------------- | ----------------------------- |
| `tsconfig.base.json`  | `configs/root/tsconfig.base.json`  | Shared TypeScript base config |
| `turbo.json`          | `configs/root/turbo.json`          | Turborepo build pipeline      |
| `pnpm-workspace.yaml` | `configs/root/pnpm-workspace.yaml` | pnpm workspace definition     |
| `vercel.json`         | `configs/root/vercel.json`         | Vercel deployment settings    |
| `firebase.json`       | `configs/root/firebase.json`       | Firebase hosting config       |

---

## Service Configurations

Each service in `services/` has its own:

| File            | Purpose                         | Movable?                          |
| --------------- | ------------------------------- | --------------------------------- |
| `wrangler.toml` | Cloudflare Worker configuration | ❌ Must stay in service directory |
| `tsconfig.json` | TypeScript configuration        | ❌ Must stay in service directory |
| `package.json`  | NPM package definition          | ❌ Must stay in service directory |

Use the templates in `configs/templates/services/` when creating new services.

---

## Package Configurations

Each package in `packages/` has its own:

| File             | Purpose                             | Movable?                          |
| ---------------- | ----------------------------------- | --------------------------------- |
| `tsconfig.json`  | TypeScript configuration            | ❌ Must stay in package directory |
| `tsup.config.ts` | Build configuration (if using tsup) | ❌ Must stay in package directory |
| `package.json`   | NPM package definition              | ❌ Must stay in package directory |

Use the templates in `configs/templates/packages/` when creating new packages.

---

## Creating a New Service

```bash
# 1. Copy service template
cp -r configs/templates/services services/my-new-service

# 2. Update service-specific values in wrangler.toml
# 3. Implement src/index.ts
# 4. Add to pnpm-workspace.yaml if not covered by glob
```

---

## Creating a New Package

```bash
# 1. Copy package template
cp -r configs/templates/packages packages/my-new-package

# 2. Update package.json with name and dependencies
# 3. Implement src/index.ts
# 4. Add to pnpm-workspace.yaml if not covered by glob
```

---

## TypeScript Configuration Strategy

### Root Base Config

- `configs/root/tsconfig.base.json`: Shared compiler options
- Referenced by all service/package tsconfig.json files

### Service Config Pattern

```json
{
  "extends": "../../configs/root/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### Package Config Pattern

```json
{
  "extends": "../../configs/root/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

---

## Why This Structure?

1. **Root configs are centralized**: Easy to find and modify global settings
2. **Service configs stay in place**: Required by Cloudflare Wrangler and TypeScript
3. **Templates for consistency**: New services/packages follow established patterns
4. **Clear separation**: Root vs service vs package configurations

---

## Updating Configs

### Root Configs

Edit directly in `configs/root/`. Changes are immediate (symlinked).

### Service Configs

Edit in-place in `services/{name}/`. Templates in `configs/templates/` are for new services only.

### Package Configs

Edit in-place in `packages/{name}/`. Templates in `configs/templates/` are for new packages only.

---

## Migration Notes

**Date**: 2026-02-10
**Changes**:

- Moved root configs to `configs/root/`
- Created symlinks in repository root
- Added templates directory
- Created this documentation

**Impact**:

- No functional changes - configs are symlinked
- Better organization and discoverability
- Templates for future growth

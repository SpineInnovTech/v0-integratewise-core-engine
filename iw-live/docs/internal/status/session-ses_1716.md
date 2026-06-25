# New session - 2026-06-03T17:52:22.339Z

**Session ID:** ses_1716292bcffeCZ1fze4f0p8KaU
**Created:** 6/3/2026, 11:22:22 PM
**Updated:** 6/4/2026, 8:07:28 AM

---

## User

total loc

---

## Assistant (Build · MiMo V2.5 Free · 15.6s)

_Thinking:_

The user is asking about "total loc" which likely means they want to know the total lines of code in the project. I'll use a bash command to count lines of code in the repository.

**Tool: bash**

**Input:**

```json
{
  "command": "find /Users/nirmal/Github/integratewise-live -type f \\( -name \"*.ts\" -o -name \"*.tsx\" -o -name \"*.js\" -o -name \"*.jsx\" -o -name \"*.json\" -o -name \"*.md\" -o -name \"*.yaml\" -o -name \"*.yml\" -o -name \"*.toml\" -o -name \"*.html\" -o -name \"*.css\" \\) -not -path \"*/node_modules/*\" -not -path \"*/.git/*\" -not -path \"*/dist/*\" -not -path \"*/build/*\" | xargs wc -l 2>/dev/null | tail -1",
  "description": "Count total lines of code in repository"
}
```

**Output:**

```
  133217 total

```

---

## Assistant (Build · MiMo V2.5 Free · 4.1s)

_Thinking:_

The user wants to know the total lines of code in the repository. I just ran a command that found all source files (TypeScript, JavaScript, JSON, Markdown, YAML, HTML, CSS) excluding node_modules, .git, dist, and build directories, and counted their lines. The result shows 133,217 total lines of code.

I should present this information clearly and concisely to the user.

The repository contains **133,217 lines of code** across all source files (TypeScript, JavaScript, JSON, Markdown, YAML, HTML, CSS) in the integratewise-live project.

---

## User

youn are not goign through the code, code is differnt than the docs base

---

## Assistant (Build · MiMo V2.5 Free · 6.9s)

_Thinking:_

I need to explore the actual codebase structure to understand what files exist and their contents. Let me start by listing the directory structure and examining some key files.

**Tool: bash**

**Input:**

```json
{
  "command": "ls -la /Users/nirmal/Github/integratewise-live",
  "description": "List root directory contents"
}
```

**Output:**

```
total 6416
drwxr-xr-x@ 86 nirmal  staff    2752 Jun  3 20:05 .
drwxr-xr-x  55 nirmal  staff    1760 Jun  4 00:51 ..
-rw-r--r--@  1 nirmal  staff   28676 Jun  3 19:17 .DS_Store
-rw-r--r--@  1 nirmal  staff    1057 Apr  8 14:28 .aider.chat.history.md
-rw-r--r--@  1 nirmal  staff      35 Apr  8 14:28 .aider.input.history
drwxr-xr-x@  9 nirmal  staff     288 Apr 30 23:00 .aider.tags.cache.v4
drwxr-xr-x@  3 nirmal  staff      96 Mar 11 19:08 .claude
drwxr-xr-x@  8 nirmal  staff     256 Apr 10 14:33 .cursor
-rw-r--r--@  1 nirmal  staff    3247 Jun  3 14:26 .cursorrules
-rw-r--r--@  1 nirmal  staff     288 Jun  3 14:26 .editorconfig
-rw-r--r--@  1 nirmal  staff    3426 Jun  3 08:21 .env
-rw-r--r--@  1 nirmal  staff    3126 Jun  3 14:26 .env.example
-rw-r--r--@  1 nirmal  staff     347 Jun  3 14:26 .envrc
drwxr-xr-x@ 19 nirmal  staff     608 Jun  3 23:09 .git
drwxr-xr-x@  9 nirmal  staff     288 Jun  3 15:44 .github
-rw-r--r--@  1 nirmal  staff    1025 Jun  3 14:26 .gitignore
drwxr-xr-x@  3 nirmal  staff      96 Jun  3 19:32 .iw
drwxr-xr-x   8 nirmal  staff     256 Jun  1 17:35 .kimi
drwxr-xr-x   5 nirmal  staff     160 Jun  1 13:55 .kiro
drwxr-xr-x@  3 nirmal  staff      96 Apr 10 14:33 .logs
-rw-r--r--@  1 nirmal  staff       3 Jun  3 14:26 .node-version
-rw-r--r--@  1 nirmal  staff     369 Jun  3 14:26 .npmrc
drwxr-xr-x@  8 nirmal  staff     256 May 27 23:03 .opencode
drwxr-xr-x  26 nirmal  staff     832 Jun  3 14:26 .playwright-mcp
drwxr-xr-x@  3 nirmal  staff      96 Mar 10 16:59 .pnpm-home
drwxr-xr-x@  4 nirmal  staff     128 Jun  2 06:10 .pnpm-store
-rw-r--r--@  1 nirmal  staff     150 Jun  3 14:26 .prettierignore
-rw-r--r--@  1 nirmal  staff     107 Jun  3 14:26 .prettierrc
drwxr-xr-x   4 nirmal  staff     128 May 24 04:10 .turbo
drwxr-xr-x@  7 nirmal  staff     224 Jun  3 14:26 .vscode
-rw-r--r--@  1 nirmal  staff     476 Jun  3 14:26 .warpindexingignore
drwxr-xr-x   5 nirmal  staff     160 Jun  1 13:55 .wrangler
-rw-r--r--@  1 nirmal  staff   12735 Jun  3 15:44 AGENTS.md
-rw-r--r--@  1 nirmal  staff   43785 Jun  3 14:26 AGENT_SESSION_NOTES.md
-rw-r--r--@  1 nirmal  staff    3377 Jun  3 14:26 CHANGELOG.md
-rw-r--r--@  1 nirmal  staff    9037 Jun  3 14:26 CLAUDE.md
-rw-r--r--@  1 nirmal  staff    6980 Jun  3 15:44 ECOSYSTEM.md
-rw-r--r--@  1 nirmal  staff    2046 Jun  3 14:26 MCP_QUICK_START.md
-rw-r--r--@  1 nirmal  staff    6075 Jun  3 14:26 ONBOARDING_FIX_COMPLETE.md
-rw-r--r--@  1 nirmal  staff   28451 Jun  3 15:44 README.md
-rw-r--r--@  1 nirmal  staff  105412 Jun  3 14:26 REPOSITORY_TREE.txt
-rw-r--r--@  1 nirmal  staff   40782 Jun  3 15:44 SERVICE_ARCHITECTURE_REPORT.md
drwxr-xr-x  15 nirmal  staff     480 Jun  3 14:26 Screenshots OnBoarding
drwxr-xr-x   4 nirmal  staff     128 Jun  2 19:34 _archived
drwxr-xr-x@  8 nirmal  staff     256 Jun  2 04:00 apps
-rw-r--r--@  1 nirmal  staff    9217 Jun  3 14:26 command-center-attempt.png
-rw-r--r--@  1 nirmal  staff    5943 Jun  3 14:26 command-center-preview.html
-rw-r--r--@  1 nirmal  staff   67455 Jun  3 14:26 command-center-preview.png
drwxr-xr-x@  7 nirmal  staff     224 Jun  3 14:26 configs
-rw-r--r--@  1 nirmal  staff   52271 Jun  3 14:26 cs-full-product-trial.html
-rw-r--r--@  1 nirmal  staff  245359 Jun  3 14:26 current-app-state.png
-rw-r--r--@  1 nirmal  staff     818 Apr 17 20:07 debug-storybook.log
drwxr-xr-x@ 33 nirmal  staff    1056 Jun  3 15:44 docs
-rw-r--r--@  1 nirmal  staff    2064 Jun  3 14:26 doppler.yaml
-rw-r--r--@  1 nirmal  staff   77346 Jun  3 14:26 integratewise-complete-mock.html
-rw-r--r--@  1 nirmal  staff   12412 Jun  3 14:26 integratewise-shell-mockup-final.html
-rw-r--r--@  1 nirmal  staff  182134 Jun  3 15:44 knowledgework_28d1.md
-rw-r--r--@  1 nirmal  staff     379 Jun  3 14:26 lefthook.yml
drwxr-xr-x@  4 nirmal  staff     128 Apr 10 14:33 mcp
drwxr-xr-x@  5 nirmal  staff     160 Jun  3 14:26 migrations
-rw-r--r--@  1 nirmal  staff    2867 Jun  3 14:26 mock_ui.html
drwxr-xr-x@  6 nirmal  staff     192 Jun  3 15:44 n8n-workflows
drwxr-xr-x  15 nirmal  staff     480 Jun  3 01:27 node_modules
-rw-r--r--@  1 nirmal  staff    3706 Jun  3 20:28 package.json
drwxr-xr-x@ 23 nirmal  staff     736 Jun  2 20:15 packages
-rw-r--r--@  1 nirmal  staff  781617 Jun  3 14:26 pnpm-lock.yaml
-rw-r--r--@  1 nirmal  staff      85 Jun  3 14:26 pnpm-workspace.yaml
-rw-r--r--@  1 nirmal  staff   17291 Jun  3 15:44 product-architecture.md
drwxr-xr-x@ 16 nirmal  staff     512 Jun  3 14:26 public
drwxr-xr-x@ 47 nirmal  staff    1504 Jun  3 18:55 scripts
drwxr-xr-x@ 28 nirmal  staff     896 Jun  2 05:08 services
-rw-r--r--@  1 nirmal  staff  497435 Jun  3 22:17 session-ses_185a.md
-rw-r--r--@  1 nirmal  staff  195298 Jun  3 15:44 session-ses_28d1.md
-rw-r--r--@  1 nirmal  staff  198256 Jun  3 14:26 spine-pipeline-backend.patch
drwxr-xr-x@  7 nirmal  staff     224 Jun  3 14:26 supabase
-rw-r--r--@  1 nirmal  staff     517 Jun  3 14:26 tsconfig.base.json
-rw-r--r--@  1 nirmal  staff     693 Jun  3 14:26 tsconfig.json
-rw-r--r--@  1 nirmal  staff     316 Mar 18 02:04 tsconfig.tsbuildinfo
-rw-r--r--@  1 nirmal  staff     623 Jun  3 14:26 turbo.json
-rw-r--r--@  1 nirmal  staff  194248 Jun  3 14:26 ui-surface-trial-full.png
-rw-r--r--@  1 nirmal  staff  198989 Jun  3 14:26 ui-surface-trial-l2.png
-rw-r--r--@  1 nirmal  staff   14069 Jun  3 14:26 ui-surface-trial.html
-rw-r--r--@  1 nirmal  staff   97837 Jun  3 14:26 ui-surface-trial.png
drwxr-xr-x@ 18 nirmal  staff     576 Jun  3 15:44 v0-review
-rw-r--r--@  1 nirmal  staff    3950 Jun  3 22:17 verify-pages.js
drwxr-xr-x@  3 nirmal  staff      96 Jun  3 14:26 vitest-stubs

```

---

## Assistant (Build · MiMo V2.5 Free · 6.1s)

_Thinking:_

The user wants me to go through the actual codebase structure. Let me explore the key directories to understand the real structure. I need to look at:

1. The `services` directory (which should contain the Cloudflare Workers)
2. The `packages` directory (which should contain shared packages)
3. The `apps` directory (which might contain the frontend)

Let me start by exploring these directories.

**Tool: bash**

**Input:**

```json
{
  "command": "ls -la /Users/nirmal/Github/integratewise-live/services",
  "description": "List services directory"
}
```

**Output:**

```
total 32
drwxr-xr-x@ 28 nirmal  staff    896 Jun  2 05:08 .
drwxr-xr-x@ 86 nirmal  staff   2752 Jun  3 20:05 ..
-rw-r--r--@  1 nirmal  staff  14340 Jun  3 01:17 .DS_Store
drwxr-xr-x@ 11 nirmal  staff    352 Jun  3 14:26 act
drwxr-xr-x@ 11 nirmal  staff    352 Jun  3 14:26 admin
drwxr-xr-x  11 nirmal  staff    352 Jun  3 15:44 agent-registry
drwxr-xr-x@ 13 nirmal  staff    416 Jun  3 17:14 billing
drwxr-xr-x@ 12 nirmal  staff    384 Jun  3 14:26 connector
drwxr-xr-x@  9 nirmal  staff    288 Jun  3 14:26 connector-sync
drwxr-xr-x  10 nirmal  staff    320 Jun  3 15:44 continuity
drwxr-xr-x@  9 nirmal  staff    288 Jun  3 14:26 folder-watcher
drwxr-xr-x@ 12 nirmal  staff    384 Jun  3 15:44 gateway
drwxr-xr-x@ 13 nirmal  staff    416 Jun  3 14:26 govern
drwxr-xr-x  11 nirmal  staff    352 Jun  3 14:26 hermes
drwxr-xr-x@ 13 nirmal  staff    416 Jun  3 15:44 intelligence
drwxr-xr-x@ 14 nirmal  staff    448 Jun  3 15:44 knowledge
drwxr-xr-x@  9 nirmal  staff    288 Jun  3 14:26 l2
drwxr-xr-x@ 15 nirmal  staff    480 Jun  3 14:26 loader
drwxr-xr-x@ 18 nirmal  staff    576 Jun  3 15:44 mcp-connector
drwxr-xr-x@ 13 nirmal  staff    416 Jun  3 14:26 normalizer
drwxr-xr-x@ 13 nirmal  staff    416 Jun  3 14:26 pipeline
drwxr-xr-x@ 12 nirmal  staff    384 Jun  3 14:26 spine-v2
drwxr-xr-x@ 11 nirmal  staff    352 Jun  3 14:26 store
drwxr-xr-x@  8 nirmal  staff    256 Jun  3 14:26 telemetry
drwxr-xr-x@ 12 nirmal  staff    384 Jun  3 14:26 tenants
drwxr-xr-x@ 14 nirmal  staff    448 Jun  3 17:14 think
drwxr-xr-x@ 11 nirmal  staff    352 Jun  3 14:26 webhook-ingress
drwxr-xr-x@ 14 nirmal  staff    448 Jun  3 14:26 workflow

```

---

## Assistant (Build · MiMo V2.5 Free · 5.2s)

_Thinking:_

The user wants to see the actual code structure. Let me check the services directory and packages directory more thoroughly.

**Tool: bash**

**Input:**

```json
{
  "command": "ls -la /Users/nirmal/Github/integratewise-live/packages",
  "description": "List packages directory"
}
```

**Output:**

```
total 32
drwxr-xr-x@ 23 nirmal  staff    736 Jun  2 20:15 .
drwxr-xr-x@ 86 nirmal  staff   2752 Jun  3 20:05 ..
-rw-r--r--@  1 nirmal  staff  12292 Jun  3 00:36 .DS_Store
drwxr-xr-x@ 10 nirmal  staff    320 Jun  3 14:26 accelerators
drwxr-xr-x@ 11 nirmal  staff    352 Jun  3 14:26 analytics
drwxr-xr-x@ 12 nirmal  staff    384 Jun  3 14:26 api
drwxr-xr-x@ 15 nirmal  staff    480 Jun  3 23:08 coda-pack
drwxr-xr-x@ 13 nirmal  staff    416 Jun  3 14:26 config
drwxr-xr-x@  9 nirmal  staff    288 Jun  3 14:26 connector-contracts
drwxr-xr-x@  7 nirmal  staff    224 Jun  3 14:26 connector-utils
drwxr-xr-x@ 14 nirmal  staff    448 Jun  3 14:26 connectors
drwxr-xr-x@  9 nirmal  staff    288 Jun  3 14:26 db
drwxr-xr-x@ 11 nirmal  staff    352 Jun  3 15:44 hermes-spine-memory
drwxr-xr-x@ 10 nirmal  staff    320 Jun  3 14:26 integratewise-mcp-tool-connector
drwxr-xr-x@  8 nirmal  staff    256 Jun  3 15:44 integration-tests
drwxr-xr-x@ 15 nirmal  staff    480 Jun  3 14:26 knowledge-bank-ui
drwxr-xr-x@ 10 nirmal  staff    320 Jun  3 14:26 lib
drwxr-xr-x@ 11 nirmal  staff    352 Jun  3 17:14 rbac
drwxr-xr-x@ 11 nirmal  staff    352 Jun  3 14:26 supabase
drwxr-xr-x@  8 nirmal  staff    256 Jun  3 14:26 tenancy
drwxr-xr-x@ 15 nirmal  staff    480 Jun  3 14:26 types
drwxr-xr-x@ 10 nirmal  staff    320 Jun  3 14:26 webhooks
drwxr-xr-x@  3 nirmal  staff     96 Mar 21 04:25 website

```

---

## Assistant (Build · MiMo V2.5 Free · 6.2s)

_Thinking:_

The user wants me to count the actual lines of code in the repository, not just rely on documentation. Let me examine the actual code files in the services and packages directories to get a more accurate count. I should focus on the TypeScript/JavaScript source files that are actually part of the codebase. Let me check the structure more carefully.

**Tool: bash**

**Input:**

```json
{
  "command": "find /Users/nirmal/Github/integratewise-live/services -name \"*.ts\" -o -name \"*.tsx\" -o -name \"*.js\" | head -20",
  "description": "Find TypeScript/JavaScript files in services"
}
```

**Output:**

```
/Users/nirmal/Github/integratewise-live/services/continuity/src/types.ts
/Users/nirmal/Github/integratewise-live/services/continuity/src/index.ts
/Users/nirmal/Github/integratewise-live/services/continuity/src/supabase.ts
/Users/nirmal/Github/integratewise-live/services/pipeline/src/pipeline.test.ts
/Users/nirmal/Github/integratewise-live/services/pipeline/src/index.ts
/Users/nirmal/Github/integratewise-live/services/think/vitest.config.ts
/Users/nirmal/Github/integratewise-live/services/think/src/fusion.test.ts
/Users/nirmal/Github/integratewise-live/services/think/src/context-to-truth.test.ts
/Users/nirmal/Github/integratewise-live/services/think/src/continuity.ts
/Users/nirmal/Github/integratewise-live/services/think/src/tenant-config.ts
/Users/nirmal/Github/integratewise-live/services/think/src/index.test.ts
/Users/nirmal/Github/integratewise-live/services/think/src/fusion.ts
/Users/nirmal/Github/integratewise-live/services/think/src/cognitive-brain.ts
/Users/nirmal/Github/integratewise-live/services/think/src/context.ts
/Users/nirmal/Github/integratewise-live/services/think/src/engine.ts
/Users/nirmal/Github/integratewise-live/services/think/src/narrative.ts
/Users/nirmal/Github/integratewise-live/services/think/src/use-cases/billing.ts
/Users/nirmal/Github/integratewise-live/services/think/src/actions.ts
/Users/nirmal/Github/integratewise-live/services/think/src/twin-triggers.ts
/Users/nirmal/Github/integratewise-live/services/think/src/semantic-lookup.ts

```

---

## Assistant (Build · MiMo V2.5 Free · 8.1s)

_Thinking:_

The user is right - I need to actually count the lines of code in the repository. Let me use a more accurate method that counts only actual source code files (TypeScript, JavaScript) and excludes configuration files, documentation, and other non-code files.

**Tool: bash**

**Input:**

```json
{
  "command": "find /Users/nirmal/Github/integratewise-live/services /Users/nirmal/Github/integratewise-live/packages /Users/nirmal/Github/integratewise-live/apps -name \"*.ts\" -o -name \"*.tsx\" -o -name \"*.js\" -o -name \"*.jsx\" | xargs wc -l 2>/dev/null | tail -1",
  "description": "Count lines of code in services, packages, and apps"
}
```

**Output:**

```
  621235 total

```

---

## Assistant (Build · MiMo V2.5 Free · 4.6s)

_Thinking:_

The user is saying that the code is different from the documentation. Let me look at what's actually in the services and packages directories to understand the real structure. I should check if the architecture described in AGENTS.md matches what's actually in the codebase.

**Tool: bash**

**Input:**

```json
{
  "command": "ls -la /Users/nirmal/Github/integratewise-live/services/think",
  "description": "Check think service structure"
}
```

**Output:**

```
total 336
drwxr-xr-x@ 14 nirmal  staff     448 Jun  3 17:14 .
drwxr-xr-x@ 28 nirmal  staff     896 Jun  2 05:08 ..
-rw-r--r--@  1 nirmal  staff    6148 May 19 00:51 .DS_Store
-rw-r--r--@  1 nirmal  staff     216 Mar 29 02:01 .dev.vars
-rw-r--r--   1 nirmal  staff     379 May 29 16:56 .env.xiaomi
drwxr-xr-x@  4 nirmal  staff     128 Mar 18 11:33 .turbo
drwxr-xr-x@  4 nirmal  staff     128 Apr  5 14:12 .wrangler
drwxr-xr-x  12 nirmal  staff     384 Jun  1 18:08 node_modules
-rw-r--r--@  1 nirmal  staff     691 Jun  3 14:26 package.json
drwxr-xr-x@ 19 nirmal  staff     608 Jun  3 15:44 src
-rw-r--r--@  1 nirmal  staff     414 Jun  3 14:26 tsconfig.json
-rw-r--r--@  1 nirmal  staff  137725 Jun  3 11:46 tsconfig.tsbuildinfo
-rw-r--r--@  1 nirmal  staff     140 Jun  3 14:26 vitest.config.ts
-rw-r--r--@  1 nirmal  staff    1994 Jun  3 14:26 wrangler.toml

```

---

## Assistant (Build · MiMo V2.5 Free · 6.6s)

_Thinking:_

I need to count the lines of code more accurately. Let me check the services and packages directories more carefully. I should count only TypeScript and JavaScript files, excluding node_modules, dist, and build directories.

**Tool: bash**

**Input:**

```json
{
  "command": "find /Users/nirmal/Github/integratewise-live/services /Users/nirmal/Github/integratewise-live/packages /Users/nirmal/Github/integratewise-live/apps -type f \\( -name \"*.ts\" -o -name \"*.tsx\" -o -name \"*.js\" -o -name \"*.jsx\" \\) -not -path \"*/node_modules/*\" -not -path \"*/.git/*\" -not -path \"*/dist/*\" -not -path \"*/build/*\" | xargs wc -l 2>/dev/null | tail -1",
  "description": "Count lines of code excluding node_modules, .git, dist, build"
}
```

**Output:**

```
  549422 total

```

---

## Assistant (Build · MiMo V2.5 Free · 7.1s)

_Thinking:_

The user is right - I need to actually count the lines of code in the repository, not just rely on the file counts. Let me get a more accurate count by looking at the actual source files. Let me also check if there are any compiled files or other artifacts that might be inflating the count.

**Tool: bash**

**Input:**

```json
{
  "command": "find /Users/nirmal/Github/integratewise-live/services /Users/nirmal/Github/integratewise-live/packages /Users/nirmal/Github/integratewise-live/apps -type f \\( -name \"*.ts\" -o -name \"*.tsx\" -o -name \"*.js\" -o -name \"*.jsx\" \\) -not -path \"*/node_modules/*\" -not -path \"*/.git/*\" -not -path \"*/dist/*\" -not -path \"*/build/*\" -not -name \"*.test.*\" -not -name \"*.spec.*\" | xargs wc -l 2>/dev/null | tail -1",
  "description": "Count production code lines only"
}
```

**Output:**

```
  541294 total

```

---

## Assistant (Build · MiMo V2.5 Free · 5.6s)

_Thinking:_

The user is right - I need to actually count the lines of code in the repository, not just rely on the file counts. Let me get a more accurate count by looking at the actual source files. Let me also check if there are any compiled files or other artifacts that might be inflating the count.

**Tool: bash**

**Input:**

```json
{
  "command": "find /Users/nirmal/Github/integratewise-live/services /Users/nirmal/Github/integratewise-live/packages /Users/nirmal/Github/integratewise-live/apps -type f \\( -name \"*.ts\" -o -name \"*.tsx\" -o -name \"*.js\" -o -name \"*.jsx\" \\) -not -path \"*/node_modules/*\" -not -path \"*/.git/*\" -not -path \"*/dist/*\" -not -path \"*/build/*\" | wc -l",
  "description": "Count number of source files"
}
```

**Output:**

```
    1197

```

---

## Assistant (Build · MiMo V2.5 Free · 7.6s)

_Thinking:_

Let me break this down by service and package to give a more useful summary.

**Tool: bash**

**Input:**

```json
{
  "command": "echo \"=== SERVICES ===\" && for d in /Users/nirmal/Github/integratewise-live/services/*/; do name=$(basename \"$d\"); count=$(find \"$d\" -type f \\( -name \"*.ts\" -o -name \"*.tsx\" -o -name \"*.js\" \\) -not -path \"*/node_modules/*\" -not -path \"*/dist/*\" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'); [ -n \"$count\" ] && [ \"$count\" != \"0\" ] && printf \"%-25s %s\\n\" \"$name\" \"$count\"; done | sort -t' ' -k2 -rn",
  "description": "Lines of code per service"
}
```

**Output:**

```
=== SERVICES ===
mcp-connector             143082
workflow                  47935
knowledge                 47299
spine-v2                  21148
admin                     12831
think                     9932
loader                    8368
webhook-ingress           5111
govern                    4799
normalizer                4285
billing                   4185
intelligence              3982
tenants                   3593
gateway                   3272
pipeline                  2282
connector                 2213
hermes                    1992
continuity                1310
connector-sync            825
l2                        722
act                       686
agent-registry            528
store                     521
folder-watcher            134
telemetry                 79

```

**Tool: bash**

**Input:**

```json
{
  "command": "echo \"=== PACKAGES ===\" && for d in /Users/nirmal/Github/integratewise-live/packages/*/; do name=$(basename \"$d\"); count=$(find \"$d\" -type f \\( -name \"*.ts\" -o -name \"*.tsx\" -o -name \"*.js\" \\) -not -path \"*/node_modules/*\" -not -path \"*/dist/*\" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'); [ -n \"$count\" ] && [ \"$count\" != \"0\" ] && printf \"%-35s %s\\n\" \"$name\" \"$count\"; done | sort -t' ' -k2 -rn",
  "description": "Lines of code per package"
}
```

**Output:**

```
=== PACKAGES ===
connectors                          27833
types                               13117
lib                                 5331
coda-pack                           2198
tenancy                             1898
api                                 1627
integration-tests                   1457
accelerators                        1419
knowledge-bank-ui                   1169
supabase                            1161
rbac                                1110
analytics                           985
hermes-spine-memory                 959
webhooks                            921
integratewise-mcp-tool-connector    519
connector-utils                     347
db                                  178
connector-contracts                 148
config                              45

```

**Tool: bash**

**Input:**

```json
{
  "command": "echo \"=== APPS ===\" && for d in /Users/nirmal/Github/integratewise-live/apps/*/; do name=$(basename \"$d\"); count=$(find \"$d\" -type f \\( -name \"*.ts\" -o -name \"*.tsx\" -o -name \"*.js\" \\) -not -path \"*/node_modules/*\" -not -path \"*/dist/*\" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'); [ -n \"$count\" ] && [ \"$count\" != \"0\" ] && printf \"%-25s %s\\n\" \"$name\" \"$count\"; done | sort -t' ' -k2 -rn",
  "description": "Lines of code per app"
}
```

**Output:**

```
=== APPS ===
web                       141687
account-success-mock      22186
desktop                   137
mobile                    132
local-monitor             119

```

---

## Assistant (Build · MiMo V2.5 Free · 6.8s)

_Thinking:_

The user is asking about total lines of code, but they mentioned that the code is different from the documentation. Let me provide them with the actual breakdown of the codebase.

**Tool: bash**

**Input:**

```json
{
  "command": "echo \"=== TOTAL LINES OF CODE ===\" && echo \"Services:  $(find /Users/nirmal/Github/integratewise-live/services -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' \\) -not -path '*/node_modules/*' -not -path '*/dist/*' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')\" && echo \"Packages:  $(find /Users/nirmal/Github/integratewise-live/packages -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' \\) -not -path '*/node_modules/*' -not -path '*/dist/*' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')\" && echo \"Apps:      $(find /Users/nirmal/Github/integratewise-live/apps -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' \\) -not -path '*/node_modules/*' -not -path '*/dist/*' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')\"",
  "description": "Summarize total LOC by area"
}
```

**Output:**

```
=== TOTAL LINES OF CODE ===
Services:  331114
Packages:  62422
Apps:      164261

```

---

## Assistant (Build · MiMo V2.5 Free · 6.9s)

_Thinking:_

The user wants the total lines of code. Let me add these up and give a clean summary.

**549,422 lines** of TS/JS across 1,197 source files.

| Area              | LOC     |
| ----------------- | ------- |
| **Services** (25) | 331,114 |
| **Packages** (21) | 62,422  |
| **Apps** (5)      | 164,261 |

**Top 10 by size:**

| Component            | LOC     |
| -------------------- | ------- |
| mcp-connector        | 143,082 |
| apps/web             | 141,687 |
| workflow             | 47,935  |
| knowledge            | 47,299  |
| connectors (pkg)     | 27,833  |
| account-success-mock | 22,186  |
| spine-v2             | 21,148  |
| admin                | 12,831  |
| types (pkg)          | 13,117  |
| think                | 9,932   |

---

## User

i did not ask the lines of code but from the code obtain the whole connectiity and derive the system i said

---

## Assistant (Build · MiMo V2.5 Free · 179.1s)

_Thinking:_

The user is asking me to analyze the actual codebase to understand the system connectivity and derive the architecture from the code itself, rather than relying on documentation. They want me to look at how services connect to each other, what APIs they expose, how data flows, etc.

Let me explore the codebase systematically to understand:

1. Service entry points and their routes/exports
2. How services communicate with each other
3. Database connections and data flow
4. Queue/message patterns
5. External API integrations
6. Authentication patterns

I should focus on:

- Service entry points (index.ts files)
- Route definitions
- Queue producers/consumers
- Database queries
- Import patterns showing inter-service communication
- Configuration files (wrangler.toml for bindings)

Let me start by examining key service entry points and their configurations.

I'll analyze the actual codebase to derive the real system connectivity. Let me trace the architecture from the code itself.

**Tool: task**

**Input:**

```json
{
  "description": "Analyze service entry points",
  "prompt": "Analyze the integratewise-live codebase to understand the real system connectivity. \n\n1. First, read the wrangler.toml files for each service to understand bindings (KV, D1, Queues, Durable Objects, etc.)\n2. Read the main index.ts entry points for each service to understand route handlers and exports\n3. Trace how services communicate - look for fetch calls, queue producers/consumers, shared imports\n\nFocus on these key services first:\n- services/pipeline/wrangler.toml and src/index.ts\n- services/connector/wrangler.toml and src/index.ts  \n- services/intelligence/wrangler.toml and src/index.ts\n- services/gateway/wrangler.toml and src/index.ts\n- services/think/wrangler.toml and src/index.ts\n- services/mcp-connector/wrangler.toml and src/index.ts\n\nFor each service, report:\n- What bindings it has (KV, D1, Queues, AI, Durable Objects)\n- What routes/handlers it exposes\n- What other services it calls or is called by\n- What queues it produces to or consumes from\n- What databases it reads/writes\n\nReturn a structured summary of findings.",
  "subagent_type": "explore"
}
```

**Output:**

```
task_id: ses_16f84fdbcffeDt2tDVhb3ascbs (for resuming to continue this task if needed)

<task_result>
Now I have all the data needed to compile a comprehensive structured summary. Here is the full analysis:

---

## IntegrateWise Live -- System Connectivity Analysis

### 1. SERVICE: `pipeline` (services/pipeline)

**Worker name:** `pipeline` (dev) / `pipeline-prod` (prod)
**File:** `/Users/nirmal/Github/integratewise-live/services/pipeline/wrangler.toml`
**Entry:** `/Users/nirmal/Github/integratewise-live/services/pipeline/src/index.ts`

**Consolidation:** Merges `normalizer` + `spine-v2` into one worker. This is the ONLY service with Supabase write credentials for the Spine.

**Bindings:**
| Type | Binding Name | Details |
|------|-------------|---------|
| D1 | `CACHE_DB` | `integratewise-spine-cache` (ed1f534a...) -- Edge Spine SSOT cache |
| KV | `CACHE` | Hot entity cache (18aa20df...), TTL 300s |
| KV | `SIGNAL_CACHE` | Signal cache (747166a3...) |
| KV | `METRICS` | Metrics (e80ee409...) |
| KV | `SCHEMA_CACHE` | Same ID as CACHE (18aa20df...) |
| AI Search | `AI_SEARCH` | Namespace: `default` -- Continuity Ledger |
| Queue Consumer | `pipeline-process` | Batch size 10, timeout 30s |
| Queue Consumer | `accelerator-trigger` | Batch size 10, timeout 30s |
| Queue Producer | `PIPELINE_QUEUE` -> `pipeline-process` | Self-loop |
| Queue Producer | `KNOWLEDGE_QUEUE` -> `knowledge-ingest` | |
| Queue Producer | `ACCELERATOR_QUEUE` -> `accelerator-trigger` | |
| Queue Producer | `INTELLIGENCE_QUEUE` -> `intelligence-events` | |
| Queue Producer | `DLQ_QUEUE` -> `ops-dlq` | |
| Queue Producer | `SIGNAL_QUEUE` -> `signals` | |
| Service | `SPINE` -> `pipeline` | Self-reference |
| Service | `BFF` -> `integratewise-bff` | |
| Service | `KNOWLEDGE` -> `integratewise-knowledge` | |
| Service | `MCP` -> `integratewise-mcp-connector` | |
| Service | `INTELLIGENCE` -> `integratewise-intelligence` | |

**Routes exposed:**
- `/health`
- `/api/v1/pipeline/spine/*` -- Spine entity CRUD
- `/api/v1/cognitive/spine/entities` -- Spine entity queries
- `/v1/spine/entities` -- Spine entity list
- `/v1/spine/signal` -- Signal write endpoint
- `/api/v1/db-proxy` -- Database proxy for other services
- `/v1/memory/write` -- Memory write-through to Supabase + D1 mirror

**Imports (code-level consolidation):**
- `import normalizerWorker from "../../normalizer/src/index"` -- Normalizer code compiled into this worker
- `import spineWorker from "../../spine-v2/src/index"` -- Spine code compiled into this worker

**Database access:**
- **D1 READ/WRITE:** `entity_cache`, `signal_cache`, `cross_data`, `decide_data`, `build_data`, `grow_data`, `run_data`, `entity360_cache`, `conversational_memory`, `org_memory`, `personal_memory`, `triage_results`, `document_chunks`, `search_history`, `session_containers`, `session_events`, `continuity_checkpoints`, `chunking_config`, `governance_data`
- **Supabase READ/WRITE:** `spine_schema_registry`, all canonical memory tables (via `createClient` with service role key)
- **KV READ/WRITE:** Entity cache (`entity:{tenant}:{type}:{id}`), Signal cache (`signal:{tenant}:{id}`)

---

### 2. SERVICE: `connector` (services/connector)

**Worker name:** `integratewise-connector` (dev) / `integratewise-connector-prod` (prod)
**File:** `/Users/nirmal/Github/integratewise-live/services/connector/wrangler.toml`
**Entry:** `/Users/nirmal/Github/integratewise-live/services/connector/src/index.ts`

**Consolidation:** Merges `loader` + `mcp-connector` + `store` into one worker.

**Bindings:**
| Type | Binding Name | Details |
|------|-------------|---------|
| D1 | `EDGE_DB` | `integratewise-spine-cache` (ed1f534a...) -- shared DB |
| KV | `MCP_IDEMPOTENCY` | MCP idempotency (16510bf2...) |
| KV | `CONNECTOR_STATUS` | Shared connector status (f7a3d773...) |
| R2 | `FILES` | `integratewise-files-prod` |
| Queue Producer | `PIPELINE_QUEUE` -> `pipeline-process` | |
| Queue Producer | `KNOWLEDGE_QUEUE` -> `knowledge-ingest` | |
| Service | `MCP` -> `integratewise-mcp-connector` | |
| Service | `KNOWLEDGE` -> `integratewise-knowledge` | |
| Service | `CONNECTOR_SYNC` -> `integratewise-connector-sync` | |
| Secrets | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `TOKEN_ENCRYPTION_KEY`, `GITHUB_TOKEN`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `VERCEL_TOKEN`, `XAI_API_KEY`, `OPENROUTER_API_KEY`, `OPENCODE_API_KEY` | Via Cloudflare Secrets Store |

**Routes exposed:**
- `/health` and `/` -- Health check
- `/api/v1/connector/*` -- MCP tool server, connector catalog, sync, OAuth, execute
- `/api/v1/loader/*` -- Rewritten to `/internal/*` (Loader routes)
- `/nango/webhook` -- Nango webhook receiver
- `/tools/*`, `/invoke`, `/sessions/*`, `/config/*`, `/v1/mcp/*` -- MCP tool server
- `/files/*`, `/upload/*` -- File storage (Store)
- `/api/v1/connector/execute` -- Action write-back (POST)
- Cron: `scheduled()` triggers loader's 5-minute connector polling

**Imports (code-level consolidation):**
- `import loaderWorker from "../../loader/src/index"` -- Loader code compiled in
- `import mcpApp from "../../mcp-connector/src/index"` -- MCP connector compiled in
- `import storeApp from "../../store/src/index"` -- Store compiled in

**Inter-service calls:**
- Calls `env.PIPELINE_QUEUE.send(...)` to push action results back into the pipeline
- Calls `loaderWorker.fetch(...)` for loader routes
- Calls `mcpApp.fetch(...)` for MCP routes
- Calls `storeApp.fetch(...)` for file routes

---

### 3. SERVICE: `intelligence` (services/intelligence)

**Worker name:** `intelligence` (dev) / `intelligence-prod` (prod)
**File:** `/Users/nirmal/Github/integratewise-live/services/intelligence/wrangler.toml`
**Entry:** `/Users/nirmal/Github/integratewise-live/services/intelligence/src/index.ts`

**Consolidation:** Merges `think` + `act` + `govern` + `agents` + `cognitive-brain` into one worker.

**Bindings:**
| Type | Binding Name | Details |
|------|-------------|---------|
| D1 | `D1` | `integratewise-spine-cache` (ed1f534a...) |
| Vectorize | `VECTOR_INDEX` | `intelligence-embeddings` |
| AI | `AI` | Workers AI binding |
| AI Search | `AI_SEARCH` | Namespace: `78ab8312-64c9-4a95-a556-3e69e8e64008` |
| Queue Consumer | `intelligence-events` | Batch size 10 |
| Queue Consumer | `intelligence-act` | Batch size 10 |
| Queue Consumer | `ops-dlq` | Batch size 10 |
| Queue Consumer | `signals` | Batch size 10 |
| Queue Producer | `PIPELINE_QUEUE` -> `pipeline-process` | |
| Queue Producer | `OPS_DLQ_QUEUE` -> `ops-dlq` | |
| Workflow | `TRIAGE_WORKFLOW` -> `TriageWorkflow` | Cloudflare Durable Workflow |
| Service | `CONNECTOR` -> `integratewise-connector` | |
| Service | `WORKFLOW` -> `integratewise-bff` | |
| Service | `KNOWLEDGE` -> `integratewise-knowledge` | |
| Service | `PIPELINE` -> `integratewise-pipeline` | |
| Service | `GOVERN` -> `intelligence` (self) | |
| Secrets | `GITHUB_TOKEN`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `OPENROUTER_API_KEY`, `OPENCODE_API_KEY` | |

**Routes exposed:**
- `/health`
- `/act/*` -- Action execution (routed to `actApp`)
- `/policies/*`, `/approve/*`, `/audit/*`, `/govern/*`, `/v1/proposals/*` -- Governance (routed to `governApp`)
- `/v1/memory/*` -- Memory reads/writes (personal, conversational, org, episodes, learnings, proposals, stats)
- `/v1/ops/*` -- Ops sync status, metrics
- `/v1/swarm/*` -- Bulk data cleanup
- `/v1/triage/*` -- Autonomous triage workflow submission
- `/v1/knowledge/*` -- Knowledge reads (org memory, signals)
- `/colony/*`, `/agents/*` -- Agent colony (routed to `agentsApp`)
- `/v1/cognitive/*`, `/v1/brainstorm`, `/v1/decisions/*`, `/v1/trust/*`, `/v1/simulation/*`, `/v1/drift/*`, `/v1/twin/*`, `/v1/insights/*` -- Cognitive brain routes
- `/v1/memory/evolution` -- Evolutionary memory ingestion
- `/v1/memory/kanban-snapshot` -- Kanban state capture

**Imports (code-level consolidation):**
- `import thinkWorker from "../../think/src/index"` -- Think code compiled in
- `import cognitiveBrain from "../../think/src/cognitive-brain"` -- Cognitive brain
- `import actApp from "../../act/src/index"` -- Act code compiled in
- `import governApp from "../../govern/src/index"` -- Govern code compiled in

**Queue processing:**
- `signals` queue: Analyzes signals, runs TypeScript SignalAnalyzer, creates governed proposals, routes to HITL
- `intelligence-events` queue: Delegates to `thinkWorker.queue()`
- `intelligence-act` queue: Routes to `actApp` for approved action execution
- `ops-dlq` queue: Routes to `governApp` for governance review

**Inter-service calls:**
- `env.PIPELINE.fetch("http://pipeline/v1/spine/signal", ...)` -- Stores signals in Spine via Pipeline
- `env.WORKFLOW.fetch("http://workflow/hitl/create", ...)` -- Registers HITL via BFF
- `governApp.fetch(...)` -- Internal governance calls (proposals, policy checks)
- `actApp.fetch(...)` -- Internal action execution

---

### 4. SERVICE: `gateway` (services/gateway)

**Worker name:** `gateway` (dev) / `gateway-prod` (prod)
**File:** `/Users/nirmal/Github/integratewise-live/services/gateway/wrangler.toml`
**Entry:** `/Users/nirmal/Github/integratewise-live/services/gateway/src/index.ts`

**Role:** SINGLE ENTRY POINT for ALL external requests. JWT validation, tenant isolation, rate limiting, CORS, webhook signature verification.

**Bindings:**
| Type | Binding Name | Details |
|------|-------------|---------|
| AI | `AI` | Workers AI binding |
| KV | `RATE_LIMITS` | Rate limiting (8f61d841...) |
| KV | `SESSIONS` | Session cache (508ba759...) |
| KV | `CONNECTOR_STATUS` | Shared (f7a3d773...) |
| KV | `SIGNAL_CACHE` | Shared (747166a3...) |
| KV | `METRICS` | Shared (e80ee409...) |
| KV | `OAUTH_STATE_KV` | OAuth state (d610b2da...) |
| Service | `PIPELINE` -> `pipeline-dev` | |
| Service | `INTELLIGENCE` -> `intelligence-dev` | |
| Service | `CONNECTOR` -> `integratewise-connector` | |
| Service | `CONNECTOR_SYNC` -> `integratewise-connector-sync` | |
| Service | `KNOWLEDGE` -> `integratewise-knowledge` | |
| Service | `BFF` -> `integratewise-bff` | |
| Service | `L2` -> `integratewise-l2` | |
| Service | `WEBHOOK_INGRESS` -> `integratewise-webhook-ingress` | |
| Service | `FOLDER_WATCHER` -> `integratewise-folder-watcher` | |
| Secrets | 30+ OAuth client secrets, webhook secrets | HubSpot, Salesforce, GitHub, Stripe, Razorpay, Slack, Notion, Asana, Linear, Jira, Zendesk, Intercom, Zoho |

**Routes exposed:**
- `/health` -- Health check
- `/health/ready` -- Probes all downstream services
- `/metrics/signals` -- Signal metrics dashboard
- `auth.integratewise.*` -- OAuth Authorization Server (well-known, JWKS, authorize, token)
- `mcp.integratewise.*` -- Protected Resource Server (MCP with JWT verification)

**Route table (Gateway -> downstream):**
| Path Prefix | Target |
|-------------|--------|
| `/api/v1/billing` | INTERNAL_BILLING (billing service) |
| `/api/v1/tenants` | INTERNAL_TENANTS (tenants service) |
| `/api/v1/support` | INTERNAL_SUPPORT |
| `/api/v1/analytics` | BFF |
| `/api/v1/agents` | INTELLIGENCE |
| `/api/v1/connectors` | CONNECTOR |
| `/api/v1/connector` | CONNECTOR |
| `/api/v1/loader` | CONNECTOR |
| `/api/v1/pipeline` | PIPELINE |
| `/api/v1/intelligence` | INTELLIGENCE |
| `/api/v1/cognitive/spine` | PIPELINE |
| `/api/v1/cognitive/entity360` | PIPELINE |
| `/api/v1/entity360` | PIPELINE |
| `/api/v1/identity` | PIPELINE |
| `/api/v1/cognitive/evidence` | BFF |
| `/api/v1/cognitive/memories` | KNOWLEDGE |
| `/api/v1/cognitive/signals` | INTELLIGENCE |
| `/api/v1/cognitive/think` | INTELLIGENCE |
| `/api/v1/cognitive/act` | INTELLIGENCE |
| `/api/v1/cognitive/govern` | INTELLIGENCE |
| `/api/v1/cognitive/context-to-truth` | INTELLIGENCE |
| `/api/v1/cognitive/hitl` | BFF |
| `/api/v1/brainstorm` | INTELLIGENCE |
| `/api/v1/knowledge` | KNOWLEDGE |
| `/api/v1/workspace` | BFF |
| `/api/v1/cognitive/twin` | INTELLIGENCE |
| `/api/v1/cognitive/insights` | INTELLIGENCE |
| `/api/v1/cognitive/audit` | BFF |
| `/api/v1/cognitive/agents` | INTELLIGENCE |
| `/api/v1/cognitive/memory` | KNOWLEDGE |
| `/api/v1/cognitive/truth` | KNOWLEDGE |
| `/api/v1/cognitive/projects` | KNOWLEDGE |
| `/api/v1/cognitive/status` | KNOWLEDGE |
| `/api/v1/l2` | L2 |
| `/ws`, `/sse`, `/stream` | BFF |
| `/admin` | INTERNAL_ADMIN (embedded) |
| `/oauth` | INTERNAL_TENANTS (embedded) |
| `/webhooks/*` | WEBHOOK_INGRESS |

**Embedded services (compiled in):**
- `import adminApp from "../../admin/src/index"`
- `import billingApp from "../../billing/src/index"`
- `import tenantsApp from "../../tenants/src/index"`

---

### 5. SERVICE: `knowledge` (services/knowledge)

**Worker name:** `integratewise-knowledge` (dev) / `integratewise-knowledge-prod` (prod)
**File:** `/Users/nirmal/Github/integratewise-live/services/knowledge/wrangler.toml`

**Bindings:**
| Type | Binding Name | Details |
|------|-------------|---------|
| D1 | `DB` | `integratewise-spine-cache` (ed1f534a...) |
| R2 | `FILES` | `integratewise-files-prod` |
| KV | `STATE` | Consolidator state (d546c00b...) |
| AI | `AI` | Workers AI |
| Vectorize | `VECTORIZE_INDEX` | `intelligence-embeddings` |
| Durable Object | `CONSOLIDATOR` | `MemoryConsolidator` class |
| Queue Consumer | `knowledge-ingest` | Batch size 10 |
| Queue Consumer | `memory-consolidation-tasks` | Batch size 5 |
| Queue Producer | `TASKS_QUEUE` -> `memory-consolidation-tasks` | |
| Service | `MCP` -> `integratewise-mcp-connector` | |
| Service | `PIPELINE` -> `integratewise-pipeline` | |
| Service | `THINK` -> `integratewise-intelligence` | |
| Service | `IQ_HUB` -> `integratewise-knowledge` (self) | |

---

### 6. SERVICE: `connector-sync` (services/connector-sync)

**Worker name:** `integratewise-connector-sync`
**File:** `/Users/nirmal/Github/integratewise-live/services/connector-sync/wrangler.toml`

**Bindings:**
| Type | Binding Name | Details |
|------|-------------|---------|
| KV | `CONNECTOR_STATUS` | Shared (f7a3d773...) |
| Queue Consumer | `connector-sync` | Batch size 10 |
| Queue Producer | `SYNC_QUEUE` -> `connector-sync` | Self-loop |
| Service | `CONNECTOR` -> `integratewise-connector` | |

---

### 7. SERVICE: `webhook-ingress` (services/webhook-ingress)

**Worker name:** `integratewise-webhook-ingress`
**File:** `/Users/nirmal/Github/integratewise-live/services/webhook-ingress/wrangler.toml`

**Bindings:**
| Type | Binding Name | Details |
|------|-------------|---------|
| KV | `CONNECTOR_STATUS` | Shared (f7a3d773...) |
| Queue Producer | `PIPELINE_QUEUE` -> `pipeline-process` | |
| Service | `MCP` -> `integratewise-mcp-connector` | |
| Service | `BFF` -> `integratewise-bff` | |
| Service | `CONNECTOR` -> `integratewise-connector` | |
| Service | `FOLDER_WATCHER` -> `integratewise-folder-watcher` | |
| Custom Domain | `ingress.integratewise.ai` | |

---

### 8. SERVICE: `continuity` (services/continuity)

**Worker name:** `integratewise-continuity`
**File:** `/Users/nirmal/Github/integratewise-live/services/continuity/wrangler.toml`

**Bindings:**
| Type | Binding Name | Details |
|------|-------------|---------|
| D1 | `DB` | `integratewise-spine-cache` (ed1f534a...) |
| Queue Producer | `TASKS_QUEUE` -> `continuity-triage` | |
| Cron | `0 */6 * * *` | TTL cleanup every 6 hours |
| Service | `KNOWLEDGE` -> `integratewise-knowledge` | |
| Service | `MCP_CONNECTOR` -> `integratewise-mcp-connector` | |
| Service | `PIPELINE` -> `integratewise-pipeline` | |

---

## GLOBAL CONNECTIVITY MAP

### Shared Cloudflare Resources (All Services)

| Resource | Binding Name | ID | Used By |
|----------|-------------|-----|---------|
| **D1 Database** | `integratewise-spine-cache` | `ed1f534a-df1e-4783-8a74-8d6d70d067ff` | pipeline, connector, intelligence, knowledge, continuity, webhook-ingress, mcp-connector, govern |
| **KV: CACHE** | Hot entity cache | `18aa20dfeb304f0ba592d9070964dd31` | pipeline |
| **KV: SIGNAL_CACHE** | Signal cache | `747166a3165444d1a9c9c8c54abbd93a` | pipeline, gateway, normalizer |
| **KV: METRICS** | Metrics | `e80ee409f5be4bf8a9556c0917c113e2` | pipeline, gateway, normalizer |
| **KV: CONNECTOR_STATUS** | Shared connector status | `f7a3d773ff2841f7954d3cfeae82594f` | connector, connector-sync, webhook-ingress, gateway |
| **KV: MCP_IDEMPOTENCY** | MCP idempotency | `16510bf2287a45d8b24163ddafd3d302` | connector, mcp-connector |
| **KV: RATE_LIMITS** | Rate limiting | `8f61d841d2574061ac1d547187d72a58` | gateway |
| **KV: SESSIONS** | Session cache | `508ba759f7a44ca8aaaf8502d603077b` | gateway |
| **KV: OAUTH_STATE_KV** | OAuth state | `d610b2da55bf437ba90444f93077e1c6` | gateway |
| **KV: STATE** | Consolidator state | `d546c00b8ee84d0497e4a4b3ac661db8` | knowledge |
| **R2: FILES** | `integratewise-files-prod` | -- | connector, knowledge, store |
| **Vectorize** | `intelligence-embeddings` | -- | intelligence, knowledge |

### Queue Flow Diagram

```

                    ┌──────────────────────────────────────────┐
                    │            QUEUE: pipeline-process         │
                    │   Producers: pipeline, connector,         │
                    │              mcp-connector, webhook-       │
                    │              ingress, act, normalizer      │
                    │   Consumer:  pipeline                      │
                    └──────────────────┬───────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────────┐
                    │          8-STAGE NORMALIZATION PIPELINE    │
                    │          (services/pipeline)               │
                    └──────┬──────────┬───────────┬────────────┘
                           │          │           │
            ┌──────────────┘          │           └──────────────┐
            ▼                         ▼                          ▼

┌─────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐
│
</task_result>

````

**Tool: task**

**Input:**
```json
{
  "description": "Analyze queue and data flow",
  "prompt": "Analyze the integratewise-live codebase to trace queue-based communication and data flow patterns.\n\n1. Search for all queue producer and consumer patterns across the codebase:\n   - grep for `queue.send`, `queue.batchSend`, `env.*_QUEUE`, `messageQueue`, `createQueue`\n   - grep for `queue()`, `handleQueue`, `queueHandler` in service entry points\n\n2. Search for inter-service HTTP calls:\n   - grep for `fetch(` patterns that call other worker URLs\n   - grep for patterns like `integratewise-*.workers.dev`\n\n3. Search for shared state patterns:\n   - grep for KV get/put operations to understand caching\n   - grep for D1 batch/exec operations\n   - grep for Supabase client usage\n\n4. Look at the packages that are shared between services:\n   - Read packages/types/src/ to understand shared contracts\n   - Read packages/lib/src/ to understand shared utilities\n   - Read packages/api/src/ to understand API patterns\n\nReturn a detailed map of:\n- Which services produce to which queues\n- Which services consume from which queues\n- What data flows through each queue\n- What shared state exists",
  "subagent_type": "explore"
}
````

**Output:**

```
task_id: ses_16f84f1eaffep5h37iw2gXTwAZ (for resuming to continue this task if needed)

<task_result>
Now I have enough data to compile the complete map. Here is the detailed analysis:

---

# IntegrateWise Queue-Based Communication & Data Flow Map

## 1. CLOUDFLARE QUEUES — DEFINITION MAP

There are **10 distinct Cloudflare Queues** defined across the codebase:

| Queue Name | Purpose |
|---|---|
| `pipeline-process` | Core 8-stage normalization pipeline messages |
| `accelerator-trigger` | Triggers metric computation from spine data |
| `knowledge-ingest` | Document/session embeddings and knowledge ingestion |
| `intelligence-events` | Data change events and intelligence signals |
| `signals` | High-fidelity signals for Twin cognition |
| `ops-dlq` | Operations dead-letter queue (failed governance) |
| `connector-sync` | Sync jobs for multi-provider connector sync |
| `intelligence-act` | HITL-approved actions queued for execution |
| `memory-consolidation-tasks` | Periodic memory consolidation (hourly/daily/weekly) |
| `execution-outcomes` | Hermes async execution outcomes |
| `continuity-triage` | Async triage promotion from continuity service |
| `dead-letter` (DEAD_LETTER_QUEUE) | Loader-level dead letters |

---

## 2. QUEUE PRODUCER → CONSUMER MAP

### Queue: `pipeline-process`
**Binding:** `PIPELINE_QUEUE`

| Producer | File | Data Flow |
|---|---|---|
| **webhook-ingress** | `services/webhook-ingress/src/index.ts:523` | Raw webhook payloads (Nango, Stripe, etc.) enter at stage "analyze" |
| **connector** (loader path) | `services/connector/src/index.ts:168` | Extracted provider records enter at stage "analyze" |
| **connector** (sync-consumer path) | `services/connector/src/sync-consumer.ts:118` | Sync messages transformed to pipeline messages at stage "analyze" |
| **folder-watcher** | `services/folder-watcher/src/index.ts:71` | Filesystem events enter at stage "analyze" |
| **mcp-connector** | `services/mcp-connector/wrangler.toml:81` | MCP tool invocations that produce pipeline data |
| **intelligence** (triage workflow) | `services/intelligence/src/workflows/triage-workflow.ts:83` | Triage-approved writes routed to spine |
| **normalizer** (DEPRECATED) | `services/normalizer/src/index.ts:298` | Self-re-enqueue between stages (stage advancement) |
| **pipeline** (self-re-enqueue) | `services/pipeline/src/index.ts:2205` | Delegates to normalizer worker for stage processing |

**Consumer:**
- **pipeline** (`services/pipeline/src/index.ts:2151`) — THE SOLE CONSUMER. Routes to normalizer worker for 8-stage processing (S1 analyze → S2 classify → S3 filter → S4 refine → S5 extract → S6 validate → S7 sanity → S8 sectorize). Each stage re-enqueues to `PIPELINE_QUEUE` with the next stage.

**Message shape:** `PipelineQueueMessage` — `{ stage, source, source_type, tenant_id, payload: { _entity_type, _source_id, _tenant_id, ...fields }, metadata: { trace_id, attempt, received_at } }`

---

### Queue: `accelerator-trigger`
**Binding:** `ACCELERATOR_QUEUE`

| Producer | Data Flow |
|---|---|
| **pipeline/normalizer** (S8 completion) | `{ type: "spine_write", tenant_id, entity_count, trace_id }` |

**Consumer:**
- **pipeline** (`services/pipeline/src/index.ts:2158`) — Fetches recent spine data, computes entity metrics, emits `accelerator_result` to `intelligence-events` queue.

---

### Queue: `knowledge-ingest`
**Binding:** `KNOWLEDGE_QUEUE`

| Producer | File | Data Flow |
|---|---|---|
| **pipeline/normalizer** (S5 extract) | `services/normalizer/src/index.ts:576` | Extracted text content for embedding: `{ tenant_id, source_type: "pipeline_extract", content, correlation_id }` |
| **pipeline/normalizer** (final write) | `services/normalizer/src/index.ts:1067-1095` | Session summaries, tool calls, memories from MCP capture |
| **connector** (mcp-connector path) | `services/connector/src/index.ts` | MCP session data for knowledge ingestion |
| **mcp-connector** | `services/mcp-connector/wrangler.toml:75` | Session captures and document uploads |
| **normalizer-accelerator** | `services/normalizer/src/normalizer-accelerator.ts:243` | Knowledge payloads from creamy accelerator |

**Consumer:**
- **knowledge** (`services/knowledge/src/index.ts:2028`) — Processes document chunks, generates embeddings, stores in Neon (knowledge_documents), handles session embedding (Flow C — AI Chat Results).

---

### Queue: `intelligence-events`
**Binding:** `INTELLIGENCE_QUEUE`

| Producer | File | Data Flow |
|---|---|---|
| **pipeline/normalizer** (S8 completion) | `services/normalizer/src/index.ts:1224` | `{ type: "data_change", tenant_id, entities, source, trace_id, timestamp }` |
| **pipeline** (accelerator result) | `services/pipeline/src/index.ts:2174` | `{ type: "accelerator_result", tenant_id, entity_count, metrics, computed_at }` |

**Consumer:**
- **intelligence** (`services/intelligence/src/index.ts:277`) — Routes data_change events to Think worker for cognitive processing.

---

### Queue: `signals`
**Binding:** `SIGNAL_QUEUE`

| Producer | File | Data Flow |
|---|---|---|
| **pipeline/normalizer** (S8 completion) | `services/normalizer/src/index.ts:1192` | Signal objects: `{ signal_id, workspace_id, spine_id, entity_type, hydration_bucket, domain_schema, payload: { spine_snapshot, ai_analysis } }` |

**Consumer:**
- **intelligence** (`services/intelligence/src/index.ts:280`) — Processes signals through TypeScript-native SignalAnalyzer for B5-B7 signal-ready buckets. Creates governed proposals for actions requiring approval. Stores signals in Supabase for dashboard.

---

### Queue: `ops-dlq`
**Binding:** `OPS_DLQ_QUEUE` / `DLQ_QUEUE`

| Producer | File | Data Flow |
|---|---|---|
| **pipeline/normalizer** (failures) | `services/normalizer/src/index.ts:323,349` | Failed pipeline messages with error context |
| **intelligence** (triage workflow) | `services/intelligence/src/workflows/triage-workflow.ts:69` | Failed governance evaluations |
| **intelligence** (twin-orchestrator) | `services/intelligence/src/agents/specialized/twin-orchestrator.ts:145` | Orchestrator failures |

**Consumer:**
- **intelligence** (`services/intelligence/wrangler.toml:84-86`) — Consumes DLQ for operational monitoring and retry decisions.

---

### Queue: `connector-sync`
**Binding:** `SYNC_QUEUE`

| Producer | File | Data Flow |
|---|---|---|
| **connector-sync** | `services/connector-sync/src/index.ts:429,559,696,712` | `SyncQueueMessage`: `{ message_version, tenant_id, provider, entity_types, phase: "creamy"|"full"|"delta", cursor, job_id, attempt }` |
| **connector** (sync-producer) | `services/connector/src/sync-producer.ts:122` | `SyncMessageEnvelope`: `{ tenant_id, sync_type, accelerator_id, connector_id, plan_tier, payload, schema_context }` |

**Consumer:**
- **connector-sync** (`services/connector-sync/src/index.ts:806`) — Processes sync jobs: calls provider APIs, transforms records, sends to pipeline. Self-consumes (producer and consumer on same worker).

---

### Queue: `intelligence-act`
**Binding:** `ACT_QUEUE`

| Producer | File | Data Flow |
|---|---|---|
| **workflow/BFF** (HITL approval) | `services/workflow/src/index.ts:827` | `{ action_id, tenant_id, action_type, target_tool, payload, approval_token }` |

**Consumer:**
- **intelligence** (`services/intelligence/wrangler.toml:79-81`) — Consumes approved actions for execution via Act worker.

---

### Queue: `memory-consolidation-tasks`
**Binding:** `TASKS_QUEUE`

| Producer | File | Data Flow |
|---|---|---|
| **knowledge** (triage approval) | `services/knowledge/src/index.ts:425` | `{ type: "immediate_consolidation", tenant_id, triage_id, priority }` |
| **knowledge** (auto-approve) | `services/knowledge/src/index.ts:1512` | `{ type: "immediate_consolidation", tenant_id, session_id, trigger }` |
| **knowledge** (memory-consolidator) | `services/knowledge/src/memory-consolidator.ts:236,320` | `{ type: "hourly"|"daily"|"weekly", tenant_id, start_time, end_time }` |
| **continuity** (session close) | `services/continuity/src/index.ts:252` | `{ type: "session_ready_for_triage", tenant_id, session_id, event_count }` |
| **continuity** (session events) | `services/continuity/src/index.ts:483` | Session event data for triage |

**Consumer:**
- **knowledge/memory-consolidator** (`services/knowledge/src/memory-consolidator.ts:342`) — Processes consolidation tasks at hourly/daily/weekly granularity. Groups sessions by topic/user/account, generates summaries via Think service, stores consolidated memories.

---

### Queue: `execution-outcomes`
**Binding:** `OUTCOMES_QUEUE`

| Producer | File | Data Flow |
|---|---|---|
| **hermes** (executor) | `services/hermes/src/executor.ts:368` | `{ type: "execute_task", task_id, tenant_id, payload, approval_token }` |

**Consumer:**
- **hermes** (`services/hermes/wrangler.toml:67-68`) — Self-consumes for async execution outcome processing.

---

### Queue: `continuity-triage`
**Binding:** `TASKS_QUEUE` (continuity)

| Producer | File |
|---|---|
| **continuity** | `services/continuity/wrangler.toml:36-37` |

**Consumer:** Not explicitly declared in wrangler.toml — likely consumed by knowledge service via service binding.

---

### Queue: `dead-letter`
**Binding:** `DEAD_LETTER_QUEUE`

| Producer | File | Data Flow |
|---|---|---|
| **loader** (webflow handler) | `services/loader/src/handlers/webflow.ts:267` | Failed webhook payloads |
| **loader** (stripe handler) | `services/loader/src/handlers/stripe.ts:98` | Failed Stripe events |
| **loader** (hubspot handler) | `services/loader/src/handlers/hubspot.ts:115` | Failed HubSpot events |
| **loader** (enhanced-stripe) | `services/loader/src/handlers/enhanced-stripe.ts:187` | Failed enhanced Stripe events |

**Consumer:** Not declared in any wrangler.toml — appears to be a fallback/monitoring queue.

---

## 3. INTER-SERVICE HTTP CALLS (Service Bindings)

All inter-service communication within Cloudflare uses **service bindings** (not external HTTP). The key call graph:

```

gateway ──→ pipeline, intelligence, connector, connector-sync, knowledge, bff, l2, webhook-ingress, folder-watcher
pipeline ──→ pipeline (self), bff, knowledge, mcp-connector, intelligence
intelligence ──→ connector, bff/workflow, knowledge, pipeline, intelligence/govern
knowledge ──→ mcp-connector, pipeline, intelligence/think, knowledge (self), tenants
connector ──→ mcp-connector, knowledge, connector-sync
mcp-connector ──→ knowledge, continuity, pipeline
continuity ──→ knowledge, mcp-connector, pipeline
hermes ──→ pipeline, knowledge, intelligence/think, intelligence/act, continuity, bff/workflow
workflow/bff ──→ pipeline, connector, knowledge, intelligence/think, intelligence/act
folder-watcher ──→ (PIPELINE_QUEUE only)
webhook-ingress ──→ mcp-connector, bff, connector, folder-watcher, (PIPELINE_QUEUE)

```

External HTTP calls (non-service-binding):
- **mcp-connector** → `integratewise-intelligence.connect-a1b.workers.dev` (fallback URL)
- **hermes** → n8n VPS at `http://<N8N_VPS_HOST>:5678` (workflow execution)

---

## 4. SHARED STATE — KV NAMESPACES

| KV Binding | Namespace ID | Purpose | Consumers |
|---|---|---|---|
| `CACHE` | `18aa20dfeb304f0ba592d9070964dd31` | Hot entity cache (TTL 60-300s) | pipeline, spine-v2 |
| `SIGNAL_CACHE` | `747166a3165444d1a9c9c8c54abbd93a` | Signal cache (TTL 3600s) | normalizer, intelligence, gateway |
| `METRICS` | `e80ee409f5be4bf8a9556c0917c113e2` | Pipeline metrics (TTL 86400s) | normalizer, gateway |
| `CONNECTOR_STATUS` | `f7a3d773ff2841f7954d3cfeae82594f` | Connector status + tenant mappings | webhook-ingress, connector-sync, loader, workflow, tenants, gateway |
| `MCP_IDEMPOTENCY` | `16510bf2287a45d8b24163ddafd3d302` | MCP idempotency checks | mcp-connector, loader |
| `RATE_LIMITS` / `RATE_LIMIT` | `8f61d841d2574061ac1d547187d72a58` | Rate limiting | gateway, workflow/stream-gateway, hermes |
| `SESSIONS` | `508ba759f7a44ca8aaaf8502d603077b` | OAuth session cache | gateway |
| `EXECUTION_META` | `194227e14a9844b896cebe6564af3ec1` | Execution metadata + workflow mappings | hermes |
| `STATE` | `d546c00b8ee84d0497e4a4b3ac661db8` | Memory consolidator state (last run times) | knowledge/memory-consolidator |
| `OAUTH_STATE_KV` | `d610b2da55bf437ba90444f93077e1c6` | OAuth state parameter storage | tenants |
| `CONNECTION_META` | `39608aa63c5340bf953575dec34416ed` | WebSocket connection metadata | workflow/stream-gateway |
| `SCHEMA_CACHE` | `18aa20dfeb304f0ba592d9070964dd31` | Schema cache (shares CACHE namespace) | pipeline |

---

## 5. SHARED STATE — D1 DATABASES

| D1 Binding | Database | Tables Used | Services |
|---|---|---|---|
| `CACHE_DB` / `EDGE_DB` / `DB` / `D1` | `integratewise-spine-cache` (ed1f534a) | entity360_cache, org_memory, personal_memory, conversational_memory, sync_checkpoints, pipeline_quarantine, agent_registry, session_containers, events, beliefs, observations | pipeline, intelligence, knowledge, connector, mcp-connector, think, continuity, normalizer, govern, agent-registry |
| `ANALYTICS_DB` | `integratewise-analytics` (b829f7b0) | Analytics tables | workflow/bff |

All services share the **same D1 database** (`integratewise-spine-cache`) but use different table subsets.

---

## 6. SHARED STATE — SUPABASE

Supabase (integratewise-4a649) is accessed by many services via REST API (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`):

| Service | Tables Accessed |
|---|---|
| **pipeline** | spine entities via PostgREST |
| **mcp-connector** | conversational_memory, org_memory, personal_memory, episodes, primitives, tenant_spine_config |
| **continuity** | memory.session_containers, memory.conversational_memory (via supabase.ts helper) |
| **knowledge** | consolidated_memories, triage_results, knowledge_documents (via Neon DATABASE_URL) |
| **intelligence** | signals, actions, proposals, decision_memory |
| **workflow/bff** | actions, proposals, decision_memory |
| **think** | entity360_cache, signals, various Spine tables |
| **tenants** | profiles, connectors (OAuth callback handling) |
| **gateway** | profiles (auth resolution) |
| **connector-sync** | tenant_spine_config, connectors |

---

## 7. SHARED STATE — R2

| R2 Bucket | Binding | Services |
|---|---|---|
| `integratewise-files-prod` | `FILES` | connector, knowledge, loader/normalizer |

---

## 8. SHARED PACKAGES

| Package | Purpose | Used By |
|---|---|---|
| `packages/types/` | Shared Zod & TypeScript contracts: PipelineQueueMessage, SyncQueueMessage, SignalAnalyzeRequest/Response, Proposal, OrchestrationTask, MorningContext, ConnectorStatus, Schema definitions | All services |
| `packages/lib/` | Adapters (Neon, normalizers, OpenRouter SDK), correlation IDs, logging, crypto, circuit breaker, DB gate, outbox pattern | All services |
| `packages/connector-contracts/` | BaseConnector abstract class, ConnectorMetadata, SyncResult, ResilienceConfig, CircuitStatus | connector, connector-sync, all 30+ connector adapters |
| `packages/connector-utils/` | Shared connector utilities | connector, connector-sync |
| `packages/connectors/` | 30+ connector adapters (HubSpot, Salesforce, Jira, etc.) | connector |
| `packages/supabase/` | Cross-platform Supabase client (Web, React Native, Desktop) | Frontend apps |
| `packages/api/` | Legacy Hono API with entities CRUD, AI commands | Legacy frontend |
| `packages/config/` | Runtime config helpers, feature flags, env validation | All services |
| `packages/rbac/` | Role-based access control | gateway, tenants |
| `packages/tenancy/` | Tenant isolation utilities | gateway, tenants |
| `packages/analytics/` | Analytics utilities | workflow/bff |
| `packages/accelerators/` | Sync accelerator contracts | connector, connector-sync |
| `packages/hermes-spine-memory/` | Hermes ↔ Spine memory bridge | hermes |
| `packages/db/` | Database utilities | api, knowledge |

---

## 9. DATA FLOW DIAGRAM (End-to-End)

```

                        EXTERNAL SOURCES
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    Webhook Events      Provider APIs      Filesystem
    (Nango/Stripe)      (HubSpot/Jira)     (Folder Watcher)
          │                   │                   │
          ▼                   ▼                   ▼
    ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
    │  webhook-    │   │  connector  │   │ folder-      │
    │  ingress     │   │  (loader)   │   │ watcher      │
    └──────┬──────┘   └──────┬──────┘   └──────┬───────┘
           │                  │                  │
           │    ┌─────────────┤                  │
           │    │             │                  │
           ▼    ▼             ▼                  │
    ┌─────────────────────────────────────┐      │
    │        PIPELINE_QUEUE               │◄─────┘
    │  (pipeline-process)                 │
    │                                     │
    │  Consumer: pipeline (SOLE)          │
    │  ┌─────────────────────────────┐    │
    │  │ S1 analyze → S2 classify   │    │
    │  │ → S3 filter → S4 refine    │    │
    │  │ → S5 extract → S6 validate │    │
    │  │ → S7 sanity → S8 sectorize │    │
    │  └─────────────────────────────┘    │
    └──┬──────┬──────┬──────┬──────┬─────┘
       │      │      │      │      │
       │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼
    ┌──────┐ ┌────┐ ┌────┐ ┌────┐ ┌──────────┐
    │SIGNAL│ │INTEL│ │ACCEL│ │DLQ│ │KNOWLEDGE │
    │QUEUE │ │QUEUE│ │QUEUE│ │   │ │_INGEST   │
    └──┬───┘ └─┬──┘ └─┬──┘ └─┬─┘ └────┬─────┘
       │       │      │      │         │
       ▼       ▼      ▼      ▼         ▼

┌────────┐┌──────┐┌──────┐┌──────┐┌──────────┐
│intelli-││intell││intell││intell││ knowledge │
│gence ││igence││igence││igence││ (KB+embed)│
│(signals)│(events)│(accel)│(ops-dlq)│ │
└───┬────┘└──┬───┘└──┬───┘└──────┘└─────┬────┘
│ │ │ │
▼ ▼ ▼ ▼
┌──────────────────────┐ ┌──────────────┐
│ Intelligence Service │ │ Neon DB │
│ (Think+Act+Govern) │ │ (knowledge\_ │
│ │ │ documents) │
│ Creates Proposals │ └──────────────┘
│ Runs SignalAnalyzer │
│ Governs Actions │
└───────────┬───────────┘
│
▼
┌──────────────────────┐
│ workflow/BFF │
│ HITL Approval Gate │
│ │
│ approve → ACT_QUEUE │
│ deny → decision_memory│
└───────────┬───────────┘
│
▼
┌──────────────────────┐ ┌─────────────────┐
│ intelligence/act │────▶│ Hermes Executor │
│ (execution) │ │ (n8n / DO / queue)│
└──────────────────────┘ └────────┬────────┘
│
▼
┌─────────────────┐
│ OUTCOMES_QUEUE │
│ (self-consume) │
└─────────────────┘

```

---

## 10. KEY ARCHITECTURAL OBSERVATIONS

1. **Pipeline is the central nervous system.** The `pipeline-process` queue is the single ingestion point for all data. Every external event (webhooks, provider syncs, file changes) flows through the 8-stage normalizer.

2. **Pipeline is both producer and consumer** of `pipeline-process` — it re-enqueues messages between stages (S1→S2→...→S8), making it a self-consuming pipeline.

3. **Fan-out after S8 (sectorize):** After the final pipeline stage, the normalizer fans out to 4 queues simultaneously: `signals`, `intelligence-events`, `accelerator-trigger`, and `knowledge-ingest`.

4. **Governed cognition loop:** Signals → Intelligence (SignalAnalyzer) → Proposals → BFF/HITL Gate → ACT_QUEUE → Hermes Executor → Outcomes → Spine writeback.

5. **Memory consolidation is queue-driven:** The `memory-consolidation-tasks` queue drives hourly/daily/weekly memory consolidation, with both cron-triggered and event-triggered (session close, triage approval) producers.

6. **CONNECTOR_STATUS KV is the shared coordination point** — used by 6+ services for tenant-to-connector mappings, sync status tracking, and OAuth state.

7. **Single D1 database, many表 subsets:** All services share `integratewise-spine-cache` D1 but each uses different table subsets, creating a logical partitioning within a single physical database.

8. **Deprecated services still have bindings:** normalizer, think, loader, mcp-connector have standalone wrangler.toml files with consumer bindings removed (to prevent split-brain) but producer bindings retained.
</task_result>
```

**Tool: task**

**Input:**

```json
{
  "description": "Analyze webhook and gateway flow",
  "prompt": "Analyze the integratewise-live codebase to understand the external-facing connectivity and authentication flow.\n\n1. Read services/gateway/src/index.ts thoroughly - this is the API gateway\n2. Read services/webhook-ingress/src/index.ts - this handles incoming webhooks\n3. Read services/connector/src/index.ts - this handles connector operations\n4. Read services/mcp-connector/src/index.ts - this is the MCP server\n\nFor each, report:\n- All route handlers and their paths\n- Authentication/authorization patterns (JWT, API keys, etc.)\n- How requests flow through the system\n- What external systems they connect to (HubSpot, Jira, Gmail, etc.)\n\n5. Also check packages/connectors/src/ to understand all available connectors and their patterns.\n\n6. Check services/loader/src/ for intake patterns.\n\nReturn a structured report of:\n- External entry points (gateway routes, webhook URLs, MCP endpoints)\n- Authentication flow\n- Connector registry (which external services are supported)\n- Request processing pipeline",
  "subagent_type": "explore"
}
```

**Output:**

```
task_id: ses_16f84e79bffei8TETXJ5JLdr02 (for resuming to continue this task if needed)

<task_result>
Now I have enough information to provide a comprehensive structured report. Here is my analysis:

---

# IntegrateWise External Connectivity & Authentication Flow Report

## 1. EXTERNAL ENTRY POINTS

### 1.1 Gateway (Primary Entry Point)
**File:** `/Users/nirmal/Github/integratewise-live/services/gateway/src/index.ts`

The Gateway is the **sole entry point** for all external requests. It operates across three hostname patterns:

#### Hostname: `auth.integratewise.ai` (Authorization Server)
| Path | Method | Purpose |
|------|--------|---------|
| `/.well-known/oauth-authorization-server` | GET | OAuth metadata discovery |
| `/.well-known/openid-configuration` | GET | OpenID Connect configuration |
| `/.well-known/jwks.json` | GET | JSON Web Key Set (public keys) |
| `/oauth/authorize` | GET | Consent form UI (HTML) |
| `/oauth/authorize/confirm` | POST | Handle consent form submission |
| `/oauth/token` | POST | Token exchange (authorization_code or client_credentials) |

#### Hostname: `mcp.integratewise.ai` (Protected Resource Server)
| Path | Method | Purpose |
|------|--------|---------|
| `/.well-known/oauth-protected-resource` | GET | Resource metadata |
| `/tools`, `/tools/*` | GET | Tool discovery (MCP) |
| `/invoke` | POST | Tool invocation (MCP) |
| `/mcp` | POST | Standard MCP JSON-RPC endpoint |
| `/sessions`, `/sessions/*` | GET/POST | Session management |
| `/config/mcp-server` | GET | MCP server configuration |
| `/v1/mcp/*` | * | MCP v1 API routes |

#### Hostname: Main Domain (API Gateway)
| Route Prefix | Target Service | Purpose |
|--------------|----------------|---------|
| `/api/v1/billing` | INTERNAL_BILLING | Billing & subscriptions |
| `/api/v1/tenants` | INTERNAL_TENANTS | Tenant management |
| `/api/v1/support` | INTERNAL_SUPPORT | Support tickets |
| `/api/v1/analytics` | BFF | Analytics backend |
| `/api/v1/agents` | INTELLIGENCE | AI agent orchestration |
| `/api/v1/connectors` | CONNECTOR | Connector operations |
| `/api/v1/connector` | CONNECTOR | Legacy connector routes |
| `/api/v1/loader` | CONNECTOR | Data loader |
| `/api/v1/pipeline` | PIPELINE | 8-stage normalization |
| `/api/v1/intelligence` | INTELLIGENCE | Cognitive layer |
| `/api/v1/cognitive/*` | INTELLIGENCE/PIPELINE/KNOWLEDGE | Cognitive endpoints |
| `/api/v1/knowledge` | KNOWLEDGE | Knowledge base |
| `/api/v1/entity360` | PIPELINE | Entity 360 |
| `/api/v1/identity` | PIPELINE | Identity resolution |
| `/api/v1/l2` | L2 | L2 API layer |
| `/ws`, `/sse`, `/stream` | BFF | Real-time streaming |
| `/admin` | INTERNAL_ADMIN | Admin panel |
| `/oauth` | INTERNAL_TENANTS | OAuth flows |
| `/webhooks` | WEBHOOK_INGRESS | Webhook intake |
| `/health` | Self | Health check |
| `/health/ready` | All services | Readiness probe |

---

### 1.2 Webhook Ingress Service
**File:** `/Users/nirmal/Github/integratewise-live/services/webhook-ingress/src/index.ts`

| Route | Method | Provider | Signature Verification |
|-------|--------|----------|------------------------|
| `/webhooks/hubspot` | POST | HubSpot | HMAC-SHA256 (v3 or legacy) |
| `/webhooks/salesforce` | POST | Salesforce | Certificate-based / HMAC |
| `/webhooks/stripe` | POST | Stripe | HMAC-SHA256 (t,v1) |
| `/webhooks/github` | POST | GitHub | HMAC-SHA256 (sha256=) |
| `/webhooks/slack-workflow` | POST | Slack | HMAC-SHA256 (v0=) |
| `/webhooks/slack/interactivity` | POST | Slack | HMAC-SHA256 (v0=) |
| `/webhooks/folder-monitor` | POST | Internal | Forward to FOLDER_WATCHER |
| `/health` | GET | Self | Health check |
| `/config/:provider` | GET | Config | Webhook URL configuration |

---

### 1.3 Connector Service (Consolidated)
**File:** `/Users/nirmal/Github/integratewise-live/services/connector/src/index.ts`

| Route | Method | Purpose |
|-------|--------|---------|
| `/health` | GET | Health check |
| `/api/v1/connector` | GET | Service info |
| `/api/v1/connector/*` | * | MCP routes (tools, invoke, sessions) |
| `/api/v1/loader/*` | * | Loader routes (creamy, background-sync) |
| `/api/v1/connector/sync/:provider/:operation` | POST | Sync operations |
| `/api/v1/connector/execute` | POST | Act service write-back |
| `/nango/webhook` | POST | Nango OAuth webhook |
| `/internal/*` | * | Internal routes (spine init, schema) |
| `/files/*`, `/upload/*` | * | File storage (R2) |
| `/tools/*`, `/invoke`, `/mcp/*` | * | MCP tool server |

---

### 1.4 MCP Connector (MCP Tool Server)
**File:** `/Users/nirmal/Github/integratewise-live/services/mcp-connector/src/index.ts`

| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | Server info |
| `/health` | GET | Health check |
| `/config/mcp-server` | GET | MCP configuration |
| `/tools` | GET | Tool discovery (18 tools) |
| `/invoke` | POST | Tool invocation |
| `/mcp` | ALL | Standard MCP JSON-RPC endpoint |
| `/v1/mcp/save_session_memory` | POST | Session memory capture |
| `/v1/mcp/capture_session` | POST | Enhanced session capture with entity linking |

---

### 1.5 Loader Service (Data Intake)
**File:** `/Users/nirmal/Github/integratewise-live/services/loader/src/index.ts`

| Route | Method | Purpose |
|-------|--------|---------|
| `/nango/webhook` | POST | Nango OAuth events (auth.created, auth.revoked) |
| `/internal/creamy` | POST | Start Creamy layer sync (Phase 1) |
| `/internal/creamy/:jobId` | GET | Check Creamy job status |
| `/internal/background-sync` | POST | Start background sync (Phase 2) |
| Cron (every 5 min) | Scheduled | Discover unsynced connectors |

---

## 2. AUTHENTICATION FLOW

### 2.1 Cloudflare Zero Trust (Primary - Production)
```

Request → Cf-Access-Jwt-Assertion header
↓
Gateway verifies JWT against Cloudflare JWKS certs
(https://{teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs)
↓
Extract email from JWT payload
↓
Domain matching:

- integratewise.ai domain → auto-assign tenant (tenant-iw-101)
- External domain → query Supabase profiles table
  ↓
  Inject headers: x-tenant-id, x-user-id, x-user-role, x-org-id, x-team-id, x-user-email
  ↓
  Route to downstream service

```

### 2.2 IntegrateWise OAuth 2.0 (MCP Clients)
```

Client → auth.integratewise.ai/.well-known/oauth-authorization-server
↓
Authorization Code Flow:

1. Client → /oauth/authorize (consent form)
2. User approves → /oauth/authorize/confirm (generates code)
3. Client → /oauth/token (exchanges code for JWT)

Client Credentials Flow:

1. Client → /oauth/token (with client credentials)
2. Returns signed RS256 JWT (1 hour expiry)
   ↓
   JWT contains: iss, aud, sub, tenant_id, role, scope, exp
   ↓
   Client uses JWT → mcp.integratewise.ai (Bearer token)
   ↓
   Gateway validates JWT signature and audience
   ↓
   Enriches headers and routes to connector

```

### 2.3 MCP API Key Authentication
```

Request → Authorization: Bearer <MCP_KEY> or X-MCP-Key: <key>
↓
MCP Connector verifies against MCP_CONNECTOR_API_KEY secret
↓
Requires x-tenant-id header for tenant isolation
↓
Grants Admin + Member roles

```

### 2.4 Cloudflare Access Service Tokens (MCP Bypass)
```

Client sends:

- CF-Access-Client-Id: <service-token-client-id>
- CF-Access-Client-Secret: <service-token-client-secret>
- x-tenant-id: <tenant-id>
  ↓
  Bypasses interactive login for external MCP clients

```

### 2.5 Webhook Signature Verification
Each provider uses its own verification scheme:
- **HubSpot**: HMAC-SHA256 (v3: base64, legacy: hex)
- **Stripe**: HMAC-SHA256 with timestamp (t,v1 format)
- **GitHub**: HMAC-SHA256 (sha256=hex)
- **Slack**: HMAC-SHA256 (v0=hex with timestamp)
- **Salesforce**: Certificate-based or HMAC
- **Razorpay**: HMAC-SHA256

### 2.6 Service-to-Service (Internal)
```

Cloudflare Service Bindings → no auth header needed
↓
Gateway adds cf-worker header
↓
MCP Connector trusts requests with cf-worker header

```

---

## 3. CONNECTOR REGISTRY

### 3.1 Supported External Services (50+)

| Domain | Category | Provider | Auth Type |
|--------|----------|----------|-----------|
| **CRM** | crm | Salesforce | OAuth |
| | crm | HubSpot | OAuth |
| | crm | Pipedrive | OAuth |
| | crm | Zoho CRM | OAuth |
| | crm | Freshsales | API Key |
| | crm | Close | API Key |
| **Support** | support | Zendesk | OAuth |
| | support | Intercom | OAuth |
| | support | Help Scout | OAuth |
| | support | Front | OAuth |
| | support | Freshdesk | API Key |
| | support | Kustomer | OAuth |
| **Communication** | communication | Slack | OAuth |
| | communication | Microsoft Teams | OAuth |
| | communication | Zoom | OAuth |
| | communication | Twilio | API Key |
| | communication | Discord | OAuth |
| | communication | WhatsApp Business | API Key |
| | communication | Gmail | OAuth |
| | communication | Outlook | OAuth |
| | communication | Google Calendar | OAuth |
| **Marketing** | marketing | HubSpot Marketing | OAuth |
| | marketing | Braze | API Key |
| | marketing | SendGrid | API Key |
| | marketing | Mailchimp | OAuth |
| | marketing | Marketo | OAuth |
| | marketing | Customer.io | API Key |
| | marketing | Segment | API Key |
| **Finance** | accounting | QuickBooks | OAuth |
| | accounting | Xero | OAuth |
| | accounting | Freshbooks | OAuth |
| | billing | Chargebee | API Key |
| | payments | Stripe | OAuth |
| | payments | Paddle | API Key |
| | accounting | Tally ERP | API Key |
| | payments | Razorpay | API Key |
| | accounting | Vyapar | OAuth |
| | accounting | Khatabook | API Key |
| **Analytics** | analytics | Google Analytics 4 | OAuth |
| | analytics | Amplitude | API Key |
| | analytics | Heap | API Key |
| | analytics | Mixpanel | API Key |
| | analytics | Metabase | API Key |
| | analytics | Tableau | OAuth |
| **Engineering** | source_control | GitHub | OAuth |
| | source_control | GitLab | OAuth |
| | source_control | Bitbucket | OAuth |
| | project_management | Jira | OAuth |
| | project_management | Linear | OAuth |
| **Productivity** | docs | Notion | OAuth |
| | storage | Google Drive | OAuth |
| | spreadsheet | Google Sheets | OAuth |
| | storage | Dropbox | OAuth |
| | storage | OneDrive | OAuth |
| | productivity | Airtable | OAuth |
| | productivity | Calendly | OAuth |
| **Commerce** | ecommerce | Shopify | OAuth |
| | ecommerce | WooCommerce | API Key |
| | ecommerce | BigCommerce | OAuth |
| | logistics | Shiprocket | API Key |
| **AI** | llm | OpenAI | API Key |
| | llm | Cohere | API Key |

### 3.2 Accelerators (Bundled Solutions)

| ID | Name | Required Connectors |
|----|------|---------------------|
| subscription-metrics | Subscription Metrics | stripe |
| finance | Finance Accelerator | quickbooks, stripe |
| support-marketing | Support & Marketing | zendesk, mailchimp |
| engineering | Engineering Accelerator | github, jira |
| hr | HR Accelerator | (none required) |

---

## 4. REQUEST PROCESSING PIPELINE

### 4.1 External Webhook Flow
```

External System (HubSpot/Salesforce/Stripe/GitHub)
↓
Gateway verifies signature (per-provider HMAC)
↓
Webhook Ingress receives verified request
↓
Resolves tenant (from query, portal ID, org ID, or installation ID)
↓
Idempotency check (WEBHOOK_LOG KV - 7 day TTL)
↓
Process event + Update CONNECTOR_STATUS KV
↓
Forward to PIPELINE_QUEUE (8-stage normalization)
↓
Broadcast real-time update to BFF (SignalStreamDO)
↓
Return success response

```

### 4.2 OAuth Connection Flow
```

User clicks "Connect" in UI
↓
Frontend → /api/v1/connectors/:provider/authorize
↓
Gateway → Tenants Service (OAuth implementation)
↓
Nango Connect session created (POST /internal/nango/session)
↓
User completes OAuth in Nango UI
↓
Nango → POST /nango/webhook (auth.created)
↓
Loader writes connector row to Supabase
↓
Triggers Creamy sync via CONNECTOR_SYNC service
↓
Schema-driven extraction (only allowed entity types)
↓
Results → PIPELINE_QUEUE → 8-stage normalization → Spine

```

### 4.3 Data Synchronization Flow
```

Cron (every 5 min) or Manual Trigger
↓
Loader checks CONNECTOR_STATUS KV for unsynced connectors
↓
Reads tenant_spine_config for allowed entity types
↓
Resolves access token (Nango-first, legacy fallback)
↓
universalSync() → connector-specific API calls
↓
Schema filter: only keep allowed entity types
↓
Send to PIPELINE_QUEUE with trace metadata
↓
Pipeline processes through 8 stages
↓
Results written to D1/KV (edge) and Supabase (SSOT)

```

### 4.4 MCP Tool Invocation Flow
```

AI Client (Claude/ChatGPT/Perplexity)
↓
Authentication (CF Access JWT / OAuth JWT / MCP API Key)
↓
Rate limiting (100 req/min per IP)
↓
Tool discovery (GET /tools) or invocation (POST /invoke)
↓
Permission check (role-based: Admin/Member/Viewer/TriageBot)
↓
Tenant isolation validation
↓
Execute tool (KB operations, memory writes, Book of Projects)
↓
Response with correlation_id for tracing

```

---

## 5. KEY ARCHITECTURAL PATTERNS

1. **Tenant Isolation**: All requests carry `x-tenant-id` header; enforced at Gateway and every service
2. **Schema-Driven Extraction**: Only entity types defined in `tenant_spine_config` are extracted
3. **Dual-Write**: Data written to both Supabase (SSOT) and D1/KV (edge cache)
4. **Circuit Breaker**: Gateway uses `resilientFetch` with service health probing
5. **Model Fallback Chain**: AI routes use `modelSwitchFetch` for automatic provider failover
6. **Idempotency**: Webhooks and MCP writes use KV-based idempotency keys (7-day TTL)
7. **CORS Policy**: Configurable allowed origins, preflight caching (86400s)
8. **Rate Limiting**: IP-based (100/min) and per-route AI limits (10-60/min)
</task_result>
```

---

## Assistant (Build · MiMo V2.5 Free · 38.9s)

_Thinking:_

The user wants me to analyze the actual codebase to understand the system connectivity and derive the architecture from the code itself, rather than relying on documentation. I've now gathered comprehensive information from the three agent tasks.

Let me synthesize all this information into a clear, structured report that shows:

1. The real service topology (not what docs say, but what code actually does)
2. Queue-based communication patterns
3. Data flow
4. Authentication flow
5. Key architectural patterns

The agents have done thorough analysis. Let me present this in a clean format for the user.

Based on thorough analysis of the actual codebase, here is the **real system connectivity** derived from the code:

---

## Service Topology (Actual from Code)

```
                        ┌─────────────────────────────────────┐
                        │         GATEWAY (auth+api+admin)      │
                        │  • auth.integratewise.ai (OAuth2)     │
                        │  • mcp.integratewise.ai (MCP+JWT)     │
                        │  • Main domain (REST API)             │
                        │  • JWT validation, tenant isolation    │
                        │  • Rate limiting (KV-based)           │
                        └────────────────┬────────────────────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            │                            │                            │
            ▼                            ▼                            ▼
    ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
    │  PIPELINE      │          │ INTELLIGENCE   │          │  CONNECTOR    │
    │  (8-stage     │◄────────►│ (Think+Act+   │◄────────►│ (Loader+MCP-  │
    │   Normalizer) │          │  Govern+Agents)│          │  Connector+   │
    │  + Spine V2   │          │                │          │  Store)       │
    └───────┬───────┘          └───────┬────────┘          └───────┬───────┘
            │                          │                          │
            │                          │                          │
            ▼                          ▼                          ▼
    ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
    │  KNOWLEDGE     │          │   WORKFLOW     │          │  CONNECTOR-   │
    │  (KB ingestion │          │  (HITL gates   │          │  SYNC         │
    │  + memory      │          │  + orchestration│         │  (Delta       │
    │  consolidation)│          │  + streaming)  │          │   pollers)    │
    └───────┬───────┘          └───────────────┘          └───────────────┘
            │                          │                          │
            │                          │                          │
            ▼                          ▼                          ▼
    ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
    │  CONTINUITY    │          │    HERMES      │          │  WEBHOOK-     │
    │  (Session      │          │  (External     │          │  INGRESS      │
    │  memory +      │          │  execution via │          │  (Webhook     │
    │  triage)       │          │  n8n VPS)      │          │  intake)      │
    └───────────────┘          └───────────────┘          └───────────────┘
            │                          │                          │
            │                          │                          │
            ▼                          ▼                          ▼
    ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
    │  FOLDER-       │          │    BILLING      │          │   TENANTS     │
    │  WATCHER       │          │  (Stripe +     │          │  (RBAC +      │
    │  (DO-backed    │          │  Razorpay)     │          │  OAuth mgmt)  │
    │  filesystem    │          │                │          │               │
    │  monitor)      │          │                │          │               │
    └───────────────┘          └───────────────┘          └───────────────┘
```

---

## Queue-Based Communication (10 Active Queues)

### Core Flow: `pipeline-process`

```
                    ┌──────────────────────────────────────────┐
                    │            QUEUE: pipeline-process         │
                    │   Producers: webhook-ingress, connector,  │
                    │              folder-watcher, mcp-connector │
                    │   Consumer:  pipeline (SOLE)               │
                    └──────────────────┬───────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────────┐
                    │          8-STAGE NORMALIZATION PIPELINE    │
                    │          (services/pipeline)               │
                    └──────┬──────────┬───────────┬────────────┘
                           │          │           │
            ┌──────────────┘          │           └──────────────┐
            ▼                         ▼                          ▼
  ┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
  │SIGNAL QUEUE     │    │INTELLIGENCE EVENTS   │    │KNOWLEDGE INGEST     │
  │                 │    │                      │    │                     │
  │Signals for      │    │Data changes for      │    │Documents for        │
  │Twin cognition   │    │Think processing      │    │embedding            │
  └────────┬────────┘    └──────────┬───────────┘    └──────────┬──────────┘
           │                        │                           │
           ▼                        ▼                           ▼
  ┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
  │intelligence/    │    │intelligence/          │    │knowledge/           │
  │signals          │    │events                 │    │ingest               │
  │(SignalAnalyzer) │    │(Think worker)         │    │(Embedding + KB)     │
  └────────┬────────┘    └──────────┬───────────┘    └──────────┬──────────┘
           │                        │                           │
           ▼                        ▼                           ▼
  ┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
  │GOVERNED PROPOSALS│    │COGNITIVE PROCESSING  │    │NEON DB              │
  │(Requires HITL)  │    │(Context, Brain, etc) │    │(knowledge_documents)│
  └────────┬────────┘    └──────────────────────┘    └─────────────────────┘
           │
           ▼
  ┌─────────────────┐
  │WORKFLOW/BFF     │
  │(HITL Gate)      │
  │                 │
  │approve → ACT_   │
  │         QUEUE   │
  │deny → decision_ │
  │         memory  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │intelligence/act │
  │(Hermes Executor)│
  │                 │
  │Writes back to   │
  │Spine via        │
  │PIPELINE_QUEUE   │
  └─────────────────┘
```

---

## Data Flow Summary

### 1. External Data Ingestion

```
External System (HubSpot/Salesforce/Stripe/GitHub)
    ↓
Gateway (JWT validation + tenant isolation)
    ↓
Webhook Ingress (signature verification)
    ↓
Idempotency check (KV-based, 7-day TTL)
    ↓
PIPELINE_QUEUE → 8-stage normalization → Spine (D1/KV + Supabase)
```

### 2. Connector Sync Flow

```
Cron (5 min) or Manual Trigger
    ↓
Loader checks CONNECTOR_STATUS KV for unsynced connectors
    ↓
Schema-driven extraction (only allowed entity types from tenant_spine_config)
    ↓
PIPELINE_QUEUE → 8-stage normalization → Spine
    ↓
Fan-out to: signals, intelligence-events, knowledge-ingest, accelerator-trigger
```

### 3. MCP Tool Invocation Flow

```
AI Client (Claude/ChatGPT/Perplexity)
    ↓
Authentication (CF Access JWT / OAuth JWT / MCP API Key)
    ↓
Rate limiting (100 req/min per IP)
    ↓
Tool discovery (GET /tools) or invocation (POST /invoke)
    ↓
Permission check (role-based: Admin/Member/Viewer/TriageBot)
    ↓
Tenant isolation validation
    ↓
Execute tool (KB operations, memory writes, Book of Projects)
    ↓
Response with correlation_id for tracing
```

### 4. Intelligence Cognition Flow

```
Signals (from pipeline S8)
    ↓
Intelligence Service (SignalAnalyzer)
    ↓
Creates governed proposals (requires HITL approval)
    ↓
Workflow/BFF (HITL gate)
    ↓
approve → ACT_QUEUE → Hermes Executor
    ↓
Execution outcomes → PIPELINE_QUEUE (writeback to Spine)
```

---

## Authentication Flow

### 1. Cloudflare Zero Trust (Primary - Production)

```
Request → Cf-Access-Jwt-Assertion header
    ↓
Gateway verifies JWT against Cloudflare JWKS certs
    ↓
Extract email from JWT payload
    ↓
Domain matching:
    - integratewise.ai domain → auto-assign tenant (tenant-iw-101)
    - External domain → query Supabase profiles table
    ↓
Inject headers: x-tenant-id, x-user-id, x-user-role, x-org-id, x-team-id, x-user-email
    ↓
Route to downstream service
```

### 2. IntegrateWise OAuth 2.0 (MCP Clients)

```
Client → auth.integratewise.ai/.well-known/oauth-authorization-server
    ↓
Authorization Code Flow:
    1. Client → /oauth/authorize (consent form)
    2. User approves → /oauth/authorize/confirm (generates code)
    3. Client → /oauth/token (exchanges code for JWT)

Client Credentials Flow:
    1. Client → /oauth/token (with client credentials)
    2. Returns signed RS256 JWT (1 hour expiry)
    ↓
JWT contains: iss, aud, sub, tenant_id, role, scope, exp
    ↓
Client uses JWT → mcp.integratewise.ai (Bearer token)
    ↓
Gateway validates JWT signature and audience
    ↓
Enriches headers and routes to connector
```

### 3. Service-to-Service (Internal)

```
Cloudflare Service Bindings → no auth header needed
    ↓
Gateway adds cf-worker header
    ↓
MCP Connector trusts requests with cf-worker header
```

---

## Shared State

### Cloudflare Resources

| Resource                 | Binding                     | Purpose                            | Services                                                 |
| ------------------------ | --------------------------- | ---------------------------------- | -------------------------------------------------------- |
| **D1**                   | `integratewise-spine-cache` | Edge Spine SSOT                    | pipeline, connector, intelligence, knowledge, continuity |
| **KV: CACHE**            | `18aa20df...`               | Hot entity cache (TTL 300s)        | pipeline                                                 |
| **KV: SIGNAL_CACHE**     | `747166a3...`               | Signal cache (TTL 3600s)           | pipeline, gateway                                        |
| **KV: METRICS**          | `e80ee409...`               | Pipeline metrics (TTL 86400s)      | pipeline, gateway                                        |
| **KV: CONNECTOR_STATUS** | `f7a3d773...`               | Connector status + tenant mappings | webhook-ingress, connector-sync, loader, gateway         |
| **KV: MCP_IDEMPOTENCY**  | `16510bf2...`               | MCP idempotency checks             | mcp-connector, loader                                    |
| **KV: RATE_LIMITS**      | `8f61d841...`               | Rate limiting                      | gateway                                                  |
| **KV: SESSIONS**         | `508ba759...`               | OAuth session cache                | gateway                                                  |
| **R2: FILES**            | `integratewise-files-prod`  | File storage                       | connector, knowledge                                     |
| **Vectorize**            | `intelligence-embeddings`   | Vector embeddings                  | intelligence, knowledge                                  |

### Supabase (integratewise-4a649)

All services write to Supabase via REST API (not direct DB connection):

- **Pipeline**: spine entities via PostgREST
- **MCP Connector**: conversational_memory, org_memory, personal_memory, episodes
- **Continuity**: session_containers, conversational_memory
- **Knowledge**: consolidated_memories, triage_results, knowledge_documents (via Neon)
- **Intelligence**: signals, actions, proposals, decision_memory
- **Tenants**: profiles, connectors (OAuth callback handling)

---

## Key Architectural Patterns

1. **Pipeline is the Central Nervous System**: The `pipeline-process` queue is the single ingestion point for all data. Every external event flows through the 8-stage normalizer.

2. **Self-Consuming Pipeline**: Pipeline re-enqueues messages between stages (S1→S2→...→S8), making it a self-consuming pipeline.

3. **Fan-out After S8**: After the final pipeline stage, the normalizer fans out to 4 queues simultaneously: `signals`, `intelligence-events`, `accelerator-trigger`, and `knowledge-ingest`.

4. **Governed Cognition Loop**: Signals → Intelligence (SignalAnalyzer) → Proposals → BFF/HITL Gate → ACT_QUEUE → Hermes Executor → Outcomes → Spine writeback.

5. **Memory Consolidation is Queue-Driven**: The `memory-consolidation-tasks` queue drives hourly/daily/weekly memory consolidation, with both cron-triggered and event-triggered producers.

6. **CONNECTOR_STATUS KV is the Shared Coordination Point**: Used by 6+ services for tenant-to-connector mappings, sync status tracking, and OAuth state.

7. **Single D1 Database, Many Table Subsets**: All services share `integratewise-spine-cache` D1 but each uses different table subsets, creating logical partitioning within a single physical database.

8. **Dual-Write**: Data written to both Supabase (SSOT) and D1/KV (edge cache).

9. **Circuit Breaker**: Gateway uses `resilientFetch` with service health probing.

10. **Model Fallback Chain**: AI routes use `modelSwitchFetch` for automatic provider failover.

---

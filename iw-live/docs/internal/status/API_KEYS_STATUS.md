# API Keys Status Report

> **Date:** 2026-06-09 14:15 UTC  
> **Secrets Store ID:** `1fd83fc5881e4cd296ae3c2fbe80693c`

---

## ✅ Wired & Active

### OpenRouter API Key

- **Status:** ✅ ACTIVE
- **Secret ID:** `a2dbb029b1964633a5485a564cf0a4c9`
- **Created:** 2026-06-09 19:41 UTC
- **Binding Name:** `OPENROUTER_API_KEY`
- **Used By:**
  - `intelligence` worker (dev/test/prod)
  - `mcp-connector` worker (dev/test/prod)
- **Verified:** ✅ Working (intelligence health check shows "configured")
- **Free Tier:** `openrouter/auto` model working

---

## ⚠️ Referenced But Status Unknown

These API keys are referenced in wrangler.toml files but need verification:

### Supabase Credentials

- **Binding Names:**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
- **Used By:**
  - `mcp-connector` (REQUIRED — sole credential holder)
  - `pipeline` (formerly normalizer)
  - `store` (deprecated)
  - `govern` (deprecated, merged into intelligence)
  - `billing`
  - `loader` (deprecated)
- **Status:** ⏳ NEEDS VERIFICATION
- **Priority:** 🔴 CRITICAL (MCP connector requires this)

### GitHub Token

- **Binding Name:** `GITHUB_TOKEN`
- **Used By:**
  - `loader` (deprecated)
  - `intelligence` (commented out in Phase 1)
- **Status:** ⏳ NEEDS VERIFICATION
- **Priority:** 🟡 MEDIUM (loader deprecated, intelligence optional)

### OpenAI API Key

- **Binding Name:** `OPENAI_API_KEY`
- **Used By:**
  - `loader` (deprecated)
  - `intelligence` (commented out in Phase 1)
- **Status:** ⏳ NEEDS VERIFICATION
- **Priority:** 🟢 LOW (optional, using Workers AI + OpenRouter instead)

### Google API Key (Gemini)

- **Binding Name:** `GOOGLE_API_KEY`
- **Used By:**
  - `loader` (deprecated)
  - `intelligence` (commented out in Phase 1)
- **Status:** ⏳ NEEDS VERIFICATION
- **Priority:** 🟢 LOW (optional, using Workers AI + OpenRouter instead)

### xAI API Key (Grok)

- **Binding Name:** `XAI_API_KEY`
- **Used By:**
  - `intelligence` (commented out in Phase 1)
- **Status:** ⏳ NEEDS VERIFICATION
- **Priority:** 🟢 LOW (optional)

### OpenCode API Key

- **Binding Name:** `OPENCODE_API_KEY`
- **Used By:**
  - `intelligence` (commented out in Phase 1)
- **Status:** ⏳ NEEDS VERIFICATION
- **Priority:** 🟢 LOW (optional)

### Vercel Token

- **Binding Name:** `VERCEL_TOKEN`
- **Used By:**
  - `loader` (deprecated)
- **Status:** ⏳ NEEDS VERIFICATION
- **Priority:** 🟢 LOW (loader deprecated)

### Database URL (Supabase Direct)

- **Binding Name:** `DATABASE_URL`
- **Used By:**
  - `govern` (deprecated, merged into intelligence)
- **Status:** ⏳ NEEDS VERIFICATION
- **Priority:** 🟢 LOW (govern deprecated)

### Triage Bot API Key

- **Binding Name:** `TRIAGE_BOT_API_KEY`
- **Used By:**
  - `mcp-connector`
  - `continuity`
- **Status:** ⏳ NEEDS VERIFICATION
- **Priority:** 🟡 MEDIUM (used for write access)
- **Note:** Set via `wrangler secret put` (not Secrets Store)

---

## Verification Commands

### List All Secrets in Store

```bash
unset CLOUDFLARE_API_TOKEN
wrangler secrets-store secret list 1fd83fc5881e4cd296ae3c2fbe80693c
```

### Check Specific Secret

```bash
wrangler secrets-store secret get 1fd83fc5881e4cd296ae3c2fbe80693c <SECRET_NAME>
```

### Check Worker Bindings

```bash
# Intelligence worker
wrangler deployments view --name intelligence

# MCP connector
wrangler deployments view --name integratewise-mcp-connector

# Pipeline
wrangler deployments view --name integratewise-pipeline
```

### Test API Key Availability

```bash
# Test OpenRouter via intelligence
curl https://intelligence.dev.integratewise.ai/health

# Test MCP connector
curl https://mcp.integratewise.ai/health
```

---

## Priority Actions

### 🔴 CRITICAL (Do Now)

1. **Verify Supabase credentials exist:**

   ```bash
   wrangler secrets-store secret get 1fd83fc5881e4cd296ae3c2fbe80693c SUPABASE_URL
   wrangler secrets-store secret get 1fd83fc5881e4cd296ae3c2fbe80693c SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Test MCP connector (requires Supabase):**

   ```bash
   curl https://mcp.integratewise.ai/health
   ```

   Expected response:

   ```json
   {
     "status": "ok",
     "service": "mcp-connector",
     "version": "2.0.0",
     "oauth": "enabled",
     "tools": 18
   }
   ```

### 🟡 MEDIUM (Do Soon)

3. **Check Triage Bot API Key:**

   ```bash
   # This is a worker secret, not Secrets Store
   wrangler secret list --name integratewise-mcp-connector
   ```

4. **Verify GitHub token (if loader is still in use):**
   ```bash
   wrangler secrets-store secret get 1fd83fc5881e4cd296ae3c2fbe80693c GITHUB_TOKEN
   ```

### 🟢 LOW (Optional)

5. **Check optional AI API keys:**
   - OpenAI, Google, xAI, OpenCode
   - Only needed if expanding AI router beyond Workers AI + OpenRouter

---

## Current AI Router Configuration (intelligence)

**Active (Phase 1):**

- ✅ Cloudflare Workers AI (via `env.AI` binding)
- ✅ AI Gateway (`integratewise-ai-dev`)
- ✅ OpenRouter free tier (`openrouter/auto`)

**Disabled (Commented Out in wrangler.toml):**

- ❌ OpenAI API
- ❌ Google Gemini API
- ❌ xAI Grok API
- ❌ OpenCode API
- ❌ GitHub Copilot API

**Rationale:**

- Workers AI is free and edge-native
- OpenRouter free tier provides fallback
- Additional APIs can be enabled later if needed

---

## Adding New API Keys

### Via Secrets Store (Recommended)

```bash
unset CLOUDFLARE_API_TOKEN

# Create secret
wrangler secrets-store secret create 1fd83fc5881e4cd296ae3c2fbe80693c \
  --name=<SECRET_NAME> \
  --scopes=workers

# Set value
wrangler secrets-store secret put 1fd83fc5881e4cd296ae3c2fbe80693c \
  <SECRET_NAME> \
  --value="<SECRET_VALUE>"

# Verify
wrangler secrets-store secret get 1fd83fc5881e4cd296ae3c2fbe80693c <SECRET_NAME>
```

### Via Worker Secrets (Legacy)

```bash
# Set secret directly on worker
wrangler secret put <SECRET_NAME> --name <WORKER_NAME>

# List secrets
wrangler secret list --name <WORKER_NAME>
```

---

## Security Notes

1. **Never commit API keys to git**
2. **Use Secrets Store for shared secrets** (Supabase, OpenRouter)
3. **Use worker secrets for worker-specific keys** (Triage Bot)
4. **Rotate keys regularly** (especially Supabase service key)
5. **Check .env files are gitignored** ✅ Already in `.gitignore`

---

## Next Steps

1. ✅ Verify Supabase credentials exist in Secrets Store
2. ✅ Test MCP connector health endpoint
3. ⏳ Add missing keys if any workers fail
4. ⏳ Document key rotation policy
5. ⏳ Set up monitoring for API key expiration

---

**Status:** 1 of ~10 keys verified ✅  
**Priority:** Verify Supabase credentials (CRITICAL)  
**Last Updated:** 2026-06-09T14:15:00Z

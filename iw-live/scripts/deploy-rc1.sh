#!/bin/bash
# ═══════════════════════════════════════════════
# RC1 Deploy Script — External Customer Surface
# ═══════════════════════════════════════════════
#
# Prerequisites:
# - OAUTH_PRIVATE_KEY stored in Cloudflare Secrets Store (store_id: 1fd83fc5881e4cd296ae3c2fbe80693c)
# - All tests passing (npx vitest run)
# - Branch merged to main
#
# Run order: dev → smoke → staging → smoke → prod → smoke → playwright

set -e

echo "═══════════════════════════════════════════════"
echo "  IntegrateWise RC1 Deploy — v3.7 External Customer Surface"
echo "═══════════════════════════════════════════════"
echo ""

# ─── Step 1: Verify tests pass ───
echo "Step 1: Running unit tests..."
npx vitest run tests/functional/ tests/edge/ tests/doctrine/ --reporter=dot
echo "✅ Unit tests passed"
echo ""

# ─── Step 2: Apply D1 migrations ───
echo "Step 2: Applying D1 migrations..."
echo "  → 0001_create_tenant_config.sql"
wrangler d1 execute integratewise-spine-cache --file=services/intelligence/migrations/0001_create_tenant_config.sql --remote
echo "  → 0002_create_handoff_tables.sql"
wrangler d1 execute integratewise-spine-cache --file=services/intelligence/migrations/0002_create_handoff_tables.sql --remote
echo "  → 0003_create_outcome_events.sql"
wrangler d1 execute integratewise-spine-cache --file=services/intelligence/migrations/0003_create_outcome_events.sql --remote
echo "✅ D1 migrations applied"
echo ""

# ─── Step 3: Deploy services ───
echo "Step 3: Deploying services..."
echo "  → intelligence (includes HandoffTimeoutDO)"
cd services/intelligence && wrangler deploy && cd ../..
echo "  → gateway (OAUTH_PRIVATE_KEY binding)"
cd services/gateway && wrangler deploy && cd ../..
echo "✅ Services deployed to dev"
echo ""

# ─── Step 4: Smoke tests ───
echo "Step 4: Running smoke tests..."
echo "  → GET /connectors/catalog"
curl -sf https://gateway.dev.integratewise.ai/connectors/catalog > /dev/null && echo "    ✅ 200" || echo "    ❌ FAILED"
echo "  → GET /api/v1/handoff/list (requires auth)"
echo "    ⚠️  Requires valid JWT — run manually with auth header"
echo ""

# ─── Step 5: Run Playwright RC1 suite ───
echo "Step 5: Playwright RC1 verification..."
echo "  Set environment variables then run:"
echo "    export BASE_URL=https://gateway.dev.integratewise.ai"
echo "    export TENANT_A_JWT=<your-jwt>"
echo "    cd tests/playwright && npx playwright test"
echo ""
echo "═══════════════════════════════════════════════"
echo "  When Suite 7 (Continuity Loop) passes:"
echo "  RC1 Candidate → RC1 Verified"
echo "═══════════════════════════════════════════════"

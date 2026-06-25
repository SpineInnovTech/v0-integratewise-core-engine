#!/bin/bash
# ═══════════════════════════════════════════════
# Pre-Deploy Verification — Run Before Any Deploy
# ═══════════════════════════════════════════════
# This script verifies the entire codebase is doctrinally sound
# before any deployment action.

set -e

echo "═══════════════════════════════════════════════"
echo "  IntegrateWise Pre-Deploy Verification"
echo "  $(date)"
echo "═══════════════════════════════════════════════"
echo ""

# ─── 1. Unit + Functional + Edge + Doctrine Tests ───
echo "1. Running core test suite..."
npx vitest run tests/functional/ tests/edge/ tests/doctrine/ tests/thesis/ \
  services/intelligence/src/dispatch.test.ts \
  services/intelligence/src/memory-writeback.test.ts \
  services/iw-agent-runtime/src/tenant-brain-do.test.ts \
  --reporter=verbose 2>&1
echo ""
echo "✅ Core tests passed"
echo ""

# ─── 2. Structural Verification ───
echo "2. Structural verification..."

# V1: No hardcoded private keys
if grep -q "DEFAULT_PRIVATE_JWK" services/gateway/src/lib/jwt.ts 2>/dev/null; then
  echo "  ❌ V1 FAIL: Hardcoded private key found in jwt.ts"
  exit 1
else
  echo "  ✅ V1: No hardcoded private key"
fi

# V2: OAUTH_PRIVATE_KEY enabled
if grep -v "^#" services/gateway/wrangler.toml | grep -q "OAUTH_PRIVATE_KEY"; then
  echo "  ✅ V2: OAUTH_PRIVATE_KEY binding active"
else
  echo "  ❌ V2 FAIL: OAUTH_PRIVATE_KEY not enabled"
  exit 1
fi

# V3: No actual Supabase SDK usage in knowledge source
# Note: neonShim/supabase.ts are D1 shims with legacy names (verified: use env.DB exclusively)
if grep -r "@supabase/supabase-js\|createClient.*SUPABASE" services/knowledge/src/ 2>/dev/null; then
  echo "  ❌ V3 FAIL: Supabase SDK import found in knowledge source"
  exit 1
else
  echo "  ✅ V3: No Supabase SDK in knowledge source (shims use D1)"
fi

# V4: No active SUPABASE bindings in knowledge wrangler
if grep -v "^#" services/knowledge/wrangler.toml 2>/dev/null | grep -qi "SUPABASE"; then
  echo "  ❌ V4 FAIL: Active SUPABASE bindings in knowledge wrangler"
  exit 1
else
  echo "  ✅ V4: No active SUPABASE bindings"
fi

# V5: packages/supabase removed
if [ -d "packages/supabase" ]; then
  echo "  ❌ V5 FAIL: packages/supabase still exists"
  exit 1
else
  echo "  ✅ V5: packages/supabase removed"
fi

# V6: GOVERN binding removed
if grep -v "^#" services/intelligence/wrangler.toml | grep -q '"GOVERN"'; then
  echo "  ❌ V6 FAIL: GOVERN binding still active"
  exit 1
else
  echo "  ✅ V6: GOVERN binding removed"
fi

# V7: tenant_config migration exists
if [ -f "services/intelligence/migrations/0001_create_tenant_config.sql" ]; then
  echo "  ✅ V7: tenant_config migration exists"
else
  echo "  ❌ V7 FAIL: tenant_config migration missing"
  exit 1
fi

# V8: HandoffTimeoutDO registered
if grep -q "HandoffTimeoutDO" services/intelligence/wrangler.toml; then
  echo "  ✅ V8: HandoffTimeoutDO registered"
else
  echo "  ❌ V8 FAIL: HandoffTimeoutDO not registered"
  exit 1
fi

# V9: No hardcoded WebUI password
if grep -r "IntegrateWise@980" scripts/ packages/ 2>/dev/null | grep -v "pre-deploy-verify.sh"; then
  echo "  ❌ V9 FAIL: Hardcoded WebUI password found"
  exit 1
else
  echo "  ✅ V9: No hardcoded WebUI password"
fi

# V10: Doctrine ratchet
RATCHET=$(cat scripts/doctrine-baseline.json | grep -o '"supabase": [0-9]*' | grep -o '[0-9]*')
if [ "$RATCHET" -lt 2990 ]; then
  echo "  ✅ V10: Doctrine ratchet below 2990 (current: $RATCHET)"
else
  echo "  ❌ V10 FAIL: Doctrine ratchet at or above 2990 ($RATCHET)"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  ALL VERIFICATIONS PASSED"
echo "  Ready for deploy."
echo "═══════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Ensure OAUTH_PRIVATE_KEY is in Cloudflare Secrets Store"
echo "  2. Run: ./scripts/deploy-rc1.sh"
echo "  3. After deploy: cd tests/playwright && npx playwright test"
echo "  4. When Suite 7 passes: RC1 Verified"

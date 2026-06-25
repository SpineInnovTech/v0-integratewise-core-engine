#!/bin/bash
# Diagnose "Failed to load connectors" error in onboarding flow

set -e

ACCOUNT_ID="a1bbbb12a32cdbb68dd170b09fe8b5f3"
GATEWAY_URL="https://gateway.integratewise.ai"

echo "🔍 Diagnosing Onboarding Connectors Error..."
echo ""

# Step 1: Check BFF Worker deployment
echo "📦 Step 1: Checking BFF Worker deployment..."
BFF_STATUS=$(wrangler deployments list --name integratewise-bff 2>&1 || echo "NOT_DEPLOYED")

if echo "$BFF_STATUS" | grep -q "NOT_DEPLOYED"; then
  echo "❌ BFF Worker (integratewise-bff) is NOT deployed"
  echo ""
  echo "Fix: Deploy the BFF Worker"
  echo "  cd services/workflow"
  echo "  wrangler deploy --env production"
  echo ""
else
  echo "✅ BFF Worker is deployed"
  echo ""
fi

# Step 2: Check Gateway service binding
echo "📋 Step 2: Checking Gateway service binding..."
if grep -q 'binding = "BFF"' services/gateway/wrangler.toml; then
  echo "✅ Gateway has BFF service binding configured"
  echo ""
else
  echo "❌ Gateway is missing BFF service binding"
  echo ""
  echo "Fix: Add BFF service binding to services/gateway/wrangler.toml:"
  echo '  [[services]]'
  echo '  binding = "BFF"'
  echo '  service = "integratewise-bff"'
  echo ""
fi

# Step 3: Check Gateway routing
echo "🛣️  Step 3: Checking Gateway routing..."
if grep -q '"/api/v1/workspace", "BFF"' services/gateway/src/index.ts; then
  echo "✅ Gateway routes /api/v1/workspace/* to BFF"
  echo ""
else
  echo "❌ Gateway routing for /api/v1/workspace/* is missing or incorrect"
  echo ""
  echo "Fix: Add route to services/gateway/src/index.ts ROUTES array:"
  echo '  ["/api/v1/workspace", "BFF"],'
  echo ""
fi

# Step 4: Test BFF endpoint (requires auth)
echo "🌐 Step 4: Testing BFF endpoint..."
echo ""
echo "Manual test required (needs JWT token):"
echo ""
echo "  curl $GATEWAY_URL/api/v1/workspace/connectors \\"
echo "    -H \"Authorization: Bearer <YOUR_JWT>\" \\"
echo "    -H \"x-tenant-id: <YOUR_TENANT_ID>\""
echo ""
echo "Expected response:"
echo "  {\"connectors\": [...], \"summary\": {...}}"
echo ""

# Step 5: Test fallback endpoint
echo "🔄 Step 5: Testing fallback endpoint..."
echo ""
echo "Manual test required (needs JWT token):"
echo ""
echo "  curl $GATEWAY_URL/api/v1/connectors/catalog \\"
echo "    -H \"Authorization: Bearer <YOUR_JWT>\" \\"
echo "    -H \"x-tenant-id: <YOUR_TENANT_ID>\""
echo ""
echo "Expected response:"
echo "  {\"connectors\": [...]}"
echo ""

# Step 6: Check BFF Worker bindings
echo "🔗 Step 6: Checking BFF Worker bindings..."
echo ""
echo "Required bindings in services/workflow/wrangler.toml:"
echo "  ✓ SUPABASE_URL (secret)"
echo "  ✓ SUPABASE_SERVICE_ROLE_KEY (secret)"
echo "  ✓ SPINE service binding → integratewise-pipeline"
echo "  ✓ CONNECTOR service binding → integratewise-connector"
echo "  ✓ KNOWLEDGE service binding → integratewise-knowledge"
echo "  ✓ THINK service binding → integratewise-intelligence"
echo "  ✓ ACT service binding → integratewise-intelligence"
echo "  ✓ ANALYTICS_DB (D1 database)"
echo "  ✓ CONNECTION_META (KV namespace)"
echo "  ✓ RATE_LIMIT (KV namespace)"
echo ""

# Step 7: Check frontend fallback
echo "🎨 Step 7: Checking frontend fallback mechanism..."
if grep -q "api/v1/connectors/catalog" apps/web/src/components/activation/onboarding/steps/ConnectorsStep.tsx; then
  echo "✅ Frontend has fallback mechanism implemented"
  echo ""
else
  echo "❌ Frontend is missing fallback mechanism"
  echo ""
  echo "Fix: Update ConnectorsStep.tsx to add fallback to /api/v1/connectors/catalog"
  echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Diagnosis Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Common fixes:"
echo ""
echo "1. Deploy BFF Worker:"
echo "   cd services/workflow && wrangler deploy --env production"
echo ""
echo "2. Verify Gateway configuration:"
echo "   - Check services/gateway/wrangler.toml for BFF service binding"
echo "   - Check services/gateway/src/index.ts for /api/v1/workspace route"
echo ""
echo "3. Test endpoints manually with curl (see Step 4 & 5 above)"
echo ""
echo "4. Check Cloudflare Workers logs for errors:"
echo "   wrangler tail integratewise-bff --env production"
echo ""
echo "5. If all else fails, frontend fallback should work:"
echo "   - Fallback endpoint: /api/v1/connectors/catalog"
echo "   - User can also skip connector setup and add tools later"
echo ""
echo "📖 Full troubleshooting guide:"
echo "   docs/troubleshooting/ONBOARDING_CONNECTORS_ERROR.md"
echo ""

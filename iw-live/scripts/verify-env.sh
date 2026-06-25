#!/bin/bash
set -e

echo "═══════════════════════════════════════════════"
echo "  IntegrateWise Multi-Environment Verification"
echo "═══════════════════════════════════════════════"
echo ""

# Check wrangler is available
if ! command -v wrangler &> /dev/null && ! command -v npx &> /dev/null; then
  echo "❌ wrangler not found. Install with: pnpm add -D wrangler"
  exit 1
fi

echo "📋 Current Cloudflare account:"
npx wrangler whoami 2>/dev/null || echo "⚠️  Not logged in to wrangler. Run: wrangler login"
echo ""

echo "═══════════════════════════════════════════════"
echo "  DEV Environment (default — no flags)"
echo "═══════════════════════════════════════════════"
echo ""
echo "  Gateway:     gateway.dev.integratewise.ai"
echo "  Intelligence: intelligence.dev.integratewise.ai"
echo "  Pipeline:    pipeline.dev.integratewise.ai"
echo ""
echo "  Deploy: npm run deploy:dev"
echo ""

echo "═══════════════════════════════════════════════"
echo "  TEST Environment (--env=test)"
echo "═══════════════════════════════════════════════"
echo ""
echo "  Gateway:     gateway.test.integratewise.ai"
echo "  Intelligence: intelligence.test.integratewise.ai"
echo "  Pipeline:    pipeline.test.integratewise.ai"
echo ""
echo "  Deploy: npm run deploy:test"
echo ""

echo "═══════════════════════════════════════════════"
echo "  PROD Environment (--env=prod)"
echo "═══════════════════════════════════════════════"
echo ""
echo "  Gateway:     gateway.integratewise.ai"
echo "  Intelligence: intelligence.integratewise.ai"
echo "  Pipeline:    pipeline.integratewise.ai"
echo ""
echo "  Deploy: npm run deploy:prod"
echo ""

echo "═══════════════════════════════════════════════"
echo "  Dry Run — Dev (default)"
echo "═══════════════════════════════════════════════"
echo ""

for service in gateway intelligence pipeline; do
  echo "  Checking $service..."
  cd "services/$service"
  npx wrangler deploy --dry-run 2>&1 | head -5
  cd ../..
  echo ""
done

echo "✅ Verification complete."
echo ""
echo "Next steps:"
echo "  1. Create DNS records (mcp.*.integratewise.ai CNAMEs)"
echo "  2. Create 3 Zero Trust Access apps (dev/test/prod)"
echo "  3. Create 3 AI Gateways (integratewise-ai-dev/test/prod)"
echo "  4. Deploy to dev: npm run deploy:dev"

#!/bin/bash
# Set up platform.integratewise.ai → integratewise-admin Worker
# This becomes the internal operations dashboard

set -e

ZONE_ID="your-zone-id-for-integratewise-ai"
ACCOUNT_ID="a1bbbb12a32cdbb68dd170b09fe8b5f3"
WORKER_NAME="integratewise-admin"
CUSTOM_DOMAIN="platform.integratewise.ai"

echo "🚀 Setting up platform.integratewise.ai..."
echo ""
echo "This will:"
echo "  1. Attach custom domain platform.integratewise.ai to integratewise-admin Worker"
echo "  2. Configure Cloudflare Access for email-based authentication"
echo "  3. Set up as internal operations dashboard"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "🔍 Step 1: Verifying Worker exists..."

wrangler deployments list --name "$WORKER_NAME" || {
  echo "❌ Worker $WORKER_NAME not found"
  echo "Please deploy the admin Worker first:"
  echo "  cd services/admin && wrangler deploy --env production"
  exit 1
}

echo "✅ Worker found"

echo ""
echo "🌐 Step 2: Attaching custom domain..."

wrangler deployments domain add "$CUSTOM_DOMAIN" --name "$WORKER_NAME"

echo "✅ Custom domain attached"

echo ""
echo "🔒 Step 3: Setting up Cloudflare Access..."
echo ""
echo "Manual steps required (Cloudflare Dashboard):"
echo ""
echo "1. Go to: https://dash.cloudflare.com/$ACCOUNT_ID/access/apps"
echo "2. Click 'Add an application'"
echo "3. Select 'Self-hosted'"
echo "4. Configure:"
echo "   Name: IntegrateWise Platform (Internal Ops)"
echo "   Subdomain: platform"
echo "   Domain: integratewise.ai"
echo "   Session Duration: 24 hours"
echo ""
echo "5. Add Policy:"
echo "   Name: Email Allowlist"
echo "   Action: Allow"
echo "   Include:"
echo "     - Emails: nirmal@integratewise.ai"
echo "     - Emails: (add other team members)"
echo ""
echo "6. Save and deploy"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Platform Dashboard Features:"
echo "   - Tenant management (create, update, delete)"
echo "   - Worker health monitoring"
echo "   - Pipeline queue inspection"
echo "   - Quarantine record review"
echo "   - Merge candidate approval (HITL)"
echo "   - Connector status overview"
echo "   - System metrics and logs"
echo ""
echo "🔗 Access at: https://platform.integratewise.ai"
echo ""
echo "⚠️  IMPORTANT: Ensure integratewise-admin Worker has all necessary bindings:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - D1 binding: CACHE_DB"
echo "   - KV bindings: CACHE, METRICS, CONNECTOR_STATUS"
echo "   - Service bindings: PIPELINE, INTELLIGENCE, KNOWLEDGE"

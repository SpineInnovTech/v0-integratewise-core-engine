#!/bin/bash
# Retire api.integratewise.online domain
# This script removes the custom domain and optionally sets up a redirect

set -e

ZONE_ID="your-zone-id-for-integratewise-online"
ACCOUNT_ID="a1bbbb12a32cdbb68dd170b09fe8b5f3"
WORKER_NAME="hub-api-prod"

echo "🔍 Step 1: Finding custom domain record for api.integratewise.online..."

# List all custom domains for the Worker
DOMAINS=$(wrangler deployments list --name "$WORKER_NAME" --json 2>/dev/null || echo "[]")

echo "📋 Current domains attached to $WORKER_NAME:"
echo "$DOMAINS" | jq -r '.[] | select(.custom_domain) | .custom_domain'

echo ""
echo "🗑️  Step 2: Removing custom domain api.integratewise.online from Worker..."

# Remove the custom domain from the Worker
wrangler deployments domain remove api.integratewise.online --name "$WORKER_NAME"

echo "✅ Custom domain removed from Worker"

echo ""
echo "🔀 Step 3: Setting up redirect (optional)..."
echo ""
echo "To set up a 301 redirect from api.integratewise.online → gateway.integratewise.ai:"
echo "1. Go to Cloudflare Dashboard → integratewise.online zone"
echo "2. Navigate to Rules → Page Rules"
echo "3. Create a new Page Rule:"
echo "   URL: api.integratewise.online/*"
echo "   Setting: Forwarding URL (301 - Permanent Redirect)"
echo "   Destination: https://gateway.integratewise.ai/\$1"
echo ""
echo "OR use Bulk Redirects (recommended for modern Cloudflare):"
echo "1. Go to Rules → Redirect Rules"
echo "2. Create a new rule:"
echo "   Name: Redirect api.integratewise.online to gateway"
echo "   When incoming requests match: Hostname equals api.integratewise.online"
echo "   Then: Dynamic redirect"
echo "   Expression: concat(\"https://gateway.integratewise.ai\", http.request.uri.path)"
echo "   Status code: 301"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "⚠️  IMPORTANT: Update any hardcoded references to api.integratewise.online in:"
echo "   - Frontend code (check for VITE_API_BASE_URL overrides)"
echo "   - Documentation"
echo "   - External integrations"
echo "   - Postman collections / API clients"

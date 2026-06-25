#!/bin/bash
set -e

# Secret Rotation Script
# Run this AFTER migrating to Doppler to rotate compromised secrets

PROJECT="integratewise"

echo "🔄 Secret Rotation for IntegrateWise"
echo "====================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  WARNING: This will rotate production secrets!${NC}"
echo ""
echo "Secrets to rotate:"
echo "  1. Neon DB password"
echo "  2. Supabase JWT secret"
echo "  3. Clerk secret key"
echo "  4. Stripe secret key"
echo "  5. OAuth client secrets (Salesforce, Google, HubSpot, Slack)"
echo "  6. Vercel Blob read-write token"
echo "  7. Groq API key"
echo "  8. Cron secret"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

# Helper function to update secret in all production configs
update_all_prod() {
  local key=$1
  local value=$2
  local services=(
    "spine-v2" "loader" "normalizer" "connector" "cognitive-brain"
    "stream-gateway" "memory-consolidator" "workflow" "agents"
    "knowledge" "tenants" "admin" "billing" "govern" "act"
    "think" "views" "mcp-connector" "frontend"
  )

  for service in "${services[@]}"; do
    echo "$value" | doppler secrets set "$key" --config "${service}-production" --project $PROJECT --silent
  done
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Rotating Neon DB Password"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Steps:"
echo "  1. Go to: https://console.neon.tech"
echo "  2. Select your project"
echo "  3. Settings → Reset Password"
echo "  4. Copy new connection string"
echo ""
read -sp "Enter new NEON_DB_URL: " NEON_DB_URL
echo
update_all_prod "NEON_DB_URL" "$NEON_DB_URL"
echo -e "${GREEN}✅ Updated NEON_DB_URL${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Rotating Supabase Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Steps:"
echo "  1. Go to: https://supabase.com/dashboard"
echo "  2. Settings → API"
echo "  3. Reset JWT Secret (note: will logout all users)"
echo "  4. Copy new URL and anon key"
echo ""
read -sp "Enter new SUPABASE_URL: " SUPABASE_URL
echo
read -sp "Enter new SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
echo
update_all_prod "SUPABASE_URL" "$SUPABASE_URL"
update_all_prod "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
echo -e "${GREEN}✅ Updated Supabase secrets${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Rotating Clerk Secret"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Steps:"
echo "  1. Go to: https://dashboard.clerk.com"
echo "  2. API Keys → Roll Secret Key"
echo ""
read -sp "Enter new CLERK_SECRET_KEY: " CLERK_SECRET_KEY
echo
update_all_prod "CLERK_SECRET_KEY" "$CLERK_SECRET_KEY"
echo -e "${GREEN}✅ Updated CLERK_SECRET_KEY${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Rotating Stripe Secret"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Steps:"
echo "  1. Go to: https://dashboard.stripe.com/apikeys"
echo "  2. Roll secret key"
echo ""
read -sp "Enter new STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
echo
update_all_prod "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
echo -e "${GREEN}✅ Updated STRIPE_SECRET_KEY${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Rotating OAuth Client Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Salesforce:"
read -sp "Enter new SALESFORCE_CLIENT_SECRET: " SALESFORCE_CLIENT_SECRET
echo
update_all_prod "SALESFORCE_CLIENT_SECRET" "$SALESFORCE_CLIENT_SECRET"

echo "Google:"
read -sp "Enter new GOOGLE_CLIENT_SECRET: " GOOGLE_CLIENT_SECRET
echo
update_all_prod "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"

echo "HubSpot:"
read -sp "Enter new HUBSPOT_CLIENT_SECRET: " HUBSPOT_CLIENT_SECRET
echo
update_all_prod "HUBSPOT_CLIENT_SECRET" "$HUBSPOT_CLIENT_SECRET"

echo "Slack:"
read -sp "Enter new SLACK_CLIENT_SECRET: " SLACK_CLIENT_SECRET
echo
update_all_prod "SLACK_CLIENT_SECRET" "$SLACK_CLIENT_SECRET"
echo -e "${GREEN}✅ Updated OAuth secrets${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Rotating Vercel Blob Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -sp "Enter new BLOB_READ_WRITE_TOKEN: " BLOB_READ_WRITE_TOKEN
echo
update_all_prod "BLOB_READ_WRITE_TOKEN" "$BLOB_READ_WRITE_TOKEN"
echo -e "${GREEN}✅ Updated BLOB_READ_WRITE_TOKEN${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Rotating Groq API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -sp "Enter new GROQ_API_KEY: " GROQ_API_KEY
echo
update_all_prod "GROQ_API_KEY" "$GROQ_API_KEY"
echo -e "${GREEN}✅ Updated GROQ_API_KEY${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  Generating New Cron Secret"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
CRON_SECRET=$(openssl rand -hex 32)
echo "Generated: $CRON_SECRET"
update_all_prod "CRON_SECRET" "$CRON_SECRET"
echo -e "${GREEN}✅ Updated CRON_SECRET${NC}"
echo ""

echo ""
echo -e "${GREEN}✅ All secrets rotated successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Sync secrets to Cloudflare Workers: ./scripts/sync-doppler-to-workers.sh"
echo "2. Update Vercel environment variables"
echo "3. Restart all services to pick up new secrets"
echo "4. Test authentication flows"
echo "5. Monitor error logs for any auth failures"

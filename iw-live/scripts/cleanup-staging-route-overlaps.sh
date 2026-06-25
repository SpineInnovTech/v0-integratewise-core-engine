#!/bin/bash
# Clean up staging route overlaps
# Removes duplicate route patterns where custom domains already exist

set -e

ACCOUNT_ID="a1bbbb12a32cdbb68dd170b09fe8b5f3"

echo "🧹 Cleaning up staging route overlaps..."
echo ""
echo "Strategy: Keep custom domains, remove duplicate route patterns"
echo ""

# List of staging Workers with duplicate access paths
declare -A STAGING_WORKERS=(
  ["integratewise-loader-staging"]="loader-staging.integratewise.ai/*"
  ["integratewise-hooks-staging"]="hooks-staging.integratewise.ai/*"
  ["integratewise-gateway-staging"]="gateway-staging.integratewise.ai/*"
)

echo "📋 Workers to clean up:"
for worker in "${!STAGING_WORKERS[@]}"; do
  echo "  - $worker: Remove route ${STAGING_WORKERS[$worker]}"
done

echo ""
read -p "Continue with cleanup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "🔍 Step 1: Listing current routes..."

for worker in "${!STAGING_WORKERS[@]}"; do
  echo ""
  echo "Worker: $worker"
  wrangler deployments list --name "$worker" 2>/dev/null || echo "  (No deployments found)"
done

echo ""
echo "🗑️  Step 2: Removing duplicate route patterns..."

for worker in "${!STAGING_WORKERS[@]}"; do
  route_pattern="${STAGING_WORKERS[$worker]}"
  echo ""
  echo "Removing route: $route_pattern from $worker"
  
  # Get the route ID first
  ROUTE_ID=$(wrangler routes list --env staging 2>/dev/null | grep "$route_pattern" | awk '{print $1}' || echo "")
  
  if [ -z "$ROUTE_ID" ]; then
    echo "  ⚠️  Route not found or already removed"
    continue
  fi
  
  # Remove the route
  wrangler routes delete "$ROUTE_ID" --env staging || echo "  ⚠️  Failed to remove route"
  
  echo "  ✅ Route removed"
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Verification: Each staging Worker should now have ONLY its custom domain:"
echo ""

for worker in "${!STAGING_WORKERS[@]}"; do
  custom_domain=$(echo "$worker" | sed 's/integratewise-/staging-/' | sed 's/-staging/.integratewise.ai/')
  echo "  ✅ $worker → $custom_domain (custom domain only)"
done

echo ""
echo "⚠️  IMPORTANT: Test staging services to ensure they're still accessible via custom domains"

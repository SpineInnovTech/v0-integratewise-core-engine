
#!/bin/bash
# IntegrateWise - Cloudflare Worker Secrets Setup
# Usage: ./scripts/setup-secrets.sh [staging|production]
#
# Prerequisites:
# 1. Wrangler authenticated: wrangler login
# 2. Create a .secrets file with your values (see .secrets.example)

set -e

ENVIRONMENT=${1:-staging}
SECRETS_FILE=".secrets"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  IntegrateWise - Secrets Setup${NC}"
echo -e "${BLUE}  Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Check secrets file exists
if [[ ! -f "$SECRETS_FILE" ]]; then
    echo -e "${RED}Error: $SECRETS_FILE not found${NC}"
    echo -e "Create it from .secrets.example and fill in your values"
    exit 1
fi

# Load secrets
source "$SECRETS_FILE"

# Validate required secrets
required_vars=("NEON_CONNECTION_STRING" "SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}Error: $var is not set in $SECRETS_FILE${NC}"
        exit 1
    fi
done

# Services and their required secrets
# Note: OPENROUTER_API_KEY is the preferred AI provider (replaces ANTHROPIC/OPENAI)
declare -A SERVICE_SECRETS=(
    ["spine"]="NEON_CONNECTION_STRING SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY"
    ["gateway"]="NEON_CONNECTION_STRING WEBHOOK_SECRET"
    ["loader"]="NEON_CONNECTION_STRING SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY"
    ["normalizer"]="NEON_CONNECTION_STRING"
    ["store"]="NEON_CONNECTION_STRING R2_BUCKET R2_ACCESS_KEY R2_SECRET_KEY"
    ["knowledge"]="NEON_CONNECTION_STRING OPENROUTER_API_KEY"
    ["think"]="NEON_CONNECTION_STRING OPENROUTER_API_KEY"
    ["govern"]="NEON_CONNECTION_STRING"
    ["act"]="NEON_CONNECTION_STRING SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY"
    ["iq-hub"]="NEON_CONNECTION_STRING OPENROUTER_API_KEY"
    ["admin"]="NEON_CONNECTION_STRING ADMIN_SECRET"
    ["mcp-connector"]="NEON_CONNECTION_STRING"
)

set_secret() {
    local service=$1
    local secret_name=$2
    local secret_value=${!secret_name}
    
    if [[ -z "$secret_value" ]]; then
        echo -e "  ${YELLOW}⚠ $secret_name not set, skipping${NC}"
        return 0
    fi
    
    echo -e "  Setting $secret_name..."
    cd "services/$service"
    
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        echo "$secret_value" | wrangler secret put "$secret_name" --env staging 2>/dev/null || \
        echo "$secret_value" | wrangler secret put "$secret_name"
    else
        echo "$secret_value" | wrangler secret put "$secret_name"
    fi
    
    cd - > /dev/null
}

# Set secrets for each service
for service in "${!SERVICE_SECRETS[@]}"; do
    echo -e "\n${YELLOW}Configuring: $service${NC}"
    
    if [[ ! -d "services/$service" ]]; then
        echo -e "  ${RED}Service directory not found, skipping${NC}"
        continue
    fi
    
    secrets="${SERVICE_SECRETS[$service]}"
    for secret in $secrets; do
        set_secret "$service" "$secret"
    done
    
    echo -e "  ${GREEN}✓ $service configured${NC}"
done

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Secrets configured for $ENVIRONMENT${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "\nNext steps:"
echo -e "  1. Deploy workers: pnpm deploy:workers:$ENVIRONMENT"
echo -e "  2. Verify health: curl https://integratewise-spine-$ENVIRONMENT.workers.dev/health"

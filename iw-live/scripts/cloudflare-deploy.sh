#!/bin/bash
# ============================================================================
# Cloudflare-Native Deployment for IntegrateWise
# ============================================================================
# Usage: ./scripts/cloudflare-deploy.sh [target] [environment]
# 
# Targets:
#   frontend      - Deploy web app to Cloudflare Pages
#   workers       - Deploy all Workers (pipeline, connector, etc.)
#   gateway       - Deploy API Gateway only
#   all           - Deploy everything (frontend + workers)
#
# Environments:
#   production    - Production deployment
#   staging       - Staging deployment
#
# Examples:
#   ./scripts/cloudflare-deploy.sh frontend production
#   ./scripts/cloudflare-deploy.sh workers production
#   ./scripts/cloudflare-deploy.sh all production
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Arguments
TARGET=${1:-frontend}
ENV=${2:-staging}

# Normalize environment
if [ "$ENV" == "prod" ] || [ "$ENV" == "production" ]; then
    ENV="prod"
    ENV_SHORT="prod"
    CF_BRANCH="main"
    DOPPLER_CONFIG="prd_web"
    
    # Enforce Policy: No direct production deployments of Workers from local terminals
    if [ "$TARGET" = "workers" ] || [ "$TARGET" = "all" ] || [ "$TARGET" = "gateway" ]; then
        if [ "${GITHUB_ACTIONS:-false}" != "true" ] && [ "${CI:-false}" != "true" ] && [ "${ALLOW_LOCAL_PROD_DEPLOY:-false}" != "true" ]; then
            echo -e "${RED}Error: Direct production deployments of Workers from local terminal are blocked by policy.${NC}"
            echo "   Please deploy to staging instead: $0 $TARGET staging"
            echo "   Or set ALLOW_LOCAL_PROD_DEPLOY=true if you have explicit founder authorization."
            exit 1
        fi
    fi
elif [ "$ENV" == "stg" ] || [ "$ENV" == "staging" ] || [ "$ENV" == "test" ]; then
    ENV="test"
    ENV_SHORT="test"
    CF_BRANCH="staging"
    DOPPLER_CONFIG="stg_web"
else
    echo -e "${RED}Error: Invalid environment '$ENV'${NC}"
    echo "Valid: production, staging, test (or prod, stg)"
    exit 1
fi

# Cloudflare Project Names
CF_PAGES_PROJECT="integratewise"

# ============================================================================
# Helper Functions
# ============================================================================

check_doppler_auth() {
    if ! doppler whoami > /dev/null 2>&1; then
        echo -e "${RED}Error: Not authenticated with Doppler${NC}"
        echo "Run: doppler login"
        exit 1
    fi
    echo -e "${GREEN}✓ Doppler authenticated${NC}"
}

check_wrangler_auth() {
    if ! wrangler whoami > /dev/null 2>&1; then
        echo -e "${RED}Error: Not authenticated with Wrangler${NC}"
        echo "Run: wrangler login"
        exit 1
    fi
    echo -e "${GREEN}✓ Wrangler authenticated${NC}"
}

verify_secrets() {
    local config=$1
    echo -e "${BLUE}▶ Verifying Doppler secrets for $config...${NC}"
    
    if ! doppler configs get "$config" --project integratewise > /dev/null 2>&1; then
        echo -e "${RED}Error: Config '$config' not found in Doppler${NC}"
        echo "Available configs:"
        doppler configs --project integratewise
        exit 1
    fi
    echo -e "${GREEN}✓ Doppler config exists${NC}"
}

# ============================================================================
# Deployment Functions
# ============================================================================

deploy_frontend() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║        Deploying Frontend to Cloudflare Pages                      ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    verify_secrets "$DOPPLER_CONFIG"
    
    cd apps/web
    
    echo -e "${BLUE}▶ Installing dependencies...${NC}"
    pnpm install --frozen-lockfile
    
    echo -e "${BLUE}▶ Building with Doppler secrets...${NC}"
    doppler run --config "$DOPPLER_CONFIG" --project integratewise -- pnpm build
    
    # Enforce Pages branch protection policy (never deploy main/production directly)
    if [ "$CF_BRANCH" == "main" ] || [ "$CF_BRANCH" == "production" ]; then
        COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
        SAFE_BRANCH="preview-${COMMIT_SHA}"
        echo -e "${YELLOW}⚠️  Policy Violation: Direct Pages deployment to branch '${CF_BRANCH}' is prohibited.${NC}"
        echo -e "${YELLOW}   Redirecting deployment to preview branch '${SAFE_BRANCH}'.${NC}"
        echo -e "${YELLOW}   Production promotion must be performed manually via the Cloudflare Pages Dashboard.${NC}"
        CF_BRANCH="$SAFE_BRANCH"
    fi

    echo -e "${BLUE}▶ Deploying to Cloudflare Pages...${NC}"
    echo -e "   Project: ${YELLOW}$CF_PAGES_PROJECT${NC}"
    echo -e "   Branch:  ${YELLOW}$CF_BRANCH${NC}"
    
    wrangler pages deploy dist \
        --project-name="$CF_PAGES_PROJECT" \
        --branch="$CF_BRANCH" \
        --commit-dirty=true
    
    cd ../..
    
    echo ""
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo -e "${CYAN}URL: https://$CF_BRANCH.$CF_PAGES_PROJECT.pages.dev${NC}"
}

deploy_worker() {
    local service=$1
    local config_file=$2
    
    echo -e "${BLUE}▶ Deploying $service...${NC}"
    
    if [ ! -f "$config_file" ]; then
        echo -e "${YELLOW}⚠ Skipping $service - no config found${NC}"
        return 1
    fi
    
    # Extract environment flag if env section exists (wrangler uses "production" / "staging")
    if grep -q "\[env\.$ENV\]" "$config_file"; then
        ENV_FLAG="--env $ENV"
    else
        ENV_FLAG=""
    fi
    
    wrangler deploy -c "$config_file" $ENV_FLAG --keep-vars
    
    echo -e "${GREEN}✓ $service deployed${NC}"
}

deploy_workers() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║        Deploying Workers to Cloudflare                              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Deploy order matters — downstream first, gateway LAST
    local SERVICES=(
        "services/pipeline/wrangler.toml"
        "services/connector/wrangler.toml"
        "services/mcp-connector/wrangler.toml"
        "services/intelligence/wrangler.toml"
        "services/knowledge/wrangler.toml"
        "services/workflow/wrangler.toml"
        "services/connector-sync/wrangler.toml"
        "services/webhook-ingress/wrangler.toml"
        "services/folder-watcher/wrangler.toml"
        "services/continuity/wrangler.toml"
        "services/l2/wrangler.toml"
        "services/gateway/wrangler.toml"
    )
    
    DEPLOYED=0
    FAILED=0
    
    for service_config in "${SERVICES[@]}"; do
        service_name=$(basename $(dirname "$service_config"))
        
        if deploy_worker "$service_name" "$service_config"; then
            ((DEPLOYED++))
        else
            ((FAILED++)) || true
        fi
    done
    
    echo ""
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Deployed: $DEPLOYED${NC}  ${RED}❌ Failed: $FAILED${NC}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    
    if [ $FAILED -gt 0 ]; then
        echo -e "${RED}Some Workers failed to deploy${NC}"
        return 1
    fi
}

deploy_gateway() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║        Deploying API Gateway                                        ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    deploy_worker "gateway" "services/gateway/wrangler.toml"
}

# ============================================================================
# Health Check
# ============================================================================

health_check() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║        Running Health Checks                                        ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    sleep 5
    
    local ENDPOINTS=(
        "https://gateway.integratewise.ai/health"
    )
    
    for url in "${ENDPOINTS[@]}"; do
        echo -e "${BLUE}Checking $url...${NC}"
        if curl -sf --max-time 10 "$url" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✅ Healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Unreachable (may need DNS propagation)${NC}"
        fi
    done
}

# ============================================================================
# Main Execution
# ============================================================================

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Cloudflare-Native Deployment for IntegrateWise                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Target:      ${YELLOW}$TARGET${NC}"
echo -e "Environment: ${YELLOW}$ENV${NC}"
echo -e "Doppler:     ${YELLOW}$DOPPLER_CONFIG${NC}"
echo ""

# Pre-flight checks
echo -e "${BLUE}▶ Running pre-flight checks...${NC}"
check_doppler_auth
check_wrangler_auth
echo ""

# Execute deployment based on target
case "$TARGET" in
    frontend|web|app)
        deploy_frontend
        ;;
    workers)
        deploy_workers
        ;;
    gateway)
        deploy_gateway
        ;;
    all)
        deploy_frontend
        deploy_workers
        health_check
        ;;
    *)
        echo -e "${RED}Error: Unknown target '$TARGET'${NC}"
        echo "Valid targets: frontend, workers, gateway, all"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              Cloudflare Deployment Complete!                        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$TARGET" == "frontend" ] || [ "$TARGET" == "all" ]; then
    echo -e "${GREEN}Frontend:${NC} https://$CF_BRANCH.$CF_PAGES_PROJECT.pages.dev"
    if [ "$ENV_SHORT" == "prd" ]; then
        echo -e "${GREEN}Production:${NC} https://integratewise.ai"
    fi
fi

if [ "$TARGET" == "workers" ] || [ "$TARGET" == "all" ]; then
    echo -e "${GREEN}Gateway:${NC} https://gateway.integratewise.ai"
fi

echo ""

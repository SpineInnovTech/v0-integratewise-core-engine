#!/bin/bash
# ============================================================================
# Cloudflare Security & Infrastructure Remediation
# ============================================================================
# Usage: 
#   export CLOUDFLARE_API_TOKEN="your-token"
#   export CLOUDFLARE_ZONE_ID="your-zone-id"
#   export CLOUDFLARE_ACCOUNT_ID="your-account-id"
#   export SERVICE_TOKEN_ID="your-access-service-token-id" # Optional
#   ./scripts/cloudflare-remediate.sh
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Remediating Cloudflare Security and Setup Faults                 ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Pre-flight checks
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}Error: CLOUDFLARE_API_TOKEN is not set.${NC}"
    exit 1
fi
if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo -e "${RED}Error: CLOUDFLARE_ZONE_ID is not set.${NC}"
    exit 1
fi
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo -e "${RED}Error: CLOUDFLARE_ACCOUNT_ID is not set.${NC}"
    exit 1
fi

API_HEADER="Authorization: Bearer $CLOUDFLARE_API_TOKEN"

# 1. SSL/TLS to Full (strict)
echo -e "${BLUE}▶ 1. Switching SSL/TLS mode to Full (strict)...${NC}"
SSL_RES=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/settings/ssl" \
     -H "$API_HEADER" \
     -H "Content-Type: application/json" \
     --data '{"value":"strict"}')

if echo "$SSL_RES" | grep -q '"success":true'; then
    echo -e "  ${GREEN}✓ SSL/TLS mode updated to Full (strict)${NC}"
else
    echo -e "  ${RED}✗ Failed to update SSL/TLS mode: $SSL_RES${NC}"
fi
echo ""

# 2. Enable DNSSEC
echo -e "${BLUE}▶ 2. Enabling DNSSEC...${NC}"
DNSSEC_RES=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dnssec" \
     -H "$API_HEADER" \
     -H "Content-Type: application/json" \
     --data '{"status":"active"}')

if echo "$DNSSEC_RES" | grep -q '"success":true'; then
    echo -e "  ${GREEN}✓ DNSSEC enabled successfully${NC}"
else
    echo -e "  ${RED}✗ Failed to enable DNSSEC: $DNSSEC_RES${NC}"
fi
echo ""

# 3. Proxy DNS records
echo -e "${BLUE}▶ 3. Proxying DNS records (orange cloud)...${NC}"
RECORDS=("appflowy-aeya.operations" "hermes" "ollama.operations" "workspace")

# Fetch existing DNS records to match names and types
DNS_LIST=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records" \
     -H "$API_HEADER" \
     -H "Content-Type: application/json")

for record in "${RECORDS[@]}"; do
    fullname="${record}.integratewise.ai"
    echo -e "   Checking record: ${YELLOW}${fullname}${NC}"
    
    # Simple grep parsing to find ID, content and type of record
    # Note: Using standard python/grep parsing in bash
    RECORD_DATA=$(echo "$DNS_LIST" | grep -o '{"id":"[^"]*","zone_id":"[^"]*","zone_name":"[^"]*","name":"'"$fullname"'","type":"[^"]*","content":"[^"]*"' | head -n1 || true)
    
    if [ -n "$RECORD_DATA" ]; then
        RECORD_ID=$(echo "$RECORD_DATA" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        RECORD_TYPE=$(echo "$RECORD_DATA" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)
        RECORD_CONTENT=$(echo "$RECORD_DATA" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
        
        echo -e "   Found record ID: ${CYAN}${RECORD_ID}${NC} (Type: $RECORD_TYPE)"
        
        # Proxy record
        PROXY_RES=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${RECORD_ID}" \
             -H "$API_HEADER" \
             -H "Content-Type: application/json" \
             --data '{"proxied":true}')
             
        if echo "$PROXY_RES" | grep -q '"success":true'; then
            echo -e "     ${GREEN}✓ Record ${fullname} is now proxied${NC}"
        else
            echo -e "     ${RED}✗ Failed to proxy record ${fullname}: $PROXY_RES${NC}"
        fi
    else
        echo -e "     ${YELLOW}⚠ Record ${fullname} not found in DNS list${NC}"
    fi
done
echo ""

# 4. Create Zero Trust Access Application & Service Auth Policy
echo -e "${BLUE}▶ 4. Configuring Zero Trust Access Application for mcp.integratewise.ai...${NC}"
ACCESS_APP_RES=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/access/apps" \
     -H "$API_HEADER" \
     -H "Content-Type: application/json" \
     --data '{
       "name": "IntegrateWise MCP Access Application",
       "domain": "mcp.integratewise.ai",
       "type": "self_hosted",
       "session_duration": "24h"
     }')

if echo "$ACCESS_APP_RES" | grep -q '"success":true'; then
    APP_ID=$(echo "$ACCESS_APP_RES" | grep -o '"uid":"[^"]*"' | head -n1 | cut -d'"' -f4 || true)
    echo -e "  ${GREEN}✓ Access Application created (ID: $APP_ID)${NC}"
    
    if [ -n "$SERVICE_TOKEN_ID" ] && [ -n "$APP_ID" ]; then
        echo -e "     Binding Service Auth policy (Service Token: $SERVICE_TOKEN_ID)..."
        POLICY_RES=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/access/apps/${APP_ID}/policies" \
             -H "$API_HEADER" \
             -H "Content-Type: application/json" \
             --data '{
               "name": "Service Token Access Policy",
               "decision": "non_identity",
               "include": [
                 {
                   "service_token": {
                     "token_id": "'"${SERVICE_TOKEN_ID}"'"
                   }
                 }
               ]
             }')
        if echo "$POLICY_RES" | grep -q '"success":true'; then
            echo -e "     ${GREEN}✓ Service Auth policy successfully bound${NC}"
        else
            echo -e "     ${RED}✗ Failed to bind Service Auth policy: $POLICY_RES${NC}"
        fi
    else
        echo -e "     ${YELLOW}⚠ Service Token ID not provided, skipping policy creation.${NC}"
    fi
else
    # Check if application already exists
    if echo "$ACCESS_APP_RES" | grep -q "already exists"; then
        echo -e "  ${YELLOW}⚠ Access Application for mcp.integratewise.ai already exists${NC}"
    else
        echo -e "  ${RED}✗ Failed to create Access Application: $ACCESS_APP_RES${NC}"
    fi
fi
echo ""

# 5. Create AI Gateway
echo -e "${BLUE}▶ 5. Creating AI Gateway for intelligence Worker...${NC}"
AI_GW_RES=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai-gateway/gateways" \
     -H "$API_HEADER" \
     -H "Content-Type: application/json" \
     --data '{
       "id": "integratewise-gateway",
       "name": "IntegrateWise AI Gateway",
       "settings": {
         "cache_ttl": 3600,
         "rate_limiter": {
           "limit": 100,
           "period": 60
         }
       }
     }')

if echo "$AI_GW_RES" | grep -q '"success":true'; then
    echo -e "  ${GREEN}✓ AI Gateway \"integratewise-gateway\" created successfully${NC}"
else
    if echo "$AI_GW_RES" | grep -q "already exists"; then
        echo -e "  ${YELLOW}⚠ AI Gateway \"integratewise-gateway\" already exists${NC}"
    else
        echo -e "  ${RED}✗ Failed to create AI Gateway: $AI_GW_RES${NC}"
    fi
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              Cloudflare Remediation Script Finished                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

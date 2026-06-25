#!/bin/bash
# Fetch a fresh IntegrateWise MCP OAuth token (client_credentials).
# Usage:
#   ./scripts/mcp-get-token.sh              # print token to stdout
#   ./scripts/mcp-get-token.sh --export     # print export statements
#   ./scripts/mcp-get-token.sh --write-env  # write ~/.integratewise-mcp.env

set -euo pipefail

MCP_URL="${INTEGRATEWISE_MCP_URL:-https://mcp.integratewise.ai}"
TENANT_ID="${INTEGRATEWISE_TENANT_ID:-integratewise}"
MODE="${1:-}"

RESP=$(curl -s -X POST "$MCP_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "grant_type=client_credentials&scope=mcp:tools%20mcp:resources%20memory:read%20memory:write")

TOKEN=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null || true)
EXPIRES=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('expires_in',''))" 2>/dev/null || true)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token: $RESP" >&2
  exit 1
fi

case "$MODE" in
  --export)
    echo "export INTEGRATEWISE_MCP_URL=\"$MCP_URL\""
    echo "export INTEGRATEWISE_TENANT_ID=\"$TENANT_ID\""
    echo "export INTEGRATEWISE_MCP_TOKEN=\"$TOKEN\""
    echo "# expires_in: ${EXPIRES}s (~1 hour)"
    ;;
  --write-env)
    ENV_FILE="${HOME}/.integratewise-mcp.env"
    cat > "$ENV_FILE" <<EOF
# IntegrateWise MCP OAuth credentials (auto-generated)
# Refresh: ~/Github/integratewise-live/scripts/mcp-get-token.sh --write-env
INTEGRATEWISE_MCP_URL=$MCP_URL
INTEGRATEWISE_TENANT_ID=$TENANT_ID
INTEGRATEWISE_MCP_TOKEN=$TOKEN
# expires_in: ${EXPIRES}s
EOF
    chmod 600 "$ENV_FILE"
    echo "Wrote $ENV_FILE (expires in ${EXPIRES}s)"
    ;;
  *)
    echo "$TOKEN"
    ;;
esac
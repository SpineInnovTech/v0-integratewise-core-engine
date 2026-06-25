#!/bin/bash
# Test IntegrateWise MCP OAuth flow (client_credentials + protected endpoints)
set -euo pipefail

MCP_URL="${INTEGRATEWISE_MCP_URL:-https://mcp.integratewise.ai}"
TENANT_ID="${INTEGRATEWISE_TENANT_ID:-integratewise}"

echo "🔐 Testing IntegrateWise MCP OAuth"
echo "   MCP URL: $MCP_URL"
echo "   Tenant:  $TENANT_ID"
echo ""

echo "1) Protected resource metadata"
META=$(curl -s "$MCP_URL/.well-known/oauth-protected-resource")
echo "$META" | python3 -c "import sys,json; d=json.load(sys.stdin); print('   resource:', d['resource']); print('   auth:', d['authorization_servers'][0])"
echo ""

echo "2) Unauthenticated /tools → expect 401 + WWW-Authenticate"
HTTP=$(curl -s -o /tmp/mcp_tools_401.json -w "%{http_code}" "$MCP_URL/tools")
AUTH_HDR=$(curl -s -I "$MCP_URL/tools" | grep -i www-authenticate || true)
echo "   HTTP $HTTP"
echo "   $AUTH_HDR"
if [ "$HTTP" != "401" ]; then
  echo "❌ Expected 401 without token"
  exit 1
fi
echo ""

echo "3) Client credentials token"
TOKEN_RESP=$(curl -s -X POST "$MCP_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "grant_type=client_credentials&scope=mcp:tools%20mcp:resources")
ACCESS_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || true)
if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Token exchange failed: $TOKEN_RESP"
  exit 1
fi
echo "   ✅ Token received (${#ACCESS_TOKEN} chars)"
echo ""

echo "4) Authenticated /tools"
HTTP=$(curl -s -o /tmp/mcp_tools_ok.json -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$MCP_URL/tools")
COUNT=$(python3 -c "import json; d=json.load(open('/tmp/mcp_tools_ok.json')); print(len(d.get('tools',[])))" 2>/dev/null || echo 0)
echo "   HTTP $HTTP — $COUNT tools"
if [ "$HTTP" != "200" ]; then
  echo "❌ Authenticated tools list failed"
  cat /tmp/mcp_tools_ok.json
  exit 1
fi

echo ""
echo "✅ MCP OAuth flow OK"
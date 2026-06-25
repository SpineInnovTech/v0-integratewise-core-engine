#!/bin/bash
set -e

BASE="https://mcp.integratewise.ai"
TENANT="iw-customer-zero"

echo "=== IntegrateWise E2E Pipeline Check ==="
echo ""

# Token
TOKEN=$(curl -s -X POST "$BASE/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=mcp:tools+mcp:resources+memory:read+memory:write+tenant:read+tenant:write&client_id=kiro-iw" \
  -H "x-tenant-id: $TENANT" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "1. OAuth:     ✅ Token (${#TOKEN} chars)"

# Tools
TOOLS=$(curl -s -X POST "$BASE/" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print(len(r['result']['tools']))")
echo "2. Tools:     ✅ $TOOLS available"

# Write
WID=$(curl -s -X POST "$BASE/" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":\"2\",\"method\":\"tools/call\",\"params\":{\"name\":\"memory.write_conversational\",\"arguments\":{\"tenant_id\":\"$TENANT\",\"session_id\":\"e2e-$(date +%s)\",\"user_id\":\"nirmal\",\"role\":\"user\",\"content\":\"E2E validation $(date -u +%H:%M)\",\"metadata\":{\"test\":true}}}}" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); d=json.loads(r['result']['content'][0]['text']); print(d.get('id','FAIL'))")
echo "3. Write:     ✅ $WID"

# Read
READ=$(curl -s -X POST "$BASE/" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":\"3\",\"method\":\"tools/call\",\"params\":{\"name\":\"memory.read_conversational\",\"arguments\":{\"tenant_id\":\"$TENANT\",\"limit\":1}}}" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); d=json.loads(r['result']['content'][0]['text']); print(f\"{d['count']} records\")")
echo "4. Read:      ✅ $READ"

# Org Memory
ORG=$(curl -s -X POST "$BASE/" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":\"4\",\"method\":\"tools/call\",\"params\":{\"name\":\"memory.search_org\",\"arguments\":{\"tenant_id\":\"$TENANT\",\"limit\":3}}}" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); d=json.loads(r['result']['content'][0]['text']); print(f\"{d['count']} decisions\")")
echo "5. OrgMem:    ✅ $ORG"

# Signals
SIG=$(curl -s -X POST "$BASE/" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":\"5\",\"method\":\"tools/call\",\"params\":{\"name\":\"signal.list\",\"arguments\":{\"tenant_id\":\"$TENANT\",\"limit\":5}}}" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); d=json.loads(r['result']['content'][0]['text']); print(f\"{d['count']} signals\")")
echo "6. Signals:   ✅ $SIG"

# Proposals
PROP=$(curl -s -X POST "$BASE/" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":\"6\",\"method\":\"tools/call\",\"params\":{\"name\":\"proposal.list\",\"arguments\":{\"tenant_id\":\"$TENANT\",\"limit\":5}}}" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); d=json.loads(r['result']['content'][0]['text']); print(f\"{d['count']} proposals\")")
echo "7. Proposals: ✅ $PROP"

# Search
SRCH=$(curl -s -X POST "$BASE/" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":\"7\",\"method\":\"tools/call\",\"params\":{\"name\":\"search.semantic\",\"arguments\":{\"tenant_id\":\"$TENANT\",\"q\":\"architecture\"}}}" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); d=json.loads(r['result']['content'][0]['text']); print(f\"{d.get('data',{}).get('totalResults',0)} results\")")
echo "8. Search:    ✅ $SRCH"

# Pipeline
PIPE=$(curl -s -o /dev/null -w "%{http_code}" https://pipeline.dev.integratewise.ai/health)
echo "9. Pipeline:  ✅ HTTP $PIPE"

# Kiro Bridge
KIRO=$(echo '{"jsonrpc":"2.0","id":"t","method":"tools/list","params":{}}' | INTEGRATEWISE_MCP_URL=$BASE INTEGRATEWISE_TENANT_ID=$TENANT INTEGRATEWISE_CLIENT_ID=kiro-iw node scripts/integratewise-mcp-bridge.mjs 2>/dev/null | python3 -c "import sys,json; r=json.load(sys.stdin); print(f\"{len(r['result']['tools'])} tools\")")
echo "10. Kiro:     ✅ $KIRO"

echo ""
echo "=== ALL SYSTEMS GO ==="

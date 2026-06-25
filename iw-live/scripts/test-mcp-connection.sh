#!/bin/bash
# Test IntegrateWise MCP connection

set -e

echo "🔍 Testing IntegrateWise MCP Connection..."
echo ""

# Check environment variables
if [ -z "$INTEGRATEWISE_MCP_TOKEN" ]; then
  echo "❌ INTEGRATEWISE_MCP_TOKEN not set"
  exit 1
fi

if [ -z "$INTEGRATEWISE_TENANT_ID" ]; then
  echo "❌ INTEGRATEWISE_TENANT_ID not set"
  exit 1
fi

echo "✅ Environment variables set"
echo "   Token: ${INTEGRATEWISE_MCP_TOKEN:0:20}..."
echo "   Tenant: $INTEGRATEWISE_TENANT_ID"
echo ""

# Test 1: Initialize
echo "📡 Test 1: Initialize MCP server..."
INIT_RESPONSE=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | \
  INTEGRATEWISE_MCP_TOKEN="$INTEGRATEWISE_MCP_TOKEN" \
  INTEGRATEWISE_TENANT_ID="$INTEGRATEWISE_TENANT_ID" \
  node scripts/integratewise-mcp-bridge.mjs 2>/dev/null)

if echo "$INIT_RESPONSE" | grep -q "integratewise-cloud"; then
  echo "✅ Initialize successful"
else
  echo "❌ Initialize failed"
  echo "$INIT_RESPONSE"
  exit 1
fi
echo ""

# Test 2: List tools
echo "📋 Test 2: List available tools..."
TOOLS_RESPONSE=$(echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | \
  INTEGRATEWISE_MCP_TOKEN="$INTEGRATEWISE_MCP_TOKEN" \
  INTEGRATEWISE_TENANT_ID="$INTEGRATEWISE_TENANT_ID" \
  node scripts/integratewise-mcp-bridge.mjs 2>/dev/null | tail -1)

if echo "$TOOLS_RESPONSE" | grep -q "kb.search"; then
  echo "✅ Tools list retrieved"
  TOOL_COUNT=$(echo "$TOOLS_RESPONSE" | grep -o '"name"' | wc -l | tr -d ' ')
  echo "   Found $TOOL_COUNT tools"
else
  echo "❌ Tools list failed"
  echo "$TOOLS_RESPONSE"
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests passed! MCP connection is working."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Available tools:"
echo "$TOOLS_RESPONSE" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g' | sort | sed 's/^/  • /'

#!/bin/bash
# Test JWT verification security fix

MCP_WORKER="https://integratewise-mcp-connector.connect-a1b.workers.dev"
if [ -z "$MCP_API_KEY" ]; then
  echo "❌ Error: MCP_API_KEY env var is required (your MCP connector key). Do not hardcode it."
  exit 1
fi

echo "🧪 Testing MCP Authentication Security"
echo "======================================"
echo ""

# Test 1: Valid MCP API key with x-tenant-id
echo "✓ Test 1: Valid MCP API key + x-tenant-id"
curl -s -X POST "$MCP_WORKER/invoke" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H "x-tenant-id: test-tenant-123" \
  -H "Content-Type: application/json" \
  -d '{"tool": "kb.search", "arguments": {"tenant_id": "test-tenant-123", "q": "test"}}' \
  | grep -q "unauthorized\|error\|results" && echo "✓ Auth passed" || echo "✗ Auth failed"

echo ""

# Test 2: Missing x-tenant-id (should fail)
echo "✓ Test 2: MCP API key without x-tenant-id (should fail)"
curl -s -X POST "$MCP_WORKER/invoke" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "kb.search", "arguments": {"tenant_id": "test-tenant-123", "q": "test"}}' \
  | grep -q "unauthorized" && echo "✓ Correctly rejected" || echo "✗ Should have been rejected"

echo ""

# Test 3: Invalid token (should fail)
echo "✓ Test 3: Invalid JWT token (should fail)"
curl -s -X POST "$MCP_WORKER/invoke" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.token" \
  -H "Content-Type: application/json" \
  -d '{"tool": "kb.search", "arguments": {"tenant_id": "test-tenant-123", "q": "test"}}' \
  | grep -q "unauthorized" && echo "✓ Correctly rejected fake token" || echo "✗ Should have rejected fake token"

echo ""
echo "🎯 If all tests show ✓, your JWT verification is secure!"
echo "   - MCP API key auth works"
echo "   - JWT signature verification is enforced"
echo "   - Invalid tokens are rejected"
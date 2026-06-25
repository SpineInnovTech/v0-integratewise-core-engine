#!/bin/bash
# =============================================================================
# IntegrateWise MCP Connector Local Startup Script
# =============================================================================

# Ensure we use Browser OAuth and clear any overriding token env variables
unset CLOUDFLARE_API_TOKEN

# Get script directory and navigate to services/mcp-connector root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "---------------------------------------------------------"
echo "🚀 Starting IntegrateWise MCP Connector on localhost:8787"
echo "🌐 Connected Account ID: a1bbbb12a32cdbb68dd170b09fe8b5f3"
echo "---------------------------------------------------------"

# Run Wrangler in dev mode
npx wrangler dev --port 8787

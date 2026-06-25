#!/bin/bash
#
# Setup script for OpenClaw MCP integration with IntegrateWise
# This script configures OpenClaw to work with the IntegrateWise MCP system
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🦞 OpenClaw MCP Setup for IntegrateWise"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if OpenClaw is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Checking OpenClaw installation...${NC}"
if npx openclaw --version &> /dev/null; then
    OPENCLAW_VERSION=$(npx openclaw --version 2>&1 | head -1)
    echo -e "${GREEN}✓ OpenClaw found: ${OPENCLAW_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠ OpenClaw not found. Installing...${NC}"
    npm install -g openclaw@latest
fi

echo ""
echo -e "${BLUE}🔍 Checking OpenClaw MCP...${NC}"
if npx openclaw-mcp --version &> /dev/null; then
    MCP_VERSION=$(npx openclaw-mcp --version 2>&1 | head -1)
    echo -e "${GREEN}✓ OpenClaw MCP found: ${MCP_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠ OpenClaw MCP will be installed on first use${NC}"
fi

# Check if OpenClaw config exists
OPENCLAW_CONFIG="${HOME}/.openclaw/openclaw.json"
if [ -f "$OPENCLAW_CONFIG" ]; then
    echo ""
    echo -e "${BLUE}📄 Found OpenClaw config${NC}"
    
    # Extract gateway URL and token
    GATEWAY_PORT=$(cat "$OPENCLAW_CONFIG" | grep -o '"port":[0-9]*' | head -1 | cut -d':' -f2 || echo "18789")
    GATEWAY_BIND=$(cat "$OPENCLAW_CONFIG" | grep -o '"bind":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "loopback")
    AUTH_TOKEN=$(cat "$OPENCLAW_CONFIG" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    # Determine URL based on bind mode
    if [ "$GATEWAY_BIND" = "lan" ]; then
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
        GATEWAY_URL="ws://${LOCAL_IP}:${GATEWAY_PORT}"
    else
        GATEWAY_URL="ws://127.0.0.1:${GATEWAY_PORT}"
    fi
    
    echo ""
    echo -e "${GREEN}OpenClaw Configuration:${NC}"
    echo "  Gateway URL: $GATEWAY_URL"
    echo "  Bind Mode: $GATEWAY_BIND"
    echo "  Port: $GATEWAY_PORT"
    if [ -n "$AUTH_TOKEN" ]; then
        echo "  Auth Token: ${AUTH_TOKEN:0:20}..."
    fi
else
    echo ""
    echo -e "${YELLOW}⚠ OpenClaw config not found. Running initial setup...${NC}"
    echo "  Config path: $OPENCLAW_CONFIG"
    echo ""
    echo -e "${BLUE}Running 'npx openclaw onboard' to create initial config...${NC}"
    npx openclaw onboard --dev
fi

echo ""
echo -e "${BLUE}🔧 Checking OpenClaw gateway status...${NC}"
if lsof -i :${GATEWAY_PORT:-18789} &> /dev/null; then
    echo -e "${GREEN}✓ Gateway is running on port ${GATEWAY_PORT:-18789}${NC}"
else
    echo -e "${YELLOW}⚠ Gateway not running. Starting...${NC}"
    nohup npx openclaw gateway --bind lan --port ${GATEWAY_PORT:-18789} > /tmp/openclaw-gateway.log 2>&1 &
    sleep 3
    if lsof -i :${GATEWAY_PORT:-18789} &> /dev/null; then
        echo -e "${GREEN}✓ Gateway started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start gateway. Check logs: /tmp/openclaw-gateway.log${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📝 Cursor MCP Configuration${NC}"
echo "The OpenClaw MCP server has been added to .cursor/mcp.json"
echo ""

# Create .env file for Cursor MCP
cat > "${PROJECT_ROOT}/.cursor/.env" << EOF
# OpenClaw MCP Configuration
# Generated on $(date)
OPENCLAW_GATEWAY_URL=${GATEWAY_URL:-ws://127.0.0.1:18789}
OPENCLAW_AUTH_TOKEN=${AUTH_TOKEN}
EOF

echo -e "${GREEN}✓ Created .cursor/.env with OpenClaw credentials${NC}"
echo ""

echo "========================================"
echo -e "${GREEN}🎉 OpenClaw MCP Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Configuration Summary:"
echo "  Gateway URL: ${GATEWAY_URL:-ws://127.0.0.1:18789}"
echo "  Auth Token: ${AUTH_TOKEN:0:20}..."
echo ""
echo "Next Steps:"
echo "  1. Restart Cursor IDE to load the new MCP configuration"
echo "  2. When prompted, enter your OpenClaw credentials:"
echo "     - Gateway URL: ${GATEWAY_URL:-ws://127.0.0.1:18789}"
echo "     - Auth Token: (from ~/.openclaw/openclaw.json)"
echo ""
echo "  Or copy from: .cursor/.env"
echo ""
echo "Available OpenClaw MCP Tools:"
echo "  - openclaw_chat: Send messages to OpenClaw AI"
echo "  - openclaw_agent: Run agents through OpenClaw"
echo "  - openclaw_memory: Access OpenClaw memory/knowledge"
echo ""
echo "Useful Commands:"
echo "  npx openclaw health          # Check gateway health"
echo "  npx openclaw dashboard       # Open web dashboard"
echo "  npx openclaw logs            # View logs"
echo "  ~/.openclaw/start-gateway.sh # Start gateway script"
echo ""

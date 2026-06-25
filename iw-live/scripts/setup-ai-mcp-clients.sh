#!/bin/bash
# Wire IntegrateWise MCP into local AI tool configs (Kiro, Kimi, shell env).
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
BRIDGE="$REPO/scripts/integratewise-mcp-bridge.mjs"
MCP_URL="https://mcp.integratewise.ai"
TENANT_ID="${INTEGRATEWISE_TENANT_ID:-integratewise}"

echo "🔗 IntegrateWise MCP — AI client setup"
echo ""

# 1. OAuth token → ~/.integratewise-mcp.env
"$REPO/scripts/mcp-get-token.sh" --write-env
# shellcheck disable=SC1091
source "${HOME}/.integratewise-mcp.env"
echo ""

# 2. Shell profile hook (idempotent)
PROFILE="${HOME}/.zshrc"
MARKER="# IntegrateWise MCP OAuth"
if ! grep -q "$MARKER" "$PROFILE" 2>/dev/null; then
  cat >> "$PROFILE" <<'EOF'

# IntegrateWise MCP OAuth
[ -f ~/.integratewise-mcp.env ] && source ~/.integratewise-mcp.env
EOF
  echo "✅ Added source hook to ~/.zshrc"
else
  echo "✅ ~/.zshrc already sources ~/.integratewise-mcp.env"
fi
echo ""

# 3. Kiro — HTTP OAuth MCP (like Figma) + stdio bridge fallback
KIRO_CFG="${HOME}/.kiro/settings/mcp.json"
mkdir -p "$(dirname "$KIRO_CFG")"
if [ -f "$KIRO_CFG" ]; then
  python3 - <<'PY' "$KIRO_CFG" "$BRIDGE" "$MCP_URL"
import json, sys
path, bridge, mcp_url = sys.argv[1:4]
with open(path) as f:
    cfg = json.load(f)
servers = cfg.setdefault("mcpServers", {})
servers["integratewise"] = {
    "type": "http",
    "url": f"{mcp_url}/mcp",
    "autoApprove": [
        "kb.list_recent", "kb.get_artifact", "kb.search", "kb.topic_list",
        "memory.read_conversational", "memory.search_org", "memory.read_personal",
        "book.get_episodes", "book.get_episode", "book.search_by_entity",
    ],
}
servers["integratewise-cloud"] = {
    "command": "node",
    "args": [bridge],
    "env": {
        "INTEGRATEWISE_MCP_URL": mcp_url,
        "INTEGRATEWISE_MCP_TOKEN": "${INTEGRATEWISE_MCP_TOKEN}",
        "INTEGRATEWISE_TENANT_ID": "${INTEGRATEWISE_TENANT_ID}",
    },
    "autoApprove": servers.get("integratewise-cloud", {}).get("autoApprove", [
        "kb.list_recent", "kb.get_artifact", "kb.search", "kb.topic_list",
        "memory.read_conversational", "memory.search_org",
    ]),
}
with open(path, "w") as f:
    json.dump(cfg, f, indent=2)
    f.write("\n")
print(f"Updated {path}")
PY
else
  echo "⚠️  Kiro config not found at $KIRO_CFG — skip"
fi
echo ""

# 4. Kimi — stdio bridge (no native OAuth HTTP yet)
KIMI_CFG="${HOME}/.kimi/mcp.json"
mkdir -p "$(dirname "$KIMI_CFG")"
python3 - <<'PY' "$KIMI_CFG" "$BRIDGE" "$MCP_URL"
import json, sys, os
path, bridge, mcp_url = sys.argv[1:4]
cfg = {}
if os.path.exists(path):
    with open(path) as f:
        cfg = json.load(f)
servers = cfg.setdefault("mcpServers", {})
servers["integratewise"] = {
    "command": "node",
    "args": [bridge],
    "env": {
        "INTEGRATEWISE_MCP_URL": mcp_url,
        "INTEGRATEWISE_MCP_TOKEN": "${INTEGRATEWISE_MCP_TOKEN}",
        "INTEGRATEWISE_TENANT_ID": "${INTEGRATEWISE_TENANT_ID}",
    },
}
with open(path, "w") as f:
    json.dump(cfg, f, indent=2)
    f.write("\n")
print(f"Updated {path}")
PY
echo ""

# 5. Verify
echo "🧪 Verifying connection..."
"$REPO/scripts/test-mcp-oauth.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Done. Restart your AI tools, then:"
echo ""
echo "  Cursor / VS Code  → use .vscode/mcp.json server \"integratewise\""
echo "                    → OAuth browser flow on first connect"
echo ""
echo "  Kiro              → server \"integratewise\" (HTTP OAuth)"
echo "                    → or \"integratewise-cloud\" (stdio bridge)"
echo ""
echo "  Kimi              → server \"integratewise\" (stdio bridge)"
echo ""
echo "  Token refresh     → ./scripts/mcp-get-token.sh --write-env"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
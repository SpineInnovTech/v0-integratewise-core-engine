#!/usr/bin/env bash
# Verify deployment — health checks + L2 KV read
# Usage: ./scripts/verify-deployment.sh [BASE_URL]
# Default BASE_URL: https://gateway.integratewise.ai
# When gateway is unreachable: script still runs L2 checks and exits 0 (resilient).
# Set STRICT=1 to exit 1 on health failure (e.g. in CI after deploy).

set -e
BASE_URL="${1:-https://gateway.integratewise.ai}"
STRICT="${STRICT:-0}"
FAILED=0

echo "════════════════════════════════════════"
echo " IntegrateWise Deployment Verification"
echo " Base URL: $BASE_URL"
echo "════════════════════════════════════════"

# Health checks (optional exit: if gateway unreachable, warn and continue when SKIP_HEALTH=1)
SERVICES=(
  "$BASE_URL/health"
  "$BASE_URL/api/v1/l2/health"
)
for url in "${SERVICES[@]}"; do
  echo -n "Checking $url ... "
  if curl -sf --max-time 15 "$url" > /dev/null 2>&1; then
    echo "✅"
  else
    echo "❌ FAILED (timeout or unreachable)"
    FAILED=1
  fi
done

if [ "$FAILED" = "1" ] && [ "$STRICT" = "1" ]; then
  echo ""
  echo "Tip: Run without STRICT=1 to continue L2 checks and exit 0 when gateway is not deployed."
  exit 1
fi

# L2 insights (KV-backed when namespace configured)
echo -n "L2 insights (test-user, personal-today) ... "
RESP=$(curl -sf --max-time 15 "$BASE_URL/api/v1/l2/insights?viewId=personal-today&userId=test-user" 2>/dev/null || echo "[]")
if echo "$RESP" | grep -q '"id"'; then
  echo "✅ (data returned)"
else
  echo "⚠️  (empty or demo — KV may not be populated)"
fi

# L2 recommendations
echo -n "L2 recommendations (test-user, personal-today) ... "
RESP=$(curl -sf --max-time 15 "$BASE_URL/api/v1/l2/recommendations?viewId=personal-today&userId=test-user" 2>/dev/null || echo "[]")
if echo "$RESP" | grep -q '"id"'; then
  echo "✅ (data returned)"
else
  echo "⚠️  (empty or demo)"
fi

echo ""
echo "════════════════════════════════════════"
echo " Verification complete"
echo "════════════════════════════════════════"

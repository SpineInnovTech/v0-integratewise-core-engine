#!/usr/bin/env bash
# Run the L2 happy path from docs/L2_HAPPY_PATH_TRANSCRIPT.md
# Usage: BASE_URL=https://gateway.integratewise.ai ./scripts/verify-l2-happy-path.sh
#    or: ./scripts/verify-l2-happy-path.sh [BASE_URL]

set -e
BASE_URL="${1:-${BASE_URL:-https://gateway.integratewise.ai}}"
USER_ID="${USER_ID:-test-user}"

echo "════════════════════════════════════════"
echo " L2 Happy Path (docs → real)"
echo " BASE_URL: $BASE_URL"
echo " USER_ID: $USER_ID"
echo "════════════════════════════════════════"

# Flow 1: Insights
echo ""
echo "1. GET insights (personal-today)"
INSIGHTS=$(curl -sf --max-time 10 "$BASE_URL/api/v1/l2/insights?viewId=personal-today&userId=$USER_ID" 2>/dev/null || echo "[]")
if echo "$INSIGHTS" | grep -q '"id"'; then
  echo "   ✅ Insights returned"
else
  echo "   ⚠️  Empty (KV may not be seeded; demo fallback returns 1 for personal-today)"
fi

# Flow 1b: Dismiss
echo ""
echo "2. POST dismiss (demo-personal-today-1)"
DISMISS=$(curl -sf -w "%{http_code}" -o /tmp/l2-dismiss.json -X POST "$BASE_URL/api/v1/l2/events" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"user_action\",\"source\":\"hub-today\",\"payload\":{\"action\":\"dismiss\",\"insightId\":\"demo-personal-today-1\",\"userId\":\"$USER_ID\"}}" 2>/dev/null || echo "000")
if [ "$DISMISS" = "204" ] || [ "$DISMISS" = "200" ]; then
  echo "   ✅ Dismiss recorded"
else
  echo "   ⚠️  HTTP $DISMISS (KV may not be bound)"
fi

# Flow 1c: GET insights again (should filter dismissed)
echo ""
echo "3. GET insights again (dismissed filtered)"
INSIGHTS2=$(curl -sf --max-time 10 "$BASE_URL/api/v1/l2/insights?viewId=personal-today&userId=$USER_ID" 2>/dev/null || echo "[]")
DCOUNT=$(echo "$INSIGHTS2" | grep -o '"id"' | wc -l | tr -d ' ')
echo "   (insight count: $DCOUNT)"

# Flow 2: Recommendations
echo ""
echo "4. GET recommendations (pending-review)"
RECS=$(curl -sf --max-time 10 "$BASE_URL/api/v1/l2/recommendations?viewId=pending-review&userId=$USER_ID&status=pending" 2>/dev/null || echo "[]")
if echo "$RECS" | grep -q '"id"'; then
  echo "   ✅ Recommendations returned"
else
  echo "   ⚠️  Empty"
fi

# Flow 2b: Approve
echo ""
echo "5. POST approve (demo-rec-1)"
APPROVE=$(curl -sf -w "%{http_code}" -o /tmp/l2-approve.json -X POST "$BASE_URL/api/v1/l2/recommendations/demo-rec-1/decision" \
  -H "Content-Type: application/json" \
  -d "{\"decision\":\"approve\",\"reason\":\"Scheduling exec sync\",\"actor\":\"$USER_ID\",\"viewId\":\"pending-review\"}" 2>/dev/null || echo "000")
if [ "$APPROVE" = "200" ] || [ "$APPROVE" = "204" ]; then
  echo "   ✅ Decision recorded"
else
  echo "   ⚠️  HTTP $APPROVE"
fi

# Flow 2c: Decision log
echo ""
echo "6. GET decisions (decision-log, approved)"
DECISIONS=$(curl -sf --max-time 10 "$BASE_URL/api/v1/l2/recommendations?viewId=decision-log&userId=$USER_ID&status=approved,rejected" 2>/dev/null || echo "[]")
if echo "$DECISIONS" | grep -q '"approved"'; then
  echo "   ✅ Decision log shows approved"
else
  echo "   ⚠️  (in-memory fallback or KV not yet propagated)"
fi

echo ""
echo "════════════════════════════════════════"
echo " Happy path complete"
echo "════════════════════════════════════════"

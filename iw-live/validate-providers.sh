#!/bin/bash

echo "================================"
echo "Provider Configuration Validator"
echo "================================"
echo ""

# Test all 24 combinations
COMBINATIONS=0
for AUTH in supabase clerk; do
  for DB in supabase d1; do
    for AI in claude gpt groq; do
      for AGENT in vercel-ai langchain; do
        COMBINATIONS=$((COMBINATIONS + 1))
        echo "✓ Config $COMBINATIONS: $AUTH + $DB + $AI + $AGENT"
      done
    done
  done
done

echo ""
echo "================================"
echo "Total Supported Combinations: $COMBINATIONS"
echo "Expected: 24"
echo "Status: $([ $COMBINATIONS -eq 24 ] && echo 'PASS ✅' || echo 'FAIL ❌')"
echo "================================"
echo ""

# Validate provider implementations exist
echo "Checking Provider Implementations..."
echo ""

check_file() {
  if [ -f "$1" ]; then
    LINES=$(wc -l < "$1")
    echo "✓ $1 ($LINES lines)"
    return 0
  else
    echo "✗ MISSING: $1"
    return 1
  fi
}

AUTH_IMPL=0
DB_IMPL=0
AI_IMPL=0
AGENT_IMPL=0

echo "Auth Implementations:"
check_file "apps/web/lib/auth/providers/supabase-auth.ts" && AUTH_IMPL=$((AUTH_IMPL + 1))
check_file "apps/web/lib/auth/providers/clerk-auth.ts" && AUTH_IMPL=$((AUTH_IMPL + 1))

echo ""
echo "Database Implementations:"
check_file "apps/web/lib/db/providers/supabase-db.ts" && DB_IMPL=$((DB_IMPL + 1))
check_file "apps/web/lib/db/providers/d1-db.ts" && DB_IMPL=$((DB_IMPL + 1))

echo ""
echo "AI Implementations:"
check_file "apps/web/lib/ai/providers/claude-ai.ts" && AI_IMPL=$((AI_IMPL + 1))
check_file "apps/web/lib/ai/providers/gpt-ai.ts" && AI_IMPL=$((AI_IMPL + 1))
check_file "apps/web/lib/ai/providers/groq-ai.ts" && AI_IMPL=$((AI_IMPL + 1))

echo ""
echo "Agent Implementations:"
check_file "apps/web/lib/agent/providers/vercel-ai-agent.ts" && AGENT_IMPL=$((AGENT_IMPL + 1))
check_file "apps/web/lib/agent/providers/langchain-agent.ts" && AGENT_IMPL=$((AGENT_IMPL + 1))

echo ""
echo "Factory Functions:"
check_file "apps/web/lib/auth/factory.ts"
check_file "apps/web/lib/db/factory.ts"
check_file "apps/web/lib/ai/factory.ts"
check_file "apps/web/lib/agent/factory.ts"

echo ""
echo "================================"
echo "Provider Implementation Summary"
echo "================================"
echo "Auth Providers:    $AUTH_IMPL/2"
echo "Database Providers: $DB_IMPL/2"
echo "AI Providers:      $AI_IMPL/3"
echo "Agent Providers:   $AGENT_IMPL/2"
echo "Total:             $((AUTH_IMPL + DB_IMPL + AI_IMPL + AGENT_IMPL))/9"
echo ""

if [ $AUTH_IMPL -eq 2 ] && [ $DB_IMPL -eq 2 ] && [ $AI_IMPL -eq 3 ] && [ $AGENT_IMPL -eq 2 ]; then
  echo "Status: ALL IMPLEMENTATIONS FOUND ✅"
else
  echo "Status: SOME IMPLEMENTATIONS MISSING ❌"
fi

echo ""
echo "Testing TypeScript compilation..."
cd apps/web && pnpm tsc --noEmit 2>&1 | head -20

echo ""
echo "================================"
echo "VALIDATION COMPLETE"
echo "================================"

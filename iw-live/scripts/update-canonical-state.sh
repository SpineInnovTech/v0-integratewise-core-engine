#!/bin/bash
# Script to update canonical state after v3.7 external customer surface completion
# Run this AFTER all E2E tests pass and before final deploy.
#
# Actions:
# 1. Mark punch list items 1-11 as Done in docs/CANONICAL_STATE.md §3
# 2. Add DECISION block in AGENTS.md
# 3. Move Customer Zero items 12-14 to active
#
# Phase 9 Task 43
# Requirements: all (closure)

echo "⚠️  This script is a manual checklist — run each step and verify."
echo ""
echo "1. Edit docs/CANONICAL_STATE.md §3.1 and §3.2:"
echo "   - Mark all P0 items with [x] (security fixes complete)"
echo "   - Mark all §3.1 items with [x] (feature deliverables complete)"
echo ""
echo "2. Add to AGENTS.md after DECISION 24:"
echo "   ## DECISION 25 — v3.7 External Customer Surface Complete"
echo "   Date: $(date +%Y-%m-%d)"
echo "   Status: LOCKED"
echo "   Canonical Spec: .kiro/specs/external-customer-surface-completion/"
echo "   Summary: External customer go-live surface delivered. 43 tasks across"
echo "   10 phases (P0 security, binding hygiene, de-Supabase, tenant_class,"
echo "   memory writeback, handoff contract, outcome API, timeout guard,"
echo "   Approval Center UI, Memory Hub UI)."
echo ""
echo "3. Move Customer Zero items 12-14 to active in §3."
echo ""
echo "4. Run: node scripts/check-doctrine.mjs (verify ratchets)"
echo "5. Commit: git commit -am 'docs: mark v3.7 punch list complete (DECISION 25)'"

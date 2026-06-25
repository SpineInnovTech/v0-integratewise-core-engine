#!/bin/bash
# Sync internal docs from integratewise-live/docs/ to integratewise-docs VitePress site
#
# Usage:
#   ./scripts/sync-docs.sh /path/to/integratewise-docs
#
# Features:
# 1. Copies MD content with VitePress frontmatter injection
# 2. Auto-generates sidebar config from actual files (no hardcoding)
# 3. Cleans stale files (removed from source → removed from target)
# 4. Generates internal landing page (index.md)
# 5. Idempotent — safe to run repeatedly
#
# The VitePress site handles rendering, navigation, and auth.

set -e

DOCS_REPO="${1:-../integratewise-docs}"
SOURCE="docs"
VITEPRESS_CONTENT="$DOCS_REPO/docs"
INTERNAL="$VITEPRESS_CONTENT/internal"

if [ ! -d "$DOCS_REPO" ]; then
  echo "Error: Docs repo not found at $DOCS_REPO"
  echo "Usage: ./scripts/sync-docs.sh /path/to/integratewise-docs"
  exit 1
fi

echo "╔══════════════════════════════════════════════╗"
echo "║  IntegrateWise Docs Sync → VitePress        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Source: $SOURCE/"
echo "  Target: $INTERNAL/"
echo ""

# ─── Category mapping: source folder → target folder + display name ──────────
declare -A CATEGORY_MAP
CATEGORY_MAP=(
  ["tech"]="architecture|Architecture"
  ["product"]="product|Product"
  ["gtm"]="gtm|Go-To-Market"
  ["operations"]="operations|Operations"
  ["design"]="design|Design"
  ["playbooks"]="playbooks|Playbooks"
  ["runbooks"]="runbooks|Runbooks"
)

# ─── Create target directories ───────────────────────────────────────────────
for key in "${!CATEGORY_MAP[@]}"; do
  IFS='|' read -r target_dir display_name <<< "${CATEGORY_MAP[$key]}"
  mkdir -p "$INTERNAL/$target_dir"
done

# ─── Sync function: copy MD with VitePress frontmatter ───────────────────────
sync_file() {
  local src="$1"
  local dest="$2"
  local title

  # Extract title from first # heading, fallback to filename
  title=$(grep -m1 "^# " "$src" 2>/dev/null | sed 's/^# //' || echo "")
  if [ -z "$title" ]; then
    title=$(basename "$src" .md | sed 's/_/ /g; s/-/ /g')
  fi
  # Escape quotes in title
  title=$(echo "$title" | sed 's/"/\\"/g')

  # Skip if source hasn't changed (compare content hash)
  if [ -f "$dest" ]; then
    local src_hash dest_hash
    src_hash=$(md5 -q "$src" 2>/dev/null || md5sum "$src" | cut -d' ' -f1)
    # Strip frontmatter from dest before comparing
    dest_hash=$(sed '1{/^---$/!q;};1,/^---$/d' "$dest" | md5 -q 2>/dev/null || sed '1{/^---$/!q;};1,/^---$/d' "$dest" | md5sum | cut -d' ' -f1)
    if [ "$src_hash" = "$dest_hash" ]; then
      return 1  # no change
    fi
  fi

  # Write file with frontmatter
  if head -1 "$src" | grep -q "^---"; then
    cp "$src" "$dest"
  else
    {
      echo "---"
      echo "title: \"$title\""
      echo "editLink: false"
      echo "lastUpdated: true"
      echo "---"
      echo ""
      cat "$src"
    } > "$dest"
  fi
  return 0
}

# ─── Sync each category ─────────────────────────────────────────────────────
SYNCED=0
SKIPPED=0
DELETED=0

for source_dir in "${!CATEGORY_MAP[@]}"; do
  IFS='|' read -r target_dir display_name <<< "${CATEGORY_MAP[$source_dir]}"
  
  echo "── $display_name ($source_dir/ → internal/$target_dir/)"
  
  if [ ! -d "$SOURCE/$source_dir" ]; then
    echo "   ⚠ Source directory not found, skipping"
    continue
  fi

  # Track which files exist in source
  declare -A SOURCE_FILES
  SOURCE_FILES=()

  for f in "$SOURCE/$source_dir/"*.md; do
    [ -f "$f" ] || continue
    local_name=$(basename "$f")
    
    # Skip README.md files (they're index pages, not content)
    if [ "$local_name" = "README.md" ]; then
      continue
    fi

    SOURCE_FILES["$local_name"]=1

    if sync_file "$f" "$INTERNAL/$target_dir/$local_name"; then
      echo "   ✓ $local_name (updated)"
      SYNCED=$((SYNCED + 1))
    else
      SKIPPED=$((SKIPPED + 1))
    fi
  done

  # Clean stale files in target that no longer exist in source
  for f in "$INTERNAL/$target_dir/"*.md; do
    [ -f "$f" ] || continue
    local_name=$(basename "$f")
    if [ -z "${SOURCE_FILES[$local_name]+x}" ]; then
      rm "$f"
      echo "   ✗ $local_name (removed — no longer in source)"
      DELETED=$((DELETED + 1))
    fi
  done

  unset SOURCE_FILES
  echo ""
done

# ─── Auto-generate sidebar config from actual files ──────────────────────────
echo "── Generating sidebar config..."

generate_sidebar_items() {
  local dir="$1"
  local vitepress_path="$2"
  local first=true

  for f in "$dir/"*.md; do
    [ -f "$f" ] || continue
    local name=$(basename "$f" .md)
    local title=$(grep -m1 "^title:" "$f" 2>/dev/null | sed 's/^title: *"//; s/"$//' || echo "")
    if [ -z "$title" ]; then
      title=$(grep -m1 "^# " "$f" 2>/dev/null | sed 's/^# //' || echo "$name")
    fi
    # Truncate long titles for sidebar
    if [ ${#title} -gt 50 ]; then
      title="${title:0:47}..."
    fi
    # Escape for JSON
    title=$(echo "$title" | sed 's/"/\\"/g')

    if [ "$first" = true ]; then
      first=false
    else
      echo ","
    fi
    printf "      { text: '%s', link: '%s/%s' }" "$title" "$vitepress_path" "$name"
  done
}

{
  cat << 'HEADER'
// Auto-generated by sync-docs.sh — do not edit manually
// Import this in .vitepress/config.ts → sidebar → '/internal/'
// Last synced: SYNC_TIMESTAMP

export const internalSidebar = [
HEADER

  FIRST_SECTION=true
  # Ordered sections for sidebar
  for section_key in tech product gtm operations design playbooks runbooks; do
    IFS='|' read -r target_dir display_name <<< "${CATEGORY_MAP[$section_key]}"
    target_path="$INTERNAL/$target_dir"
    
    # Skip empty directories
    file_count=$(find "$target_path" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$file_count" = "0" ]; then
      continue
    fi

    if [ "$FIRST_SECTION" = true ]; then
      FIRST_SECTION=false
    else
      echo ","
    fi

    # Determine collapsed state (first section open, rest collapsed)
    collapsed="true"
    if [ "$section_key" = "tech" ]; then
      collapsed="false"
    fi

    printf "  {\n"
    printf "    text: '%s',\n" "$display_name"
    printf "    collapsed: %s,\n" "$collapsed"
    printf "    items: [\n"
    generate_sidebar_items "$target_path" "/internal/$target_dir"
    printf "\n    ]\n"
    printf "  }"
  done

  echo ""
  echo "]"
} > "$INTERNAL/_sidebar.ts"

# Replace timestamp placeholder
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i.bak "s/SYNC_TIMESTAMP/$TIMESTAMP/" "$INTERNAL/_sidebar.ts" && rm -f "$INTERNAL/_sidebar.ts.bak"

echo "   ✓ _sidebar.ts generated"

# ─── Generate internal landing page ──────────────────────────────────────────
echo ""
echo "── Generating internal docs landing page..."

cat > "$INTERNAL/index.md" << 'LANDING'
---
title: Internal Documentation
editLink: false
layout: doc
---

# IntegrateWise Internal Documentation

> Product docs for the System of Context, governed AI, and connected operations.

---

## 🕸️ Architecture

Learn how IntegrateWise links accounts, people, documents, signals, and actions into one operating model. The Spine, Entity 360, Twin Trigger Engine, and 8-stage pipeline.

→ [Architecture Decisions](/internal/architecture/ARCHITECTURE_DECISIONS)
→ [System Data Flow](/internal/architecture/SYSTEM_DATA_FLOW_AND_TWIN_ACTIVATION)
→ [Entity 360 + Twin Scoring](/internal/architecture/ENTITY_360_TWIN_TRIGGER_SCORING_GUARDRAILS)

## 📦 Product

What we sell. Features, solutions, product family, and the complete platform spec.

→ [Platform Features (Complete)](/internal/product/PLATFORM_FEATURES_COMPLETE)
→ [Solutions & Product](/internal/product/SOLUTIONS_AND_PRODUCT)

## 🛡️ Governed AI

See how proposals stay evidence-backed, approval-gated, and traceable before any action reaches a system or customer.

→ [AI Memory & Triage](/internal/architecture/FLOW_C_AI_MEMORY_AND_TRIAGE)
→ [Spine → Twin Boundary](/internal/architecture/SPINE_TO_TWIN_BOUNDARY)

## 🔌 Connectors & GTM

Understand how CRM, support, billing, collaboration, and internal knowledge systems come together. Plus go-to-market strategy for India SMB, UAE FZE, and Enterprise.

→ [India SMB GTM](/internal/gtm/INDIA_SMB_GTM_AND_CONNECTOR_ROADMAP)
→ [UAE FZE GTM](/internal/gtm/UAE_SMB_FZE_GTM)

## 🧪 Operations & Rollout

Use onboarding, implementation, and governance docs to roll IntegrateWise into revenue and operations teams.

→ [Deployment Guide](/internal/operations/DEPLOYMENT_GUIDE)
→ [Developer Onboarding](/internal/operations/DEVELOPER_ONBOARDING)
→ [API Reference](/internal/operations/API_REFERENCE)

## 📋 Playbooks & Runbooks

Step-by-step guides for common operations and incident response.

→ [Connector Go-Live](/internal/playbooks/connector-go-live)
→ [Incident Response](/internal/runbooks/incident-response)

---

::: info Core Principles
- **Product first**: the workspace and outcomes should be easy to understand on first read.
- **Context before intelligence**: AI only becomes useful when the underlying context is linked and stable.
- **Govern before act**: recommendations stay reviewable, explainable, and auditable.
- **Connectors inform, but do not define truth**: source systems contribute signals while IntegrateWise maintains the operating model.
:::

---

*Need help? Email: connect@integratewise.ai*
LANDING

echo "   ✓ index.md generated"

# ─── Summary ─────────────────────────────────────────────────────────────────
TOTAL=$(find "$INTERNAL" -name "*.md" | wc -l | tr -d ' ')
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Sync Complete                               ║"
echo "╠══════════════════════════════════════════════╣"
printf "║  Updated:  %-4s pages                        ║\n" "$SYNCED"
printf "║  Unchanged:%-4s pages                        ║\n" "$SKIPPED"
printf "║  Removed:  %-4s stale pages                  ║\n" "$DELETED"
printf "║  Total:    %-4s pages in VitePress            ║\n" "$TOTAL"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "To use in VitePress config.ts:"
echo ""
echo "  import { internalSidebar } from '../docs/internal/_sidebar'"
echo ""
echo "  export default defineConfig({"
echo "    themeConfig: {"
echo "      sidebar: {"
echo "        '/internal/': internalSidebar"
echo "      }"
echo "    }"
echo "  })"
echo ""
echo "Next:"
echo "  cd $DOCS_REPO && git add docs/internal/ && git commit -m 'sync: internal docs' && git push"

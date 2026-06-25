#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────
# detect-deploy-targets.sh
#
# Determines which Cloudflare Workers need deployment based on changed
# files between HEAD~1 and HEAD.
#
# Uses the v3.6 consolidated worker architecture dependency map so that
# changing a sub-service (e.g. normalizer) also deploys its parent
# consolidated worker (pipeline).
#
# Shared package changes (packages/**) trigger ALL worker deploys.
#
# Output: JSON array of service directory names, e.g. ["gateway","pipeline"]
# Compatible with bash 3.2+ (macOS) — no associative arrays.
# ────────────────────────────────────────────────────────────────────────
set -eo pipefail

# All deployable workers (have their own wrangler.toml)
ALL_WORKERS="gateway pipeline connector connector-sync intelligence knowledge workflow l2 tenants think admin billing webhook-ingress mcp-connector"

# ── Consolidated worker dependency map ──────────────────────────────────
# Returns the parent consolidated worker for a sub-service, or empty.
#
# v3.6 Architecture:
#   gateway     bundles: admin, billing, tenants (via relative imports)
#   pipeline    bundles: normalizer, spine-v2
#   connector   bundles: loader, mcp-connector, store
#   intelligence bundles: think, act, govern, agents
get_parent() {
  case "$1" in
    admin|billing|tenants)    echo "gateway" ;;
    normalizer|spine-v2)      echo "pipeline" ;;
    loader|store)             echo "connector" ;;
    mcp-connector)            echo "connector" ;;
    think|act|govern|agents)  echo "intelligence" ;;
    *)                        echo "" ;;
  esac
}

# Check if a service is directly deployable (has wrangler.toml)
is_deployable() {
  case "$1" in
    gateway|pipeline|connector|connector-sync|intelligence|knowledge|workflow|l2|tenants|think|admin|billing|webhook-ingress|mcp-connector)
      return 0 ;;
    *)
      return 1 ;;
  esac
}

# ── Get changed files ───────────────────────────────────────────────────
CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED" ]; then
  echo '[]'
  exit 0
fi

# ── Detect what changed ─────────────────────────────────────────────────
DEPLOY_LIST=""

# Check if shared packages changed
PACKAGES_CHANGED=false
echo "$CHANGED" | while IFS= read -r file; do
  case "$file" in
    packages/*|pnpm-lock.yaml)
      # Signal to parent shell via temp file (subshell limitation)
      echo "true" > /tmp/_iw_pkg_changed
      break
      ;;
  esac
done

if [ -f /tmp/_iw_pkg_changed ]; then
  PACKAGES_CHANGED=true
  rm -f /tmp/_iw_pkg_changed
fi

if [ "$PACKAGES_CHANGED" = "true" ]; then
  # Shared packages changed → deploy ALL workers
  DEPLOY_LIST="$ALL_WORKERS"
else
  # Only deploy services whose code changed + their parents
  while IFS= read -r file; do
    case "$file" in
      services/*)
        # Extract: services/gateway/src/index.ts → gateway
        svc=$(echo "$file" | cut -d/ -f2)

        # Add this service if it's directly deployable
        if is_deployable "$svc"; then
          case " $DEPLOY_LIST " in
            *" $svc "*) ;; # already in list
            *) DEPLOY_LIST="$DEPLOY_LIST $svc" ;;
          esac
        fi

        # If it's a sub-service, also deploy the parent consolidated worker
        parent=$(get_parent "$svc")
        if [ -n "$parent" ]; then
          case " $DEPLOY_LIST " in
            *" $parent "*) ;; # already in list
            *) DEPLOY_LIST="$DEPLOY_LIST $parent" ;;
          esac
        fi
        ;;
    esac
  done <<< "$CHANGED"
fi

# ── Output as JSON array ────────────────────────────────────────────────
# Trim whitespace
DEPLOY_LIST=$(echo "$DEPLOY_LIST" | xargs)

if [ -z "$DEPLOY_LIST" ]; then
  echo '[]'
else
  # Build JSON array without jq (portable)
  JSON="["
  FIRST=true
  for svc in $DEPLOY_LIST; do
    if [ "$FIRST" = "true" ]; then
      FIRST=false
    else
      JSON="$JSON,"
    fi
    JSON="$JSON\"$svc\""
  done
  JSON="$JSON]"
  echo "$JSON"
fi

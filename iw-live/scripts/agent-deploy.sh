#!/bin/bash
# agent-deploy.sh
# Wraps wrangler deploy to auto-catch errors and notify the Triage Bot / Agent

set -e

SERVICE_PATH=$1
ENVIRONMENT=${2:-staging}

if [ -z "$SERVICE_PATH" ]; then
  echo "Usage: ./scripts/agent-deploy.sh <path_to_service> [environment]"
  echo "Example: ./scripts/agent-deploy.sh services/pipeline staging"
  exit 1
fi

echo "[agent-deploy] Deploying $SERVICE_PATH to --env $ENVIRONMENT..."

cd "$SERVICE_PATH"

# Unset token to rely on correct OAuth / local secrets logic per Doctrine
unset CLOUDFLARE_API_TOKEN

# Capture both stdout and stderr
set +e
OUTPUT=$(wrangler deploy --env "$ENVIRONMENT" 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ]; then
  echo "=========================================================="
  echo "[agent-deploy] DEPLOYMENT FAILED for $SERVICE_PATH"
  echo "=========================================================="
  echo "$OUTPUT"
  echo "=========================================================="
  
  # Check if the error is a missing secret or binding
  if echo "$OUTPUT" | grep -q "Missing secret" || echo "$OUTPUT" | grep -q "binding"; then
    echo "[agent-deploy] DETECTED MISSING BINDING OR SECRET."
    echo "[agent-deploy] Action Required: Review wrangler.toml and secrets_store_secrets."
  fi
  
  # In a fully automated setup, we would POST this to the Triage Bot webhook here.
  # For now, it outputs cleanly for the AI Agent to observe in the terminal.
  exit $EXIT_CODE
else
  echo "[agent-deploy] SUCCESS!"
  echo "$OUTPUT"
fi

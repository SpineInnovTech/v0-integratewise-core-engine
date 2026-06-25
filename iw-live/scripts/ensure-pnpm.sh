#!/usr/bin/env bash
# Ensure pnpm is available (via Corepack). Run from repo root.
# Usage: ./scripts/ensure-pnpm.sh   OR   npm run ensure-pnpm

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v pnpm >/dev/null 2>&1; then
  echo "pnpm already available: $(pnpm --version)"
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install it first:"
  echo "  https://nodejs.org/ (LTS)  |  brew install node  |  nvm install --lts"
  exit 1
fi

# Prefer version from package.json "packageManager": "pnpm@9.0.0"
PNPM_VER="9.0.0"
if [ -f package.json ] && grep -q '"packageManager"' package.json; then
  if sed -n 's/.*"packageManager"[[:space:]]*:[[:space:]]*"pnpm@\([^"]*\)".*/\1/p' package.json | grep -q .; then
    PNPM_VER=$(sed -n 's/.*"packageManager"[[:space:]]*:[[:space:]]*"pnpm@\([^"]*\)".*/\1/p' package.json)
  fi
fi

if command -v corepack >/dev/null 2>&1; then
  echo "Enabling pnpm via Corepack (pnpm@${PNPM_VER})..."
  corepack enable
  corepack prepare "pnpm@${PNPM_VER}" --activate
  echo "pnpm is now available: $(pnpm --version)"
else
  echo "Corepack not found (Node 16.9+). Install pnpm manually:"
  echo "  npm install -g pnpm"
  exit 1
fi

#!/bin/bash
# Validate Configuration Files
# Run this script to check configuration consistency across the monorepo

echo "🔍 Validating IntegrateWise Configuration..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check root symlinks
echo "📁 Checking root symlinks..."
for file in tsconfig.base.json turbo.json pnpm-workspace.yaml vercel.json firebase.json; do
  if [ -L "$file" ]; then
    if [ -e "$file" ]; then
      echo -e "${GREEN}✅${NC} $file -> $(readlink $file)"
    else
      echo -e "${RED}❌${NC} $file -> broken link"
      ((ERRORS++))
    fi
  else
    echo -e "${RED}❌${NC} $file missing (should be symlink)"
    ((ERRORS++))
  fi
done

echo ""
echo "🔧 Checking service configurations..."
for service in services/*/; do
  name=$(basename $service)
  
  # Check wrangler.toml
  if [ -f "$service/wrangler.toml" ]; then
    echo -e "${GREEN}✅${NC} $name/wrangler.toml"
  else
    echo -e "${YELLOW}⚠️${NC} $name/wrangler.toml missing"
    ((WARNINGS++))
  fi
  
  # Check tsconfig.json
  if [ -f "$service/tsconfig.json" ]; then
    # Check extends path
    if grep -q 'configs/root/tsconfig.base.json' "$service/tsconfig.json" 2>/dev/null; then
      echo -e "${GREEN}✅${NC} $name/tsconfig.json (correct extends)"
    else
      echo -e "${YELLOW}⚠️${NC} $name/tsconfig.json (legacy extends path)"
      ((WARNINGS++))
    fi
  fi
done

echo ""
echo "📦 Checking package configurations..."
for pkg in packages/*/; do
  name=$(basename $pkg)
  
  # Check tsconfig.json
  if [ -f "$pkg/tsconfig.json" ]; then
    if grep -q 'configs/root/tsconfig.base.json' "$pkg/tsconfig.json" 2>/dev/null; then
      echo -e "${GREEN}✅${NC} $name/tsconfig.json (correct extends)"
    else
      echo -e "${YELLOW}⚠️${NC} $name/tsconfig.json (legacy extends path)"
      ((WARNINGS++))
    fi
  fi
  
  # Check package.json
  if [ -f "$pkg/package.json" ]; then
    echo -e "${GREEN}✅${NC} $name/package.json"
  else
    echo -e "${RED}❌${NC} $name/package.json missing"
    ((ERRORS++))
  fi
done

echo ""
echo "📊 Summary:"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All critical configurations valid!${NC}"
  exit 0
else
  echo -e "${RED}❌ Configuration errors found. Please fix.${NC}"
  exit 1
fi

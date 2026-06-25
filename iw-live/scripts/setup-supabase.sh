#!/bin/bash
# ============================================================================
# Setup Supabase Project for IntegrateWise
# ============================================================================
# This script helps you:
# 1. Check Supabase connection
# 2. Run migrations
# 3. Seed initial data
# 4. Verify setup
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get Supabase credentials
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║           IntegrateWise - Supabase Setup                             ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Check for .env.local
if [ -f "apps/web/.env.local" ]; then
    source apps/web/.env.local
    echo -e "${GREEN}✓ Found .env.local${NC}"
else
    echo -e "${YELLOW}⚠ .env.local not found${NC}"
    echo "Create it first:"
    echo "  cp apps/web/.env.local.example apps/web/.env.local"
    echo "  # Edit with your Supabase credentials"
    exit 1
fi

# Verify required vars
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: Missing Supabase credentials in .env.local${NC}"
    echo "Required:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's|https://||' | sed 's/\.supabase\.co//')
DB_HOST="db.${PROJECT_REF}.supabase.co"
DIRECT_URL="postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${DB_HOST}:5432/postgres"

echo ""
echo -e "${BLUE}Project: ${PROJECT_REF}${NC}"
echo ""

# ============================================================================
# Step 1: Test Connection
# ============================================================================
echo -e "${BLUE}Step 1: Testing Supabase connection...${NC}"

if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ psql not found. Skipping direct DB test.${NC}"
    echo "  Install PostgreSQL client:"
    echo "    macOS: brew install postgresql"
    echo "    Ubuntu: sudo apt install postgresql-client"
else
    if psql "$DIRECT_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${RED}✗ Database connection failed${NC}"
        echo "Check your SUPABASE_SERVICE_ROLE_KEY"
        exit 1
    fi
fi

# ============================================================================
# Step 2: Run Migrations
# ============================================================================
echo ""
echo -e "${BLUE}Step 2: Running migrations...${NC}"

if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ Cannot run migrations (psql not installed)${NC}"
    echo "Manually run via Supabase Dashboard:"
    echo "  1. Go to https://app.supabase.com/project/${PROJECT_REF}"
    echo "  2. Open SQL Editor"
    echo "  3. Run: sql-migrations/001_supabase_schema.sql"
else
    # Run core migration
    echo -e "${BLUE}  Running 001_supabase_schema.sql...${NC}"
    if psql "$DIRECT_URL" -f sql-migrations/001_supabase_schema.sql > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Core schema created${NC}"
    else
        echo -e "${RED}  ✗ Migration failed${NC}"
        echo "  Run manually via Supabase Dashboard SQL Editor"
    fi
    
    # Run RBAC migration
    if [ -f "sql-migrations/031_rbac_system.sql" ]; then
        echo -e "${BLUE}  Running 031_rbac_system.sql...${NC}"
        if psql "$DIRECT_URL" -f sql-migrations/031_rbac_system.sql > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ RBAC system created${NC}"
        else
            echo -e "${YELLOW}  ⚠ RBAC migration skipped (may already exist)${NC}"
        fi
    fi
fi

# ============================================================================
# Step 3: Verify Tables
# ============================================================================
echo ""
echo -e "${BLUE}Step 3: Verifying tables...${NC}"

if command -v psql &> /dev/null; then
    TABLE_COUNT=$(psql "$DIRECT_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    echo -e "${GREEN}✓ Found ${TABLE_COUNT} tables${NC}"
    
    # List key tables
    echo ""
    echo "Key tables:"
    psql "$DIRECT_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('tenants', 'profiles', 'audit_log', 'base_buckets') ORDER BY table_name;" 2>/dev/null || true
else
    echo "Install psql to verify tables"
fi

# ============================================================================
# Step 4: Test Web Connection
# ============================================================================
echo ""
echo -e "${BLUE}Step 4: Testing web connection...${NC}"
echo ""
echo "Start the dev server and test:"
echo "  cd apps/web"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000/test"
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                      Setup Summary                                    ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Supabase project: ${PROJECT_REF}${NC}"
echo -e "${GREEN}✓ Database URL: ${NEXT_PUBLIC_SUPABASE_URL}${NC}"
echo ""
echo "Next steps:"
echo "  1. cd apps/web"
echo "  2. npm install"
echo "  3. npm run dev"
echo "  4. Open http://localhost:3000/test"
echo ""
echo "Supabase Dashboard:"
echo "  https://app.supabase.com/project/${PROJECT_REF}"
echo ""

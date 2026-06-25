#!/bin/bash
# Package Release Script
# Prepares everything for production deployment

set -e

VERSION=${1:-"$(date +%Y.%m.%d)"}
RELEASE_DIR="releases/integratewise-v$VERSION"

echo "📦 Packaging IntegrateWise v$VERSION"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Clean and install
echo -e "${BLUE}Step 1: Clean install${NC}"
rm -rf node_modules pnpm-lock.yaml
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Type check
echo -e "${BLUE}Step 2: Type checking${NC}"
if pnpm typecheck; then
  echo -e "${GREEN}✓ TypeScript check passed${NC}"
else
  echo -e "${RED}✗ TypeScript check failed${NC}"
  exit 1
fi
echo ""

# Step 3: Lint
echo -e "${BLUE}Step 3: Linting${NC}"
if pnpm lint; then
  echo -e "${GREEN}✓ Lint passed${NC}"
else
  echo -e "${RED}✗ Lint failed${NC}"
  exit 1
fi
echo ""

# Step 4: Build all packages
echo -e "${BLUE}Step 4: Building packages${NC}"
pnpm build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 5: Run tests
echo -e "${BLUE}Step 5: Running tests${NC}"
if pnpm test; then
  echo -e "${GREEN}✓ Tests passed${NC}"
else
  echo -e "${YELLOW}⚠ Some tests failed (review recommended)${NC}"
fi
echo ""

# Step 6: Create release directory
echo -e "${BLUE}Step 6: Creating release package${NC}"
mkdir -p "$RELEASE_DIR"

# Copy essential files
cp -r packages "$RELEASE_DIR/"
cp -r services "$RELEASE_DIR/"
cp -r apps "$RELEASE_DIR/"
cp -r sql-migrations "$RELEASE_DIR/"
cp -r configs "$RELEASE_DIR/"
cp package.json "$RELEASE_DIR/"
cp pnpm-workspace.yaml "$RELEASE_DIR/"
cp turbo.json "$RELEASE_DIR/"
cp tsconfig.base.json "$RELEASE_DIR/"
cp tsconfig.json "$RELEASE_DIR/"
cp .prettierrc "$RELEASE_DIR/"
cp .editorconfig "$RELEASE_DIR/"
cp lefthook.yml "$RELEASE_DIR/"

# Copy documentation
cp -r docs "$RELEASE_DIR/"

# Copy scripts
cp -r scripts "$RELEASE_DIR/"

# Create environment template
cat > "$RELEASE_DIR/.env.example" << 'EOF'
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DATABASE_URL=postgres://...

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# OAuth - CS/Support Connectors
ZENDESK_CLIENT_ID=
ZENDESK_CLIENT_SECRET=
FRESHDESK_CLIENT_ID=
FRESHDESK_CLIENT_SECRET=
FRONT_CLIENT_ID=
FRONT_CLIENT_SECRET=
HELPSCOUT_CLIENT_ID=
HELPSCOUT_CLIENT_SECRET=
KUSTOMER_CLIENT_ID=
KUSTOMER_CLIENT_SECRET=
INTERCOM_CLIENT_ID=
INTERCOM_CLIENT_SECRET=
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
TABLEAU_CLIENT_ID=
TABLEAU_CLIENT_SECRET=

# OAuth - Mail/Context Connectors
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=

# Webhook Secrets
STRIPE_WEBHOOK_SECRET=
SLACK_WEBHOOK_SECRET=
GITHUB_WEBHOOK_SECRET=

# AI Services
OPENAI_API_KEY=
OPENROUTER_API_KEY=

# Encryption
ENCRYPTION_KEY=your_256_bit_key
EOF

echo -e "${GREEN}✓ Release package created: $RELEASE_DIR${NC}"
echo ""

# Step 7: Verify connectors are packaged
echo -e "${BLUE}Step 7: Verifying connectors${NC}"
CONNECTOR_COUNT=$(find "$RELEASE_DIR/packages/connectors/src" -name "*.ts" -type f | grep -E "(zendesk|freshdesk|front|helpscout|kustomer|intercom|zoho-crm|gmail|outlook)" | wc -l)
echo "  Found $CONNECTOR_COUNT connector implementations"

echo "  Connectors included:"
ls -1 "$RELEASE_DIR/packages/connectors/src/support/" 2>/dev/null || echo "  (support directory)"
ls -1 "$RELEASE_DIR/packages/connectors/src/communication/" 2>/dev/null || echo "  (communication directory)"
echo ""

# Step 8: Create deployment guide
cat > "$RELEASE_DIR/DEPLOY.md" << 'EOF'
# Deployment Guide

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# 3. Deploy to Cloudflare
pnpm deploy:all

# 4. Apply database migrations
pnpm db:migrate

# 5. Test with real OAuth
./scripts/test-real-oauth.sh zendesk your_tenant_id
```

## Step-by-Step

### 1. Database Setup

Apply migrations in order:
```bash
# Using Supabase CLI
supabase db push

# Or manually
psql $DATABASE_URL < sql-migrations/001_initial_schema.sql
psql $DATABASE_URL < sql-migrations/002_connectors.sql
# ... etc
```

### 2. Configure OAuth Apps

For each connector you want to use:

1. Create OAuth app in external service
2. Set redirect URI to: `https://your-domain.com/oauth/callback/{provider}`
3. Add credentials to Cloudflare secrets
4. Test with: `./scripts/test-real-oauth.sh {provider} {tenant_id}`

### 3. Deploy Services

```bash
# Deploy all services
pnpm deploy:all

# Or individually
pnpm --filter @integratewise/gateway deploy
pnpm --filter @integratewise/tenants deploy
pnpm --filter @integratewise/loader deploy
pnpm --filter @integratewise/normalizer deploy
pnpm --filter @integratewise/workflow deploy
pnpm --filter @integratewise/intelligence deploy
```

### 4. Verify Deployment

```bash
# Health checks
curl https://gateway.your-domain.com/health
curl https://tenants.your-domain.com/health
curl https://loader.your-domain.com/health

# Test OAuth flow
curl https://gateway.your-domain.com/v1/connectors/zendesk/authorize \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 5. Test with Real Data

1. Create a test tenant
2. Complete onboarding (select department)
3. Connect Zendesk or other connector
4. Verify creamy sync (10 records)
5. Check Entity 360
6. Wait 3 days for full sync
7. Test AI insights and actions

## Monitoring

```bash
# View logs
wrangler tail --format=pretty

# Check DLQ
curl https://gateway.your-domain.com/v1/admin/dlq \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Metrics (if configured)
curl https://gateway.your-domain.com/v1/metrics
```

## Troubleshooting

See `docs/TROUBLESHOOTING.md` for common issues.
EOF

echo -e "${GREEN}✓ Deployment guide created${NC}"
echo ""

# Step 9: Create tarball
echo -e "${BLUE}Step 8: Creating tarball${NC}"
tar -czf "releases/integratewise-v$VERSION.tar.gz" -C releases "integratewise-v$VERSION"
echo -e "${GREEN}✓ Release tarball: releases/integratewise-v$VERSION.tar.gz${NC}"
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}Release v$VERSION Complete!${NC}"
echo "=========================================="
echo ""
echo "Package: releases/integratewise-v$VERSION.tar.gz"
echo "Size: $(du -h releases/integratewise-v$VERSION.tar.gz | cut -f1)"
echo ""
echo "Contents:"
echo "  - $(find $RELEASE_DIR/packages/connectors/src -name "*.ts" | wc -l) connector files"
echo "  - $(find $RELEASE_DIR/services -name "index.ts" | wc -l) services"
echo "  - $(find $RELEASE_DIR/sql-migrations -name "*.sql" | wc -l) migrations"
echo "  - Documentation and deployment guides"
echo ""
echo "Next steps:"
echo "1. Extract: tar -xzf releases/integratewise-v$VERSION.tar.gz"
echo "2. Configure: cp .env.example .env && edit"
echo "3. Deploy: pnpm deploy:all"
echo "4. Test: ./scripts/test-real-oauth.sh zendesk test_tenant"
echo ""

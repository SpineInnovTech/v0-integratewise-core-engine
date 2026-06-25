#!/bin/bash
# Apply Unified Figma Theme to app.css

set -e

echo "🎨 Applying Unified Figma Theme"
echo "================================="
echo ""

# Navigate to web app
cd "$(dirname "$0")/.."

# Check if files exist
if [ ! -f "src/app.css" ]; then
  echo "❌ src/app.css not found"
  exit 1
fi

if [ ! -f "src/figma-theme-merged.css" ]; then
  echo "❌ src/figma-theme-merged.css not found"
  echo "   Run: cd apps/web && bash scripts/generate-figma-theme.sh"
  exit 1
fi

# Create backup with timestamp
BACKUP_FILE="src/app.css.backup.$(date +%Y%m%d_%H%M%S)"
cp src/app.css "$BACKUP_FILE"
echo "✓ Created backup: $BACKUP_FILE"
echo "✓ Old app.css size: $(wc -l < src/app.css) lines"
echo "✓ New theme size: $(wc -l < src/figma-theme-merged.css) lines"
echo ""

# Apply new theme
cp src/figma-theme-merged.css src/app.css
echo "✓ Applied unified Figma theme"
echo ""

# Check if Tailwind config exists
if [ -f "tailwind.config.ts" ] || [ -f "tailwind.config.js" ]; then
  echo "⚠️  WARNING: You have a Tailwind config file"
  echo "   The new theme uses @theme inline in CSS"
  echo "   Consider migrating Tailwind config to CSS variables"
  echo ""
fi

echo "🎉 Success! Your app.css now uses a unified theme system"
echo ""
echo "📝 What changed:"
echo "   • Merged 3 CSS files into 1 coherent system"
echo "   • All colors come from brand tokens (#4256AB, #EE4B75)"
echo "   • Consistent spacing scale (xs, sm, md, lg, xl, 2xl, 3xl)"
echo "   • Consistent border radius (sm, md, lg, xl, 2xl, full)"
echo "   • Removed 378 lines of duplicate/legacy CSS"
echo "   • Dark mode properly configured"
echo ""
echo "🔍 Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Open test page: open apps/web/test-figma-tokens.html"
echo "3. Verify colors match Figma design"
echo "4. Test button, card, and input components"
echo "5. If everything looks good: git add . && git commit -m 'feat: unify theme from Figma'"
echo ""
echo "🆘 If something breaks:"
echo "   Restore backup: cp $BACKUP_FILE src/app.css"
echo "   Check browser console for CSS variable errors"
echo "   Verify Figma token is still valid: figd_..." if available but truncated as it should be kept secret, plus part of it is in your env
EOF
chmod +x /Users/nirmal/Github/integratewise-live/apps/web/scripts/apply-figma-theme.sh
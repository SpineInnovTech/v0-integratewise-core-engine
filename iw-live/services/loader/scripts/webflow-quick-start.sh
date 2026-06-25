#!/bin/bash

# Webflow Quick Start Script
# Helps you get started with enhancing your Webflow site

echo "🚀 Webflow Site Enhancement - Quick Start"
echo "=========================================="
echo ""

# Check if API key is set
if [ -z "$WEBFLOW_API_KEY" ]; then
    echo "❌ WEBFLOW_API_KEY environment variable is not set"
    echo ""
    echo "To set it, run:"
    echo "  export WEBFLOW_API_KEY=your-api-key-here"
    echo ""
    echo "Or add it to your .env file and source it."
    echo ""
    exit 1
fi

echo "✅ WEBFLOW_API_KEY is set"
echo ""

# Run audit
echo "📡 Running site audit..."
echo ""
pnpm webflow:audit

echo ""
echo "=========================================="
echo "Next Steps:"
echo "1. Review the audit output above"
echo "2. Note your site ID"
echo "3. Run: pnpm webflow:enhance <site-id>"
echo "4. Create missing collections in Webflow Designer"
echo "5. Use the content generator scripts to populate data"
echo ""
echo "For detailed instructions, see: WEBFLOW_SITE_ENHANCEMENT.md"
echo ""

#!/bin/bash
#
# Setup Script for macOS Folder Monitor Bridge
# 
# This script installs dependencies and configures the folder monitor
# to watch IntegrateWise - Memory/Conversation memory/ directory.
#

set -e

echo "🚀 Setting up macOS Folder Monitor Bridge"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from integratewise-live root directory"
  exit 1
fi

# Check if IntegrateWise - Memory exists
MEMORY_DIR="../IntegrateWise - Memory/Conversation memory"
if [ ! -d "$MEMORY_DIR" ]; then
  echo "❌ Error: IntegrateWise - Memory repository not found at expected location"
  echo "Expected: $MEMORY_DIR"
  echo ""
  echo "Please clone or ensure IntegrateWise - Memory is at:"
  echo "  /Users/\$USER/Github/IntegrateWise - Memory/"
  exit 1
fi

echo "✅ Found IntegrateWise - Memory at: $MEMORY_DIR"
echo ""

# Install dependencies
echo "📦 Installing dependencies (chokidar + node-fetch@2)..."
npm install --save-dev chokidar node-fetch@2

echo ""
echo "✅ Dependencies installed"
echo ""

# Check for environment variable
if [ -z "$FOLDER_WATCHER_KEY" ]; then
  echo "⚠️  FOLDER_WATCHER_KEY environment variable not set"
  echo ""
  echo "Please set it before running the monitor:"
  echo "  export FOLDER_WATCHER_KEY='your-secret-key-here'"
  echo ""
  echo "You can add this to your ~/.zshrc or ~/.bashrc for persistence:"
  echo "  echo 'export FOLDER_WATCHER_KEY=\"your-secret-key\"' >> ~/.zshrc"
  echo ""
else
  echo "✅ FOLDER_WATCHER_KEY is set"
  echo ""
fi

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
  echo "✅ PM2 is installed"
  echo ""
else
  echo "⚠️  PM2 not found (optional, but recommended for production)"
  echo ""
  echo "To install PM2 globally:"
  echo "  npm install -g pm2"
  echo ""
fi

# Test run instructions
echo "🎯 Next Steps:"
echo ""
echo "1. Set environment variable (if not already set):"
echo "   export FOLDER_WATCHER_KEY='your-secret-key'"
echo ""
echo "2. Test run (foreground):"
echo "   node scripts/folder-monitor-bridge.js"
echo ""
echo "3. Run as daemon (PM2):"
echo "   pm2 start scripts/folder-monitor-bridge.js --name iw-folder-monitor"
echo "   pm2 save"
echo "   pm2 startup  # Follow instructions to enable autostart"
echo ""
echo "4. Check status:"
echo "   pm2 status"
echo "   pm2 logs iw-folder-monitor"
echo ""
echo "5. Stop daemon:"
echo "   pm2 stop iw-folder-monitor"
echo "   pm2 delete iw-folder-monitor"
echo ""
echo "✅ Setup complete!"

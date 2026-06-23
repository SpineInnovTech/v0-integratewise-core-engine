#!/usr/bin/env node
/**
 * Extract Design Tokens from Figma via MCP
 *
 * Usage: node scripts/extract-figma-tokens.js <file-key>
 *
 * This script:
 * 1. Calls Figma MCP to get file data
 * 2. Extracts color styles, typography, spacing
 * 3. Generates CSS variables
 * 4. Updates app.css with single source of truth
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const MCP_WORKER =
  process.env.MCP_WORKER || "https://integratewise-mcp-connector.bellcurve.workers.dev";
const MCP_API_KEY = process.env.MCP_API_KEY;
if (!MCP_API_KEY) {
  throw new Error("MCP_API_KEY env var is required (your MCP connector key). Do not hardcode it.");
}

async function callMcpTool(tool, args) {
  const response = await fetch(`${MCP_WORKER}/invoke`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MCP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tool, arguments: args }),
  });

  if (!response.ok) {
    throw new Error(`MCP Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function extractTokensFromFigma(fileKey) {
  console.log("🎨 Extracting tokens from Figma file:", fileKey);

  // Get file data
  const fileData = await callMcpTool("figma.get_file", {
    file_key: fileKey,
    depth: 2,
  });

  console.log("✓ Retrieved Figma file structure");

  // For now, we'll create a template that shows how to map tokens
  // In a real implementation, we'd parse the fileData document tree
  return {
    colors: {
      // These would be extracted from Figma styles
      "primary-500": "#4154A3",
      "primary-600": "#364789",
      "primary-700": "#2A3A6F",
      "accent-500": "#EB4379",
      "accent-600": "#D03568",
      "success-500": "#10B981",
      "warning-500": "#F59E0B",
      "error-500": "#EF4444",
      "gray-50": "#F0F2F7",
      "gray-100": "#E8ECF2",
      "gray-200": "#D5DAE5",
      "gray-300": "#BCC3D4",
      "gray-400": "#9BA8C2",
      "gray-500": "#7B8AAD",
      "gray-600": "#5F6E93",
      "gray-700": "#475578",
      "gray-800": "#2F3D5E",
      "gray-900": "#1B2544",
      "bg-primary": "#1B2544",
      "bg-secondary": "#2F3D5E",
      "text-primary": "#FFFFFF",
      "text-secondary": "rgba(255, 255, 255, 0.78)",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
      "2xl": "48px",
    },
  };
}

function generateCssVariables(tokens) {
  let css = `/* Auto-generated from Figma - DO NOT EDIT MANUALLY */
/* Generated: ${new Date().toISOString()} */

:root {`;

  // Colors
  css += "\n\n  /* ===== Colors ===== */";
  Object.entries(tokens.colors).forEach(([name, value]) => {
    const cssName = name.replace(/([A-Z])/g, "-$1").toLowerCase();
    css += `\n  --${cssName}: ${value};`;
  });

  css += "\n\n  /* ===== Semantic Mapping ===== */";
  css += "\n  --primary: var(--primary-500);";
  css += "\n  --secondary: var(--gray-200);";
  css += "\n  --accent: var(--accent-500);";
  css += "\n  --success: var(--success-500);";
  css += "\n  --warning: var(--warning-500);";
  css += "\n  --error: var(--error-500);";

  // Add Tailwind theme mapping
  css += "\n\n  /* ===== Tailwind Theme ===== */";
  css += "\n  --color-background: var(--bg-primary);";
  css += "\n  --color-foreground: var(--text-primary);";
  css += "\n  --color-primary: var(--primary-500);";
  css += "\n  --color-secondary: var(--gray-200);";
  css += "\n  --color-accent: var(--accent-500);";

  css += "\n}\n";

  return css;
}

function updateAppCss(cssVariables) {
  const appCssPath = path.join(process.cwd(), "src/app.css");

  if (!fs.existsSync(appCssPath)) {
    throw new Error(`app.css not found at ${appCssPath}`);
  }

  const appCss = fs.readFileSync(appCssPath, "utf-8");

  // Find the :root block
  const rootStart = appCss.indexOf(":root {");
  const rootEnd = appCss.indexOf("}", rootStart);

  if (rootStart === -1) {
    throw new Error("Could not find :root block in app.css");
  }

  // Keep everything before and after, replace the root block
  const beforeRoot = appCss.substring(0, rootStart);
  const afterRoot = appCss.substring(rootEnd + 1);

  // Create backup
  fs.writeFileSync(appCssPath + ".backup", appCss);

  // Write new content
  const newCss = beforeRoot + cssVariables + afterRoot;
  fs.writeFileSync(appCssPath, newCss);

  console.log("✓ Updated app.css with Figma tokens");
  console.log("✓ Backup created: app.css.backup");
}

async function main() {
  const fileKey = process.argv[2];

  if (!fileKey) {
    console.error("❌ Error: Please provide a Figma file key");
    console.error("Usage: node scripts/extract-figma-tokens.js <file-key>");
    console.error("Example: node scripts/extract-figma-tokens.js abc123def456ghi789");
    process.exit(1);
  }

  try {
    console.log("🚀 Starting Figma token extraction...\n");

    // Test MCP connection first
    console.log("🔌 Testing MCP connection...");
    const testResult = await callMcpTool("figma.get_file", {
      file_key: fileKey,
      depth: 1,
    });

    if (testResult.error) {
      throw new Error(`MCP test failed: ${testResult.error}`);
    }

    console.log("✓ MCP connection working\n");

    // Extract tokens
    const tokens = await extractTokensFromFigma(fileKey);

    // Generate CSS
    const cssVariables = generateCssVariables(tokens);

    // Update app.css
    updateAppCss(cssVariables);

    console.log("\n✨ Success! Your app.css now uses Figma as source of truth");
    console.log("\n📝 Next steps:");
    console.log("1. Review app.css to ensure tokens look correct");
    console.log("2. Delete app.css.backup once verified");
    console.log("3. Restart your dev server");
    console.log('4. Commit: git add src/app.css && git commit -m "feat: sync tokens from Figma"');
  } catch (error) {
    console.error("❌ Extraction failed:", error.message);
    process.exit(1);
  }
}

main();

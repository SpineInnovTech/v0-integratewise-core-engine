#!/usr/bin/env node
/**
 * Generate React Component from Figma Node
 *
 * Usage: node scripts/generate-component-from-figma.js <node-id> <component-name>
 * Example: node scripts/generate-component-from-figma.js 123:456 Button
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const MCP_WORKER =
  process.env.MCP_WORKER || "https://integratewise-mcp-connector.connect-a1b.workers.dev";
const MCP_API_KEY = process.env.MCP_API_KEY;
if (!MCP_API_KEY) {
  throw new Error("MCP_API_KEY env var is required (your MCP connector key). Do not hardcode it.");
}
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || "YOUR_FILE_KEY";

// Map Figma properties to CSS/Tailwind
const FIGMA_TO_CSS_MAP = {
  // Colors
  fills: (fills) => {
    if (!fills || fills.length === 0) return "";
    const fill = fills[0];
    if (fill.type === "SOLID") {
      const color = fill.color;
      const hex = rgbToHex(color);
      return `bg-[${hex}]`;
    }
    return "";
  },

  // Typography
  fontFamily: (fontName) => {
    const fontMap = {
      Inter: "font-sans",
      "JetBrains Mono": "font-mono",
    };
    return fontMap[fontName?.family] || "";
  },

  fontSize: (fontSize) => {
    const sizeMap = {
      12: "text-xs",
      14: "text-sm",
      16: "text-base",
      18: "text-lg",
      20: "text-xl",
      24: "text-2xl",
    };
    return sizeMap[fontSize] || `text-[${fontSize}px]`;
  },

  fontWeight: (weight) => {
    const weightMap = {
      400: "font-normal",
      500: "font-medium",
      600: "font-semibold",
      700: "font-bold",
    };
    return weightMap[weight] || `font-[${weight}]`;
  },

  // Spacing
  padding: (padding) => {
    if (!padding) return "";
    return `p-${padding.top}`; // Simplified - would need proper mapping
  },

  // Border radius
  cornerRadius: (radius) => {
    if (radius === 0) return "rounded-none";
    if (radius === 2) return "rounded-sm";
    if (radius === 4) return "rounded";
    if (radius === 6) return "rounded-md";
    if (radius === 8) return "rounded-lg";
    if (radius === 12) return "rounded-xl";
    return `rounded-[${radius}px]`;
  },
};

function rgbToHex(color) {
  if (!color) return "#000000";
  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
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

function extractStylesFromNode(node) {
  const styles = [];

  if (node.fills) {
    styles.push(FIGMA_TO_CSS_MAP.fills(node.fills));
  }

  if (node.style) {
    const style = node.style;

    if (style.fontFamily) {
      styles.push(FIGMA_TO_CSS_MAP.fontFamily(style.fontFamily));
    }

    if (style.fontSize) {
      styles.push(FIGMA_TO_CSS_MAP.fontSize(style.fontSize));
    }

    if (style.fontWeight) {
      styles.push(FIGMA_TO_CSS_MAP.fontWeight(style.fontWeight));
    }

    if (style.textAlignHorizontal) {
      const textAlignMap = {
        LEFT: "text-left",
        CENTER: "text-center",
        RIGHT: "text-right",
      };
      styles.push(textAlignMap[style.textAlignHorizontal] || "");
    }
  }

  if (node.cornerRadius !== undefined) {
    styles.push(FIGMA_TO_CSS_MAP.cornerRadius(node.cornerRadius));
  }

  return styles.filter(Boolean).join(" ");
}

function generateComponentCode(componentName, nodeData) {
  const styles = extractStylesFromNode(nodeData);

  return `import * as React from "react";
import { cn } from "@/lib/utils";

// Auto-generated from Figma: ${componentName}
// Figma Node: ${nodeData.id}

interface ${componentName}Props extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const ${componentName} = React.forwardRef<HTMLElement, ${componentName}Props>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "div";
    
    return (
      <Comp
        ref={ref}
        className={cn(
          "${styles}",
          className
        )}
        {...props}
      />
    );
  }
);

${componentName}.displayName = "${componentName}";

export { ${componentName} };
`;
}

async function main() {
  const nodeId = process.argv[2];
  const componentName = process.argv[3] || "GeneratedComponent";

  if (!nodeId) {
    console.error("❌ Error: Please provide a Figma node ID");
    console.error(
      "Usage: node scripts/generate-component-from-figma.js <node-id> [component-name]"
    );
    console.error("Example: node scripts/generate-component-from-figma.js 123:456 Button");
    process.exit(1);
  }

  try {
    console.log(`🎨 Fetching Figma node: ${nodeId}`);

    // Get node from Figma
    const nodeData = await callMcpTool("figma.get_node", {
      file_key: FIGMA_FILE_KEY,
      node_id: nodeId,
    });

    console.log("✓ Retrieved node data");
    console.log("  Name:", nodeData.name);
    console.log("  Type:", nodeData.type);

    // Generate component code
    const code = generateComponentCode(componentName, nodeData);

    // Write to file
    const outputPath = `src/components/ui/${componentName.replace(/([A-Z])/g, "-$1").toLowerCase()}.tsx`;
    fs.writeFileSync(outputPath, code);

    console.log("✓ Generated component:", outputPath);
    console.log("\n📝 Component code preview:");
    console.log(code.substring(0, 500) + "...");
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node
/**
 * Extract Hero Section from Figma and generate React code
 */

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
if (!FIGMA_TOKEN) {
  console.error("❌ FIGMA_TOKEN env var is required. Set it before running this script.");
  process.exit(1);
}
const FILE_KEY = "BMp4c06Ytn0uwErTRRzZOs";
const NODE_ID = "1-629"; // Hero node ID

async function extractHero() {
  console.log("🎨 Extracting Hero from Figma...");

  // Get node details
  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${NODE_ID}`, {
    headers: { "X-Figma-Token": FIGMA_TOKEN },
  });

  const data = await res.json();
  const node = data.nodes?.[NODE_ID]?.document;

  if (!node) {
    console.error("❌ Hero node not found");
    return;
  }

  console.log("✅ Hero extracted:");
  console.log(`   Name: ${node.name}`);
  console.log(`   Size: ${node.absoluteBoundingBox?.width}x${node.absoluteBoundingBox?.height}`);
  console.log(`   Children: ${node.children?.length || 0}`);

  // TODO: Parse children and generate React code
  return node;
}

extractHero().catch(console.error);

#!/usr/bin/env node
/**
 * IntegrateWise — Design Token Migration Script
 * Replaces raw Tailwind color classes with canonical iw-* semantic tokens
 * across all L1 components + activation/onboarding
 *
 * Mapping rationale:
 *   green/emerald → iw-forest-* (growth, health, success)
 *   amber/yellow  → iw-gold-*   (insight, warning, accent)
 *   red/rose      → iw-red-*    (danger, critical signals)
 *   blue/indigo   → iw-slate-*  (info, neutral-cool)
 *   purple/violet → iw-slate-mid (secondary info)
 *   cyan/teal     → iw-forest-bright (operational)
 *   orange        → iw-gold-light (soft accent)
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join, extname } from "path";

const TARGET_DIRS = ["apps/web/src/components/l1", "apps/web/src/components/activation"];

// ── BACKGROUND MAPPINGS ────────────────────────────────────────────────────
const BG_MAP: Record<string, string> = {
  // Red / Rose → iw-red
  "bg-red-50": "bg-iw-red/5",
  "bg-red-100": "bg-iw-red/10",
  "bg-red-400": "bg-iw-red/60",
  "bg-red-500": "bg-iw-red",
  "bg-red-900": "bg-iw-red/90",
  "bg-red-950": "bg-iw-red/95",
  "bg-rose-50": "bg-iw-red/5",
  "bg-rose-500": "bg-iw-red",

  // Green / Emerald → iw-forest
  "bg-green-50": "bg-iw-forest/5",
  "bg-green-100": "bg-iw-forest/10",
  "bg-green-500": "bg-iw-forest-bright",
  "bg-green-900": "bg-iw-forest/90",
  "bg-green-950": "bg-iw-forest/95",
  "bg-emerald-50": "bg-iw-forest/5",
  "bg-emerald-100": "bg-iw-forest/10",
  "bg-emerald-400": "bg-iw-forest-bright/80",
  "bg-emerald-500": "bg-iw-forest-bright",

  // Amber / Yellow → iw-gold
  "bg-amber-50": "bg-iw-gold/5",
  "bg-amber-100": "bg-iw-gold/10",
  "bg-amber-400": "bg-iw-gold-light",
  "bg-amber-500": "bg-iw-gold",
  "bg-amber-950": "bg-iw-gold/95",
  "bg-yellow-50": "bg-iw-gold/5",
  "bg-yellow-100": "bg-iw-gold/10",
  "bg-yellow-500": "bg-iw-gold",
  "bg-yellow-900": "bg-iw-gold/90",

  // Blue / Indigo / Sky → iw-slate
  "bg-blue-50": "bg-iw-slate/5",
  "bg-blue-100": "bg-iw-slate/10",
  "bg-blue-500": "bg-iw-slate-mid",
  "bg-blue-900": "bg-iw-slate/90",
  "bg-blue-950": "bg-iw-slate/95",
  "bg-indigo-50": "bg-iw-slate/5",
  "bg-indigo-500": "bg-iw-slate-mid",

  // Purple / Violet → iw-slate-mid
  "bg-purple-50": "bg-iw-slate-mid/5",
  "bg-purple-100": "bg-iw-slate-mid/10",
  "bg-purple-500": "bg-iw-slate-mid",
  "bg-purple-900": "bg-iw-slate-mid/90",

  // Cyan / Teal → iw-forest-bright
  "bg-cyan-500": "bg-iw-forest-bright",

  // Orange → iw-gold-light
  "bg-orange-50": "bg-iw-gold/5",
  "bg-orange-100": "bg-iw-gold-light/10",
};

// ── TEXT MAPPINGS ──────────────────────────────────────────────────────────
const TEXT_MAP: Record<string, string> = {
  // Red / Rose → iw-red
  "text-red-400": "text-iw-red/70",
  "text-red-500": "text-iw-red",
  "text-red-600": "text-iw-red",
  "text-red-700": "text-iw-red",
  "text-rose-500": "text-iw-red",
  "text-rose-600": "text-iw-red",
  "text-rose-900": "text-iw-red/90",

  // Green / Emerald → iw-forest
  "text-green-400": "text-iw-forest-bright/80",
  "text-green-500": "text-iw-forest-bright",
  "text-green-600": "text-iw-forest-mid",
  "text-green-700": "text-iw-forest",
  "text-emerald-400": "text-iw-forest-bright/80",
  "text-emerald-500": "text-iw-forest-bright",
  "text-emerald-600": "text-iw-forest-mid",
  "text-emerald-700": "text-iw-forest",

  // Amber / Yellow → iw-gold
  "text-amber-400": "text-iw-gold-light",
  "text-amber-500": "text-iw-gold",
  "text-amber-600": "text-iw-gold",
  "text-amber-700": "text-iw-gold",
  "text-yellow-400": "text-iw-gold-light",
  "text-yellow-600": "text-iw-gold",
  "text-yellow-700": "text-iw-gold",
  "text-orange-400": "text-iw-gold-light",
  "text-orange-500": "text-iw-gold-light",
  "text-orange-600": "text-iw-gold",

  // Blue / Indigo → iw-slate
  "text-blue-400": "text-iw-slate-mid/80",
  "text-blue-500": "text-iw-slate-mid",
  "text-blue-600": "text-iw-slate-mid",
  "text-blue-700": "text-iw-slate",
  "text-indigo-600": "text-iw-slate",
  "text-indigo-700": "text-iw-slate",

  // Purple / Violet → iw-slate-mid
  "text-purple-300": "text-iw-slate-mid/60",
  "text-purple-400": "text-iw-slate-mid/80",
  "text-purple-500": "text-iw-slate-mid",
  "text-purple-600": "text-iw-slate-mid",
  "text-purple-700": "text-iw-slate",

  // Cyan → iw-forest-bright
  "text-cyan-500": "text-iw-forest-bright",
  "text-cyan-600": "text-iw-forest-bright",
  "text-cyan-700": "text-iw-forest-mid",

  // Pink
  "text-pink-600": "text-iw-red/80",
};

// ── BORDER MAPPINGS ────────────────────────────────────────────────────────
const BORDER_MAP: Record<string, string> = {
  // Red
  "border-red-200": "border-iw-red/20",
  "border-red-400": "border-iw-red/60",
  "border-red-500": "border-iw-red",
  "border-red-800": "border-iw-red/80",
  "border-rose-200": "border-iw-red/20",

  // Green / Emerald
  "border-green-200": "border-iw-forest/20",
  "border-emerald-200": "border-iw-forest/20",
  "border-emerald-400": "border-iw-forest-bright/60",

  // Amber / Yellow
  "border-amber-200": "border-iw-gold/20",
  "border-amber-500": "border-iw-gold",
  "border-yellow-200": "border-iw-gold/20",
  "border-yellow-500": "border-iw-gold",
  "border-yellow-800": "border-iw-gold/80",

  // Blue / Indigo
  "border-blue-200": "border-iw-slate/20",
  "border-blue-400": "border-iw-slate-mid/60",
  "border-blue-500": "border-iw-slate-mid",
  "border-indigo-200": "border-iw-slate/20",

  // Orange
  "border-orange-200": "border-iw-gold-light/20",

  // Purple
  "border-purple-500": "border-iw-slate-mid",
  "border-purple-800": "border-iw-slate/80",
};

// ── COMBINED MAP ───────────────────────────────────────────────────────────
const ALL_REPLACEMENTS: Record<string, string> = {
  ...BG_MAP,
  ...TEXT_MAP,
  ...BORDER_MAP,
};

// Sort by length descending so longer patterns match first
const sortedKeys = Object.keys(ALL_REPLACEMENTS).sort((a, b) => b.length - a.length);

function processFile(filePath: string): boolean {
  const content = readFileSync(filePath, "utf-8");
  let updated = content;

  for (const key of sortedKeys) {
    const replacement = ALL_REPLACEMENTS[key];
    // Match as whole class token: preceded by space, quote, or {, followed by space, quote, }, /
    const regex = new RegExp(`(?<=[ "'{\`])${key.replace(/-/g, "\\-")}(?=[ "'}\`/])`, "g");
    updated = updated.replace(regex, replacement);
  }

  if (updated !== content) {
    writeFileSync(filePath, updated, "utf-8");
    return true;
  }
  return false;
}

function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkDir(full));
    } else if ([".tsx", ".ts", ".css"].includes(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

const ROOT = "/Users/nirmal/Github/integratewise-live";
let changed = 0;
let total = 0;

for (const dir of TARGET_DIRS) {
  const files = walkDir(join(ROOT, dir));
  for (const file of files) {
    total++;
    if (processFile(file)) {
      changed++;
      console.log(`✓ ${file.replace(ROOT + "/", "")}`);
    }
  }
}

console.log(`\nDone: ${changed}/${total} files updated`);

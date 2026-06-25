#!/usr/bin/env node

/**
 * Simple Neon Database Table Check Script
 * Checks how many tables exist in Neon database
 */

import { neon } from "@neondatabase/serverless";

const NEON_CONNECTION_STRING = process.env.NEON_CONNECTION_STRING || "";

async function checkTables() {
  console.log("🔍 Checking Neon Database Tables\n");
  console.log("=".repeat(50));

  const sql = neon(NEON_CONNECTION_STRING);

  try {
    console.log("🔌 Connecting to Neon...");

    // Get all tables in the database
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log(`✅ Found ${result.length} tables in Neon database:\n`);

    result.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    console.log(`\n📊 Total tables: ${result.length}`);

    if (result.length < 53) {
      console.log(`\n⚠️  Warning: Expected 53 tables (from Supabase), but found ${result.length}`);
      console.log("Some migrations may not have been applied to Neon.");
    } else if (result.length === 53) {
      console.log("\n✅ Table count matches Supabase!");
    } else {
      console.log(`\nℹ️  More tables in Neon (${result.length}) than Supabase (53)`);
    }
  } catch (error) {
    console.error("❌ Error connecting to database:", error.message);
    process.exit(1);
  }
}

checkTables();

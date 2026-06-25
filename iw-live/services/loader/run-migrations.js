#!/usr/bin/env node

/**
 * Neon Database Migration Runner
 * Applies all SQL migrations to Neon database
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const NEON_CONNECTION_STRING = process.env.DATABASE_URL;

if (!NEON_CONNECTION_STRING) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.error('Usage: DATABASE_URL="postgresql://..." node services/loader/run-migrations.js');
  process.exit(1);
}
const MIGRATIONS_DIR = join(process.cwd(), "..", "..", "sql-migrations");

async function runMigrations() {
  console.log("🚀 Running Neon Database Migrations\n");
  console.log("=".repeat(50));

  const sql = neon(NEON_CONNECTION_STRING);

  try {
    console.log("🔌 Connecting to Neon...");

    // Get all migration files
    const migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Sort to ensure proper order

    console.log(`📁 Found ${migrationFiles.length} migration files\n`);

    for (const file of migrationFiles) {
      console.log(`📄 Applying migration: ${file}`);

      const filePath = join(MIGRATIONS_DIR, file);
      const migrationSQL = readFileSync(filePath, "utf8");

      try {
        // Execute the migration SQL
        await sql`${migrationSQL}`;

        console.log(`✅ Applied ${file}`);
      } catch (error) {
        console.error(`❌ Failed to apply ${file}:`, error.message);
        // Continue with other migrations
      }
    }

    console.log("\n🔍 Verifying migration results...");

    // Check final table count
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log(`\n📊 Final table count: ${result.length}`);
    console.log("✅ Migration process completed!");
  } catch (error) {
    console.error("❌ Error during migration:", error.message);
    process.exit(1);
  }
}

runMigrations();

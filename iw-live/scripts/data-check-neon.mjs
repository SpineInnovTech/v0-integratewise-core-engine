#!/usr/bin/env node
/**
 * One-off data check for Neon DBs. Reads connection strings from env:
 *   DATABASE_URL_SPINE   - Spine database
 *   DATABASE_URL_NEONDB  - neondb database
 * Run: DATABASE_URL_SPINE="..." DATABASE_URL_NEONDB="..." node scripts/data-check-neon.mjs
 */

import pg from "pg";
const { Client } = pg;

async function runQuery(client, sql, params = []) {
  const res = await client.query(sql, params);
  return res.rows;
}

async function checkDatabase(label, connectionString) {
  if (!connectionString) {
    console.log(`\n--- ${label} ---\n(no URL provided)\n`);
    return;
  }
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`\n=== ${label} ===`);
    console.log("Connected successfully.\n");

    const tables = await runQuery(
      client,
      `SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
       ORDER BY table_schema, table_name`
    );
    console.log(`Tables (${tables.length}):`);
    if (tables.length === 0) {
      console.log("  (none)");
    } else {
      const counts = [];
      for (const { table_schema, table_name } of tables) {
        const fullName = table_schema === "public" ? table_name : `${table_schema}.${table_name}`;
        try {
          const [{ count }] = await runQuery(
            client,
            `SELECT count(*)::text as count FROM "${table_schema}"."${table_name}"`
          );
          counts.push({ table: fullName, count: count || "0" });
        } catch (e) {
          counts.push({ table: fullName, count: `err: ${e.message?.slice(0, 40)}` });
        }
      }
      const maxLen = Math.max(...counts.map((c) => c.table.length), 10);
      for (const { table, count } of counts) {
        console.log(`  ${table.padEnd(maxLen)}  ${count}`);
      }
    }

    const version = await runQuery(client, "SELECT version()");
    console.log("\nServer:", version[0]?.version?.split("\n")[0] ?? "");
  } catch (err) {
    console.error(`${label} error:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  const spineUrl = process.env.DATABASE_URL_SPINE;
  const neondbUrl = process.env.DATABASE_URL_NEONDB;

  await checkDatabase("Database: Spine", spineUrl);
  await checkDatabase("Database: neondb", neondbUrl);

  console.log("\nDone.\n");
}

main();

/**
 * Database Shim for Knowledge Service
 *
 * Intercepts Postgres SQL queries and routes both reads and writes
 * directly to the D1 SQLite database binding `env.DB`.
 */

export function neonShim(env: any) {
  return async (strings: TemplateStringsArray, ...values: any[]) => {
    // 1. Reconstruct the SQL query with placeholders
    let query = "";
    for (let i = 0; i < strings.length; i++) {
      query += strings[i];
      if (i < values.length) {
        query += `?${i + 1}`;
      }
    }

    const upperQuery = query.trim().toUpperCase();
    const isSelect = upperQuery.startsWith("SELECT");

    // 2. Normalize Postgres syntax to SQLite
    let sql = query
      .replace(/public\./g, "")
      .replace(/memory\./g, "")
      .replace(/::uuid/g, "")
      .replace(/::vector/g, "")
      .replace(/::text\[\]/g, "")
      .replace(/::text/g, "")
      .replace(/::numeric\[\]/g, "")
      .replace(/ILIKE/g, "LIKE")
      .replace(/NOW\(\) - INTERVAL '24 hours'/g, "datetime('now', '-24 hours')")
      .replace(/NOW\(\)/g, "datetime('now')");

    // Map consolidated_memories to org_memory
    if (sql.includes("consolidated_memories")) {
      sql = sql.replace(/consolidated_memories/g, "org_memory");
      sql = sql
        .replace(/consolidation_type/g, "category")
        .replace(/summary/g, "content")
        .replace(/session_count/g, "confidence");
    }

    // Map JSON arrows to direct columns or json_extract
    sql = sql
      .replace(/metadata->>'tenant_id'/g, "tenant_id")
      .replace(/metadata->>'entity_id'/g, "related_entity_ids");

    if (!env.DB) {
      throw new Error("D1 database binding 'DB' not configured");
    }

    // 3. Execute query on D1
    if (isSelect) {
      try {
        const stmt = env.DB.prepare(sql);
        const { results } = await stmt.bind(...values).all();

        // Map columns back to maintain compatibility with legacy code
        const mapped = (results || []).map((row: any) => {
          if (row.category !== undefined && row.content !== undefined) {
            return {
              ...row,
              consolidation_type: row.category,
              summary: row.content,
              session_count: row.confidence ? Math.round(row.confidence * 10) : 0,
              metadata:
                typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata || {},
            };
          }
          if (row.metadata && typeof row.metadata === "string") {
            row.metadata = JSON.parse(row.metadata);
          }
          return row;
        });
        return mapped;
      } catch (err: any) {
        console.error(`[db-shim] D1 query failed: ${sql}\nError: ${err.message}`);
        throw err;
      }
    } else {
      try {
        const stmt = env.DB.prepare(sql);
        const res = await stmt.bind(...values).run();
        return res;
      } catch (err: any) {
        console.error(`[db-shim] D1 write query failed: ${sql}\nError: ${err.message}`);
        throw err;
      }
    }
  };
}

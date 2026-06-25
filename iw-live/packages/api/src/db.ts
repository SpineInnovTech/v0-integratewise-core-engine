import { Entity, Metric, Activity, EntityType, EntityStatus, Priority } from "./types";

function generateId(): string {
  return crypto.randomUUID();
}

// Entity CRUD operations
export async function createEntity(
  db: D1Database,
  data: Omit<Entity, "id" | "created_at" | "updated_at">
): Promise<Entity> {
  const id = generateId();
  const now = new Date().toISOString();

  await db
    .prepare(
      `
    INSERT INTO entities (id, type, title, description, status, priority, category, tags, metadata, parent_id, owner, source, source_id, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .bind(
      id,
      data.type,
      data.title,
      data.description || null,
      data.status || "active",
      data.priority || "medium",
      data.category || null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.parent_id || null,
      data.owner || null,
      data.source || "manual",
      data.source_id || null,
      data.due_date || null,
      now,
      now
    )
    .run();

  return { ...data, id, created_at: now, updated_at: now } as Entity;
}

export async function getEntity(db: D1Database, id: string): Promise<Entity | null> {
  const result = await db.prepare("SELECT * FROM entities WHERE id = ?").bind(id).first();
  if (!result) return null;
  return parseEntity(result);
}

export async function updateEntity(
  db: D1Database,
  id: string,
  data: Partial<Entity>
): Promise<Entity | null> {
  const now = new Date().toISOString();
  const existing = await getEntity(db, id);
  if (!existing) return null;

  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    values.push(data.status);
  }
  if (data.priority !== undefined) {
    updates.push("priority = ?");
    values.push(data.priority);
  }
  if (data.category !== undefined) {
    updates.push("category = ?");
    values.push(data.category);
  }
  if (data.tags !== undefined) {
    updates.push("tags = ?");
    values.push(JSON.stringify(data.tags));
  }
  if (data.metadata !== undefined) {
    updates.push("metadata = ?");
    values.push(JSON.stringify(data.metadata));
  }
  if (data.owner !== undefined) {
    updates.push("owner = ?");
    values.push(data.owner);
  }
  if (data.due_date !== undefined) {
    updates.push("due_date = ?");
    values.push(data.due_date);
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(id);

  await db
    .prepare(`UPDATE entities SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return getEntity(db, id);
}

export async function deleteEntity(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM entities WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}

export async function listEntities(
  db: D1Database,
  filters: {
    type?: EntityType;
    status?: EntityStatus;
    category?: string;
    owner?: string;
    source?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Entity[]> {
  let query = "SELECT * FROM entities WHERE 1=1";
  const values: unknown[] = [];

  if (filters.type) {
    query += " AND type = ?";
    values.push(filters.type);
  }
  if (filters.status) {
    query += " AND status = ?";
    values.push(filters.status);
  }
  if (filters.category) {
    query += " AND category = ?";
    values.push(filters.category);
  }
  if (filters.owner) {
    query += " AND owner = ?";
    values.push(filters.owner);
  }
  if (filters.source) {
    query += " AND source = ?";
    values.push(filters.source);
  }

  query += " ORDER BY updated_at DESC";
  const limit = Number(filters.limit) || 100;
  const offset = Number(filters.offset) || 0;
  if (!Number.isFinite(limit) || !Number.isFinite(offset)) {
    throw new Error("Invalid limit or offset value");
  }
  const safeLimit = Math.max(1, Math.min(limit, 1000));
  const safeOffset = Math.max(0, offset);
  query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

  const result = await db
    .prepare(query)
    .bind(...values)
    .all();
  return (result.results || []).map(parseEntity);
}

export async function searchEntities(db: D1Database, query: string): Promise<Entity[]> {
  const result = await db
    .prepare(
      `
    SELECT e.* FROM entities e
    JOIN entities_fts fts ON e.id = fts.id
    WHERE entities_fts MATCH ?
    ORDER BY rank
    LIMIT 50
  `
    )
    .bind(query)
    .all();
  return (result.results || []).map(parseEntity);
}

// Metrics operations
export async function createMetric(
  db: D1Database,
  data: Omit<Metric, "id" | "created_at">
): Promise<Metric> {
  const id = generateId();
  const now = new Date().toISOString();

  await db
    .prepare(
      `
    INSERT INTO metrics (id, key, value, unit, category, period, period_start, period_end, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .bind(
      id,
      data.key,
      data.value,
      data.unit || null,
      data.category,
      data.period || null,
      data.period_start || null,
      data.period_end || null,
      now
    )
    .run();

  return { ...data, id, created_at: now };
}

export async function getMetrics(
  db: D1Database,
  category?: string,
  period?: string
): Promise<Metric[]> {
  let query = "SELECT * FROM metrics WHERE 1=1";
  const values: unknown[] = [];

  if (category) {
    query += " AND category = ?";
    values.push(category);
  }
  if (period) {
    query += " AND period = ?";
    values.push(period);
  }

  query += " ORDER BY created_at DESC LIMIT 100";

  const result = await db
    .prepare(query)
    .bind(...values)
    .all();
  return (result.results || []).map((r) => ({
    id: r.id as string,
    key: r.key as string,
    value: r.value as number,
    unit: r.unit as string | undefined,
    category: r.category as string,
    period: r.period as string | undefined,
    period_start: r.period_start as string | undefined,
    period_end: r.period_end as string | undefined,
    created_at: r.created_at as string,
  }));
}

export async function getLatestMetrics(
  db: D1Database,
  category?: string
): Promise<Record<string, number>> {
  let query = `
    SELECT key, value FROM metrics m1
    WHERE created_at = (
      SELECT MAX(created_at) FROM metrics m2 WHERE m2.key = m1.key
    )
  `;
  const values: unknown[] = [];

  if (category) {
    query += " AND category = ?";
    values.push(category);
  }

  const result = await db
    .prepare(query)
    .bind(...values)
    .all();
  const metrics: Record<string, number> = {};
  for (const r of result.results || []) {
    metrics[r.key as string] = r.value as number;
  }
  return metrics;
}

// Activity logging
export async function logActivity(
  db: D1Database,
  data: Omit<Activity, "id" | "created_at">
): Promise<Activity> {
  const id = generateId();
  const now = new Date().toISOString();

  await db
    .prepare(
      `
    INSERT INTO activities (id, entity_id, action, actor, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `
    )
    .bind(
      id,
      data.entity_id || null,
      data.action,
      data.actor || null,
      data.details ? JSON.stringify(data.details) : null,
      now
    )
    .run();

  return { ...data, id, created_at: now };
}

export async function getActivities(
  db: D1Database,
  entityId?: string,
  limit = 50
): Promise<Activity[]> {
  let query = "SELECT * FROM activities";
  const values: unknown[] = [];

  if (entityId) {
    query += " WHERE entity_id = ?";
    values.push(entityId);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  values.push(limit);

  const result = await db
    .prepare(query)
    .bind(...values)
    .all();
  return (result.results || []).map((r) => ({
    id: r.id as string,
    entity_id: r.entity_id as string | undefined,
    action: r.action as string,
    actor: r.actor as string | undefined,
    details: r.details ? JSON.parse(r.details as string) : undefined,
    created_at: r.created_at as string,
  }));
}

// Dashboard aggregations
export async function getDashboardStats(db: D1Database): Promise<{
  totalEntities: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recentActivity: Activity[];
}> {
  const [total, byType, byStatus, activity] = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM entities").first(),
    db.prepare("SELECT type, COUNT(*) as count FROM entities GROUP BY type").all(),
    db.prepare("SELECT status, COUNT(*) as count FROM entities GROUP BY status").all(),
    getActivities(db, undefined, 10),
  ]);

  return {
    totalEntities: (total?.count as number) || 0,
    byType: Object.fromEntries((byType.results || []).map((r) => [r.type, r.count])),
    byStatus: Object.fromEntries((byStatus.results || []).map((r) => [r.status, r.count])),
    recentActivity: activity,
  };
}

// Helper to parse entity from DB row
function parseEntity(row: Record<string, unknown>): Entity {
  return {
    id: row.id as string,
    type: row.type as EntityType,
    title: row.title as string,
    description: row.description as string | undefined,
    status: row.status as EntityStatus,
    priority: row.priority as Priority,
    category: row.category as string | undefined,
    tags: row.tags ? JSON.parse(row.tags as string) : undefined,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    parent_id: row.parent_id as string | undefined,
    owner: row.owner as string | undefined,
    source: row.source as string | undefined,
    source_id: row.source_id as string | undefined,
    due_date: row.due_date as string | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

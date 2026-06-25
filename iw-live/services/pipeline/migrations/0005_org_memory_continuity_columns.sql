-- Migration: 0005_org_memory_continuity_columns
-- Align live org_memory with the Memory Promotion Engine + Continuity assembler
-- (spine-hydration-lifecycle Wave 5/6). The live table predates these columns;
-- promote() INSERTs and assembleContinuity() reads them. All confirmed absent on
-- the live spine-cache DB, so these ADD COLUMNs are safe. Cloudflare D1 only.

ALTER TABLE org_memory ADD COLUMN confidence REAL DEFAULT 0.6;
ALTER TABLE org_memory ADD COLUMN embedding TEXT;
ALTER TABLE org_memory ADD COLUMN related_entity_ids TEXT DEFAULT '[]';
ALTER TABLE org_memory ADD COLUMN related_departments TEXT DEFAULT '[]';
ALTER TABLE org_memory ADD COLUMN access_scope TEXT DEFAULT 'org';
ALTER TABLE org_memory ADD COLUMN lineage_ref TEXT;
ALTER TABLE org_memory ADD COLUMN tier TEXT DEFAULT 'standard';

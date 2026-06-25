-- =============================================================================
-- 052_pgvector_file_store_spine.sql
-- Ensures pgvector and file store are enabled and linked to Spine.
-- - pgvector: extension already enabled; add vector similarity index on file_embeddings.
-- - File store: files (metadata), file_versions (paths), file_embeddings (vectors).
-- - Spine linkage: files.entity_type / entity_id are Spine-aligned; optional spine_observation_id.
-- =============================================================================

-- 1. pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Vector similarity index on file_embeddings for semantic search (Flow B / Knowledge)
-- Enables: SELECT ... ORDER BY embedding <=> query_embedding LIMIT k
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'file_embeddings' AND indexname = 'idx_file_embeddings_embedding'
  ) THEN
    CREATE INDEX idx_file_embeddings_embedding ON file_embeddings
      USING hnsw (embedding vector_cosine_ops);
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- Column might not be vector type in some envs; skip
    NULL;
END $$;

-- 3. Spine linkage: optional direct link from files to Spine observation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'spine_observation_id'
  ) THEN
    ALTER TABLE files ADD COLUMN spine_observation_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_files_spine_observation ON files(spine_observation_id);
    COMMENT ON COLUMN files.spine_observation_id IS 'Optional link to Spine observation (iw_observations or domain observation id) for Entity 360 context.';
  END IF;
END $$;

-- 4. Clarify Spine semantics on files (entity_type / entity_id = Spine entity)
COMMENT ON COLUMN files.entity_type IS 'Spine entity type (e.g. deal, account, contract). Drives Entity 360 and Knowledge context.';
COMMENT ON COLUMN files.entity_id IS 'Spine canonical entity id. With entity_type, links file to Spine for context and search.';

-- 5. file_versions: storage_path comment only if column exists (some envs have minimal file_versions)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'file_versions' AND column_name = 'storage_path') THEN
    EXECUTE 'COMMENT ON COLUMN file_versions.storage_path IS ''Object path: Supabase Storage bucket path or R2 key. Resolve via tenant config.''';
  END IF;
END $$;

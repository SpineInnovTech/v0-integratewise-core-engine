-- Knowledge Pipeline Table (Replacing or complementing 'documents')
-- Spec-aligned storage for Docs & Dumps pipeline
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    entity_type TEXT,
    -- Account / Lead / Opportunity
    entity_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_label TEXT DEFAULT 'v1',
    storage_path TEXT,
    -- S3/Bucket path
    status TEXT DEFAULT 'pending',
    -- pending, processing, ready, failed, limit_exceeded
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS file_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES file_versions(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding vector(1536),
    -- Assuming OpenAI dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_files_tenant ON files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_file ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_embeddings_version ON file_embeddings(version_id);
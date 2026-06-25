-- Flow B: Extraction feedback table for Knowledge service
-- Stores user feedback on extraction quality for continuous improvement

CREATE TABLE IF NOT EXISTS extraction_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    file_id UUID NOT NULL,
    version_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    corrections JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extraction_feedback_tenant ON extraction_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_extraction_feedback_file ON extraction_feedback(file_id);

-- BYOT (Bring Your Own Template) Tables
-- For AI Loader Part B: Template URL → Schema → Render

-- Template Analyses: Store analyzed template structures
CREATE TABLE IF NOT EXISTS template_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  template_url TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('notion', 'confluence')),
  structure JSONB NOT NULL,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_template_analyses_workspace ON template_analyses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_template_analyses_type ON template_analyses(template_type);

-- Template Schemas: Store generated JSON Schemas
CREATE TABLE IF NOT EXISTS template_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  template_structure JSONB NOT NULL,
  json_schema JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_template_schemas_workspace ON template_schemas(workspace_id);

-- Template Renders: Track rendered pages/items
CREATE TABLE IF NOT EXISTS template_renders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  template_id UUID,
  rendered_data JSONB NOT NULL,
  result JSONB NOT NULL,
  rendered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_template_renders_workspace ON template_renders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_template_renders_template ON template_renders(template_id);

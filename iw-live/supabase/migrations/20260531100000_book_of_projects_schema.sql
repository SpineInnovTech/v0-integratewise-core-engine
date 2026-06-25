-- Book of Projects — Institutional Knowledge Store
-- Separate from Spine (operational data)
-- Append-only. Versioned. Nothing deleted.
-- Written only through Triage Bot → HITL → sole-writer path.

-- Schema
CREATE SCHEMA IF NOT EXISTS book_of_projects;

-- Episodes — top-level groupings of related primitives
CREATE TABLE IF NOT EXISTS book_of_projects.episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'superseded')),
  entity_refs JSONB DEFAULT '[]',  -- [{entity_type, entity_id, relationship}]
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Primitives — facts, decisions, commitments, learnings
CREATE TABLE IF NOT EXISTS book_of_projects.primitives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  episode_id UUID REFERENCES book_of_projects.episodes(id),
  type TEXT NOT NULL CHECK (type IN ('fact', 'decision', 'commitment', 'learning')),
  content TEXT NOT NULL,
  source TEXT,  -- who/what created this
  confidence NUMERIC(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  entity_refs JSONB DEFAULT '[]',  -- [{entity_type, entity_id, relationship}]
  superseded_by UUID REFERENCES book_of_projects.primitives(id),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Versions — immutable history of changes
CREATE TABLE IF NOT EXISTS book_of_projects.versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,  -- 'episode' or 'primitive'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,  -- 'create', 'update', 'supersede'
  data JSONB NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS episodes_tenant_idx ON book_of_projects.episodes(tenant_id);
CREATE INDEX IF NOT EXISTS episodes_status_idx ON book_of_projects.episodes(status);
CREATE INDEX IF NOT EXISTS episodes_created_at_idx ON book_of_projects.episodes(created_at DESC);

CREATE INDEX IF NOT EXISTS primitives_tenant_idx ON book_of_projects.primitives(tenant_id);
CREATE INDEX IF NOT EXISTS primitives_episode_idx ON book_of_projects.primitives(episode_id);
CREATE INDEX IF NOT EXISTS primitives_type_idx ON book_of_projects.primitives(type);
CREATE INDEX IF NOT EXISTS primitives_created_at_idx ON book_of_projects.primitives(created_at DESC);

CREATE INDEX IF NOT EXISTS versions_tenant_idx ON book_of_projects.versions(tenant_id);
CREATE INDEX IF NOT EXISTS versions_entity_idx ON book_of_projects.versions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS versions_created_at_idx ON book_of_projects.versions(created_at DESC);

-- RLS
ALTER TABLE book_of_projects.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_of_projects.primitives ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_of_projects.versions ENABLE ROW LEVEL SECURITY;

-- Policies: service role full access
CREATE POLICY "service_role_episodes_full" ON book_of_projects.episodes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_primitives_full" ON book_of_projects.primitives
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_versions_full" ON book_of_projects.versions
  FOR ALL USING (auth.role() = 'service_role');

-- Policies: authenticated users read their tenant
CREATE POLICY "auth_episodes_read" ON book_of_projects.episodes
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "auth_primitives_read" ON book_of_projects.primitives
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "auth_versions_read" ON book_of_projects.versions
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Comments
COMMENT ON TABLE book_of_projects.episodes IS 'Top-level groupings of related primitives (institutional knowledge)';
COMMENT ON TABLE book_of_projects.primitives IS 'Facts, decisions, commitments, learnings — append-only, versioned';
COMMENT ON TABLE book_of_projects.versions IS 'Immutable history of all changes to episodes and primitives';

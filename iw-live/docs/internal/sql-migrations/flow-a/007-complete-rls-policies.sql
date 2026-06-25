-- Complete RLS Policies for all tables
-- Run this after creating all tables

-- Enable RLS on core tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

-- Create organizations table if not exists (required for spend insights)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  owner_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Owners can update their organizations"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view org memberships"
  ON public.organization_members FOR SELECT
  USING (user_id = auth.uid() OR org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

-- Clients RLS - workspace-based access with tenant isolation
CREATE POLICY "Users can view workspace clients"
  ON clients FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert clients"
  ON clients FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clients"
  ON clients FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Tasks RLS - user-based access (owner or assignee only)
CREATE POLICY "Users can view their tasks"
  ON tasks FOR SELECT
  USING (owner_id = auth.uid() OR assignee_id = auth.uid());

CREATE POLICY "Users can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  USING (owner_id = auth.uid() OR assignee_id = auth.uid());

-- Daily insights RLS - scoped to user's workspace
CREATE POLICY "Users can view insights"
  ON daily_insights FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_rag ON clients(rag_status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(org_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;

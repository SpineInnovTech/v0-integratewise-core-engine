-- Create profiles table (references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'personal' CHECK (type IN ('personal', 'team')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workspace_members junction table
CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Workspaces RLS policies
CREATE POLICY "workspaces_select_member" ON public.workspaces 
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "workspaces_insert_owner" ON public.workspaces 
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspaces_update_owner" ON public.workspaces 
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "workspaces_delete_owner" ON public.workspaces 
  FOR DELETE USING (owner_id = auth.uid());

-- Workspace members RLS policies
CREATE POLICY "workspace_members_select" ON public.workspace_members 
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE id = workspace_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_insert_owner" ON public.workspace_members 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE id = workspace_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_delete_owner" ON public.workspace_members 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE id = workspace_id AND owner_id = auth.uid()
    )
  );

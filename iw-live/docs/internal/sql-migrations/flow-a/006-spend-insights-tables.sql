-- Spend Insights Tables
-- Tracks historical spend data for trend analysis

CREATE TABLE IF NOT EXISTS public.spend_insights_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  total_spend DECIMAL(12,2) NOT NULL DEFAULT 0,
  mrr DECIMAL(12,2) NOT NULL DEFAULT 0,
  arr DECIMAL(12,2) NOT NULL DEFAULT 0,
  active_subscriptions INTEGER NOT NULL DEFAULT 0,
  churn_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  insights JSONB DEFAULT '[]'::jsonb,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spend_snapshots_org_id ON public.spend_insights_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_spend_snapshots_created_at ON public.spend_insights_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spend_snapshots_org_period ON public.spend_insights_snapshots(org_id, period_end DESC);

-- RLS
ALTER TABLE public.spend_insights_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org spend snapshots"
  ON public.spend_insights_snapshots FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert spend snapshots"
  ON public.spend_insights_snapshots FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.spend_insights_snapshots TO authenticated;
GRANT INSERT ON public.spend_insights_snapshots TO service_role;

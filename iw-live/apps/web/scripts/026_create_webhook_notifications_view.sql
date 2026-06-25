-- Create a view that maps to the existing webhooks table
-- This resolves the PGRST205 error by providing the expected table name

CREATE OR REPLACE VIEW public.webhook_notifications AS
SELECT
  w.id,
  w.provider AS source,
  w.event AS event_type,
  w.body AS payload,
  COALESCE(w.status, 'received') AS status,
  w.error,
  w.created_at,
  w.processed_at
FROM public.webhooks w;

-- Enable RLS on the base table if not already enabled
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Create a permissive read policy for authenticated users
-- Adjust this based on your tenancy requirements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'webhooks' 
    AND policyname = 'webhooks_read_all'
  ) THEN
    CREATE POLICY webhooks_read_all ON public.webhooks
      FOR SELECT
      USING (true);
  END IF;
END $$;

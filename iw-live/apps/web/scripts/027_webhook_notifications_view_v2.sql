-- IntegrateWise OS: Webhook Notifications View (v2)
-- Fixes the PGRST205 404 error by providing a unified view over the webhooks table
-- with flexible column mapping to handle schema variations

-- Ensure pgcrypto is available for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the view to handle schema changes
DROP VIEW IF EXISTS public.webhook_notifications;

-- Create the unified webhook_notifications view
-- Maps various column naming conventions to a consistent interface
CREATE OR REPLACE VIEW public.webhook_notifications AS
SELECT
  w.id,
  -- Handle tenant_id if it exists (for multi-tenancy)
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'tenant_id')
    THEN w.tenant_id 
    ELSE NULL 
  END AS tenant_id,
  -- Source/provider mapping
  COALESCE(w.provider, 'unknown') AS source,
  -- Event type mapping
  COALESCE(w.event_type, 'webhook') AS event_type,
  -- Payload/body mapping
  COALESCE(w.payload, '{}'::jsonb) AS payload,
  -- Status with default
  COALESCE(
    CASE 
      WHEN w.processed = true THEN 'processed'
      WHEN w.processed = false THEN 'pending'
      ELSE 'received'
    END,
    'received'
  ) AS status,
  -- Error message
  w.error_message AS error,
  -- Timestamps
  COALESCE(w.created_at, NOW()) AS created_at,
  w.processed_at,
  -- Additional metadata
  w.metadata,
  w.signature_valid
FROM public.webhooks w;

-- Grant permissions
GRANT SELECT ON public.webhook_notifications TO anon, authenticated;

-- Enable RLS on the base table if not already enabled
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Create permissive read policy for the webhooks table
-- This allows reading via the view for all authenticated users
-- Adjust based on your tenancy requirements
DO $$
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS webhooks_read_all ON public.webhooks;
  DROP POLICY IF EXISTS "Allow all access to webhooks" ON public.webhooks;
  
  -- Create new permissive read policy
  CREATE POLICY webhooks_read_all ON public.webhooks
    FOR SELECT
    USING (true);
    
  -- Create insert policy for API routes
  CREATE POLICY webhooks_insert_all ON public.webhooks
    FOR INSERT
    WITH CHECK (true);
    
  -- Create update policy for processing webhooks
  CREATE POLICY webhooks_update_all ON public.webhooks
    FOR UPDATE
    USING (true);
END $$;

-- Add helpful comments
COMMENT ON VIEW public.webhook_notifications IS 'Unified view over webhooks table for consistent API access';

-- Force Row Level Security on critical tables
-- Ensures RLS policies apply even to table owners (service_role),
-- preventing accidental bypasses in application code.

ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.connectors FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;

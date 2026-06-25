-- Enable multi-org connector bindings per tenant/user/provider by workspace/account key.
-- This is required for Customer Success truth paths that bind multiple Salesforce orgs.

ALTER TABLE connectors
DROP CONSTRAINT IF EXISTS connectors_tenant_user_provider_key;

ALTER TABLE connectors
ADD CONSTRAINT connectors_tenant_user_provider_workspace_key
UNIQUE (tenant_id, user_id, provider, provider_workspace_id);

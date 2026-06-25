-- Seed default roles and demo org

-- Create default org
INSERT INTO orgs (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000001', 'IntegrateWise Demo', 'integratewise-demo')
ON CONFLICT (id) DO NOTHING;

-- Create roles
INSERT INTO roles (name, description, permissions) VALUES
  ('Admin', 'Full system access', '["*"]'),
  ('Manager', 'Manage team and operations', '["view.*", "edit.*", "manage.team"]'),
  ('Analyst', 'View and edit own data', '["view.*", "edit.own"]'),
  ('Viewer', 'Read-only access', '["view.*"]')
ON CONFLICT (name) DO NOTHING;

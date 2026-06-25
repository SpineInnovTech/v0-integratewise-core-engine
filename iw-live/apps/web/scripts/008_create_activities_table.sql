-- Activities/Activity Feed table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type VARCHAR(50) NOT NULL, -- 'task_completed', 'document_updated', 'email_received', 'meeting_scheduled', 'file_uploaded', 'interaction_captured'
  title TEXT NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20) DEFAULT 'teal',
  related_entity_type VARCHAR(50), -- 'task', 'document', 'email', 'calendar_event', 'drive_file', 'interaction'
  related_entity_id UUID,
  actor_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS activities_activity_type_idx ON activities(activity_type);
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS activities_related_entity_idx ON activities(related_entity_type, related_entity_id);

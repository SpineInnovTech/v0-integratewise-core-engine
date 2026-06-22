-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'meeting', -- 'meeting', 'call', 'focus', 'break', 'reminder'
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees TEXT[] DEFAULT '{}',
  color VARCHAR(20) DEFAULT 'teal',
  is_all_day BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- iCal RRULE format
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS calendar_events_start_time_idx ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS calendar_events_event_type_idx ON calendar_events(event_type);

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  preview TEXT,
  body TEXT,
  folder VARCHAR(50) DEFAULT 'inbox', -- 'inbox', 'sent', 'archive', 'trash'
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  has_attachments BOOLEAN DEFAULT FALSE,
  thread_id UUID,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS emails_folder_idx ON emails(folder);
CREATE INDEX IF NOT EXISTS emails_is_read_idx ON emails(is_read);
CREATE INDEX IF NOT EXISTS emails_received_at_idx ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS emails_thread_id_idx ON emails(thread_id);

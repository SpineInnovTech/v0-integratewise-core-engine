-- Drive/Files table
CREATE TABLE IF NOT EXISTS drive_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'document', 'spreadsheet', 'presentation', 'image', 'pdf', 'folder', 'video', 'audio'
  mime_type TEXT,
  size_bytes BIGINT,
  parent_folder_id UUID REFERENCES drive_files(id),
  file_url TEXT,
  thumbnail_url TEXT,
  is_starred BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with TEXT[] DEFAULT '{}',
  embedding vector(1536),
  content_preview TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS drive_files_file_type_idx ON drive_files(file_type);
CREATE INDEX IF NOT EXISTS drive_files_parent_folder_idx ON drive_files(parent_folder_id);
CREATE INDEX IF NOT EXISTS drive_files_updated_at_idx ON drive_files(updated_at DESC);

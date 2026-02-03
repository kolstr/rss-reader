-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'folder',
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ensure there is a default folder
INSERT INTO folders (label, icon, is_default)
SELECT 'Default', 'folder', 1
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE is_default = 1);

-- Add folder_id to feeds
ALTER TABLE feeds ADD COLUMN folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL;

-- Assign existing feeds to default folder
UPDATE feeds
SET folder_id = (SELECT id FROM folders WHERE is_default = 1)
WHERE folder_id IS NULL;

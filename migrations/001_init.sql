-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  icon TEXT DEFAULT 'fa-folder',
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default folder
INSERT OR IGNORE INTO folders (id, title, icon, sort_order) VALUES (1, 'Default', 'fa-folder', 0);

-- Feeds table
CREATE TABLE IF NOT EXISTS feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  color TEXT DEFAULT '#3b82f6',
  fetch_content BOOLEAN DEFAULT 0,
  folder_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET DEFAULT
);

-- Index for folder lookups
CREATE INDEX IF NOT EXISTS idx_feeds_folder_id ON feeds(folder_id);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER NOT NULL,
  guid TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  description TEXT,
  full_content TEXT,
  image_url TEXT,
  pub_date DATETIME,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE,
  UNIQUE(feed_id, guid)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_feed_id ON items(feed_id);
CREATE INDEX IF NOT EXISTS idx_items_pub_date ON items(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_items_read_at ON items(read_at);

-- Filter keywords table
CREATE TABLE IF NOT EXISTS filter_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_filter_keywords_keyword ON filter_keywords(keyword);

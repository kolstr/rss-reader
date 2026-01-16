-- Filter keywords table
CREATE TABLE IF NOT EXISTS filter_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_filter_keywords_keyword ON filter_keywords(keyword);

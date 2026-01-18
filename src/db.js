const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Run migrations
function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found');
    return;
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
  }
  
  console.log('Migrations completed');
}

// Initialize database
runMigrations();

// Feed queries
const feedQueries = {
  getAll: db.prepare('SELECT * FROM feeds ORDER BY title'),
  getById: db.prepare('SELECT * FROM feeds WHERE id = ?'),
  create: db.prepare('INSERT INTO feeds (title, url, icon_url, color, fetch_content) VALUES (?, ?, ?, ?, ?)'),
  update: db.prepare('UPDATE feeds SET title = ?, url = ?, icon_url = ?, color = ?, fetch_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  delete: db.prepare('DELETE FROM feeds WHERE id = ?'),
};

// Item queries
const itemQueries = {
  getAll: db.prepare(`
    SELECT items.*, feeds.title as feed_title, feeds.color as feed_color, feeds.icon_url as feed_icon
    FROM items 
    JOIN feeds ON items.feed_id = feeds.id 
    ORDER BY items.pub_date DESC
  `),
  getByFeed: db.prepare(`
    SELECT items.*, feeds.title as feed_title, feeds.color as feed_color, feeds.icon_url as feed_icon
    FROM items 
    JOIN feeds ON items.feed_id = feeds.id 
    WHERE items.feed_id = ? 
    ORDER BY items.pub_date DESC
  `),
  getById: db.prepare('SELECT * FROM items WHERE id = ?'),
  getByGuid: db.prepare('SELECT id, link, full_content FROM items WHERE feed_id = ? AND guid = ?'),
  upsert: db.prepare(`
    INSERT INTO items (feed_id, guid, title, link, description, image_url, pub_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(feed_id, guid) DO UPDATE SET
      title = excluded.title,
      link = excluded.link,
      description = excluded.description,
      image_url = excluded.image_url,
      pub_date = excluded.pub_date
  `),
  updateFullContent: db.prepare('UPDATE items SET full_content = ? WHERE id = ?'),
  markRead: db.prepare('UPDATE items SET read_at = CURRENT_TIMESTAMP WHERE id = ?'),
  markUnread: db.prepare('UPDATE items SET read_at = NULL WHERE id = ?'),
  deleteByFeed: db.prepare('DELETE FROM items WHERE feed_id = ?'),
  deleteOlderThan: db.prepare('DELETE FROM items WHERE pub_date < datetime(?, \'unixepoch\')'),
  getTitlesByFeed: db.prepare('SELECT title FROM items WHERE feed_id = ?'),
  getAllTitles: db.prepare('SELECT title FROM items'),
  getItemsWithoutContent: db.prepare('SELECT id, link FROM items WHERE feed_id = ? AND full_content IS NULL'),
};

// Stats queries
const statsQueries = {
  getUnreadCount: db.prepare('SELECT COUNT(*) as count FROM items WHERE read_at IS NULL'),
  getUnreadCountByFeed: db.prepare('SELECT COUNT(*) as count FROM items WHERE feed_id = ? AND read_at IS NULL'),
};

// Filter keyword queries
const filterKeywordQueries = {
  getAll: db.prepare('SELECT * FROM filter_keywords ORDER BY keyword'),
  create: db.prepare('INSERT INTO filter_keywords (keyword) VALUES (?)'),
  delete: db.prepare('DELETE FROM filter_keywords WHERE id = ?'),
};

module.exports = {
  db,
  feedQueries,
  itemQueries,
  statsQueries,
  filterKeywordQueries,
};

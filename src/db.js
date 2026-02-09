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

  // Track applied migrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = new Set(
    db.prepare('SELECT filename FROM migrations').all().map(row => row.filename)
  );

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
  }

  console.log('Migrations completed');
}

// Initialize database
runMigrations();

// Folder queries
const folderQueries = {
  getAll: db.prepare('SELECT * FROM folders ORDER BY label'),
  getById: db.prepare('SELECT * FROM folders WHERE id = ?'),
  getDefault: db.prepare('SELECT * FROM folders WHERE is_default = 1 LIMIT 1'),
  create: db.prepare('INSERT INTO folders (label, icon, is_default) VALUES (?, ?, ?)'),
  update: db.prepare('UPDATE folders SET label = ?, icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  delete: db.prepare('DELETE FROM folders WHERE id = ?'),
};

// Feed queries
const feedQueries = {
  getAll: db.prepare('SELECT * FROM feeds ORDER BY title'),
  getById: db.prepare('SELECT * FROM feeds WHERE id = ?'),
  create: db.prepare('INSERT INTO feeds (title, url, icon_url, color, fetch_content, folder_id) VALUES (?, ?, ?, ?, ?, ?)'),
  update: db.prepare('UPDATE feeds SET title = ?, url = ?, icon_url = ?, color = ?, fetch_content = ?, folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
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
  getByFolder: db.prepare(`
    SELECT items.*, feeds.title as feed_title, feeds.color as feed_color, feeds.icon_url as feed_icon
    FROM items
    JOIN feeds ON items.feed_id = feeds.id
    WHERE feeds.folder_id = ?
    ORDER BY items.pub_date DESC
  `),
  search: db.prepare(`
    SELECT items.*, feeds.title as feed_title, feeds.color as feed_color, feeds.icon_url as feed_icon
    FROM items
    JOIN feeds ON items.feed_id = feeds.id
    WHERE items.title LIKE ? OR items.description LIKE ? OR items.full_content LIKE ?
    ORDER BY items.pub_date DESC
  `),
  getById: db.prepare('SELECT * FROM items WHERE id = ?'),
  getByGuid: db.prepare('SELECT id, link, full_content, ttr FROM items WHERE feed_id = ? AND guid = ?'),
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
  updateFullContent: db.prepare('UPDATE items SET full_content = ?, ttr = ? WHERE id = ?'),
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
  getUnreadCountByFolder: db.prepare(`
    SELECT COUNT(*) as count
    FROM items
    JOIN feeds ON items.feed_id = feeds.id
    WHERE feeds.folder_id = ? AND items.read_at IS NULL
  `),
};

// Filter keyword queries
const filterKeywordQueries = {
  getAll: db.prepare('SELECT * FROM filter_keywords ORDER BY keyword'),
  create: db.prepare('INSERT INTO filter_keywords (keyword) VALUES (?)'),
  delete: db.prepare('DELETE FROM filter_keywords WHERE id = ?'),
};

function ensureDefaultFolder() {
  let defaultFolder = folderQueries.getDefault.get();
  if (!defaultFolder) {
    folderQueries.create.run('Default', 'folder', 1);
    defaultFolder = folderQueries.getDefault.get();
  }

  if (defaultFolder) {
    db.prepare('UPDATE feeds SET folder_id = ? WHERE folder_id IS NULL').run(defaultFolder.id);
  }
}

ensureDefaultFolder();

module.exports = {
  db,
  folderQueries,
  feedQueries,
  itemQueries,
  statsQueries,
  filterKeywordQueries,
};

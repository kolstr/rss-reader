const express = require('express');
const path = require('path');
const cron = require('node-cron');
const { db, feedQueries, itemQueries, statsQueries, filterKeywordQueries } = require('./db');
const { refreshFeed, refreshAllFeeds, getFaviconUrl } = require('./services/rss');
const { detectIconAndColor } = require('./services/iconDetector');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Helper to get unread counts per feed
function getUnreadCounts(feeds) {
  const counts = {};
  for (const feed of feeds) {
    const result = statsQueries.getUnreadCountByFeed.get(feed.id);
    counts[feed.id] = result ? result.count : 0;
  }
  return counts;
}

// Routes

// Home page - show all items or items from a specific feed
app.get('/', (req, res) => {
  const feedId = req.query.feed;
  const feeds = feedQueries.getAll.all();
  const unreadCounts = getUnreadCounts(feeds);
  const totalUnread = statsQueries.getUnreadCount.get().count;
  
  let items;
  let currentFeed = null;
  
  if (feedId) {
    items = itemQueries.getByFeed.all(feedId);
    currentFeed = feedQueries.getById.get(feedId);
  } else {
    items = itemQueries.getAll.all();
  }
  
  res.render('index', {
    feeds,
    items,
    currentFeed,
    unreadCounts,
    totalUnread,
  });
});

// API: Get all feeds
app.get('/api/feeds', (req, res) => {
  const feeds = feedQueries.getAll.all();
  const unreadCounts = getUnreadCounts(feeds);
  res.json({ feeds, unreadCounts });
});

// API: Fetch feed metadata from URL
app.post('/api/feeds/fetch-metadata', async (req, res) => {
  const { feedUrl } = req.body;
  
  if (!feedUrl) {
    return res.status(400).json({ error: 'Feed URL is required' });
  }
  
  try {
    const Parser = require('rss-parser');
    const parser = new Parser();
    const feed = await parser.parseURL(feedUrl);
    
    // Also detect icon and color
    const iconResult = await detectIconAndColor(feedUrl);
    
    res.json({
      success: true,
      title: feed.title || '',
      iconUrl: iconResult.iconUrl || '',
      color: iconResult.color || '#3b82f6'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Detect icon and color from feed URL
app.post('/api/feeds/detect-icon', async (req, res) => {
  const { feedUrl } = req.body;
  
  if (!feedUrl) {
    return res.status(400).json({ error: 'Feed URL is required' });
  }
  
  try {
    const result = await detectIconAndColor(feedUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Detect color from icon URL
app.post('/api/feeds/detect-color-from-icon', async (req, res) => {
  const { iconUrl } = req.body;
  
  if (!iconUrl) {
    return res.status(400).json({ error: 'Icon URL is required' });
  }
  
  try {
    const axios = require('axios');
    const { extractColorFromImage } = require('./services/iconDetector');
    
    // Fetch the icon with better error handling
    const response = await axios.get(iconUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*'
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 400
    });
    
    const imageBuffer = Buffer.from(response.data);
    
    // Check if it's an .ico file based on content-type or URL
    const contentType = (response.headers['content-type'] || '').toLowerCase();
    const isIco = contentType.includes('x-icon') || 
                  contentType.includes('vnd.microsoft.icon') ||
                  iconUrl.toLowerCase().endsWith('.ico');
    
    // Check for SVG
    if (contentType.includes('svg')) {
      console.log('SVG detected via content-type, using default color');
      return res.json({ success: true, color: '#3b82f6' });
    }
    
    // Extract color
    const color = await extractColorFromImage(imageBuffer, isIco);
    
    res.json({
      success: true,
      color: color
    });
  } catch (error) {
    console.error('Error detecting color from icon:', error.message);
    // Return default color instead of error to be more resilient
    res.json({ success: true, color: '#3b82f6', warning: error.message });
  }
});

// API: Create a new feed
app.post('/api/feeds', async (req, res) => {
  const { title, url, color } = req.body;
  
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }
  
  try {
    const iconUrl = getFaviconUrl(url);
    const result = feedQueries.create.run(title, url, iconUrl, color || '#3b82f6');
    
    // Fetch initial items
    await refreshFeed(result.lastInsertRowid, url);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update a feed
app.put('/api/feeds/:id', (req, res) => {
  const { id } = req.params;
  const { title, url, icon_url, color } = req.body;
  
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }
  
  try {
    feedQueries.update.run(title, url, icon_url, color || '#3b82f6', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete a feed
app.delete('/api/feeds/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    feedQueries.delete.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Refresh a specific feed
app.post('/api/feeds/:id/refresh', async (req, res) => {
  const { id } = req.params;
  const feed = feedQueries.getById.get(id);
  
  if (!feed) {
    return res.status(404).json({ error: 'Feed not found' });
  }
  
  try {
    const result = await refreshFeed(feed.id, feed.url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Refresh all feeds
app.post('/api/feeds/refresh-all', async (req, res) => {
  const feeds = feedQueries.getAll.all();
  
  try {
    const results = await refreshAllFeeds(feeds);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Mark item as read
app.post('/api/items/:id/read', (req, res) => {
  const { id } = req.params;
  
  try {
    itemQueries.markRead.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Mark item as unread
app.post('/api/items/:id/unread', (req, res) => {
  const { id } = req.params;
  
  try {
    itemQueries.markUnread.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Mark multiple items as read
app.post('/api/items/bulk-read', (req, res) => {
  const { itemIds } = req.body;
  
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'itemIds must be a non-empty array' });
  }
  
  try {
    const markMultiple = db.prepare(`UPDATE items SET read_at = CURRENT_TIMESTAMP WHERE id IN (${itemIds.map(() => '?').join(',')})`);
    markMultiple.run(...itemIds);
    res.json({ success: true, count: itemIds.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get all filter keywords
app.get('/api/filter-keywords', (req, res) => {
  try {
    const keywords = filterKeywordQueries.getAll.all();
    res.json({ success: true, keywords });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Add a filter keyword
app.post('/api/filter-keywords', (req, res) => {
  const { keyword } = req.body;
  
  if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
    return res.status(400).json({ error: 'Keyword is required' });
  }
  
  try {
    const result = filterKeywordQueries.create.run(keyword.trim().toLowerCase());
    res.json({ success: true, id: result.lastInsertRowid, keyword: keyword.trim().toLowerCase() });
  } catch (error) {
    // Handle duplicate keyword error
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Keyword already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// API: Delete a filter keyword
app.delete('/api/filter-keywords/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    filterKeywordQueries.delete.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set up cron job to refresh feeds every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Running scheduled feed refresh...');
  const feeds = feedQueries.getAll.all();
  try {
    const results = await refreshAllFeeds(feeds);
    const totalNew = results.reduce((sum, r) => sum + (r.newItems || 0), 0);
    console.log(`Feed refresh complete. ${totalNew} new items found.`);
    
    // Delete items older than 7 days
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    const deleteResult = itemQueries.deleteOlderThan.run(sevenDaysAgo);
    if (deleteResult.changes > 0) {
      console.log(`Deleted ${deleteResult.changes} items older than 7 days.`);
    }
  } catch (error) {
    console.error('Error during scheduled refresh:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`RSS Reader running on http://localhost:${PORT}`);
  console.log('Feed auto-refresh enabled (every 30 minutes)');
});

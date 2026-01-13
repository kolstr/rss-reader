const Parser = require('rss-parser');
const { itemQueries } = require('../db');

/**
 * Normalize date to ISO format for consistent database storage and sorting
 * @param {string} dateStr - Date string in various formats
 * @returns {string} ISO 8601 formatted date string
 */
function normalizeDate(dateStr) {
  if (!dateStr) {
    return new Date().toISOString();
  }
  
  try {
    const date = new Date(dateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log(`Invalid date: ${dateStr}, using current time`);
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (e) {
    console.log(`Error parsing date: ${dateStr}, using current time`);
    return new Date().toISOString();
  }
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
    ]
  }
});

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item) {
  // Try different common image fields
  if (item.enclosure && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
    return item.enclosure.url;
  }
  
  if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
    return item['media:content'].$.url;
  }
  
  if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
    return item['media:thumbnail'].$.url;
  }
  
  // Try to extract from content
  if (item.content || item['content:encoded']) {
    const content = item.content || item['content:encoded'];
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
      return imgMatch[1];
    }
  }
  
  return null;
}

/**
 * Get favicon URL for a feed
 */
function getFaviconUrl(feedUrl) {
  try {
    const url = new URL(feedUrl);
    return `${url.protocol}//${url.host}/favicon.ico`;
  } catch (e) {
    return null;
  }
}

/**
 * Fetch and parse RSS feed
 */
async function fetchFeed(feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);
    return {
      success: true,
      feed: feed,
      items: feed.items || [],
    };
  } catch (error) {
    console.error(`Error fetching feed ${feedUrl}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Refresh a feed and update database
 */
async function refreshFeed(feedId, feedUrl) {
  const result = await fetchFeed(feedUrl);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  let newItems = 0;
  
  for (const item of result.items) {
    const guid = item.guid || item.link || item.title;
    const imageUrl = extractImageUrl(item);
    // Normalize date to ISO format for consistent sorting
    const pubDate = normalizeDate(item.isoDate || item.pubDate);
    
    try {
      const info = itemQueries.upsert.run(
        feedId,
        guid,
        item.title || 'Untitled',
        item.link || '',
        item.contentSnippet || item.description || '',
        imageUrl,
        pubDate
      );
      
      if (info.changes > 0) {
        newItems++;
      }
    } catch (error) {
      console.error(`Error upserting item:`, error.message);
    }
  }
  
  return {
    success: true,
    itemCount: result.items.length,
    newItems: newItems,
  };
}

/**
 * Refresh all feeds
 */
async function refreshAllFeeds(feeds) {
  const results = [];
  
  for (const feed of feeds) {
    console.log(`Refreshing feed: ${feed.title}`);
    const result = await refreshFeed(feed.id, feed.url);
    results.push({
      feedId: feed.id,
      feedTitle: feed.title,
      ...result,
    });
  }
  
  return results;
}

module.exports = {
  fetchFeed,
  refreshFeed,
  refreshAllFeeds,
  getFaviconUrl,
  extractImageUrl,
};

const Parser = require('rss-parser');
const { itemQueries, filterKeywordQueries, feedQueries } = require('../db');
const { extractArticleContent } = require('./articleExtractor');

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
      // Node/JS Date parsing is inconsistent for timezone abbreviations (e.g. CET/CEST).
      // Try converting common abbreviations to numeric offsets and re-parse.
      const coerced = coerceRssDateTimezone(dateStr);
      if (coerced) {
        const retry = new Date(coerced);
        if (!isNaN(retry.getTime())) {
          return retry.toISOString();
        }
      }

      console.log(`Invalid date: ${dateStr}, using current time`);
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (e) {
    console.log(`Error parsing date: ${dateStr}, using current time`);
    return new Date().toISOString();
  }
}

function coerceRssDateTimezone(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // Common timezone abbreviations found in RSS/Atom feeds.
  // Prefer numeric offsets for reliable parsing.
  const tzMap = {
    UTC: '+0000',
    GMT: '+0000',
    CET: '+0100',
    CEST: '+0200',
    // German abbreviations
    MEZ: '+0100',
    MESZ: '+0200',
  };

  // Example: "Tue, 13 Jan 2026 19:33:16 CET" -> "Tue, 13 Jan 2026 19:33:16 +0100"
  const match = dateStr.match(/\b([A-Z]{2,5})\b\s*$/);
  if (!match) return null;
  const tz = match[1];
  const offset = tzMap[tz];
  if (!offset) return null;

  return dateStr.replace(/\b([A-Z]{2,5})\b\s*$/, offset);
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
      // Some feeds (especially Atom) provide update timestamps in namespaced tags
      ['a10:updated', 'a10:updated'],
    ]
  }
});

function getFirstTextValue(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;

  // rss-parser sometimes returns arrays/objects depending on tag structure
  if (Array.isArray(value)) {
    for (const entry of value) {
      const asText = getFirstTextValue(entry);
      if (asText) return asText;
    }
    return null;
  }

  if (typeof value === 'object') {
    // Common shapes: { _: 'text' } or { '#': 'text' }
    if (typeof value._ === 'string') return value._;
    if (typeof value['#'] === 'string') return value['#'];
  }

  return null;
}

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
async function refreshFeed(feedId, feedUrl, fetchContent = false) {
  const result = await fetchFeed(feedUrl);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  // Get filter keywords
  const filterKeywords = filterKeywordQueries.getAll.all();
  const keywords = filterKeywords.map(k => k.keyword.toLowerCase());
  
  // Get all existing titles across all feeds to avoid duplicates
  const existingTitles = new Set(
    itemQueries.getAllTitles.all().map(row => row.title)
  );
  
  // Calculate cutoff date - MAX_ARTICLE_AGE_DAYS (default: 3 days)
  const maxAgeDays = parseInt(process.env.MAX_ARTICLE_AGE_DAYS || '3', 10);
  const cutoffDate = new Date(Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000));
  
  let newItems = 0;
  let filteredItems = 0;
  let duplicateTitles = 0;
  let tooOldItems = 0;
  const newItemIds = []; // Track new item IDs for content fetching
  
  for (const item of result.items) {
    const guid = item.guid || item.link || item.title;
    const title = item.title || 'Untitled';
    
    // Check if item with exact title already exists
    if (existingTitles.has(title)) {
      duplicateTitles++;
      continue; // Skip this item
    }
    
    // Add title to set to prevent duplicates within the same refresh batch
    existingTitles.add(title);
    
    // Check if title or link contains any filter keyword (case-insensitive)
    const titleLower = title.toLowerCase();
    const linkLower = (item.link || '').toLowerCase();
    const isFiltered = keywords.some(keyword => 
      titleLower.includes(keyword) || linkLower.includes(keyword)
    );
    
    if (isFiltered) {
      filteredItems++;
      continue; // Skip this item
    }
    
    const imageUrl = extractImageUrl(item);
    // Normalize date to ISO format for consistent sorting
    // Fallbacks for feeds that don't provide pubDate (e.g. Atom: <a10:updated>)
    const updatedFallback =
      getFirstTextValue(item['a10:updated']) ||
      getFirstTextValue(item.updated) ||
      getFirstTextValue(item['atom:updated']);
    const pubDate = normalizeDate(item.isoDate || item.pubDate || updatedFallback);
    
    // Skip items older than MAX_ARTICLE_AGE_DAYS
    const itemDate = new Date(pubDate);
    if (itemDate < cutoffDate) {
      tooOldItems++;
      continue; // Skip this item
    }
    
    try {
      const info = itemQueries.upsert.run(
        feedId,
        guid,
        title,
        item.link || '',
        item.contentSnippet || item.description || '',
        imageUrl,
        pubDate
      );
      
      if (info.changes > 0) {
        newItems++;
        // Track the item for content fetching - but we need the correct ID
        // lastInsertRowid is unreliable for ON CONFLICT DO UPDATE, so we query by guid
        if (fetchContent) {
          const insertedItem = itemQueries.getByGuid.get(feedId, guid);
          // Only fetch content if item exists and doesn't already have content
          if (insertedItem && !insertedItem.full_content && insertedItem.link) {
            newItemIds.push({ id: insertedItem.id, link: insertedItem.link });
          }
        }
      }
    } catch (error) {
      console.error(`Error upserting item:`, error.message);
    }
  }
  
  // Fetch content for new items if enabled
  let contentFetched = 0;
  let contentFailed = 0;
  
  if (fetchContent && newItemIds.length > 0) {
    console.log(`Fetching content for ${newItemIds.length} new items from feed ${feedId}...`);
    
    for (const item of newItemIds) {
      if (!item.link) continue;
      
      try {
        const contentResult = await extractArticleContent(item.link);
        if (contentResult.success && contentResult.content) {
          const ttrSeconds = Number.isFinite(contentResult.ttr)
            ? Math.round(contentResult.ttr)
            : null;
          itemQueries.updateFullContent.run(contentResult.content, ttrSeconds, item.id);
          contentFetched++;
        } else {
          contentFailed++;
        }
      } catch (error) {
        console.error(`Error fetching content for item ${item.id}:`, error.message);
        contentFailed++;
      }
      
      // Small delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`Content fetching complete: ${contentFetched} fetched, ${contentFailed} failed`);
  }
  
  return {
    success: true,
    itemCount: result.items.length,
    newItems: newItems,
    filteredItems: filteredItems,
    duplicateTitles: duplicateTitles,
    tooOldItems: tooOldItems,
    contentFetched: contentFetched,
    contentFailed: contentFailed,
  };
}

/**
 * Refresh all feeds
 */
async function refreshAllFeeds(feeds) {
  const results = [];
  
  for (const feed of feeds) {
    console.log(`Refreshing feed: ${feed.title}`);
    const fetchContent = feed.fetch_content === 1;
    const result = await refreshFeed(feed.id, feed.url, fetchContent);
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

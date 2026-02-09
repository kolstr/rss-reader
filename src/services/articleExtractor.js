/**
 * Article content extraction service
 * Uses @extractus/article-extractor to fetch and extract article content from web pages
 */

let extractorModule = null;

/**
 * Dynamically import the article extractor (ESM module)
 */
async function getExtractor() {
  if (!extractorModule) {
    try {
      extractorModule = await import('@extractus/article-extractor');
    } catch (error) {
      console.error('Failed to load @extractus/article-extractor:', error.message);
      throw new Error('Article extractor module not available. Please run: npm install @extractus/article-extractor');
    }
  }
  return extractorModule;
}

/**
 * Extract article content from a URL
 * @param {string} url - The URL of the article to extract
 * @returns {Promise<{success: boolean, content?: string, title?: string, description?: string, ttr?: number, error?: string}>}
 */
async function extractArticleContent(url) {
  if (!url) {
    return { success: false, error: 'URL is required' };
  }

  try {
    const { extract } = await getExtractor();
    const article = await extract(url, {}, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!article || !article.content) {
      return { success: false, error: 'Could not extract content from page' };
    }

    const ttrSeconds = Number.isFinite(article.ttr) ? Math.round(article.ttr) : null;

    return {
      success: true,
      content: article.content,
      title: article.title,
      description: article.description,
      ttr: ttrSeconds,
    };
  } catch (error) {
    console.error(`Error extracting article from ${url}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch content for multiple items
 * @param {Array<{id: number, link: string}>} items - Items to fetch content for
 * @param {Function} updateCallback - Callback to update item content in database
 * @returns {Promise<{fetched: number, failed: number}>}
 */
async function fetchContentForItems(items, updateCallback) {
  let fetched = 0;
  let failed = 0;

  for (const item of items) {
    const result = await extractArticleContent(item.link);
    
    if (result.success && result.content) {
      try {
        await updateCallback(item.id, result.content);
        fetched++;
      } catch (error) {
        console.error(`Failed to save content for item ${item.id}:`, error.message);
        failed++;
      }
    } else {
      failed++;
    }

    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { fetched, failed };
}

module.exports = {
  extractArticleContent,
  fetchContentForItems,
};

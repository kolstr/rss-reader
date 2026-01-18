// Modal management
let currentFeedId = null;
let confirmCallback = null;

// Show read toggle management
let showRead = localStorage.getItem('showRead') !== 'false'; // default true

function initShowReadToggle() {
  updateShowReadToggle();
}

function toggleShowRead() {
  showRead = !showRead;
  localStorage.setItem('showRead', showRead);
  document.documentElement.classList.toggle('hide-read', !showRead);
  updateShowReadToggle();
}

function updateShowReadToggle() {
  const toggle = document.getElementById('showReadToggle');
  const thumb = document.getElementById('showReadToggleThumb');
  const articles = document.querySelectorAll('article[data-item-id]');

  document.documentElement.classList.toggle('hide-read', !showRead);
  
  if (showRead) {
    // Show all items (read + unread)
    toggle?.classList.add('bg-blue-500', 'dark:bg-blue-600');
    toggle?.classList.remove('bg-gray-200', 'dark:bg-gray-600');
    toggle?.setAttribute('aria-checked', 'true');
    thumb?.classList.add('translate-x-5');
    thumb?.classList.remove('translate-x-0');
    
    articles.forEach(article => {
      article.style.display = '';
    });
    
    const countEl = document.getElementById('visibleItemsCount');
    if (countEl) {
      const allEl = countEl.querySelector('.count-all');
      const unreadEl = countEl.querySelector('.count-unread');
      if (allEl) allEl.textContent = articles.length;
      if (unreadEl) unreadEl.textContent = articles.length;
    }
  } else {
    // Hide read items (show only unread)
    toggle?.classList.remove('bg-blue-500', 'dark:bg-blue-600');
    toggle?.classList.add('bg-gray-200', 'dark:bg-gray-600');
    toggle?.setAttribute('aria-checked', 'false');
    thumb?.classList.remove('translate-x-5');
    thumb?.classList.add('translate-x-0');
    
    let visibleCount = 0;
    articles.forEach(article => {
      const isRead = article.classList.contains('feed-border-read');
      if (isRead) {
        article.style.display = 'none';
      } else {
        article.style.display = '';
        visibleCount++;
      }
    });
    
    const countEl = document.getElementById('visibleItemsCount');
    if (countEl) {
      const allEl = countEl.querySelector('.count-all');
      const unreadEl = countEl.querySelector('.count-unread');
      if (allEl) allEl.textContent = articles.length;
      if (unreadEl) unreadEl.textContent = visibleCount;
    }
  }

  updateMarkRemainingButtonVisibility();
}

// Custom alert modal
function showAlert(message, title = 'Notice', type = 'info') {
  const modal = document.getElementById('alertModal');
  const titleEl = document.getElementById('alertTitle');
  const messageEl = document.getElementById('alertMessage');
  const iconEl = document.getElementById('alertIcon');
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  
  // Set icon based on type
  if (type === 'error') {
    iconEl.innerHTML = '<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  } else if (type === 'success') {
    iconEl.innerHTML = '<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  } else {
    iconEl.innerHTML = '<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  }
  
  modal.classList.remove('hidden');
}

function closeAlertModal() {
  document.getElementById('alertModal').classList.add('hidden');
}

// Custom confirm modal
function showConfirm(message, title = 'Confirm Action', callback) {
  const modal = document.getElementById('confirmModal');
  const titleEl = document.getElementById('confirmTitle');
  const messageEl = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('confirmButton');
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  confirmCallback = callback;
  
  // Remove old listener and add new one
  confirmBtn.onclick = () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
  };
  
  modal.classList.remove('hidden');
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.add('hidden');
  confirmCallback = null;
}

// Update unread counts in sidebar
function updateUnreadCounts(feedId, increment = false) {
  // Update specific feed badge
  const feedEl = document.querySelector(`[data-feed-id="${feedId}"]`);
  if (feedEl) {
    const badge = feedEl.querySelector('.feed-unread-badge');
    if (badge) {
      const currentCount = parseInt(badge.textContent);
      const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1);
      
      if (newCount === 0) {
        badge.remove();
      } else {
        badge.textContent = newCount;
      }
    } else if (increment) {
      // Need to create badge if marking as unread
      const link = feedEl.querySelector('a');
      const feedColor = link?.querySelector('[style*="background-color"]')?.style.backgroundColor || '#3b82f6';
      const badge = document.createElement('span');
      badge.className = 'feed-unread-badge text-xs px-2 py-1 rounded-full';
      badge.style.backgroundColor = feedColor;
      badge.style.color = 'white';
      badge.textContent = '1';
      link?.appendChild(badge);
    }
  }
  
  // Update total unread badge
  const totalBadge = document.getElementById('totalUnreadBadge');
  if (totalBadge) {
    const currentTotal = parseInt(totalBadge.textContent);
    const newTotal = increment ? currentTotal + 1 : Math.max(0, currentTotal - 1);
    
    if (newTotal === 0) {
      totalBadge.remove();
    } else {
      totalBadge.textContent = newTotal;
    }
  } else if (increment) {
    // Need to create total badge if marking as unread
    const allLink = document.querySelector('a[href="/"]');
    if (allLink) {
      const badge = document.createElement('span');
      badge.id = 'totalUnreadBadge';
      badge.className = 'bg-blue-500 dark:bg-blue-600 text-white text-xs px-2 py-1 rounded-full';
      badge.textContent = '1';
      allLink.appendChild(badge);
    }
  }
}

// Dark mode management
function initDarkMode() {
  // Check for saved preference or default to light mode
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  updateThemeIcons();
}

function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  const lightIcon = document.getElementById('theme-toggle-light-icon');
  const darkIcon = document.getElementById('theme-toggle-dark-icon');
  
  if (isDark) {
    lightIcon?.classList.remove('hidden');
    darkIcon?.classList.add('hidden');
  } else {
    lightIcon?.classList.add('hidden');
    darkIcon?.classList.remove('hidden');
  }
}

function updateThemeColorMeta() {
  const isDark = document.documentElement.classList.contains('dark');
  const color = isDark ? '#111827' : '#f9fafb';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', color);
  }
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcons();
  updateThemeColorMeta();
}

// Initialize dark mode on page load
// (Initialization moved to bottom of file so helper functions are defined first)

// Sidebar management for mobile
function updateMobileMenuButtonIcon() {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('mobileMenuHamburger');
  const openIcon = document.getElementById('mobileMenuOpenIcon');

  if (!sidebar || !hamburger || !openIcon) return;
  const isOpen = !sidebar.classList.contains('-translate-x-full');

  if (isOpen) {
    hamburger.classList.add('hidden');
    openIcon.classList.remove('hidden');
  } else {
    openIcon.classList.add('hidden');
    hamburger.classList.remove('hidden');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  
  sidebar.classList.toggle('-translate-x-full');
  overlay.classList.toggle('hidden');

  updateMobileMenuButtonIcon();
}

// Close sidebar when clicking a feed link on mobile
function closeSidebarOnMobile() {
  if (window.innerWidth < 768) {
    toggleSidebar();
  }
}

function openSettingsModal() {
  currentFeedId = null;
  document.getElementById('modalTitle').textContent = 'Add Feed';
  document.getElementById('feedForm').reset();
  document.getElementById('feedId').value = '';
  document.getElementById('deleteFeedBtn').classList.add('hidden');
  document.getElementById('settingsModal').classList.remove('hidden');
  
  // Reset fetch content toggle
  setFetchContentToggle(false);
  
  // Set up URL change listener for auto-fetch
  setupUrlAutoFetch();
}

// Auto-fetch feed metadata when URL is entered
let urlFetchTimeout = null;
function setupUrlAutoFetch() {
  const urlInput = document.getElementById('feedUrl');
  const titleInput = document.getElementById('feedTitle');
  const iconInput = document.getElementById('feedIcon');
  const colorInput = document.getElementById('feedColor');
  
  // Remove old listener if exists
  const newUrlInput = urlInput.cloneNode(true);
  urlInput.parentNode.replaceChild(newUrlInput, urlInput);
  
  newUrlInput.addEventListener('blur', async () => {
    const url = newUrlInput.value.trim();
    
    // Skip if editing existing feed or no URL
    if (currentFeedId || !url) return;
    
    // Skip if title is already filled
    if (titleInput.value.trim()) return;
    
    try {
      // Validate URL format
      new URL(url);
      
      const response = await fetch('/api/feeds/fetch-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedUrl: url }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          titleInput.value = result.title || '';
          iconInput.value = result.iconUrl || '';
          colorInput.value = result.color || '#3b82f6';
        }
      }
    } catch (error) {
      // Silently fail - user can enter manually
      console.log('Could not fetch feed metadata:', error.message);
    }
  });
}

function editFeed(id, title, url, iconUrl, color, fetchContent) {
  currentFeedId = id;
  document.getElementById('modalTitle').textContent = 'Edit Feed';
  document.getElementById('feedId').value = id;
  document.getElementById('feedTitle').value = title;
  document.getElementById('feedUrl').value = url;
  document.getElementById('feedIcon').value = iconUrl || '';
  document.getElementById('feedColor').value = color;
  document.getElementById('deleteFeedBtn').classList.remove('hidden');
  document.getElementById('settingsModal').classList.remove('hidden');
  
  // Set fetch content toggle
  setFetchContentToggle(fetchContent === 1);
  
  // Set up URL change listener for auto-fetch (though currentFeedId will prevent auto-fill)
  setupUrlAutoFetch();
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.add('hidden');
  currentFeedId = null;
}

// Filter modal functions
async function openFilterModal() {
  const modal = document.getElementById('filterModal');
  modal.classList.remove('hidden');
  await loadFilterKeywords();
}

function closeFilterModal() {
  document.getElementById('filterModal').classList.add('hidden');
  document.getElementById('filterKeywordInput').value = '';
}

async function loadFilterKeywords() {
  try {
    const response = await fetch('/api/filter-keywords');
    if (!response.ok) {
      throw new Error('Failed to load filter keywords');
    }
    
    const data = await response.json();
    const keywords = data.keywords || [];
    const listEl = document.getElementById('filterKeywordsList');
    
    if (keywords.length === 0) {
      listEl.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400 italic">No filter keywords yet</p>';
      return;
    }
    
    listEl.innerHTML = keywords.map(kw => `
      <div class="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
        <span class="text-gray-800 dark:text-gray-200">${escapeHtml(kw.keyword)}</span>
        <button onclick="deleteFilterKeyword(${kw.id})" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading filter keywords:', error);
    showAlert('Failed to load filter keywords', 'Error', 'error');
  }
}

async function addFilterKeyword(event) {
  event.preventDefault();
  
  const input = document.getElementById('filterKeywordInput');
  const keyword = input.value.trim();
  
  if (!keyword) return;
  
  try {
    const response = await fetch('/api/filter-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add keyword');
    }
    
    input.value = '';
    await loadFilterKeywords();
  } catch (error) {
    console.error('Error adding filter keyword:', error);
    showAlert(error.message, 'Error', 'error');
  }
}

async function deleteFilterKeyword(id) {
  try {
    const response = await fetch(`/api/filter-keywords/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete keyword');
    }
    
    await loadFilterKeywords();
  } catch (error) {
    console.error('Error deleting filter keyword:', error);
    showAlert('Failed to delete keyword', 'Error', 'error');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fetch content toggle management
function toggleFetchContent() {
  const input = document.getElementById('feedFetchContent');
  const isEnabled = input.value === '1';
  setFetchContentToggle(!isEnabled);
}

function setFetchContentToggle(enabled) {
  const toggle = document.getElementById('fetchContentToggle');
  const thumb = document.getElementById('fetchContentToggleThumb');
  const input = document.getElementById('feedFetchContent');
  
  if (enabled) {
    toggle?.classList.add('bg-blue-500', 'dark:bg-blue-600');
    toggle?.classList.remove('bg-gray-200', 'dark:bg-gray-600');
    toggle?.setAttribute('aria-checked', 'true');
    thumb?.classList.add('translate-x-5');
    thumb?.classList.remove('translate-x-0');
    if (input) input.value = '1';
  } else {
    toggle?.classList.remove('bg-blue-500', 'dark:bg-blue-600');
    toggle?.classList.add('bg-gray-200', 'dark:bg-gray-600');
    toggle?.setAttribute('aria-checked', 'false');
    thumb?.classList.remove('translate-x-5');
    thumb?.classList.add('translate-x-0');
    if (input) input.value = '0';
  }
}

// Full content expansion
const expandedArticles = new Set();
const loadedContent = new Map();

async function toggleFullContent(itemId, buttonEl) {
  const article = document.querySelector(`article[data-item-id="${itemId}"]`);
  if (!article) return;
  
  const descriptionEl = article.querySelector('.article-description');
  const contentEl = article.querySelector('.article-full-content');
  const imageEl = article.querySelector('.article-image');
  const linkEl = article.querySelector('.article-link');
  
  if (expandedArticles.has(itemId)) {
    // Collapse
    expandedArticles.delete(itemId);
    descriptionEl?.classList.remove('hidden');
    contentEl?.classList.add('hidden');
    imageEl?.classList.remove('hidden');
    
    // Update button
    buttonEl.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
      Read all
    `;
    
    // Restore link behavior
    if (linkEl) {
      linkEl.style.pointerEvents = '';
    }
  } else {
    // Expand
    expandedArticles.add(itemId);
    
    // Load content if not already loaded
    if (!loadedContent.has(itemId)) {
      buttonEl.innerHTML = `
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      `;
      
      try {
        const response = await fetch(`/api/items/${itemId}/content`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.content) {
            loadedContent.set(itemId, data.content);
          }
        }
      } catch (error) {
        console.error('Error loading content:', error);
        expandedArticles.delete(itemId);
        buttonEl.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          Read all
        `;
        return;
      }
    }
    
    // Display content
    const content = loadedContent.get(itemId);
    if (content && contentEl) {
      contentEl.innerHTML = content;
      descriptionEl?.classList.add('hidden');
      contentEl.classList.remove('hidden');
      imageEl?.classList.add('hidden');
      
      // Disable link to prevent navigation when expanded
      if (linkEl) {
        linkEl.style.pointerEvents = 'none';
      }
      
      // Update button
      buttonEl.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
        </svg>
        Collapse
      `;
    }
  }
}

// Form submission
document.getElementById('feedForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnContent = submitBtn.innerHTML;
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="w-5 h-5 animate-spin inline-block" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    ${currentFeedId ? 'Saving...' : 'Fetching feed...'}
  `;
  
  const formData = {
    title: document.getElementById('feedTitle').value,
    url: document.getElementById('feedUrl').value,
    icon_url: document.getElementById('feedIcon').value,
    color: document.getElementById('feedColor').value,
    fetch_content: document.getElementById('feedFetchContent').value === '1',
  };
  
  try {
    let response;
    if (currentFeedId) {
      // Update existing feed
      response = await fetch(`/api/feeds/${currentFeedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } else {
      // Create new feed
      response = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }
    
    if (response.ok) {
      closeSettingsModal();
      window.location.reload();
    } else {
      const error = await response.json();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
      showAlert('Error: ' + error.error, 'Error', 'error');
    }
  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnContent;
    showAlert('Error: ' + error.message, 'Error', 'error');
  }
});

// Detect icon and color from feed URL (server-side)
async function detectIconFromFeedUrl(feedUrl) {
  if (!feedUrl) return;
  
  try {
    const response = await fetch('/api/feeds/detect-icon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedUrl }),
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        // Update icon URL field
        const iconInput = document.getElementById('feedIcon');
        if (iconInput && result.iconUrl) {
          iconInput.value = result.iconUrl;
        }
        
        // Update color picker
        const colorInput = document.getElementById('feedColor');
        if (colorInput && result.color) {
          colorInput.value = result.color;
        }
      }
    }
  } catch (error) {
    console.error('Error detecting icon:', error);
  }
}

// Auto-detect icon when feed URL is entered
document.getElementById('feedUrl')?.addEventListener('blur', function() {
  const feedUrl = this.value.trim();
  if (feedUrl && feedUrl.startsWith('http')) {
    detectIconFromFeedUrl(feedUrl);
  }
});

// Detect color from icon URL - shared function
async function detectColorFromIcon() {
  const iconInput = document.getElementById('feedIcon');
  const iconUrl = iconInput?.value.trim();
  
  if (!iconUrl || !iconUrl.startsWith('http')) {
    console.log('Invalid icon URL for color detection');
    return;
  }
  
  const detectBtn = document.getElementById('detectColorBtn');
  if (detectBtn) {
    detectBtn.disabled = true;
    detectBtn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
  }
  
  try {
    const response = await fetch('/api/feeds/detect-color-from-icon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iconUrl }),
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.color) {
        // Update color picker
        const colorInput = document.getElementById('feedColor');
        if (colorInput) {
          colorInput.value = result.color;
        }
      }
    } else {
      console.error('Failed to detect color:', await response.text());
    }
  } catch (error) {
    console.error('Error detecting color from icon:', error);
  } finally {
    if (detectBtn) {
      detectBtn.disabled = false;
      detectBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>';
    }
  }
}

// Track original icon URL to detect changes
let originalIconUrl = '';

// Auto-detect color when icon URL is changed (on blur and change)
function setupIconColorDetection() {
  const iconInput = document.getElementById('feedIcon');
  if (!iconInput) return;
  
  // Store original value when focused
  iconInput.addEventListener('focus', function() {
    originalIconUrl = this.value.trim();
  });
  
  // Detect on blur only if value changed
  iconInput.addEventListener('blur', async function() {
    const newUrl = this.value.trim();
    if (newUrl && newUrl.startsWith('http') && newUrl !== originalIconUrl) {
      await detectColorFromIcon();
    }
  });
  
  // Also detect on change event (handles paste, autocomplete)
  iconInput.addEventListener('change', async function() {
    const newUrl = this.value.trim();
    if (newUrl && newUrl.startsWith('http') && newUrl !== originalIconUrl) {
      originalIconUrl = newUrl; // Update to prevent duplicate calls
      await detectColorFromIcon();
    }
  });
}

// Initialize icon color detection on DOMContentLoaded
document.addEventListener('DOMContentLoaded', setupIconColorDetection);
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('main').focus();

});
// Delete feed
async function deleteFeed() {
  if (!currentFeedId) return;
  
  showConfirm('Are you sure you want to delete this feed? All items will be deleted.', 'Delete Feed', async () => {
    try {
      const response = await fetch(`/api/feeds/${currentFeedId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        closeSettingsModal();
        window.location.href = '/';
      } else {
        const error = await response.json();
        showAlert('Error: ' + error.error, 'Error', 'error');
      }
    } catch (error) {
      showAlert('Error: ' + error.message, 'Error', 'error');
    }
  });
}

// Refresh all feeds
async function refreshAllFeeds() {
  const button = event.target;
  button.disabled = true;
  button.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Refreshing...';
  
  try {
    const response = await fetch('/api/feeds/refresh-all', {
      method: 'POST',
    });
    
    if (response.ok) {
      window.location.reload();
    } else {
      const error = await response.json();
      showAlert('Error: ' + error.error, 'Error', 'error');
      button.disabled = false;
      button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Refresh All';
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'Error', 'error');
    button.disabled = false;
    button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Refresh All';
  }
}

// Toggle read/unread status
async function toggleRead(itemId, markAsRead) {
  const endpoint = markAsRead ? 'read' : 'unread';
  
  try {
    const response = await fetch(`/api/items/${itemId}/${endpoint}`, {
      method: 'POST',
    });
    
    if (response.ok) {
      // Update UI without reload
      const article = document.querySelector(`[data-item-id="${itemId}"]`);
      if (article) {
        const feedId = article.getAttribute('data-feed-id');
        const feedColor = article.getAttribute('data-feed-color');
        
        if (markAsRead) {
          article.classList.remove('feed-border-unread');
          article.classList.add('feed-border-read');
          article.style.borderLeftColor = '';
          
          // Remove unread dot
          const unreadDot = article.querySelector('.w-2.h-2.rounded-full');
          if (unreadDot) {
            unreadDot.remove();
            // Update badges (decrement)
            if (feedId) {
              updateUnreadCounts(feedId, false);
            }
          }
        } else {
          // Mark as unread
          article.classList.remove('feed-border-read');
          article.classList.add('feed-border-unread');
          article.style.borderLeftColor = feedColor;
          
          // Add unread dot back
          const feedInfo = article.querySelector('.flex.items-center.mb-3');
          if (feedInfo && !feedInfo.querySelector('.w-2.h-2.rounded-full')) {
            const dot = document.createElement('span');
            dot.className = 'ml-2 w-2 h-2 rounded-full';
            dot.style.backgroundColor = feedColor;
            feedInfo.appendChild(dot);
          }
          
          // Update badges (increment)
          if (feedId) {
            updateUnreadCounts(feedId, true);
          }
        }
        
        // Update button text
        const button = article.querySelector('button');
        if (button) {
          button.textContent = markAsRead ? 'Mark Unread' : 'Mark Read';
          button.setAttribute('onclick', `toggleRead(${itemId}, ${!markAsRead})`);
        }
        
        // Update filter display
        updateShowReadToggle();
      }
    }
  } catch (error) {
    console.error('Error toggling read status:', error);
  }
}

// Auto-mark-as-read when items scroll out of view
const autoReadState = {
  seenArticles: new Set(),
  pendingItemIds: new Set(),
  observer: null,
  scrollRoot: null,
  scrollListenerAttached: false,
};

let markRemainingButton = null;

function setMarkRemainingButtonLabel(button, isWorking) {
  const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
  button.innerHTML = icon;
}

function ensureMarkRemainingButton() {
  if (markRemainingButton) return markRemainingButton;
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'markRemainingBtn';
  button.className = 'hidden fixed bottom-4 md:right-8 right-6 z-40 flex items-center bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white p-3 rounded-full text-sm font-medium transition shadow-lg';
  setMarkRemainingButtonLabel(button, false);
  button.addEventListener('click', async () => {
    await markRemainingVisibleAsRead();
  });
  document.body.appendChild(button);
  markRemainingButton = button;
  return button;
}

function getScrollMetrics() {
  const root = autoReadState.scrollRoot;
  if (root) {
    return {
      atBottom: root.scrollTop + root.clientHeight >= root.scrollHeight - 2,
    };
  }

  const docEl = document.documentElement;
  // Use documentElement metrics to avoid issues across browsers
  const scrollTop = docEl.scrollTop;
  const clientHeight = docEl.clientHeight;
  const scrollHeight = docEl.scrollHeight;
  return {
    atBottom: scrollTop + clientHeight >= scrollHeight - 2,
  };
}

function getRemainingVisibleUnreadArticles() {
  const unread = Array.from(document.querySelectorAll('article.feed-border-unread[data-item-id]'));
  return unread.filter(article => {
    if (article.style.display === 'none') return false;
    // Prefer observer-based visibility flag when available
    if (article.dataset.autoReadVisible === '1') return true;

    // Fallback: simple geometry check
    const rect = article.getBoundingClientRect();
    const root = autoReadState.scrollRoot;
    if (root) {
      const rootRect = root.getBoundingClientRect();
      return rect.bottom > rootRect.top && rect.top < rootRect.bottom;
    }
    return rect.bottom > 0 && rect.top < window.innerHeight;
  });
}

async function markRemainingVisibleAsRead() {
  // Mark ALL unread articles, not just visible ones
  const unreadArticles = Array.from(document.querySelectorAll('article.feed-border-unread[data-item-id]'));
  if (unreadArticles.length === 0) {
    updateMarkRemainingButtonVisibility();
    return;
  }

  const itemIds = unreadArticles
    .map(a => a.getAttribute('data-item-id'))
    .filter(Boolean);
  if (itemIds.length === 0) return;

  const button = ensureMarkRemainingButton();
  button.disabled = true;
  setMarkRemainingButtonLabel(button, true);

  try {
    const response = await fetch('/api/items/bulk-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to mark items as read');
    }

    unreadArticles.forEach(article => {
      if (isArticleUnread(article)) {
        applyReadUI(article);
      }
    });
  } catch (error) {
    console.error('Error marking remaining as read:', error);
  } finally {
    button.disabled = false;
    setMarkRemainingButtonLabel(button, false);
    updateMarkRemainingButtonVisibility();
  }
}

function updateMarkRemainingButtonVisibility() {
  // Only show when: user is at the bottom AND there are any unread items in the DOM.
  const button = ensureMarkRemainingButton();
  const { atBottom } = getScrollMetrics();
  const allUnread = document.querySelectorAll('article.feed-border-unread[data-item-id]');

  if (atBottom && allUnread.length > 0) {
    button.classList.remove('hidden');
  } else {
    button.classList.add('hidden');
  }
}

function getScrollRootElement() {
  const main = document.querySelector('main');
  if (!main) return null;
  const style = window.getComputedStyle(main);
  const overflowY = style.overflowY;
  const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && main.scrollHeight > main.clientHeight;
  return isScrollable ? main : null;
}

function isArticleUnread(article) {
  return !!article && article.classList.contains('feed-border-unread');
}

function updateArticleReadButton(article, itemId, isRead) {
  const button = article.querySelector('button');
  if (!button) return;
  button.textContent = isRead ? 'Mark Unread' : 'Mark Read';
  button.setAttribute('onclick', `toggleRead(${itemId}, ${!isRead})`);
}

function applyReadUI(article) {
  const itemId = article.getAttribute('data-item-id');
  const feedId = article.getAttribute('data-feed-id');

  article.classList.remove('feed-border-unread');
  article.classList.add('feed-border-read');
  article.style.borderLeftColor = '';

  const unreadDot = article.querySelector('.w-2.h-2.rounded-full');
  if (unreadDot) {
    unreadDot.remove();
  }

  if (feedId) {
    updateUnreadCounts(feedId);
  }

  if (itemId) {
    updateArticleReadButton(article, itemId, true);
  }

  updateShowReadToggle();
}

function markAsReadByAutoScroll(article) {
  const itemId = article.getAttribute('data-item-id');
  if (!itemId) return;
  if (!isArticleUnread(article)) return;
  if (autoReadState.pendingItemIds.has(itemId)) return;

  autoReadState.pendingItemIds.add(itemId);
  fetch(`/api/items/${itemId}/read`, { method: 'POST' })
    .then(() => {
      if (isArticleUnread(article)) {
        applyReadUI(article);
      }
    })
    .catch(err => console.error('Error marking as read:', err))
    .finally(() => {
      autoReadState.pendingItemIds.delete(itemId);
      autoReadState.seenArticles.delete(article);
    });
}

function checkForScrolledPastUnread() {
  const root = autoReadState.scrollRoot;
  const rootTop = root ? root.getBoundingClientRect().top : 0;
  const pastTopMargin = 8;

  for (const article of Array.from(autoReadState.seenArticles)) {
    if (!article || !document.body.contains(article) || !isArticleUnread(article)) {
      autoReadState.seenArticles.delete(article);
      continue;
    }

    if (article.style.display === 'none') {
      autoReadState.seenArticles.delete(article);
      continue;
    }

    const rect = article.getBoundingClientRect();
    const fullyAboveRoot = rect.bottom < rootTop + pastTopMargin;
    if (fullyAboveRoot) {
      markAsReadByAutoScroll(article);
    }
  }
}

function setupAutoMarkAsReadOnScroll() {
  const articles = document.querySelectorAll('article[data-item-id]');
  if (articles.length === 0) return;

  const nextRoot = getScrollRootElement();
  if (autoReadState.scrollRoot !== nextRoot) {
    autoReadState.scrollRoot = nextRoot;
    if (autoReadState.observer) {
      autoReadState.observer.disconnect();
      autoReadState.observer = null;
    }
  }

  if (!autoReadState.observer) {
    autoReadState.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const article = entry.target;

          // Track current visibility for the "mark remaining" button.
          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            article.dataset.autoReadVisible = '1';
          } else {
            delete article.dataset.autoReadVisible;
          }

          if (!isArticleUnread(article)) {
            autoReadState.seenArticles.delete(article);
            continue;
          }

          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            autoReadState.seenArticles.add(article);
          } else {
            // If it's no longer intersecting, a scroll may have happened. Use geometry to decide.
            if (autoReadState.seenArticles.has(article)) {
              const rootTop = entry.rootBounds ? entry.rootBounds.top : 0;
              const pastTopMargin = 8;
              if (entry.boundingClientRect.bottom < rootTop + pastTopMargin) {
                markAsReadByAutoScroll(article);
              }
            }
          }
        }

        updateMarkRemainingButtonVisibility();
      },
      { root: autoReadState.scrollRoot, threshold: 0 }
    );
  }

  // Observe all articles (safe to call multiple times; observer ignores duplicates)
  articles.forEach(article => autoReadState.observer.observe(article));

  if (!autoReadState.scrollListenerAttached) {
    autoReadState.scrollListenerAttached = true;
    let scheduled = false;

    const scheduleCheck = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        checkForScrolledPastUnread();
        updateMarkRemainingButtonVisibility();
      });
    };

    // Attach to both: window (document scroll on mobile) and main (scroll container on desktop)
    window.addEventListener('scroll', scheduleCheck, { passive: true });
    const main = document.querySelector('main');
    main?.addEventListener('scroll', scheduleCheck, { passive: true });
    window.addEventListener('resize', scheduleCheck, { passive: true });
    document.addEventListener('visibilitychange', () => {
      // If the tab was backgrounded during scrolling, reconcile state when visible again.
      if (!document.hidden) scheduleCheck();
    });

    // Initial visibility calculation
    scheduleCheck();
  }
}

// Mark as read when clicking link
function markAsRead(itemId, event) {
  // Don't prevent default - let link open
  const article = document.querySelector(`[data-item-id="${itemId}"]`);
  const feedId = article?.getAttribute('data-feed-id');
  
  // Mark as read in background
  fetch(`/api/items/${itemId}/read`, { method: 'POST' })
    .then(() => {
      if (article) {
        article.classList.remove('feed-border-unread');
        article.classList.add('feed-border-read');
        article.style.borderLeftColor = '';
        
        const unreadDot = article.querySelector('.w-2.h-2.rounded-full');
        if (unreadDot) {
          unreadDot.remove();
          // Update badges
          if (feedId) {
            updateUnreadCounts(feedId);
          }
        }

        updateArticleReadButton(article, itemId, true);
        
        // Update filter display
        updateShowReadToggle();
      }
    })
    .catch(err => console.error('Error marking as read:', err));
}

// Mark all visible unread items as read
async function markAllAsRead() {
  const button = document.getElementById('markAllBtn');
  if (!button) return;
  
  // Get ALL unread items (not just visible ones)
  const unreadArticles = Array.from(document.querySelectorAll('article.feed-border-unread'));
  
  if (unreadArticles.length === 0) {
    return;
  }
  
  const itemIds = unreadArticles.map(article => article.getAttribute('data-item-id'));
  
  // Disable button during operation
  button.disabled = true;
  button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Marking...';
  
  try {
    const response = await fetch('/api/items/bulk-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemIds }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark items as read');
    }
    
    const result = await response.json();
    
    // Update UI for all marked items
    unreadArticles.forEach(article => {
      const itemId = article.getAttribute('data-item-id');
      const feedId = article.getAttribute('data-feed-id');
      
      article.classList.remove('feed-border-unread');
      article.classList.add('feed-border-read');
      article.style.borderLeftColor = '';
      
      const unreadDot = article.querySelector('.w-2.h-2.rounded-full');
      if (unreadDot) {
        unreadDot.remove();
      }
      
      // Update button text
      const toggleButton = article.querySelector('button');
      if (toggleButton) {
        toggleButton.textContent = 'Mark Unread';
        toggleButton.setAttribute('onclick', `toggleRead(${itemId}, false)`);
      }
      
      // Update unread counts
      if (feedId) {
        updateUnreadCounts(feedId, false);
      }
    });
    
    // Update filter display
    updateShowReadToggle();
    
    // Re-enable button
    button.disabled = false;
    button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Mark as read';
  } catch (error) {
    console.error('Error marking items as read:', error);
    button.disabled = false;
    button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Mark as read';
  }
}

// Close modal on background click (only for confirm and alert modals)
document.getElementById('confirmModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'confirmModal') {
    closeConfirmModal();
  }
});

document.getElementById('alertModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'alertModal') {
    closeAlertModal();
  }
});

document.getElementById('filterModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'filterModal') {
    closeFilterModal();
  }
});

// Enable auto-mark-as-read on scroll
setupAutoMarkAsReadOnScroll();

// Initialize UI state (after all helpers are defined)
initDarkMode();
initShowReadToggle();

// Keep mobile menu button icon in sync
updateMobileMenuButtonIcon();
window.addEventListener('resize', () => {
  updateMobileMenuButtonIcon();
}, { passive: true });

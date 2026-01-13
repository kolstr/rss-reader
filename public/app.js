// Modal management
let currentFeedId = null;
let confirmCallback = null;

// Auto-mark as read on scroll out of view
let readObserver = null;
const observedUnreadItems = new Set();

// Unread filter management
let showOnlyUnread = localStorage.getItem('showOnlyUnread') === 'true';

function initUnreadFilter() {
  updateUnreadFilter();
}

function toggleUnreadFilter() {
  showOnlyUnread = !showOnlyUnread;
  localStorage.setItem('showOnlyUnread', showOnlyUnread);
  updateUnreadFilter();
}

function updateUnreadFilter() {
  const toggleBtn = document.getElementById('unreadToggle');
  const toggleText = document.getElementById('unreadToggleText');
  const toggleIcon = document.getElementById('unreadToggleIcon');
  const articles = document.querySelectorAll('article[data-item-id]');
  
  // Temporarily pause the observer during filter changes
  if (readObserver) {
    readObserver.disconnect();
  }
  
  if (showOnlyUnread) {
    // Show only unread items
    toggleText.textContent = 'Show All';
    toggleBtn?.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white', 'dark:bg-blue-600', 'dark:hover:bg-blue-700');
    toggleBtn?.classList.remove('bg-gray-100', 'hover:bg-gray-200', 'dark:bg-gray-700', 'dark:hover:bg-gray-600', 'text-gray-700', 'dark:text-gray-200');
    
    // Eye-off icon
    if (toggleIcon) {
      toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>';
    }
    
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
    if (countEl) countEl.textContent = visibleCount;
  } else {
    // Show all items
    toggleText.textContent = 'Show Unread';
    toggleBtn?.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'text-white', 'dark:bg-blue-600', 'dark:hover:bg-blue-700');
    toggleBtn?.classList.add('bg-gray-100', 'hover:bg-gray-200', 'dark:bg-gray-700', 'dark:hover:bg-gray-600', 'text-gray-700', 'dark:text-gray-200');
    
    // Eye icon
    if (toggleIcon) {
      toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>';
    }
    
    articles.forEach(article => {
      article.style.display = '';
    });
    
    const countEl = document.getElementById('visibleItemsCount');
    if (countEl) countEl.textContent = articles.length;
  }
  
  // Resume the observer after a short delay to let DOM settle
  setTimeout(() => {
    if (readObserver) {
      observedUnreadItems.clear();
      document.querySelectorAll('article.feed-border-unread').forEach(article => {
        if (article.style.display !== 'none') {
          readObserver.observe(article);
        }
      });
    }
  }, 100);
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

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcons();
}

// Initialize dark mode on page load
initDarkMode();

// Initialize unread filter on page load
initUnreadFilter();

// Sidebar management for mobile
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  
  sidebar.classList.toggle('-translate-x-full');
  overlay.classList.toggle('hidden');
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

function editFeed(id, title, url, iconUrl, color) {
  currentFeedId = id;
  document.getElementById('modalTitle').textContent = 'Edit Feed';
  document.getElementById('feedId').value = id;
  document.getElementById('feedTitle').value = title;
  document.getElementById('feedUrl').value = url;
  document.getElementById('feedIcon').value = iconUrl || '';
  document.getElementById('feedColor').value = color;
  document.getElementById('deleteFeedBtn').classList.remove('hidden');
  document.getElementById('settingsModal').classList.remove('hidden');
  
  // Set up URL change listener for auto-fetch (though currentFeedId will prevent auto-fill)
  setupUrlAutoFetch();
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.add('hidden');
  currentFeedId = null;
}

// Form submission
document.getElementById('feedForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    title: document.getElementById('feedTitle').value,
    url: document.getElementById('feedUrl').value,
    icon_url: document.getElementById('feedIcon').value,
    color: document.getElementById('feedColor').value,
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
      showAlert('Error: ' + error.error, 'Error', 'error');
    }
  } catch (error) {
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
  button.textContent = 'Refreshing...';
  
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
      button.textContent = 'Refresh All';
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'Error', 'error');
    button.disabled = false;
    button.textContent = 'Refresh All';
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
        updateUnreadFilter();
      }
    }
  } catch (error) {
    console.error('Error toggling read status:', error);
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
        
        // Update filter display
        updateUnreadFilter();
      }
    })
    .catch(err => console.error('Error marking as read:', err));
}

function initAutoMarkAsRead() {
  // Cleanup existing observer
  if (readObserver) {
    readObserver.disconnect();
    observedUnreadItems.clear();
  }
  
  // Create intersection observer
  readObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const article = entry.target;
      const itemId = article.getAttribute('data-item-id');
      const isUnread = article.classList.contains('feed-border-unread');
      
      if (!isUnread || !itemId) return;
      
      // When the item enters the viewport, mark it for observation
      if (entry.isIntersecting) {
        observedUnreadItems.add(itemId);
      } 
      // When the item exits the viewport and was previously visible, mark as read
      else if (observedUnreadItems.has(itemId)) {
        observedUnreadItems.delete(itemId);
        
        // Mark as read
        const feedId = article.getAttribute('data-feed-id');
        fetch(`/api/items/${itemId}/read`, { method: 'POST' })
          .then(() => {
            article.classList.remove('feed-border-unread');
            article.classList.add('feed-border-read');
            article.style.borderLeftColor = '';
            
            const unreadDot = article.querySelector('.w-2.h-2.rounded-full');
            if (unreadDot) {
              unreadDot.remove();
              if (feedId) {
                updateUnreadCounts(feedId, false);
              }
            }
            
            // Update button text if exists
            const button = article.querySelector('button');
            if (button) {
              button.textContent = 'Mark Unread';
              button.setAttribute('onclick', `toggleRead(${itemId}, false)`);
            }
            
            // Update filter display
            updateUnreadFilter();
          })
          .catch(err => console.error('Error auto-marking as read:', err));
      }
    });
  }, {
    root: null, // viewport
    threshold: 0, // trigger when any part leaves viewport
    rootMargin: '0px'
  });
  
  // Observe all unread articles
  document.querySelectorAll('article.feed-border-unread').forEach(article => {
    readObserver.observe(article);
  });
}

// Initialize on page load
initAutoMarkAsRead();

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

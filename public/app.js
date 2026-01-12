// Modal management
let currentFeedId = null;
let confirmCallback = null;

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

// Auto-detect color when icon URL is changed
document.getElementById('feedIcon')?.addEventListener('blur', async function() {
  const iconUrl = this.value.trim();
  if (iconUrl && iconUrl.startsWith('http')) {
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
      }
    } catch (error) {
      console.error('Error detecting color from icon:', error);
    }
  }
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
      }
    })
    .catch(err => console.error('Error marking as read:', err));
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

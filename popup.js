document.addEventListener('DOMContentLoaded', function() {
  console.debug('[LogFilter] Popup initialized');
  const debugFilter = document.getElementById('debugFilter');
  const themeToggle = document.getElementById('themeToggle');
  const highlightPattern = document.getElementById('highlightPattern');

  // Load saved states
  console.debug('[LogFilter] Loading saved filter states');
  chrome.storage.local.get(['showDebug', 'darkMode', 'highlightPattern'], function(result) {
    console.debug('[LogFilter] Loaded states:', result);
    
    // Toggle debug state
    const newDebugState = !(result.showDebug !== false);
    debugFilter.checked = newDebugState;
    
    // Set theme
    themeToggle.checked = result.darkMode === undefined ? true : result.darkMode;
    
    // Set pattern
    if (result.highlightPattern) {
      highlightPattern.value = result.highlightPattern;
    }
    
    console.debug('[LogFilter] Applied states - debug:', debugFilter.checked, 'darkMode:', themeToggle.checked, 'pattern:', highlightPattern.value);
    
    // Set initial dark mode if not set
    if (result.darkMode === undefined) {
      chrome.storage.local.set({ darkMode: true });
    }
    
    // Save and apply the new debug state
    chrome.storage.local.set({ showDebug: newDebugState }, function() {
      applyFilters();
    });
  });

  // Add change listeners
  debugFilter.addEventListener('change', function() {
    console.debug('[LogFilter] Debug filter changed:', debugFilter.checked);
    chrome.storage.local.set({ showDebug: debugFilter.checked }, function() {
      applyFilters();
    });
  });

  themeToggle.addEventListener('change', function() {
    console.debug('[LogFilter] Theme changed:', themeToggle.checked);
    chrome.storage.local.set({ darkMode: themeToggle.checked }, function() {
      applyFilters();
    });
  });

  // Add input listener for pattern with debounce
  let patternTimeout;
  highlightPattern.addEventListener('input', function() {
    clearTimeout(patternTimeout);
    patternTimeout = setTimeout(() => {
      console.debug('[LogFilter] Pattern changed:', highlightPattern.value);
      chrome.storage.local.set({ highlightPattern: highlightPattern.value }, function() {
        applyFilters();
      });
    }, 300); // Wait 300ms after typing stops
  });

  function applyFilters() {
    console.debug('[LogFilter] Applying filters to active tab');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0]) {
        console.debug('[LogFilter] No active tab found');
        return;
      }
      
      const message = {
        showDebug: debugFilter.checked,
        darkMode: themeToggle.checked,
        highlightPattern: highlightPattern.value || '------------------------ live log'
      };
      console.debug('[LogFilter] Sending message to content script:', message);
      
      chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
        if (chrome.runtime.lastError) {
          console.debug('[LogFilter] Error:', chrome.runtime.lastError);
          return;
        }
        console.debug('[LogFilter] Filter application response:', response);
      });
    });
  }
});

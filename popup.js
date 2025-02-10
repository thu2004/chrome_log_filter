document.addEventListener('DOMContentLoaded', function() {
  console.debug('[LogFilter] Popup initialized');
  const debugFilter = document.getElementById('debugFilter');
  const themeToggle = document.getElementById('themeToggle');
  const highlightPattern = document.getElementById('highlightPattern');
  const excludePatterns = document.getElementById('excludePatterns');

  // Load saved states
  console.debug('[LogFilter] Loading saved filter states');
  chrome.storage.local.get(['showDebug', 'darkMode', 'highlightPattern', 'excludePatterns'], function(result) {
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

    // Set exclude patterns
    if (result.excludePatterns) {
      excludePatterns.value = result.excludePatterns;
    } else {
      excludePatterns.value = '[comm_libs.';
      chrome.storage.local.set({ excludePatterns: '[comm_libs.' });
    }
    
    console.debug('[LogFilter] Applied states - debug:', debugFilter.checked, 'darkMode:', themeToggle.checked, 'pattern:', highlightPattern.value, 'excludePatterns:', excludePatterns.value);
    
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

  highlightPattern.addEventListener('input', function() {
    console.debug('[LogFilter] Pattern changed:', highlightPattern.value);
    chrome.storage.local.set({ highlightPattern: highlightPattern.value }, function() {
      applyFilters();
    });
  });

  excludePatterns.addEventListener('input', function() {
    console.debug('[LogFilter] Exclude patterns changed:', excludePatterns.value);
    chrome.storage.local.set({ excludePatterns: excludePatterns.value }, function() {
      applyFilters();
    });
  });

  function applyFilters() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          showDebug: debugFilter.checked,
          darkMode: themeToggle.checked,
          highlightPattern: highlightPattern.value,
          excludePatterns: excludePatterns.value
        });
      }
    });
  }
});

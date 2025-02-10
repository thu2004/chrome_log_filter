document.addEventListener('DOMContentLoaded', function() {
  console.debug('[LogFilter] Popup initialized');
  const debugFilter = document.getElementById('debugFilter');
  const themeToggle = document.getElementById('themeToggle');
  const highlightPattern = document.getElementById('highlightPattern');
  const excludePatterns = document.getElementById('excludePatterns');
  const autoToggleDebug = document.getElementById('autoToggleDebug');

  // Load saved states
  console.debug('[LogFilter] Loading saved filter states');
  browserAPI.storage.local.get(['showDebug', 'darkMode', 'highlightPattern', 'excludePatterns', 'autoToggleDebug'], function(result) {
    console.debug('[LogFilter] Loaded states:', result);
    
    // Set auto toggle debug state (default to false)
    autoToggleDebug.checked = result.autoToggleDebug === true;
    
    // Toggle debug state only if auto toggle is enabled
    const newDebugState = autoToggleDebug.checked ? !(result.showDebug !== false) : (result.showDebug !== false);
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
      browserAPI.storage.local.set({ excludePatterns: '[comm_libs.' });
    }
    
    console.debug('[LogFilter] Applied states - debug:', debugFilter.checked, 'darkMode:', themeToggle.checked, 
      'pattern:', highlightPattern.value, 'excludePatterns:', excludePatterns.value, 
      'autoToggleDebug:', autoToggleDebug.checked);
    
    // Set initial dark mode if not set
    if (result.darkMode === undefined) {
      browserAPI.storage.local.set({ darkMode: true });
    }
    
    // Save and apply the new debug state
    browserAPI.storage.local.set({ showDebug: newDebugState }, function() {
      applyFilters();
    });
  });

  // Add change listeners
  debugFilter.addEventListener('change', function() {
    console.debug('[LogFilter] Debug filter changed:', debugFilter.checked);
    browserAPI.storage.local.set({ showDebug: debugFilter.checked }, function() {
      applyFilters();
    });
  });

  autoToggleDebug.addEventListener('change', function() {
    console.debug('[LogFilter] Auto toggle debug changed:', autoToggleDebug.checked);
    browserAPI.storage.local.set({ autoToggleDebug: autoToggleDebug.checked });
  });

  themeToggle.addEventListener('change', function() {
    console.debug('[LogFilter] Theme changed:', themeToggle.checked);
    browserAPI.storage.local.set({ darkMode: themeToggle.checked }, function() {
      applyFilters();
    });
  });

  highlightPattern.addEventListener('input', function() {
    console.debug('[LogFilter] Pattern changed:', highlightPattern.value);
    browserAPI.storage.local.set({ highlightPattern: highlightPattern.value }, function() {
      applyFilters();
    });
  });

  excludePatterns.addEventListener('input', function() {
    console.debug('[LogFilter] Exclude patterns changed:', excludePatterns.value);
    browserAPI.storage.local.set({ excludePatterns: excludePatterns.value }, function() {
      applyFilters();
    });
  });

  function applyFilters() {
    browserAPI.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        browserAPI.tabs.sendMessage(tabs[0].id, {
          showDebug: debugFilter.checked,
          darkMode: themeToggle.checked,
          highlightPattern: highlightPattern.value,
          excludePatterns: excludePatterns.value
        });
      }
    });
  }
});

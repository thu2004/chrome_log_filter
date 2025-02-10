document.addEventListener('DOMContentLoaded', function() {
  console.debug('[LogFilter] Popup initialized');
  const enableExtension = document.getElementById('enableExtension');
  const settingsContainer = document.getElementById('settingsContainer');
  const debugFilter = document.getElementById('debugFilter');
  const themeToggle = document.getElementById('themeToggle');
  const highlightPattern = document.getElementById('highlightPattern');
  const excludePatterns = document.getElementById('excludePatterns');
  const autoToggleDebug = document.getElementById('autoToggleDebug');

  // Load saved states
  console.debug('[LogFilter] Loading saved filter states');
  chrome.storage.local.get(['enabled', 'showDebug', 'darkMode', 'highlightPattern', 'excludePatterns', 'autoToggleDebug'], function(result) {
    console.debug('[LogFilter] Loaded states:', result);
    
    // Set enabled state (default to true)
    const isEnabled = result.enabled !== false;
    enableExtension.checked = isEnabled;
    settingsContainer.classList.toggle('disabled-overlay', !isEnabled);
    
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
      chrome.storage.local.set({ excludePatterns: '[comm_libs.' });
    }
    
    console.debug('[LogFilter] Applied states - enabled:', isEnabled, 'debug:', debugFilter.checked, 
      'darkMode:', themeToggle.checked, 'pattern:', highlightPattern.value, 
      'excludePatterns:', excludePatterns.value, 'autoToggleDebug:', autoToggleDebug.checked);
    
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
  enableExtension.addEventListener('change', function() {
    console.debug('[LogFilter] Extension enabled changed:', enableExtension.checked);
    chrome.storage.local.set({ enabled: enableExtension.checked }, function() {
      settingsContainer.classList.toggle('disabled-overlay', !enableExtension.checked);
      
      if (!enableExtension.checked) {
        // If extension is disabled, refresh the current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      } else {
        applyFilters();
      }
    });
  });

  debugFilter.addEventListener('change', function() {
    console.debug('[LogFilter] Debug filter changed:', debugFilter.checked);
    chrome.storage.local.set({ showDebug: debugFilter.checked }, function() {
      applyFilters();
    });
  });

  autoToggleDebug.addEventListener('change', function() {
    console.debug('[LogFilter] Auto toggle debug changed:', autoToggleDebug.checked);
    chrome.storage.local.set({ autoToggleDebug: autoToggleDebug.checked });
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
    if (!enableExtension.checked) {
      // If extension is disabled, send message to remove all filtering
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { enabled: false });
        }
      });
      return;
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          enabled: true,
          showDebug: debugFilter.checked,
          darkMode: themeToggle.checked,
          highlightPattern: highlightPattern.value,
          excludePatterns: excludePatterns.value
        });
      }
    });
  }

  function updateIcon() {
    chrome.browserAction.setIcon({
      path: enableExtension.checked ? 'icon-enabled.png' : 'icon-disabled.png'
    });
  }
});

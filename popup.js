document.addEventListener('DOMContentLoaded', function() {
  console.debug('[LogFilter] Popup initialized');
  const enableExtension = document.getElementById('enableExtension');
  const settingsContainer = document.getElementById('settingsContainer');
  const debugFilter = document.getElementById('debugFilter');
  const themeToggle = document.getElementById('themeToggle');
  const excludePatterns = document.getElementById('excludePatterns');
  const autoToggleDebug = document.getElementById('autoToggleDebug');
  const greenHighlightPatterns = document.getElementById('greenHighlightPatterns');

  // Load saved states
  console.debug('[LogFilter] Loading saved filter states');
  chrome.storage.local.get(['enabled', 'showDebug', 'darkMode', 'excludePatterns', 'autoToggleDebug', 'greenHighlightPatterns'], function(result) {
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

    // Set exclude patterns
    if (result.excludePatterns) {
      excludePatterns.value = result.excludePatterns;
    } else {
      excludePatterns.value = '[comm_libs.';
      chrome.storage.local.set({ excludePatterns: '[comm_libs.' });
    }

    // Set green highlight patterns
    if (result.greenHighlightPatterns) {
      greenHighlightPatterns.value = result.greenHighlightPatterns;
    } else {
      greenHighlightPatterns.value = '--- live log';
      chrome.storage.local.set({ greenHighlightPatterns: '--- live log' });
    }
    
    console.debug('[LogFilter] Applied states - enabled:', isEnabled, 'debug:', debugFilter.checked, 
      'darkMode:', themeToggle.checked, 
      'excludePatterns:', excludePatterns.value, 'autoToggleDebug:', autoToggleDebug.checked,
      'greenHighlightPatterns:', greenHighlightPatterns.value);
    
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

  greenHighlightPatterns.addEventListener('input', function() {
    console.debug('[LogFilter] Green highlight patterns changed:', greenHighlightPatterns.value);
    chrome.storage.local.set({ greenHighlightPatterns: greenHighlightPatterns.value }, function() {
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
          chrome.tabs.sendMessage(tabs[0].id, { type: 'applyFilters', enabled: false });
        }
      });
      return;
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'applyFilters',
          enabled: true,
          showDebug: debugFilter.checked,
          darkMode: themeToggle.checked,
          excludePatterns: excludePatterns.value,
          greenHighlightPatterns: greenHighlightPatterns.value
        });
      }
    });
  }

  function updateIcon() {
    const iconPath = enableExtension.checked ? 'icons/icon-48.png' : 'icons/icon-disabled-48.png';
    chrome.action.setIcon({ path: iconPath });
  }
});

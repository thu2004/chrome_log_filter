I'll help you create a Chrome extension that can filter log messages on the webpage. Let's create a simple extension that can toggle DEBUG logs and potentially add more filtering options.



```javascript
// manifest.json
{
  "manifest_version": 3,
  "name": "Log Filter",
  "version": "1.0",
  "description": "Filter log messages on webpages",
  "permissions": ["activeTab", "scripting"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}

// popup.html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      width: 200px;
      padding: 10px;
    }
    .filter-option {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <h3>Log Filter Options</h3>
  <div class="filter-option">
    <input type="checkbox" id="debugFilter" checked>
    <label for="debugFilter">Show DEBUG logs</label>
  </div>
  <div class="filter-option">
    <input type="checkbox" id="infoFilter" checked>
    <label for="infoFilter">Show INFO logs</label>
  </div>
  <script src="popup.js"></script>
</body>
</html>

// popup.js
document.addEventListener('DOMContentLoaded', function() {
  const debugFilter = document.getElementById('debugFilter');
  const infoFilter = document.getElementById('infoFilter');

  // Load saved states
  chrome.storage.local.get(['showDebug', 'showInfo'], function(result) {
    debugFilter.checked = result.showDebug !== false;
    infoFilter.checked = result.showInfo !== false;
  });

  // Add change listeners
  debugFilter.addEventListener('change', function() {
    chrome.storage.local.set({ showDebug: debugFilter.checked });
    applyFilters();
  });

  infoFilter.addEventListener('change', function() {
    chrome.storage.local.set({ showInfo: infoFilter.checked });
    applyFilters();
  });

  function applyFilters() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        showDebug: debugFilter.checked,
        showInfo: infoFilter.checked
      });
    });
  }
});

// content.js
function applyLogFilters(showDebug, showInfo) {
  const logLines = document.querySelectorAll('pre');
  
  logLines.forEach(line => {
    const text = line.textContent;
    if (text.includes('[DEBUG]') && !showDebug) {
      line.style.display = 'none';
    } else if (text.includes('[INFO]') && !showInfo) {
      line.style.display = 'none';
    } else {
      line.style.display = '';
    }
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  applyLogFilters(request.showDebug, request.showInfo);
});

// Initial filter application
chrome.storage.local.get(['showDebug', 'showInfo'], function(result) {
  applyLogFilters(
    result.showDebug !== false,
    result.showInfo !== false
  );
});

```

To use this Chrome extension:

1. Create a new directory for your extension
2. Create these files with the provided code
3. In Chrome, go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select your extension directory

Features:
- Toggles for DEBUG and INFO log visibility
- Persistent settings across browser sessions
- Real-time filtering
- Works on any webpage with log content

To customize this extension:
1. Add more log levels by adding checkboxes in `popup.html`
2. Modify the filtering logic in `content.js`
3. Add custom CSS styling in `popup.html`

Would you like me to add any additional features, such as:
- Regular expression filtering
- Custom color highlighting for different log levels
- Export filtered logs
- Search functionality
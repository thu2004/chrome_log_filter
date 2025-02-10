// Import browser polyfill
// importScripts('browser-polyfill.js');

// Set initial state
chrome.storage.local.get(['enabled'], function(result) {
  updateBadge(result.enabled !== false);
});

// Listen for changes to enabled state
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local' && changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

function updateBadge(enabled) {
  chrome.action.setBadgeText({ 
    text: enabled ? '' : 'OFF'
  });
  chrome.action.setBadgeBackgroundColor({ 
    color: enabled ? '#4285f4' : '#999999'
  });
}

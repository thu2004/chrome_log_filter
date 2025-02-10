// Set initial state
browserAPI.storage.local.get(['enabled'], function(result) {
  updateBadge(result.enabled !== false);
});

// Listen for changes to enabled state
browserAPI.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local' && changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

function updateBadge(enabled) {
  browserAPI.action.setBadgeText({ 
    text: enabled ? '' : 'OFF'
  });
  browserAPI.action.setBadgeBackgroundColor({ 
    color: enabled ? '#4285f4' : '#999999'
  });
}

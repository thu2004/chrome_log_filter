// Browser API compatibility layer
const browserAPI = (function() {
    // Check if running in Firefox (browser exists)
    if (typeof browser !== 'undefined' && browser.runtime) {
        return browser;
    }
    
    // Check if running in Chrome (chrome exists)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        return {
            runtime: {
                ...chrome.runtime,
                onMessage: {
                    addListener: function(callback) {
                        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                            callback(message, sender, sendResponse);
                            return true; // Keep message channel open for async responses
                        });
                    }
                }
            },
            storage: chrome.storage,
            tabs: chrome.tabs
        };
    }
    
    // Fallback for content scripts that might not have direct access
    return {
        runtime: {
            onMessage: {
                addListener: function(callback) {
                    window.addEventListener('message', function(event) {
                        // Only accept messages from our extension
                        if (event.source !== window) return;
                        if (!event.data || !event.data.type || event.data.type !== 'LOG_FILTER_MESSAGE') return;
                        
                        callback(event.data.message, { id: null }, function(response) {
                            window.postMessage({
                                type: 'LOG_FILTER_RESPONSE',
                                response: response
                            }, '*');
                        });
                    });
                }
            }
        }
    };
})();

// Store original content for each pre element
const originalContents = new WeakMap();
const DEFAULT_HIGHLIGHT_PATTERN = '------------------------ live log';
const ERROR_PATTERN = 'ERROR';
const PASS_PATTERN = 'PASS';
const WARNING_SUMMARY_PATTERN = 'warnings summary';
const DEFAULT_EXCLUDE_PATTERNS = '[comm_libs.';

// Define log colors for both themes
const LOG_STYLES = {
  light: {
    DEBUG: '#2196F3', // Blue
    DEFAULT: '#333333', // Dark gray
    HIGHLIGHT_BG: '#FFEB3B', // Yellow background
    HIGHLIGHT_TEXT: '#000000', // Black text for highlighted lines
    ERROR_TEXT: '#D32F2F', // Red text for errors
    PASS_TEXT: '#2E7D32', // Dark green text for pass
    WARNING_TEXT: '#ED6C02' // Orange text for warnings
  },
  dark: {
    DEBUG: '#5C6BC0', // Muted indigo-blue
    DEFAULT: '#E0E0E0', // Light gray
    HIGHLIGHT_BG: '#2C2C00', // Dark yellow background
    HIGHLIGHT_TEXT: '#FFEB3B', // Yellow text for highlighted lines
    ERROR_TEXT: '#FF5252', // Light red text for errors
    PASS_TEXT: '#81C784', // Light green text for pass
    WARNING_TEXT: '#FFB74D' // Light orange text for warnings
  }
};

// Add CSS styles to the page
function addStyles(darkMode) {
  // Remove existing styles if any
  const existingStyle = document.getElementById('log-filter-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  const colors = darkMode ? LOG_STYLES.dark : LOG_STYLES.light;
  const style = document.createElement('style');
  style.id = 'log-filter-styles';
  style.textContent = `
    .log-container {
      background-color: ${darkMode ? '#1E1E1E' : '#FFFFFF'};
      color: ${darkMode ? '#E0E0E0' : '#333333'};
      padding: 10px;
      border-radius: 4px;
    }
    .log-line {
      display: block;
      font-family: monospace;
      padding: 1px 0;
      white-space: pre;
    }
    .log-debug {
      color: ${colors.DEBUG};
    }
    .log-other {
      color: ${colors.DEFAULT};
    }
    .log-highlight {
      background-color: ${colors.HIGHLIGHT_BG};
      color: ${colors.HIGHLIGHT_TEXT};
      font-weight: bold;
    }
    .log-error {
      color: ${colors.ERROR_TEXT};
      font-weight: bold;
    }
    .log-pass {
      color: ${colors.PASS_TEXT};
      font-weight: bold;
    }
    .log-warning {
      color: ${colors.WARNING_TEXT};
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);
}

function initializeLogContainers() {
  const logContainers = document.querySelectorAll('pre');
  logContainers.forEach(container => {
    if (!originalContents.has(container)) {
      originalContents.set(container, container.textContent);
      container.classList.add('log-container');
    }
  });
}

function formatLogLine(line, pattern, excludePatterns) {
  // Skip empty lines
  if (!line.trim()) {
    return '';
  }

  // Check if line matches any exclude pattern
  if (excludePatterns) {
    const patterns = excludePatterns.split(',').map(p => p.trim());
    if (patterns.some(pattern => line.includes(pattern))) {
      return '';
    }
  }

  let formattedLine = line;
  
  // Highlight ERROR in red
  if (line.includes(ERROR_PATTERN)) {
    formattedLine = `<span style="color: #ff6b6b;">${line}</span>`;
  }
  // Highlight PASS in green
  else if (line.includes(PASS_PATTERN)) {
    formattedLine = `<span style="color: #51cf66;">${line}</span>`;
  }
  // Highlight warning summary in yellow
  else if (line.includes(WARNING_SUMMARY_PATTERN)) {
    formattedLine = `<span style="color: #ffd43b;">${line}</span>`;
  }
  // Highlight custom pattern
  else if (pattern && line.includes(pattern)) {
    formattedLine = `<span style="color: #4dabf7;">${line}</span>`;
  }

  return formattedLine;
}

function applyLogFilters(showDebug, darkMode, highlightPattern = DEFAULT_HIGHLIGHT_PATTERN, excludePatterns = DEFAULT_EXCLUDE_PATTERNS) {
  console.debug('[LogFilter] Applying filters - debug:', showDebug, 'dark:', darkMode, 'pattern:', highlightPattern);
  
  document.querySelectorAll('pre').forEach(pre => {
    const originalContent = originalContents.get(pre);
    if (!originalContent) {
      originalContents.set(pre, pre.innerHTML);
    }

    // Split content into lines, filter and format them
    const lines = (originalContent || pre.innerHTML).split('\n');
    const filteredLines = lines
      .map(line => {
        // Skip DEBUG lines if debug is disabled
        if (!showDebug && line.includes('[DEBUG]')) {
          return '';
        }
        return formatLogLine(line, highlightPattern, excludePatterns);
      })
      .filter(line => line !== '') // Remove empty lines
      .join('\n');

    pre.innerHTML = filteredLines;
    
    // Apply dark mode styles
    addStyles(darkMode);
  });
}

function restoreOriginalContent() {
  document.querySelectorAll('pre').forEach(pre => {
    const originalContent = originalContents.get(pre);
    if (originalContent) {
      pre.innerHTML = originalContent;
    }
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.debug('[LogFilter] Received message from popup:', request);
  
  if (!request.enabled) {
    restoreOriginalContent();
    return;
  }

  applyLogFilters(
    request.showDebug,
    request.darkMode,
    request.highlightPattern || DEFAULT_HIGHLIGHT_PATTERN,
    request.excludePatterns || DEFAULT_EXCLUDE_PATTERNS
  );
  sendResponse({ success: true }); // Acknowledge receipt
  return true; // Keep the message channel open for async response
});

// Initial filter application
console.debug('[LogFilter] Loading initial filter settings');
try {
  chrome.storage.local.get(['enabled', 'showDebug', 'darkMode', 'highlightPattern', 'excludePatterns'], function(result) {
    console.debug('[LogFilter] Initial settings loaded:', result);
    
    // Don't apply filters if extension is disabled
    if (result.enabled === false) {
      return;
    }

    // Default to dark mode if not set
    const darkMode = result.darkMode === undefined ? true : result.darkMode;
    applyLogFilters(
      result.showDebug !== false,
      darkMode,
      result.highlightPattern || DEFAULT_HIGHLIGHT_PATTERN,
      result.excludePatterns || DEFAULT_EXCLUDE_PATTERNS
    );
  });
} catch (error) {
  console.debug('[LogFilter] Error loading initial settings:', error);
  // Apply default settings if storage access fails
  applyLogFilters(true, true, DEFAULT_HIGHLIGHT_PATTERN, DEFAULT_EXCLUDE_PATTERNS);
}

// Initialize when the content script loads
console.debug('[LogFilter] Content script initialized');
initializeLogContainers();

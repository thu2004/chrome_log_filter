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
  // Check if line should be excluded
  const patterns = excludePatterns ? excludePatterns.split(',').map(p => p.trim()) : [DEFAULT_EXCLUDE_PATTERNS];
  if (patterns.some(pattern => line.includes(pattern))) {
    return null; // Return null to indicate this line should be excluded
  }

  // Format line if not excluded
  const isDebug = line.includes('[DEBUG]');
  const isError = line.includes(ERROR_PATTERN) && !line.includes('NO_ERROR');
  const isPass = line.includes(PASS_PATTERN);
  const isWarning = line.toLowerCase().includes(WARNING_SUMMARY_PATTERN.toLowerCase());
  const matchesPattern = pattern && line.includes(pattern);

  let className = 'log-line';
  if (isDebug) className += ' log-debug';
  if (isError) className += ' log-error';
  if (isPass) className += ' log-pass';
  if (isWarning) className += ' log-warning';
  if (matchesPattern) className += ' log-highlight';

  // Escape HTML special characters to prevent XSS
  const escapedLine = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<span class="${className}">${escapedLine}</span>`;
}

function applyLogFilters(showDebug, darkMode, highlightPattern = DEFAULT_HIGHLIGHT_PATTERN, excludePatterns = DEFAULT_EXCLUDE_PATTERNS) {
  console.debug('[LogFilter] Applying filters:', { showDebug, darkMode, highlightPattern, excludePatterns });
  
  // Add styles with current theme
  addStyles(darkMode);
  
  // Process each pre element
  document.querySelectorAll('pre').forEach(pre => {
    // Get or create container
    let container = pre.parentElement.querySelector('.log-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'log-container';
      pre.parentElement.insertBefore(container, pre);
      container.appendChild(pre);
    }
    
    // Get original content
    let content = originalContents.get(pre);
    if (!content) {
      content = pre.textContent;
      originalContents.set(pre, content);
    }
    
    // Process lines
    const lines = content.split('\n');
    const processedLines = lines
      .map(line => {
        // Skip empty lines
        if (!line.trim()) return line;
        
        // Format and possibly exclude the line
        const formattedLine = formatLogLine(line, highlightPattern, excludePatterns);
        if (formattedLine === null) return null; // Skip excluded lines
        
        // Handle debug logs
        if (line.includes('[DEBUG]') && !showDebug) return null;
        
        return formattedLine || line;
      })
      .filter(line => line !== null) // Remove excluded lines
      .join('\n');
    
    pre.innerHTML = processedLines;
  });
}

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.debug('[LogFilter] Received message from popup:', request);
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
  browserAPI.storage.local.get(['showDebug', 'darkMode', 'highlightPattern', 'excludePatterns'], function(result) {
    console.debug('[LogFilter] Initial settings loaded:', result);
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

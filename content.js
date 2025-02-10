// Store original content for each pre element
const originalContents = new WeakMap();
const DEFAULT_HIGHLIGHT_PATTERN = '------------------------ live log';
const ERROR_PATTERN = 'ERROR';
const PASS_PATTERN = 'PASS';
const WARNING_SUMMARY_PATTERN = 'warnings summary';

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

function formatLogLine(line, pattern) {
  const trimmedLine = line.trim();
  if (trimmedLine === '') {
    return `<span class="log-line">${line}</span>`;
  }
  
  // Escape HTML special characters to prevent XSS
  const escapedLine = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  let classes = ['log-line'];
  
  // Add debug class if it's a debug line
  if (line.includes('[DEBUG]')) {
    classes.push('log-debug');
  } else {
    classes.push('log-other');
  }
  
  // Add error class if line contains ERROR but not NO_ERROR
  if (line.includes(ERROR_PATTERN) && !line.includes('NO_ERROR')) {
    classes.push('log-error');
  }
  // Add pass class if line contains PASS
  else if (line.includes(PASS_PATTERN)) {
    classes.push('log-pass');
  }
  // Add warning class if line contains warnings summary
  else if (line.toLowerCase().includes(WARNING_SUMMARY_PATTERN)) {
    classes.push('log-warning');
  }
  // Add highlight class if line matches pattern and doesn't have special highlighting
  else if (pattern && line.includes(pattern)) {
    classes.push('log-highlight');
  }
  
  return `<span class="${classes.join(' ')}">${escapedLine}</span>`;
}

function applyLogFilters(showDebug, darkMode, highlightPattern = DEFAULT_HIGHLIGHT_PATTERN) {
  console.debug('[LogFilter] Applying filters - showDebug:', showDebug, 'darkMode:', darkMode, 'pattern:', highlightPattern);
  
  // Update styles for dark/light mode
  addStyles(darkMode);
  
  // Find all pre elements that might contain logs
  const logContainers = document.querySelectorAll('pre');
  console.debug('[LogFilter] Found', logContainers.length, 'log containers to process');

  // Initialize containers if needed
  initializeLogContainers();

  logContainers.forEach((container, containerIndex) => {
    // Get the original content from our stored map
    const originalContent = originalContents.get(container);
    const lines = originalContent.split('\n');
    console.debug(`[LogFilter] Container ${containerIndex}: Processing ${lines.length} lines`);

    // Process each line
    const visibleLines = lines.filter(line => {
      if (line.trim() === '') return true; // Keep empty lines
      const isDebug = line.includes('[DEBUG]');
      
      if (isDebug) {
        return showDebug;
      }
      return true; // Keep all non-DEBUG lines
    });

    console.debug(`[LogFilter] Container ${containerIndex}: ${lines.length - visibleLines.length} lines filtered out`);

    // Format each line with color and highlighting
    const formattedContent = visibleLines.map(line => formatLogLine(line, highlightPattern)).join('');
    container.innerHTML = formattedContent;
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.debug('[LogFilter] Received message from popup:', request);
  applyLogFilters(request.showDebug, request.darkMode, request.highlightPattern);
  sendResponse({success: true}); // Acknowledge receipt
  return true; // Keep the message channel open for the async response
});

// Initialize when the content script loads
console.debug('[LogFilter] Content script initialized');
addStyles(true); // Start with dark mode
initializeLogContainers();

// Initial filter application
console.debug('[LogFilter] Loading initial filter settings');
chrome.storage.local.get(['showDebug', 'darkMode', 'highlightPattern'], function(result) {
  console.debug('[LogFilter] Initial settings loaded:', result);
  // Default to dark mode if not set
  const darkMode = result.darkMode === undefined ? true : result.darkMode;
  applyLogFilters(
    result.showDebug !== false,
    darkMode,
    result.highlightPattern || DEFAULT_HIGHLIGHT_PATTERN
  );
});

// Store original content for each pre element
const originalContents = new WeakMap();
const DEFAULT_HIGHLIGHT_PATTERN = '------------------------ live log';
const ERROR_PATTERN = 'ERROR';
const PASS_PATTERN = 'PASS';
const WARNING_SUMMARY_PATTERN = 'warnings summary';
const DEFAULT_EXCLUDE_PATTERNS = '[comm_libs.';

// CSS styles for log formatting
const logStyles = {
  timestamp: 'color: #888;',
  id: 'color: #666; font-style: italic;',
  debug: 'color: #6c757d;',
  info: {
    color: '#d4d4d4',
    bgDark: '#2d4f4f',  // Dark teal background
    bgLight: '#e6f3f3'  // Light teal background
  },
  error: 'color: #dc3545; font-weight: bold;',
  warning: 'color: #ffc107;',
  pass: 'color: #28a745; font-weight: bold;',
  highlight: 'color: #0dcaf0;',
  path: 'color: #888;',
  darkMode: {
    background: '#1e1e1e',
    text: '#d4d4d4',
    debugColor: '#666666'
  },
  lightMode: {
    background: '#ffffff',
    text: '#000000',
    debugColor: '#999999'
  }
};

function formatTimestamp(timestamp) {
  // Extract time components from the timestamp
  const match = timestamp.match(/\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\]/);
  if (match) {
    return `<span style="${logStyles.timestamp}">[${match[1]}]</span>`;
  }
  return timestamp;
}

function formatLogId(id) {
  // Format the process ID and thread ID
  const match = id.match(/\[(\d+)\]/);
  if (match) {
    return `<span style="${logStyles.id}">[${match[1]}]</span>`;
  }
  return id;
}

function formatLogLevel(level, isDarkMode) {
  if (level.includes('[DEBUG]')) {
    return `<span style="color: ${isDarkMode ? logStyles.darkMode.debugColor : logStyles.lightMode.debugColor}">[DEBUG]</span>`;
  } else if (level.includes('[ERROR]')) {
    return `<span style="${logStyles.error}">[ERROR]</span>`;
  } else if (level.includes('[WARNING]')) {
    return `<span style="${logStyles.warning}">[WARNING]</span>`;
  } else if (level.includes('[INFO]')) {
    const bgColor = isDarkMode ? logStyles.info.bgDark : logStyles.info.bgLight;
    return `<span style="background-color: ${bgColor}; padding: 0 4px;">[INFO]</span>`;
  }
  return level;
}

function formatCodePath(path) {
  // Format code paths like [cspfw.public.serial.serial_logger.SerialLogger:61]
  const match = path.match(/\[([\w\.\:]+)\]/);
  if (match) {
    return `<span style="${logStyles.path}">[${match[1]}]</span>`;
  }
  return path;
}

function formatLogLine(line, pattern, excludePatterns, isDarkMode) {
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

  // Split line into components
  const parts = line.split(/(\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}\]|\[\d+\]|\[(?:DEBUG|ERROR|WARNING|INFO)\]|\[[\w\.\:]+\])/g);
  
  let formattedLine = '';
  let isSpecialLine = false;

  // Check for special lines first
  if (line.includes(ERROR_PATTERN)) {
    formattedLine = `<span style="${logStyles.error}">${line}</span>`;
    isSpecialLine = true;
  } else if (line.includes(PASS_PATTERN)) {
    formattedLine = `<span style="${logStyles.pass}">${line}</span>`;
    isSpecialLine = true;
  } else if (line.includes(WARNING_SUMMARY_PATTERN)) {
    formattedLine = `<span style="${logStyles.warning}">${line}</span>`;
    isSpecialLine = true;
  } else if (pattern && line.includes(pattern)) {
    formattedLine = `<span style="${logStyles.highlight}">${line}</span>`;
    isSpecialLine = true;
  }

  // If not a special line, format each component
  if (!isSpecialLine) {
    formattedLine = parts.map(part => {
      if (!part) return '';
      if (part.match(/\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}\]/)) {
        return formatTimestamp(part);
      } else if (part.match(/\[\d+\]/)) {
        return formatLogId(part);
      } else if (part.match(/\[(?:DEBUG|ERROR|WARNING|INFO)\]/)) {
        return formatLogLevel(part, isDarkMode);
      } else if (part.match(/\[[\w\.\:]+\]/)) {
        return formatCodePath(part);
      }
      return part;
    }).join('');
  }
  return `<div class="log-line">${formattedLine}</div>`;
}

function addStyles(darkMode) {
  const style = document.createElement('style');
  const theme = darkMode ? logStyles.darkMode : logStyles.lightMode;
  
  style.textContent = `
    pre {
      background-color: ${theme.background} !important;
      color: ${theme.text} !important;
      padding: 8px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.2;
      white-space: pre;
      word-wrap: normal;
      overflow-x: auto;
    }
    .log-line {
      display: inline;
    }
    .log-line:hover {
      background-color: ${darkMode ? '#2d2d2d' : '#f8f9fa'};
    }
  `;

  // Remove any existing style
  const existingStyle = document.querySelector('#log-filter-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  style.id = 'log-filter-style';
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
        return formatLogLine(line, highlightPattern, excludePatterns, darkMode);
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

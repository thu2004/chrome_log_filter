# Chrome Log Filter Extension

A Chrome extension that helps filter and highlight log messages on webpages.

## Features

1. **DEBUG Log Toggle**
   - Toggle visibility of DEBUG logs
   - Automatically toggles when opening the popup

2. **Special Text Highlighting**
   - Lines containing "ERROR" are highlighted in red text (except "NO_ERROR")
   - Lines containing "PASS" are highlighted in green text
   - Lines containing "warnings summary" are highlighted in orange text
   - Case-insensitive matching for warnings summary
   - Works in both light and dark themes

3. **Custom Pattern Highlighting**
   - Highlight lines matching a custom pattern
   - Default pattern: "------------------------ live log"
   - Pattern highlighting is secondary to special text highlighting

4. **Dark Mode Support**
   - Toggle between light and dark themes
   - Customized colors for better readability in both modes

## Installation

1. Clone this repository or download the files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon to open the popup
2. Use the checkbox to show/hide DEBUG logs
3. Enter a custom pattern to highlight specific lines
4. Toggle dark mode using the switch

Note: Special text highlighting takes precedence over pattern highlighting.

## Color Scheme

### Light Theme
- DEBUG logs: Blue
- ERROR logs: Dark red text (except NO_ERROR)
- PASS logs: Dark green text
- Warning Summary: Orange text
- Pattern matches: Yellow background with black text
- Other logs: Dark gray

### Dark Theme
- DEBUG logs: Muted indigo-blue
- ERROR logs: Light red text (except NO_ERROR)
- PASS logs: Light green text
- Warning Summary: Light orange text
- Pattern matches: Dark yellow background with yellow text
- Other logs: Light gray

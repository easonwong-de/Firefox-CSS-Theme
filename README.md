# firefox-css-theme-mcp

Model Context Protocol (MCP) server for inspecting, querying, and live-debugging Firefox UI DOM and CSS themes (`userChrome.css`).

## Requirements

- Node.js >= 18
- Firefox Browser
- `geckodriver` available on your `PATH` or managed via Selenium

## Installation & Build

```bash
npm install
npm run build
```

## Available MCP Tools

- `launch_browser`: Launches Firefox with chrome debugging capabilities enabled.
- `close_browser`: Terminates the browser instance.
- `get_ui_tree`: Dumps the hierarchical DOM tree of the chrome window.
- `query_ui_elements`: Queries elements matching a CSS selector in the browser chrome.
- `get_computed_styles`: Extracts computed CSS property values of a specific UI element.
- `inject_theme_css`: Dynamically injects or updates stylesheets in the live UI for instant feedback.
- `remove_theme_css`: Removes an injected stylesheet.
- `take_ui_screenshot`: Captures a screenshot of the browser window or a specific UI component.
- `execute_chrome_javascript`: Runs privileged JavaScript in the browser chrome window context.

## MCP Client Configuration

```json
{
	"mcpServers": {
		"firefox-css-theme": {
			"command": "node",
			"args": ["/path/to/firefox-css-theme-mcp/dist/index.js"]
		}
	}
}
```

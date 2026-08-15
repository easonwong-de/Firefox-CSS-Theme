# Firefox CSS Theme MCP

Model Context Protocol (MCP) server for inspecting, querying, and live-debugging Firefox UI DOM and CSS themes (`userChrome.css`).

## Requirements

- Node.js >= 18
- Firefox Browser
- `geckodriver` available on your `PATH` or managed via Selenium

## Installation & Usage

### Option A — CLI

#### Claude Code

```bash
claude mcp add firefox-css-theme -- npx -y firefox-css-theme-mcp
```

#### Codex

```bash
codex mcp add firefox-css-theme -- npx -y firefox-css-theme-mcp
```

### Option B — IDE Configuration

Add the server configuration to your MCP settings file:

```json
{
	"mcpServers": {
		"firefox-css-theme": {
			"command": "npx",
			"args": ["-y", "firefox-css-theme-mcp"]
		}
	}
}
```

### Option C — From Source

1. Clone the repository and build the project:

```bash
git clone https://github.com/easonwong-de/Firefox-CSS-Theme-MCP.git
cd Firefox-CSS-Theme-MCP
npm install
npm run build
```

2. Add the local build to your MCP configuration:

```json
{
	"mcpServers": {
		"firefox-css-theme": {
			"command": "node",
			"args": ["/path/to/Firefox-CSS-Theme-MCP/dist/index.js"]
		}
	}
}
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

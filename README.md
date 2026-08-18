# Firefox CSS Theme MCP

Model Context Protocol (MCP) server for inspecting, querying, and live-debugging Firefox UI DOM and CSS themes (`userChrome.css`).

![MCP Usage Example - Customising Close Tab Button](./assets/image.jpg)

## Requirements

- Node.js >= 18
- Firefox Browser

## Installation & Usage

### Option A — CLI

#### Claude Code

```bash
claude mcp add firefox-css-theme -- npx -y firefox-css-theme-mcp --nova-ui
```

#### Codex

```bash
codex mcp add firefox-css-theme -- npx -y firefox-css-theme-mcp --nova-ui
```

### Option B — IDE Configuration

Add the server configuration to your MCP settings file:

```json
{
	"mcpServers": {
		"firefox-css-theme": {
			"command": "npx",
			"args": ["-y", "firefox-css-theme-mcp", "--nova-ui"]
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
			"args": [
				"/path/to/Firefox-CSS-Theme-MCP/dist/index.js",
				"--nova-ui"
			]
		}
	}
}
```

## Command-line Flags

| Flag        | Type      | Description                                                                                                                      |
| :---------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `--nova-ui` | `boolean` | Enables the Firefox Nova UI redesign preferences (`browser.nova.enabled` and `browser.newtabpage.activity-stream.nova.enabled`). |

## Available MCP Tools

- `launch_browser`: Launches Firefox with chrome debugging capabilities enabled.
- `close_browser`: Terminates the browser instance.
- `customize_toolbar`: Activates or controls the Firefox "Customize Toolbar" mode.
- `get_ui_tree`: Dumps the hierarchical DOM tree of the chrome window.
- `query_ui_elements`: Queries elements matching a CSS selector in the browser chrome.
- `get_computed_styles`: Extracts computed CSS property values of a specific UI element.
- `inject_theme_css`: Dynamically injects or updates stylesheets in the live UI for instant feedback.
- `remove_theme_css`: Removes an injected stylesheet.
- `take_ui_screenshot`: Captures a screenshot of the browser window or a specific UI component.
- `execute_chrome_javascript`: Runs privileged JavaScript in the browser chrome window context.

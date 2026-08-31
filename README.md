# Firefox CSS Theme

[![npm version](https://img.shields.io/npm/v/firefox-css-theme)](https://www.npmjs.com/package/firefox-css-theme)
[![Test](https://github.com/easonwong-de/Firefox-CSS-Theme-MCP/actions/workflows/test.yml/badge.svg)](https://github.com/easonwong-de/Firefox-CSS-Theme-MCP/actions/workflows/test.yml)

A CLI toolkit for scaffolding, compiling, live-debugging, and watching Firefox UI and CSS themes (`userChrome.css` and `userContent.css`). It also provides a Model Context Protocol (MCP) server for AI-assisted inspection and styling.

## Requirements

- Node.js >= 20
- Firefox Browser

## Getting Started

### Installation

Install as a development dependency within your theme repository:

```bash
npm install --save-dev firefox-css-theme
```

You can add workflow scripts to your `package.json`:

```json
{
	"scripts": {
		"create": "firefox-css-theme create",
		"start": "firefox-css-theme start",
		"profiles": "firefox-css-theme profiles",
		"save": "firefox-css-theme save"
	}
}
```

> [!NOTE]
> `userChrome.css` and `userContent.css` must be located at the project root directory by default; otherwise, specify their paths using the `-c, --chrome` and `-u, --content` options.

### Scaffold Theme Files

Generate boilerplate `userChrome.css` and `userContent.css` files with Firefox namespace headers:

```bash
npm run create
```

Options:

- `-c, --chrome <path>`: Custom output path for `userChrome.css`.
- `-u, --content <path>`: Custom output path for `userContent.css`.
- `-f, --force`: Overwrite existing files.

### Start Live Development Session

Launch Firefox with hot stylesheet reloading:

```bash
npm run start
```

Options:

- `-p, --profile <name>`: Designate a specific existing Firefox profile by name. If omitted, Firefox runs in an isolated temporary profile that is automatically created and deleted on exit.
- `-c, --chrome <path>`: Custom path to `userChrome.css`.
- `-u, --content <path>`: Custom path to `userContent.css`.
- `--no-watch`: Disable file watching and live reloading.
- `--headless`: Run Firefox in headless mode.
- `--nova-ui`: Enable Firefox Nova UI redesign preferences.
- `--binary <path>`: Path to custom Firefox executable binary.

### Discover Available Profiles

List all detected Firefox profiles:

```bash
npm run profiles
```

### Save Theme to Profile

Compile and save stylesheets directly into a profile's `chrome/` directory:

```bash
npm run save -- --profile <name>
```

Options:

- `-p, --profile <name>`: Target Firefox profile name (mandatory if multiple profiles exist).
- `-c, --chrome <path>`: Custom path to `userChrome.css`.
- `-u, --content <path>`: Custom path to `userContent.css`.
- `-f, --force`: Overwrite without confirmation prompt.

> [!WARNING]
> This operation will overwrite existing CSS themes in the profile. A backup is advised.

## CLI Usage

You can also run commands on demand without local installation using `npx firefox-css-theme [command] [option]`.

```
Options:
  -v, --version     Show version number
  -h, --help        display help for command

Commands:
  create [options]  Scaffold starter userChrome.css and userContent.css files
  start [options]   Launch Firefox with live stylesheet bundling and hot-reloading
  profiles          List all detected Firefox profiles
  save [options]    Save compiled stylesheets into a Firefox profile's chrome folder
  mcp [options]     Start the Model Context Protocol (MCP) server
  help [command]    display help for command
```

## MCP Server Usage

The MCP server enables AI assistants to inspect the Firefox chrome DOM, query computed styles, inject custom CSS, and capture UI screenshots in real time.

![MCP Usage Example - Customising Close Tab Button](./assets/image.jpg)

### Configuration

Add the server to your preferred client or development environment:

#### Claude Code

```bash
claude mcp add firefox-css-theme -- npx -y firefox-css-theme mcp --nova-ui
```

#### Codex

```bash
codex mcp add firefox-css-theme -- npx -y firefox-css-theme mcp --nova-ui
```

#### IDE MCP Settings (`mcpServers`)

Using `npx`:

```json
{
	"mcpServers": {
		"firefox-css-theme": {
			"command": "npx",
			"args": ["-y", "firefox-css-theme", "mcp", "--nova-ui"]
		}
	}
}
```

Or using an absolute path to a local build:

```json
{
	"mcpServers": {
		"firefox-css-theme": {
			"command": "node",
			"args": [
				"/absolute/path/to/firefox-css-theme-mcp/dist/cli.js",
				"mcp",
				"--nova-ui"
			]
		}
	}
}
```

## Available MCP Tools

- `launch_browser`: Launches Firefox with chrome debugging capabilities enabled.
- `close_browser`: Terminates the browser instance.
- `customize_toolbar`: Activates or controls the Firefox "Customise Toolbar" mode.
- `get_ui_tree`: Dumps the hierarchical DOM tree of the chrome window.
- `query_ui_elements`: Queries elements matching a CSS selector in the browser chrome.
- `get_computed_styles`: Extracts computed CSS property values of a specific UI element.
- `inject_theme_css`: Injects stylesheets in the live UI (`target: "chrome" | "content"`).
- `remove_theme_css`: Removes an injected stylesheet by id (`target: "chrome" | "content"`).
- `list_theme_css`: Lists all currently injected custom stylesheets (`target: "chrome" | "content"`).
- `take_ui_screenshot`: Captures a screenshot of the browser window or a specific UI component.
- `execute_chrome_javascript`: Runs privileged JavaScript in the browser chrome window context.

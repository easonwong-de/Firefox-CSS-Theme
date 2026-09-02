# Firefox CSS Theme

[![npm version](https://img.shields.io/npm/v/firefox-css-theme)](https://www.npmjs.com/package/firefox-css-theme)
[![Test](https://github.com/easonwong-de/Firefox-CSS-Theme/actions/workflows/test.yml/badge.svg)](https://github.com/easonwong-de/Firefox-CSS-Theme/actions/workflows/test.yml)

A toolkit for Firefox CSS theme authors to scaffold, bundle, and live-debug `userChrome.css` and `userContent.css`. Adding it as a dev dependency effectively equips your theme with an automated installer for end users.

It also provides an integrated Model Context Protocol (MCP) server for AI-assisted DOM inspection and live styling.

## Requirements

- Node.js >= 20
- Firefox Browser

## Getting Started

### For Theme Authors

Install as a development dependency:

```bash
npm install --save-dev firefox-css-theme
```

Add helper scripts to your `package.json`:

```javascript
{
	"scripts": {
		"create": "firefox-css-theme create", // scaffold starter CSS templates
		"start": "firefox-css-theme start", // launch Firefox with live CSS hot-reloading
		"profiles": "firefox-css-theme profiles", // list all detected Firefox profiles
		"install:theme": "firefox-css-theme install" // installer script for users
	}
}
```

> [!NOTE]
> `userChrome.css` and/or `userContent.css` must be located at the project root directory by default; otherwise, specify their paths using the `-c, --chrome` and `-u, --content` options.

### For End Users

When users clone your theme repository, they only need to run the installer:

```bash
# Clone the repository and install dependencies
npm install

# Installer the CSS theme
npm run install:theme
```

If multiple Firefox profiles exist, the target profile needs to be specified with `-p, --profile <name>` (run `firefox-css-theme profiles` to list them).

For the full list of CLI options, run `npx firefox-css-theme --help` in your project.

## Commands

### `firefox-css-theme create`

Scaffold starter `userChrome.css` and `userContent.css` boilerplate files with Firefox namespace headers.

#### Usage

```bash
firefox-css-theme create [options]
```

#### Options

| Option                 | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| `-c, --chrome <path>`  | Custom output path for `userChrome.css` (default: `./userChrome.css`)   |
| `-u, --content <path>` | Custom output path for `userContent.css` (default: `./userContent.css`) |
| `-f, --force`          | Overwrite existing files without confirmation                           |

### `firefox-css-theme start`

Launch Firefox with live stylesheet bundling (`@import` inlining) and hot-reloading. Uses a temporary profile by default to keep your personal profile safe.

#### Usage

```bash
firefox-css-theme start [options]
```

#### Options

| Option                 | Description                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| `-p, --profile <name>` | Designate an existing Firefox profile by name (temporary profile if omitted) |
| `-c, --chrome <path>`  | Custom path to `userChrome.css` (default: `./userChrome.css`)                |
| `-u, --content <path>` | Custom path to `userContent.css` (default: `./userContent.css`)              |
| `--no-watch`           | Disable file watching and live reloading                                     |
| `--headless`           | Run Firefox in headless mode                                                 |
| `--nova-ui`            | Enable Firefox Nova UI redesign preferences                                  |
| `--binary <path>`      | Path to custom Firefox executable binary                                     |

### `firefox-css-theme profiles`

List all detected Firefox profiles and their directory paths.

#### Usage

```bash
firefox-css-theme profiles
```

### `firefox-css-theme install`

The automated installer for end users. Compiles stylesheets, enables custom stylesheet preferences in `user.js`, and deploys files directly into the target Firefox profile's `chrome/` directory.

#### Usage

```bash
firefox-css-theme install [options]
```

#### Options

| Option                 | Description                                                               |
| ---------------------- | ------------------------------------------------------------------------- |
| `-p, --profile <name>` | Target Firefox profile name (mandatory if multiple profiles exist)        |
| `-c, --chrome <path>`  | Custom path to `userChrome.css` (default: `./userChrome.css`)             |
| `-u, --content <path>` | Custom path to `userContent.css` (default: `./userContent.css`)           |
| `-m, --merge`          | Merge with existing theme stylesheets instead of overwriting              |
| `-f, --force`          | Overwrite existing theme files in the profile without confirmation prompt |

> [!WARNING]
> This operation will overwrite existing CSS themes in the profile unless `--merge` is specified. A backup is advised.

### `firefox-css-theme mcp`

Start the Model Context Protocol (MCP) server over standard I/O for AI-assisted inspection and styling.

#### Usage

```bash
firefox-css-theme mcp [options]
```

#### Options

| Option                 | Description                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `-p, --profile <name>` | Designate an existing Firefox profile by name (isolated temporary profile if omitted) |
| `--nova-ui`            | Enable Firefox Nova UI redesign preferences                                           |
| `--headless`           | Run Firefox in headless mode                                                          |
| `--binary <path>`      | Path to custom Firefox executable binary                                              |

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

#### IDE MCP Configuration

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

Or using a local build:

```json
{
	"mcpServers": {
		"firefox-css-theme": {
			"command": "node",
			"args": [
				"/path/to/firefox-css-theme/dist/cli.js",
				"mcp",
				"--nova-ui"
			]
		}
	}
}
```

## Available MCP Tools

- `launch_browser`: Launches Firefox with chrome debugging.
- `close_browser`: Terminates the browser instance.
- `customize_toolbar`: Toggles the Firefox "Customise Toolbar" mode.
- `get_ui_tree`: Dumps the hierarchical DOM tree of selected UI element.
- `query_ui_elements`: Queries elements matching a CSS selector in the browser chrome.
- `get_computed_styles`: Extracts computed CSS property values of a specific UI element.
- `inject_theme_css`: Injects a stylesheet in the live UI.
- `remove_theme_css`: Removes an injected stylesheet.
- `list_theme_css`: Lists all currently injected stylesheets.
- `take_ui_screenshot`: Captures a screenshot of a specific UI component.
- `execute_chrome_javascript`: Runs JavaScript in the browser chrome window context.

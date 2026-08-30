# Firefox CSS Theme MCP (Deprecated)

> [!WARNING]
> This package (`firefox-css-theme-mcp`) has been renamed and superseded by [`firefox-css-theme`](https://www.npmjs.com/package/firefox-css-theme).

Please update your configurations to use `firefox-css-theme`.

## Migration

### Claude Code

```bash
claude mcp add firefox-css-theme -- npx -y firefox-css-theme mcp
```

### Codex

```bash
codex mcp add firefox-css-theme -- npx -y firefox-css-theme mcp
```

### MCP Settings File

```json
{
	"mcpServers": {
		"firefox-css-theme": {
			"command": "npx",
			"args": ["-y", "firefox-css-theme", "mcp"]
		}
	}
}
```

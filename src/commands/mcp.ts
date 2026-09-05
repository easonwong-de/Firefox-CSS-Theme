import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { firefoxManager } from "../firefox.js";
import { compileCssString } from "../processor.js";
import type { McpCommandOptions } from "../types.js";

/** Creates and starts the Model Context Protocol (MCP) server over standard I/O. */
export async function startMcpServer(
	options: McpCommandOptions = {},
): Promise<void> {
	const pkgJson = JSON.parse(
		readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
	) as { name: string; version: string };

	const server = new McpServer({
		name: pkgJson.name,
		version: pkgJson.version,
	});

	server.registerTool(
		"launch_browser",
		{
			description:
				"Launch a Firefox instance with chrome debugging capabilities enabled.",
			inputSchema: {
				binaryPath: z
					.string()
					.optional()
					.describe("Optional path to Firefox executable binary."),
				profileName: z
					.string()
					.optional()
					.describe(
						"Optional name of existing Firefox profile. If omitted, uses an isolated temporary profile.",
					),
				headless: z
					.boolean()
					.optional()
					.describe("Optional flag to run Firefox in headless mode."),
				novaUi: z
					.boolean()
					.optional()
					.describe(
						"Optional flag to enable Firefox Nova UI preferences.",
					),
			},
		},
		async (parameters) => {
			const profileName = parameters.profileName ?? options.profileName;

			await firefoxManager.initialiseBrowser(
				parameters.binaryPath ?? options.binaryPath,
				profileName,
				parameters.headless ?? options.headless,
				parameters.novaUi ?? options.novaUi,
			);
			return {
				content: [
					{
						type: "text",
						text: "Firefox launched successfully in chrome context.",
					},
				],
			};
		},
	);

	server.registerTool(
		"close_browser",
		{ description: "Close the running Firefox instance." },
		async () => {
			await firefoxManager.terminateBrowser();
			return {
				content: [
					{ type: "text", text: "Firefox closed successfully." },
				],
			};
		},
	);

	server.registerTool(
		"customize_toolbar",
		{
			description:
				"Activate or manage the Firefox Customise Toolbar mode in the browser chrome.",
			inputSchema: {
				action: z
					.enum(["enter", "exit"])
					.default("enter")
					.describe(
						"Action to perform on customise toolbar mode ('enter' or 'exit'). Defaults to 'enter'.",
					),
			},
		},
		async (parameters) => {
			const result = await firefoxManager.customiseToolbar(
				parameters.action,
			);
			return {
				content: [
					{ type: "text", text: JSON.stringify(result, null, 2) },
				],
			};
		},
	);

	server.registerTool(
		"get_ui_tree",
		{
			description:
				"Retrieve the hierarchical DOM tree of the Firefox chrome user interface window.",
			inputSchema: {
				rootSelector: z
					.string()
					.default("window")
					.describe("CSS selector for root element."),
				maxDepth: z
					.number()
					.default(3)
					.describe("Maximum recursive depth to traverse."),
			},
		},
		async (parameters) => {
			const treeData = await firefoxManager.getUiTree(
				parameters.rootSelector,
				parameters.maxDepth,
			);
			return {
				content: [
					{ type: "text", text: JSON.stringify(treeData, null, 2) },
				],
			};
		},
	);

	server.registerTool(
		"query_ui_elements",
		{
			description:
				"Find elements in the Firefox UI chrome document matching a CSS selector.",
			inputSchema: {
				selector: z
					.string()
					.describe(
						"CSS selector to query in chrome document (e.g. '#nav-bar', '#TabsToolbar').",
					),
			},
		},
		async (parameters) => {
			const elements = await firefoxManager.queryElements(
				parameters.selector,
			);
			return {
				content: [
					{ type: "text", text: JSON.stringify(elements, null, 2) },
				],
			};
		},
	);

	server.registerTool(
		"get_computed_styles",
		{
			description:
				"Extract computed CSS properties for a Firefox UI chrome element.",
			inputSchema: {
				selector: z
					.string()
					.describe(
						"CSS selector of the UI element (e.g. '#urlbar-background').",
					),
				properties: z
					.array(z.string())
					.optional()
					.describe("Optional list of specific CSS property names."),
			},
		},
		async (parameters) => {
			const styles = await firefoxManager.getComputedStyles(
				parameters.selector,
				parameters.properties,
			);
			return {
				content: [
					{ type: "text", text: JSON.stringify(styles, null, 2) },
				],
			};
		},
	);

	server.registerTool(
		"inject_theme_css",
		{
			description:
				"Inject or replace a live stylesheet in the Firefox window.",
			inputSchema: {
				css: z.string().describe("CSS rules to inject."),
				id: z
					.string()
					.default("mcp-injected-style")
					.describe("Identifier for the style."),
				target: z
					.enum(["chrome", "content"])
					.describe(
						"Target scope: chrome for browser UI, or content for web pages.",
					),
			},
		},
		async (parameters) => {
			const compiledCss = await compileCssString(parameters.css);
			const result =
				parameters.target === "content"
					? await firefoxManager.injectContentStyle(
							compiledCss.css,
							parameters.id,
						)
					: await firefoxManager.injectChromeStyle(
							compiledCss.css,
							parameters.id,
						);
			return {
				content: [
					{ type: "text", text: JSON.stringify(result, null, 2) },
				],
			};
		},
	);

	server.registerTool(
		"remove_theme_css",
		{
			description:
				"Remove an injected stylesheet from the Firefox window.",
			inputSchema: {
				id: z.string().describe("Identifier of the style to remove."),
				target: z
					.enum(["chrome", "content"])
					.describe(
						"Target scope of the style to remove: chrome or content.",
					),
			},
		},
		async (parameters) => {
			const result =
				parameters.target === "content"
					? await firefoxManager.removeContentStyle(parameters.id)
					: await firefoxManager.removeChromeStyle(parameters.id);
			return {
				content: [
					{ type: "text", text: JSON.stringify(result, null, 2) },
				],
			};
		},
	);

	server.registerTool(
		"list_theme_css",
		{
			description:
				"List all custom stylesheets currently injected in the Firefox window.",
			inputSchema: {
				target: z
					.enum(["chrome", "content"])
					.describe("Target scope to list: chrome or content."),
			},
		},
		async (parameters) => {
			const result =
				parameters.target === "content"
					? await firefoxManager.listContentStyles()
					: await firefoxManager.listChromeStyles();
			return {
				content: [
					{ type: "text", text: JSON.stringify(result, null, 2) },
				],
			};
		},
	);

	server.registerTool(
		"take_ui_screenshot",
		{
			description:
				"Capture a PNG screenshot of the Firefox browser chrome window or a specific UI component.",
			inputSchema: {
				selector: z
					.string()
					.optional()
					.describe(
						"Optional CSS selector to screenshot a specific element.",
					),
			},
		},
		async (parameters) => {
			const screenshot = await firefoxManager.getScreenshot(
				parameters.selector,
			);
			return {
				content: [
					{
						type: "image",
						data: screenshot.base64Image,
						mimeType: "image/png",
					},
				],
			};
		},
	);

	server.registerTool(
		"execute_chrome_javascript",
		{
			description:
				"Execute privileged JavaScript code in the Firefox chrome window context.",
			inputSchema: {
				script: z
					.string()
					.describe(
						"JavaScript code string to evaluate in chrome context.",
					),
			},
		},
		async (parameters) => {
			const result = await firefoxManager.executeChromeScript(
				parameters.script,
			);
			return {
				content: [
					{ type: "text", text: JSON.stringify(result, null, 2) },
				],
			};
		},
	);

	const transport = new StdioServerTransport();
	await server.connect(transport);
}

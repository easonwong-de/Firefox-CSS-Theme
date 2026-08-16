#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { globalFirefoxManager } from "./firefox.js";

const serverInstance = new McpServer({
	name: "firefox-css-theme-mcp",
	version: "0.1.5",
});

serverInstance.registerTool(
	"launch_browser",
	{
		description:
			"Launch a Firefox instance with chrome debugging capabilities enabled.",
		inputSchema: {
			binaryPath: z
				.string()
				.optional()
				.describe("Optional path to Firefox executable binary."),
			profileDirectory: z
				.string()
				.optional()
				.describe("Optional path to custom Firefox profile directory."),
		},
	},
	async (parameters) => {
		await globalFirefoxManager.initialiseBrowser(
			parameters.binaryPath,
			parameters.profileDirectory,
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

serverInstance.registerTool(
	"close_browser",
	{ description: "Close the running Firefox instance." },
	async () => {
		await globalFirefoxManager.terminateBrowser();
		return {
			content: [{ type: "text", text: "Firefox closed successfully." }],
		};
	},
);

serverInstance.registerTool(
	"get_ui_tree",
	{
		description:
			"Retrieve the hierarchical DOM tree of the Firefox chrome user interface window.",
		inputSchema: {
			rootSelector: z
				.string()
				.default("window")
				.describe("CSS selector for root element."),
			maximumDepth: z
				.number()
				.default(3)
				.describe("Maximum recursive depth to traverse."),
		},
	},
	async (parameters) => {
		const treeData = await globalFirefoxManager.getUserInterfaceTree(
			parameters.rootSelector,
			parameters.maximumDepth,
		);
		return {
			content: [
				{ type: "text", text: JSON.stringify(treeData, null, 2) },
			],
		};
	},
);

serverInstance.registerTool(
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
		const elements = await globalFirefoxManager.queryElements(
			parameters.selector,
		);
		return {
			content: [
				{ type: "text", text: JSON.stringify(elements, null, 2) },
			],
		};
	},
);

serverInstance.registerTool(
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
		const styles = await globalFirefoxManager.getComputedStyles(
			parameters.selector,
			parameters.properties,
		);
		return {
			content: [{ type: "text", text: JSON.stringify(styles, null, 2) }],
		};
	},
);

serverInstance.registerTool(
	"inject_theme_css",
	{
		description:
			"Inject or replace a live stylesheet in the Firefox chrome window for immediate visual testing.",
		inputSchema: {
			css: z
				.string()
				.describe("CSS rules to inject into chrome document."),
			styleId: z
				.string()
				.default("mcp-injected-style")
				.describe("Identifier for the style tag."),
		},
	},
	async (parameters) => {
		const result = await globalFirefoxManager.injectUserInterfaceStyle(
			parameters.css,
			parameters.styleId,
		);
		return {
			content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
		};
	},
);

serverInstance.registerTool(
	"remove_theme_css",
	{
		description:
			"Remove an injected stylesheet from the Firefox chrome window.",
		inputSchema: {
			styleId: z
				.string()
				.describe("Identifier of the style tag to remove."),
		},
	},
	async (parameters) => {
		const result = await globalFirefoxManager.removeUserInterfaceStyle(
			parameters.styleId,
		);
		return {
			content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
		};
	},
);

serverInstance.registerTool(
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
		const screenshot = await globalFirefoxManager.captureScreenshot(
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

serverInstance.registerTool(
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
		const result = await globalFirefoxManager.executeChromeScript(
			parameters.script,
		);
		return {
			content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
		};
	},
);

async function main(): Promise<void> {
	const transportInstance = new StdioServerTransport();
	await serverInstance.connect(transportInstance);
}

main().catch((error) => {
	console.error("Server initialisation failure:", error);
	process.exit(1);
});

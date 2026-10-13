#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { log } from "@clack/prompts";
import { Command } from "commander";
import { createCommand } from "./commands/create.js";
import { installCommand } from "./commands/install.js";
import { startMcpServer } from "./commands/mcp.js";
import { startCommand } from "./commands/start.js";

const pkgJson = JSON.parse(
	readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { name: string; version: string; description: string };

const program = new Command();

program
	.name("firefox-css-theme")
	.description(pkgJson.description)
	.version(pkgJson.version, "-v, --version", "Show version number");

program
	.command("create")
	.description("Scaffold a new Firefox CSS theme project")
	.option("-n, --name <name>", "Theme name")
	.option(
		"-t, --target <target>",
		"Stylesheet target: both, chrome, or content",
	)
	.option("-f, --force", "Proceed without warning")
	.action(
		async (options: {
			name?: string;
			target?: "both" | "chrome" | "content";
			force?: boolean;
		}) => {
			await createCommand({
				name: options.name,
				target: options.target,
				force: options.force,
			});
		},
	);

program
	.command("start")
	.description(
		"Launch Firefox with live stylesheet bundling and hot-reloading",
	)
	.option("-b, --binary <path>", "Path to Firefox executable")
	.option("-p, --profile <name>", "Firefox profile name")
	.option("--headless", "Run in headless mode")
	.option("--no-toolbox", "Disable Browser Toolbox")
	.option("--no-watch", "Disable file watching")
	.action(
		async (options: {
			binary?: string;
			profile?: string;
			headless?: boolean;
			toolbox: boolean;
			watch: boolean;
		}) => {
			await startCommand({
				binaryPath: options.binary,
				profileName: options.profile,
				headless: options.headless,
				toolbox: options.toolbox,
				watch: options.watch,
			});
		},
	);

program
	.command("install")
	.description("Install compiled stylesheets into a Firefox profile")
	.option("-p, --profile <name>", "Firefox profile name")
	.option("-m, --merge", "Merge with existing stylesheets")
	.option("-f, --force", "Proceed without warning")
	.action(
		async (options: {
			profile?: string;
			merge?: boolean;
			force?: boolean;
		}) => {
			await installCommand({
				profileName: options.profile,
				merge: options.merge,
				force: options.force,
			});
		},
	);

program
	.command("mcp")
	.description("Start the Model Context Protocol (MCP) server")
	.option("-b, --binary <path>", "Path to Firefox executable")
	.option("-p, --profile <name>", "Firefox profile name")
	.allowUnknownOption()
	.action(async (options: { binary?: string; profile?: string }) => {
		await startMcpServer({
			binaryPath: options.binary,
			profileName: options.profile,
		});
	});

/** Main CLI entry point for command parsing and execution. */
async function main(): Promise<void> {
	const scriptBinaryName = path.basename(process.argv[1] || "");

	if (
		scriptBinaryName === "firefox-css-theme-mcp" ||
		scriptBinaryName === "firefox-css-theme-mcp.js"
	) {
		await startMcpServer();
		return;
	}

	await program.parseAsync(process.argv);
}

main().catch((error) => {
	log.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});

#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { log } from "@clack/prompts";
import { Command } from "commander";
import { createCommand } from "./commands/create.js";
import { installCommand } from "./commands/install.js";
import { startMcpServer } from "./commands/mcp.js";
import { startCommand } from "./commands/start.js";

const packageJson = JSON.parse(
	readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { name: string; version: string; description: string };

const program = new Command();

program
	.name("firefox-css-theme")
	.description(packageJson.description)
	.version(packageJson.version, "-v, --version", "Show version number");

program
	.command("create")
	.description("Scaffold starter userChrome.css and userContent.css files")
	.option("-c, --chrome <path>", "Path to userChrome.css")
	.option("-u, --content <path>", "Path to userContent.css")
	.option("-f, --force", "Overwrite existing files without confirmation")
	.action(
		async (options: {
			chrome?: string;
			content?: string;
			force?: boolean;
		}) => {
			await createCommand({
				chromePath: options.chrome,
				contentPath: options.content,
				force: options.force,
			});
		},
	);

program
	.command("start")
	.description(
		"Launch Firefox with live stylesheet bundling and hot-reloading",
	)
	.option("-p, --profile <name>", "Designate Firefox profile name")
	.option(
		"-c, --chrome <path>",
		"Path to userChrome.css (default: ./userChrome.css)",
	)
	.option(
		"-u, --content <path>",
		"Path to userContent.css (default: ./userContent.css)",
	)
	.option("--binary <path>", "Path to custom Firefox executable")
	.option("--headless", "Run Firefox in headless mode")
	.option("--nova-ui", "Enable Firefox Nova UI preferences")
	.option("--no-watch", "Disable file watching in start mode")
	.action(
		async (options: {
			profile?: string;
			chrome?: string;
			content?: string;
			binary?: string;
			headless?: boolean;
			novaUi?: boolean;
			watch: boolean;
		}) => {
			await startCommand({
				profileName: options.profile,
				chromePath: options.chrome,
				contentPath: options.content,
				binaryPath: options.binary,
				headless: options.headless,
				novaUi: options.novaUi,
				watch: options.watch,
			});
		},
	);

program
	.command("install")
	.description(
		"Install compiled stylesheets into a Firefox profile's chrome folder",
	)
	.option("-p, --profile <name>", "Target Firefox profile name")
	.option("-c, --chrome <path>", "Path to userChrome.css")
	.option("-u, --content <path>", "Path to userContent.css")
	.option("-m, --merge", "Merge with existing theme stylesheets")
	.option("-f, --force", "Overwrite existing files without confirmation")
	.action(
		async (options: {
			profile?: string;
			chrome?: string;
			content?: string;
			merge?: boolean;
			force?: boolean;
		}) => {
			await installCommand({
				profileName: options.profile,
				chromePath: options.chrome,
				contentPath: options.content,
				merge: options.merge,
				force: options.force,
			});
		},
	);

program
	.command("mcp")
	.description("Start the Model Context Protocol (MCP) server")
	.option("-p, --profile <name>", "Designate Firefox profile name")
	.option("--binary <path>", "Path to custom Firefox executable")
	.option("--headless", "Run Firefox in headless mode")
	.option("--nova-ui", "Enable Firefox Nova UI preferences")
	.allowUnknownOption()
	.action(
		async (options: {
			profile?: string;
			binary?: string;
			headless?: boolean;
			novaUi?: boolean;
		}) => {
			await startMcpServer({
				profileName: options.profile,
				binaryPath: options.binary,
				headless: options.headless,
				novaUi: options.novaUi,
			});
		},
	);

/** Main CLI entry point for command parsing and execution. */
async function main(): Promise<void> {
	const scriptBinaryName = path.basename(process.argv[1] || "");

	if (
		scriptBinaryName === "firefox-css-theme-mcp" ||
		scriptBinaryName === "firefox-css-theme-mcp.js"
	) {
		const isHeadless = process.argv.includes("--headless");
		const isNovaUi = process.argv.includes("--nova-ui");
		await startMcpServer({ headless: isHeadless, novaUi: isNovaUi });
		return;
	}

	await program.parseAsync(process.argv);
}

main().catch((error) => {
	log.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});

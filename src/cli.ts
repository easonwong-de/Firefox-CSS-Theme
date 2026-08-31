#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { createCommand } from "./commands/create.js";
import { startMcpServer } from "./commands/mcp.js";
import { profilesCommand } from "./commands/profiles.js";
import { saveCommand } from "./commands/save.js";
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
	.option("--no-watch", "Disable file watching in start mode")
	.option("--headless", "Run Firefox in headless mode")
	.option("--nova-ui", "Enable Firefox Nova UI preferences")
	.option("--binary <path>", "Path to custom Firefox executable")
	.action(
		async (options: {
			binary?: string;
			chrome?: string;
			content?: string;
			headless?: boolean;
			novaUi?: boolean;
			profile?: string;
			watch: boolean;
		}) => {
			await startCommand({
				binaryPath: options.binary,
				chromePath: options.chrome,
				contentPath: options.content,
				headless: options.headless,
				novaUi: options.novaUi,
				profileName: options.profile,
				watch: options.watch,
			});
		},
	);

program
	.command("profiles")
	.description("List all detected Firefox profiles")
	.action(async () => {
		await profilesCommand();
	});

program
	.command("save")
	.description(
		"Save compiled stylesheets into a Firefox profile's chrome folder",
	)
	.option("-p, --profile <name>", "Target Firefox profile name")
	.option("-c, --chrome <path>", "Path to userChrome.css")
	.option("-u, --content <path>", "Path to userContent.css")
	.option("-f, --force", "Overwrite existing files without confirmation")
	.action(
		async (options: {
			chrome?: string;
			content?: string;
			force?: boolean;
			profile?: string;
		}) => {
			await saveCommand({
				chromePath: options.chrome,
				contentPath: options.content,
				force: options.force,
				profileName: options.profile,
			});
		},
	);

program
	.command("mcp")
	.description("Start the Model Context Protocol (MCP) server")
	.option("--nova-ui", "Enable Firefox Nova UI preferences")
	.option("--headless", "Run Firefox in headless mode")
	.option("--binary <path>", "Path to custom Firefox executable")
	.option("-p, --profile <name>", "Designate Firefox profile name")
	.allowUnknownOption()
	.action(
		async (options: {
			binary?: string;
			headless?: boolean;
			novaUi?: boolean;
			profile?: string;
		}) => {
			await startMcpServer({
				binaryPath: options.binary,
				headless: options.headless,
				novaUi: options.novaUi,
				profileName: options.profile,
			});
		},
	);

async function main(): Promise<void> {
	const scriptBinaryName = path.basename(process.argv[1] || "");

	if (
		scriptBinaryName === "firefox-css-theme-mcp" ||
		scriptBinaryName === "firefox-css-theme-mcp.js"
	) {
		const isNovaUi = process.argv.includes("--nova-ui");
		const isHeadless = process.argv.includes("--headless");
		await startMcpServer({ headless: isHeadless, novaUi: isNovaUi });
		return;
	}

	await program.parseAsync(process.argv);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});

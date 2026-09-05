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
	.command("create [name]")
	.description("Scaffold a new Firefox CSS theme package")
	.option(
		"-t, --target <target>",
		"Stylesheet target: both, chrome, or content",
	)
	.option("-f, --force", "Proceed without warning")
	.action(
		async (
			name: string | undefined,
			options: {
				force?: boolean;
				target?: "both" | "chrome" | "content";
			},
		) => {
			await createCommand({
				force: options.force,
				name: name,
				target: options.target,
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
	.option("--no-watch", "Disable file watching")
	.option("--headless", "Run in headless mode")
	.option("--nova-ui", "Enable Firefox Nova UI")
	.action(
		async (options: {
			binary?: string;
			headless?: boolean;
			novaUi?: boolean;
			profile?: string;
			watch: boolean;
		}) => {
			await startCommand({
				binaryPath: options.binary,
				headless: options.headless,
				novaUi: options.novaUi,
				profileName: options.profile,
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
			force?: boolean;
			merge?: boolean;
			profile?: string;
		}) => {
			await installCommand({
				force: options.force,
				merge: options.merge,
				profileName: options.profile,
			});
		},
	);

program
	.command("mcp")
	.description("Start the Model Context Protocol (MCP) server")
	.option("-b, --binary <path>", "Path to Firefox executable")
	.option("-p, --profile <name>", "Firefox profile name")
	.option("--headless", "Run in headless mode")
	.option("--nova-ui", "Enable Firefox Nova UI")
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

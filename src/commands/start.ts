import { existsSync } from "node:fs";
import path from "node:path";
import { firefoxManager } from "../firefox.js";
import { compileCssFile } from "../processor.js";
import { ROOT_USER_CHROME_ID, ROOT_USER_CONTENT_ID } from "../registry.js";
import type { StartCommandOptions, StyleTarget } from "../types.js";
import { type WatchedTarget, fileWatcher } from "../watcher.js";

let isShuttingDown = false;

/**
 * Shuts down the active file watcher, terminates the browser instance, and
 * exits the process.
 */
async function handleShutdown(): Promise<void> {
	if (isShuttingDown) return;
	isShuttingDown = true;
	process.off("SIGINT", handleShutdown);
	process.off("SIGTERM", handleShutdown);
	console.log("\nShutting down Firefox...");
	await fileWatcher.close().catch(() => {});
	await firefoxManager.terminateBrowser().catch(() => {});
	process.exit(0);
}

/**
 * Compiles a stylesheet file and injects the output into the browser chrome or
 * content context.
 */
async function processAndInjectCss(
	srcPath: string,
	id: string,
	target: StyleTarget,
): Promise<string[] | undefined> {
	if (!existsSync(srcPath)) {
		if (target === "content") {
			await firefoxManager.removeContentStyle(id).catch(() => {});
		} else {
			await firefoxManager.removeChromeStyle(id).catch(() => {});
		}
		return undefined;
	}

	try {
		const compilationResult = await compileCssFile(srcPath);

		if (target === "content") {
			await firefoxManager.injectContentStyle(
				compilationResult.css,
				id,
				srcPath,
			);
		} else {
			await firefoxManager.injectChromeStyle(
				compilationResult.css,
				id,
				srcPath,
			);
		}

		console.log(`\x1b[32m[reloaded]\x1b[0m ${id} (${srcPath})`);
		return compilationResult.importedFiles;
	} catch (error) {
		console.error(
			`\x1b[31m[build error]\x1b[0m ${srcPath}:`,
			error instanceof Error ? error.message : error,
		);
		return undefined;
	}
}

/** Creates and registers a watched stylesheet target for live reloading. */
function createWatchTarget(
	filePath: string,
	id: string,
	targetType: StyleTarget,
): WatchedTarget {
	const target: WatchedTarget = {
		filePaths: [filePath],
		onChange: async () => {
			const importedFiles = await processAndInjectCss(
				filePath,
				id,
				targetType,
			);
			fileWatcher.updateFilePaths(target, [
				filePath,
				...(importedFiles || []),
			]);
		},
	};
	fileWatcher.addTarget(target);
	return target;
}

/**
 * Starts a Firefox instance, compiles and injects theme stylesheets, and
 * initiates live watching.
 */
export async function startCommand(
	options: StartCommandOptions = {},
): Promise<void> {
	if (options.profileName) {
		console.log(`Using profile: \x1b[1m${options.profileName}\x1b[0m`);
	} else {
		console.log("Using temporary profile.");
	}

	const chromePath = path.resolve(
		process.cwd(),
		options.chromePath || "userChrome.css",
	);
	const contentPath = path.resolve(
		process.cwd(),
		options.contentPath || "userContent.css",
	);

	const chromeTarget = createWatchTarget(
		chromePath,
		ROOT_USER_CHROME_ID,
		"chrome",
	);
	const contentTarget = createWatchTarget(
		contentPath,
		ROOT_USER_CONTENT_ID,
		"content",
	);

	console.log("Launching Firefox instance...");
	await firefoxManager.initialiseBrowser(
		options.binaryPath,
		options.profileName,
		options.headless,
		options.novaUi,
	);

	if (options.watch !== false) {
		await fileWatcher.start();
		console.log("Live watcher active. Press Ctrl+C to quit.\n");
	} else {
		console.log("Firefox running. Press Ctrl+C to quit.\n");
	}

	await chromeTarget.onChange();
	await contentTarget.onChange();
	process.on("SIGINT", handleShutdown);
	process.on("SIGTERM", handleShutdown);
	void firefoxManager.waitForWindowClose().then(handleShutdown);
}

import { existsSync } from "node:fs";
import path from "node:path";
import { log } from "@clack/prompts";
import { firefoxManager } from "../firefox.js";
import { compileCssFile } from "../processor.js";
import { listProfiles, selectProfile } from "../profiles.js";
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
	log.step("Shutting down Firefox...");
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

		log.success(`Reloaded ${id} (${srcPath})`);
		return compilationResult.importedFiles;
	} catch (error) {
		log.error(
			`Build error in ${srcPath}: ${error instanceof Error ? error.message : error}`,
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
	let profileName = options.profileName;

	if (!profileName) {
		const profiles = listProfiles();
		if (profiles.length > 0) {
			const selected = await selectProfile(profiles, {
				includeTemp: true,
			});
			if (selected !== "temporary") profileName = selected;
		}
	}
	if (profileName === "temporary") profileName = undefined;

	if (profileName) {
		log.info(`Using profile: ${profileName}`);
	} else {
		log.info("Using temporary profile.");
	}

	const chromePath = path.resolve(process.cwd(), "userChrome.css");
	const contentPath = path.resolve(process.cwd(), "userContent.css");

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

	log.step("Launching Firefox instance...");
	await firefoxManager.initialiseBrowser(
		options.binaryPath,
		profileName,
		options.headless,
		options.novaUi,
	);

	if (options.watch !== false) {
		await fileWatcher.start();
		log.info("Live watcher active. Press Ctrl+C to quit.\n");
	} else {
		log.info("Firefox running. Press Ctrl+C to quit.\n");
	}

	await chromeTarget.onChange();
	await contentTarget.onChange();
	process.on("SIGINT", handleShutdown);
	process.on("SIGTERM", handleShutdown);
	void firefoxManager.waitForWindowClose().then(handleShutdown);
}

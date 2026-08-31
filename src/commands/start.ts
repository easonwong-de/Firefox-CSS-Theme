import { existsSync } from "node:fs";
import path from "node:path";
import { firefoxManager } from "../firefox.js";
import { compileCssFile } from "../processor.js";
import { resolveProfileDirectoryByName } from "../profiles.js";
import { ROOT_USER_CHROME_ID, ROOT_USER_CONTENT_ID } from "../registry.js";
import type { StartCommandOptions, StyleTarget } from "../types.js";
import { fileWatcher } from "../watcher.js";

async function processAndInjectCss(
	srcPath: string,
	destPath: string,
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
		const compilationResult = await compileCssFile(srcPath, destPath);

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

/**
 * Starts a Firefox instance, compiles and injects theme stylesheets, and
 * initiates live watching.
 */
export async function startCommand(
	options: StartCommandOptions = {},
): Promise<void> {
	let profileDirectory: string | undefined;

	if (options.profileName) {
		profileDirectory = resolveProfileDirectoryByName(options.profileName);
		console.log(`Using profile: \x1b[1m${options.profileName}\x1b[0m`);
	} else {
		console.log("Using temporary profile.");
	}

	const destChromePath = path.resolve(
		process.cwd(),
		".dist",
		"userChrome.css",
	);
	const destContentPath = path.resolve(
		process.cwd(),
		".dist",
		"userContent.css",
	);

	const srcChromePath = path.resolve(
		process.cwd(),
		options.chromePath || "userChrome.css",
	);

	const srcContentPath = path.resolve(
		process.cwd(),
		options.contentPath || "userContent.css",
	);

	const chromeTarget = {
		filePaths: [srcChromePath],
		onChange: async () => {
			const importedFiles = await processAndInjectCss(
				srcChromePath,
				destChromePath,
				ROOT_USER_CHROME_ID,
				"chrome",
			);
			fileWatcher.updateFilePaths(chromeTarget, [
				srcChromePath,
				...(importedFiles || []),
			]);
		},
	};
	fileWatcher.addTarget(chromeTarget);

	const contentTarget = {
		filePaths: [srcContentPath],
		onChange: async () => {
			const importedFiles = await processAndInjectCss(
				srcContentPath,
				destContentPath,
				ROOT_USER_CONTENT_ID,
				"content",
			);
			fileWatcher.updateFilePaths(contentTarget, [
				srcContentPath,
				...(importedFiles || []),
			]);
		},
	};
	fileWatcher.addTarget(contentTarget);

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
	}

	await chromeTarget.onChange();
	await contentTarget.onChange();

	const handleShutdown = async () => {
		console.log("\nShutting down Firefox...");
		await fileWatcher.close().catch(() => {});
		await firefoxManager.terminateBrowser().catch(() => {});
		process.exit(0);
	};

	process.on("SIGINT", handleShutdown);
	process.on("SIGTERM", handleShutdown);
}

import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compileCssFile } from "../../src/processor.js";
import type { InjectedStyleDetails } from "../../src/types.js";
import { FileWatcher, type WatchedTarget } from "../../src/watcher.js";
import type { TestCase } from "../types.js";
import { sleep } from "../utils.js";

export const testCase: TestCase = {
	name: "Theme Watcher Lifecycle",
	async run({ firefoxManager, results }) {
		const chromeSrcPath = path.resolve(
			process.cwd(),
			".test-userChrome.css",
		);
		const contentSrcPath = path.resolve(
			process.cwd(),
			".test-userContent.css",
		);
		const chromeTestId = "spec-theme-watcher-chrome-id";
		const contentTestId = "spec-theme-watcher-content-id";
		const testColour = "rgb(100, 150, 200)";

		writeFileSync(chromeSrcPath, "/* placeholder */\n", "utf8");
		writeFileSync(contentSrcPath, "/* placeholder */\n", "utf8");

		const watcher = new FileWatcher();

		const chromeTarget: WatchedTarget = {
			filePaths: [chromeSrcPath],
			onChange: async () => {
				if (!existsSync(chromeSrcPath)) {
					await firefoxManager
						.removeChromeStyle(chromeTestId)
						.catch(() => {});
					return;
				}

				try {
					const compilationResult =
						await compileCssFile(chromeSrcPath);
					await firefoxManager.injectChromeStyle(
						compilationResult.css,
						chromeTestId,
						chromeSrcPath,
					);
				} catch (error) {
					console.error("Test build error:", error);
				}
			},
		};

		const contentTarget: WatchedTarget = {
			filePaths: [contentSrcPath],
			onChange: async () => {
				if (!existsSync(contentSrcPath)) {
					await firefoxManager
						.removeContentStyle(contentTestId)
						.catch(() => {});
					return;
				}

				try {
					const compilationResult =
						await compileCssFile(contentSrcPath);
					await firefoxManager.injectContentStyle(
						compilationResult.css,
						contentTestId,
						contentSrcPath,
					);
				} catch (error) {
					console.error("Test build error:", error);
				}
			},
		};

		watcher.addTarget(chromeTarget);
		watcher.addTarget(contentTarget);

		await watcher.start();
		await sleep(200);

		try {
			// Chrome stylesheet lifecycle
			writeFileSync(
				chromeSrcPath,
				`#nav-bar { background-color: ${testColour} !important; }`,
				"utf8",
			);

			let isCreatedChromeInjected = false;
			let activeChromeAfterCreation: InjectedStyleDetails[] = [];
			for (let attemptIndex = 0; attemptIndex < 40; attemptIndex++) {
				await sleep(100);
				activeChromeAfterCreation =
					await firefoxManager.listChromeStyles();
				isCreatedChromeInjected = activeChromeAfterCreation.some(
					(style) => style.id === chromeTestId,
				);
				if (isCreatedChromeInjected) break;
			}

			if (isCreatedChromeInjected) {
				results.pass(
					"Theme watcher compiled and injected newly created chrome stylesheet",
				);
			} else {
				results.fail(
					"Theme watcher failed to inject newly created chrome stylesheet",
					activeChromeAfterCreation,
				);
			}

			unlinkSync(chromeSrcPath);

			let isDeletedChromePresent = true;
			let activeChromeAfterDeletion: InjectedStyleDetails[] = [];
			for (let attemptIndex = 0; attemptIndex < 40; attemptIndex++) {
				await sleep(100);
				activeChromeAfterDeletion =
					await firefoxManager.listChromeStyles();
				isDeletedChromePresent = activeChromeAfterDeletion.some(
					(style) => style.id === chromeTestId,
				);
				if (!isDeletedChromePresent) break;
			}

			if (!isDeletedChromePresent) {
				results.pass(
					"Theme watcher gracefully removed disappeared chrome stylesheet",
				);
			} else {
				results.fail(
					"Theme watcher failed to remove disappeared chrome stylesheet",
					activeChromeAfterDeletion,
				);
			}

			await sleep(200);

			// Content stylesheet lifecycle
			writeFileSync(
				contentSrcPath,
				`body { background-color: ${testColour} !important; }`,
				"utf8",
			);

			let isCreatedContentInjected = false;
			let activeContentAfterCreation: InjectedStyleDetails[] = [];
			for (let attemptIndex = 0; attemptIndex < 40; attemptIndex++) {
				await sleep(100);
				activeContentAfterCreation =
					await firefoxManager.listContentStyles();
				isCreatedContentInjected = activeContentAfterCreation.some(
					(style) => style.id === contentTestId,
				);
				if (isCreatedContentInjected) break;
			}

			if (isCreatedContentInjected) {
				results.pass(
					"Theme watcher compiled and injected newly created content stylesheet",
				);
			} else {
				results.fail(
					"Theme watcher failed to inject newly created content stylesheet",
					activeContentAfterCreation,
				);
			}

			unlinkSync(contentSrcPath);

			let isDeletedContentPresent = true;
			let activeContentAfterDeletion: InjectedStyleDetails[] = [];
			for (let attemptIndex = 0; attemptIndex < 40; attemptIndex++) {
				await sleep(100);
				activeContentAfterDeletion =
					await firefoxManager.listContentStyles();
				isDeletedContentPresent = activeContentAfterDeletion.some(
					(style) => style.id === contentTestId,
				);
				if (!isDeletedContentPresent) break;
			}

			if (!isDeletedContentPresent) {
				results.pass(
					"Theme watcher gracefully removed disappeared content stylesheet",
				);
			} else {
				results.fail(
					"Theme watcher failed to remove disappeared content stylesheet",
					activeContentAfterDeletion,
				);
			}
		} finally {
			watcher.removeTarget(chromeTarget);
			watcher.removeTarget(contentTarget);
			await watcher.close();
			if (existsSync(chromeSrcPath)) {
				unlinkSync(chromeSrcPath);
			}
			if (existsSync(contentSrcPath)) {
				unlinkSync(contentSrcPath);
			}
		}
	},
};

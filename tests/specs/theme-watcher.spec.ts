import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { describe, expect, test } from "bun:test";
import { firefoxManager } from "../../src/firefox.js";
import { compileCssFile } from "../../src/processor.js";
import type { InjectedStyleDetails } from "../../src/types.js";
import { FileWatcher, type WatchedTarget } from "../../src/watcher.js";

describe("Theme Watcher Lifecycle", () => {
	test("handles chrome and content stylesheets lifecycle", async () => {
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
		await setTimeout(200);

		try {
			writeFileSync(
				chromeSrcPath,
				`#nav-bar { background-color: ${testColour} !important; }`,
				"utf8",
			);

			let isCreatedChromeInjected = false;
			let activeChromeAfterCreation: InjectedStyleDetails[] = [];
			for (let attemptIndex = 0; attemptIndex < 40; attemptIndex++) {
				await setTimeout(100);
				activeChromeAfterCreation =
					await firefoxManager.listChromeStyles();
				isCreatedChromeInjected = activeChromeAfterCreation.some(
					(style) => style.id === chromeTestId,
				);
				if (isCreatedChromeInjected) break;
			}

			expect(isCreatedChromeInjected).toBe(true);

			unlinkSync(chromeSrcPath);

			let isDeletedChromePresent = true;
			let activeChromeAfterDeletion: InjectedStyleDetails[] = [];
			for (let attemptIndex = 0; attemptIndex < 40; attemptIndex++) {
				await setTimeout(100);
				activeChromeAfterDeletion =
					await firefoxManager.listChromeStyles();
				isDeletedChromePresent = activeChromeAfterDeletion.some(
					(style) => style.id === chromeTestId,
				);
				if (!isDeletedChromePresent) break;
			}

			expect(isDeletedChromePresent).toBe(false);

			await setTimeout(200);

			writeFileSync(
				contentSrcPath,
				`body { background-color: ${testColour} !important; }`,
				"utf8",
			);

			let isCreatedContentInjected = false;
			let activeContentAfterCreation: InjectedStyleDetails[] = [];
			for (let attemptIndex = 0; attemptIndex < 40; attemptIndex++) {
				await setTimeout(100);
				activeContentAfterCreation =
					await firefoxManager.listContentStyles();
				isCreatedContentInjected = activeContentAfterCreation.some(
					(style) => style.id === contentTestId,
				);
				if (isCreatedContentInjected) break;
			}

			expect(isCreatedContentInjected).toBe(true);

			unlinkSync(contentSrcPath);

			let isDeletedContentPresent = true;
			let activeContentAfterDeletion: InjectedStyleDetails[] = [];
			for (let attemptIndex = 0; attemptIndex < 40; attemptIndex++) {
				await setTimeout(100);
				activeContentAfterDeletion =
					await firefoxManager.listContentStyles();
				isDeletedContentPresent = activeContentAfterDeletion.some(
					(style) => style.id === contentTestId,
				);
				if (!isDeletedContentPresent) break;
			}

			expect(isDeletedContentPresent).toBe(false);
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
	});
});

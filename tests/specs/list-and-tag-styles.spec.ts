import { describe, expect, test } from "bun:test";

import { firefoxManager } from "../../src/firefox.js";

describe("List Injected Styles and Style Registry", () => {
	test("registers, lists, and deregisters chrome styles", async () => {
		const customChromeId = "spec-custom-chrome-id";
		const chromeCss = "#TabsToolbar { opacity: 0.8 !important; }";

		await firefoxManager.injectChromeStyle(
			chromeCss,
			customChromeId,
			"/path/to/chrome.css",
		);

		const activeChromeStyles = await firefoxManager.listChromeStyles();
		const matchedChrome = activeChromeStyles.find(
			(style) => style.id === customChromeId,
		);

		expect(matchedChrome).toBeDefined();
		expect(matchedChrome?.id).toBe(customChromeId);
		expect(matchedChrome?.srcPath).toBe("/path/to/chrome.css");

		const chromeRemoval =
			await firefoxManager.removeChromeStyle(customChromeId);
		expect(chromeRemoval.removed).toBe(true);
	});

	test("registers, lists, and deregisters content styles", async () => {
		const customContentId = "spec-custom-content-id";
		const contentCss = "body { margin: 0 !important; }";

		await firefoxManager.injectContentStyle(
			contentCss,
			customContentId,
			"/path/to/content.css",
		);

		const activeContentStyles = await firefoxManager.listContentStyles();
		const matchedContent = activeContentStyles.find(
			(style) => style.id === customContentId,
		);

		expect(matchedContent).toBeDefined();
		expect(matchedContent?.id).toBe(customContentId);
		expect(matchedContent?.srcPath).toBe("/path/to/content.css");

		const contentRemoval =
			await firefoxManager.removeContentStyle(customContentId);
		expect(contentRemoval.removed).toBe(true);
	});
});

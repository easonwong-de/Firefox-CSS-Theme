import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "List Injected Styles and Style Registry",
	async run({ firefoxManager, results }) {
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

		if (matchedChrome && matchedChrome.id === customChromeId) {
			results.pass("Injected chrome style listed in active styles query");
		} else {
			results.fail(
				"Injected chrome style not found in active styles query",
				{ activeStyles: activeChromeStyles },
			);
		}

		if (matchedChrome && matchedChrome.srcPath === "/path/to/chrome.css") {
			results.pass(
				"Chrome style metadata preserved registered source path",
			);
		} else {
			results.fail("Registered file path mismatch in chrome metadata", {
				matchedStyle: matchedChrome,
			});
		}

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

		if (matchedContent && matchedContent.id === customContentId) {
			results.pass(
				"Injected content style listed in active styles query",
			);
		} else {
			results.fail(
				"Injected content style not found in active styles query",
				{ activeStyles: activeContentStyles },
			);
		}

		if (
			matchedContent &&
			matchedContent.srcPath === "/path/to/content.css"
		) {
			results.pass(
				"Content style metadata preserved registered source path",
			);
		} else {
			results.fail("Registered file path mismatch in content metadata", {
				matchedStyle: matchedContent,
			});
		}

		const chromeRemoval =
			await firefoxManager.removeChromeStyle(customChromeId);
		if (chromeRemoval.removed) {
			results.pass("Chrome style removed and deregistered");
		} else {
			results.fail("Failed to remove chrome style", chromeRemoval);
		}

		const contentRemoval =
			await firefoxManager.removeContentStyle(customContentId);
		if (contentRemoval.removed) {
			results.pass("Content style removed and deregistered");
		} else {
			results.fail("Failed to remove content style", contentRemoval);
		}
	},
};

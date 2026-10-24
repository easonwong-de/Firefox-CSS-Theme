import { describe, expect, test } from "bun:test";

import { firefoxManager } from "../../src/firefox.js";

describe("Inject and Remove Styles", () => {
	test("injects, verifies, and removes userChrome style", async () => {
		const chromeId = "spec-test-chrome-style";
		const chromeColour = "rgb(123, 45, 67)";

		const chromeInjection = await firefoxManager.injectChromeStyle(
			`#nav-bar { background-color: ${chromeColour} !important; }`,
			chromeId,
		);
		expect(chromeInjection.success).toBe(true);
		expect(chromeInjection.id).toBe(chromeId);

		const updatedStyles = await firefoxManager.getComputedStyles(
			"#nav-bar",
			["background-color"],
		);
		expect(updatedStyles["background-color"]).toBe(chromeColour);

		const chromeRemoval = await firefoxManager.removeChromeStyle(chromeId);
		expect(chromeRemoval.removed).toBe(true);
		expect(chromeRemoval.id).toBe(chromeId);
	});

	test("injects, verifies, and removes userContent style", async () => {
		const contentId = "spec-test-content-style";
		const contentColour = "rgb(65, 43, 21)";
		const contentCss = `body { background-color: ${contentColour} !important; }`;

		const contentInjection = await firefoxManager.injectContentStyle(
			contentCss,
			contentId,
		);
		expect(contentInjection.success).toBe(true);
		expect(contentInjection.id).toBe(contentId);

		const isSheetRegistered =
			await firefoxManager.executeChromeScript<boolean>((id: string) => {
				const win = window as any;
				const uriStr = win.__injectedContentSheets?.get(id);
				if (!uriStr) return false;
				const sss = (globalThis as any).Cc[
					"@mozilla.org/content/style-sheet-service;1"
				].getService((globalThis as any).Ci.nsIStyleSheetService);
				const ioService = (globalThis as any).Cc[
					"@mozilla.org/network/io-service;1"
				].getService((globalThis as any).Ci.nsIIOService);
				const uri = ioService.newURI(uriStr);
				return sss.sheetRegistered(uri, sss.USER_SHEET);
			}, contentId);
		expect(isSheetRegistered).toBe(true);

		const contentRemoval =
			await firefoxManager.removeContentStyle(contentId);
		expect(contentRemoval.removed).toBe(true);
		expect(contentRemoval.id).toBe(contentId);

		const isStillRegistered =
			await firefoxManager.executeChromeScript<boolean>((id: string) => {
				const win = window as any;
				return win.__injectedContentSheets?.has(id) ?? false;
			}, contentId);
		expect(isStillRegistered).toBe(false);
	});
});

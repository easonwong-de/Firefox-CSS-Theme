import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Inject and Remove Styles",
	async run({ firefoxManager, results }) {
		const chromeId = "spec-test-chrome-style";
		const chromeColour = "rgb(123, 45, 67)";

		const chromeInjection = await firefoxManager.injectChromeStyle(
			`#nav-bar { background-color: ${chromeColour} !important; }`,
			chromeId,
		);

		if (chromeInjection.success && chromeInjection.id === chromeId) {
			results.pass("Live userChrome injected successfully");
		} else {
			results.fail("userChrome injection failed", chromeInjection);
		}

		const updatedStyles = await firefoxManager.getComputedStyles(
			"#nav-bar",
			["background-color"],
		);

		if (updatedStyles["background-color"] === chromeColour) {
			results.pass(
				"Injected userChrome updated computed background-color",
			);
		} else {
			results.fail(
				"Injected userChrome did not apply correctly",
				`expected: ${chromeColour}, got: ${updatedStyles["background-color"]}`,
			);
		}

		const chromeRemoval = await firefoxManager.removeChromeStyle(chromeId);

		if (chromeRemoval.removed && chromeRemoval.id === chromeId) {
			results.pass("Live userChrome removed successfully");
		} else {
			results.fail("userChrome removal failed", chromeRemoval);
		}

		const contentId = "spec-test-content-style";
		const contentColour = "rgb(65, 43, 21)";
		const contentCss = `body { background-color: ${contentColour} !important; }`;

		const contentInjection = await firefoxManager.injectContentStyle(
			contentCss,
			contentId,
		);

		if (contentInjection.success && contentInjection.id === contentId) {
			results.pass("Live userContent injected successfully");
		} else {
			results.fail("userContent injection failed", contentInjection);
		}

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

		if (isSheetRegistered) {
			results.pass(
				"userContent style sheet registered with StyleSheetService",
			);
		} else {
			results.fail(
				"userContent style sheet not registered with StyleSheetService",
			);
		}

		const contentRemoval =
			await firefoxManager.removeContentStyle(contentId);
		if (contentRemoval.removed && contentRemoval.id === contentId) {
			results.pass("Live userContent removed successfully");
		} else {
			results.fail("userContent removal failed", contentRemoval);
		}

		const isStillRegistered =
			await firefoxManager.executeChromeScript<boolean>((id: string) => {
				const win = window as any;
				return win.__injectedContentSheets?.has(id) ?? false;
			}, contentId);

		if (!isStillRegistered) {
			results.pass(
				"userContent style sheet unregistered from StyleSheetService",
			);
		} else {
			results.fail(
				"userContent style sheet was not unregistered",
				isStillRegistered,
			);
		}
	},
};

import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Take UI Screenshot",
	async run({ firefoxManager, results }) {
		const fullScreenshot = await firefoxManager.getScreenshot();
		if (
			fullScreenshot.format === "png" &&
			typeof fullScreenshot.base64Image === "string" &&
			fullScreenshot.base64Image.length > 100
		) {
			results.pass("Captured full window screenshot as PNG base64");
		} else {
			results.fail(
				"Full window screenshot invalid",
				fullScreenshot.format,
			);
		}

		const elementScreenshot =
			await firefoxManager.getScreenshot("#nav-bar");
		if (
			elementScreenshot.format === "png" &&
			typeof elementScreenshot.base64Image === "string" &&
			elementScreenshot.base64Image.length > 100
		) {
			results.pass("Captured #nav-bar screenshot as PNG base64");
		} else {
			results.fail(
				"Element screenshot invalid",
				elementScreenshot.format,
			);
		}
	},
};

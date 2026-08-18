import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Customize Toolbar Mode",
	async run({ firefoxManager, results }) {
		const enterResult = await firefoxManager.customizeToolbar("enter");
		if (enterResult.success && enterResult.isCustomizing) {
			results.pass("Entered toolbar customization mode");
		} else {
			results.fail("Failed to enter customization mode", enterResult);
		}

		const exitResult = await firefoxManager.customizeToolbar("exit");
		if (exitResult.success && !exitResult.isCustomizing) {
			results.pass("Exited toolbar customization mode");
		} else {
			results.fail("Failed to exit customization mode", exitResult);
		}
	},
};

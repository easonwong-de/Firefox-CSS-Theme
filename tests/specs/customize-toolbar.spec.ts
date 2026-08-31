import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Customise Toolbar Mode",
	async run({ firefoxManager, results }) {
		const enterResult = await firefoxManager.customiseToolbar("enter");
		if (enterResult.success && enterResult.isCustomising) {
			results.pass("Entered toolbar customisation mode");
		} else {
			results.fail("Failed to enter customisation mode", enterResult);
		}

		const exitResult = await firefoxManager.customiseToolbar("exit");
		if (exitResult.success && !exitResult.isCustomising) {
			results.pass("Exited toolbar customisation mode");
		} else {
			results.fail("Failed to exit customisation mode", exitResult);
		}
	},
};

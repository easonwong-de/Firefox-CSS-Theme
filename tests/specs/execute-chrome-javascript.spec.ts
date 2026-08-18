import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Execute Chrome JavaScript",
	async run({ firefoxManager, results }) {
		const executionResult =
			await firefoxManager.executeChromeScript<string>(() => {
				return document.documentElement.tagName.toLowerCase();
			});

		if (
			typeof executionResult === "string" &&
			(executionResult === "html" || executionResult === "window")
		) {
			results.pass(
				`Chrome context script executed successfully (documentElement: ${executionResult})`,
			);
		} else {
			results.fail(
				"Chrome script execution returned unexpected result",
				executionResult,
			);
		}
	},
};

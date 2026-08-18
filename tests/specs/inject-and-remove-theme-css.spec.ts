import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Inject and Remove Theme CSS",
	async run({ firefoxManager, results }) {
		const testStyleIdentifier = "spec-test-style";
		const testColour = "rgb(123, 45, 67)";

		const injectionResult = await firefoxManager.injectUserInterfaceStyle(
			`#nav-bar { background-color: ${testColour} !important; }`,
			testStyleIdentifier,
		);

		if (
			injectionResult.success &&
			injectionResult.identifier === testStyleIdentifier
		) {
			results.pass("Live CSS injected successfully");
		} else {
			results.fail("CSS injection failed", injectionResult);
		}

		const updatedStyles = await firefoxManager.getComputedStyles(
			"#nav-bar",
			["background-color"],
		);

		if (updatedStyles["background-color"] === testColour) {
			results.pass("Injected CSS updated computed background-color");
		} else {
			results.fail(
				"Injected CSS did not apply correctly",
				`expected: ${testColour}, got: ${updatedStyles["background-color"]}`,
			);
		}

		const removalResult =
			await firefoxManager.removeUserInterfaceStyle(testStyleIdentifier);

		if (
			removalResult.removed &&
			removalResult.identifier === testStyleIdentifier
		) {
			results.pass("Live CSS removed successfully");
		} else {
			results.fail("CSS removal failed", removalResult);
		}
	},
};

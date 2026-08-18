import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Query UI Elements",
	async run({ firefoxManager, results }) {
		const elements = await firefoxManager.queryElements("#nav-bar");

		if (!Array.isArray(elements) || elements.length === 0) {
			results.fail("Navbar element not found with selector #nav-bar");
			return;
		}

		const navigationToolbar = elements[0];
		if (navigationToolbar?.id === "nav-bar") {
			results.pass("Found #nav-bar element");
		} else {
			results.fail(
				"Expected element id to be nav-bar",
				navigationToolbar,
			);
		}

		if (navigationToolbar?.tagName === "toolbar") {
			results.pass("Navbar element has correct tagName 'toolbar'");
		} else {
			results.fail("Navbar tagName mismatch", navigationToolbar?.tagName);
		}

		if (
			navigationToolbar?.attributes &&
			typeof navigationToolbar.attributes === "object"
		) {
			results.pass("Navbar attributes successfully extracted");
		} else {
			results.fail("Navbar attributes missing or invalid");
		}
	},
};

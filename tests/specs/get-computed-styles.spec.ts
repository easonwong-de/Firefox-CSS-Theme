import type { TestCase } from "../types.js";

export const testCase: TestCase = {
	name: "Get Computed Styles",
	async run({ firefoxManager, results }) {
		const styles = await firefoxManager.getComputedStyles("#nav-bar", [
			"display",
			"visibility",
		]);

		if (styles && typeof styles === "object") {
			results.pass("Retrieved computed styles object");
		} else {
			results.fail("Failed to retrieve computed styles object", styles);
			return;
		}

		if (styles["display"]) {
			results.pass(`Navbar display style resolved: ${styles["display"]}`);
		} else {
			results.fail("Navbar display property missing");
		}

		if (styles["visibility"]) {
			results.pass(
				`Navbar visibility style resolved: ${styles["visibility"]}`,
			);
		} else {
			results.fail("Navbar visibility property missing");
		}
	},
};

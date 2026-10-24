import { describe, expect, test } from "bun:test";

import { firefoxManager } from "../../src/firefox.js";

describe("Get Computed Styles", () => {
	test("retrieves computed styles for element", async () => {
		const styles = await firefoxManager.getComputedStyles("#nav-bar", [
			"display",
			"visibility",
		]);

		expect(styles).toBeDefined();
		expect(typeof styles).toBe("object");
		expect(styles["display"]).toBe("flex");
		expect(styles["visibility"]).toBe("visible");
	});
});

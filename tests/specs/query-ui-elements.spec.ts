import { describe, expect, test } from "bun:test";

import { firefoxManager } from "../../src/firefox.js";

describe("Query UI Elements", () => {
	test("queries navbar element with selector", async () => {
		const elements = await firefoxManager.queryElements("#nav-bar");

		expect(Array.isArray(elements)).toBe(true);
		expect(elements.length).toBeGreaterThan(0);

		const navigationToolbar = elements[0];
		expect(navigationToolbar?.id).toBe("nav-bar");
		expect(navigationToolbar?.tagName).toBe("toolbar");
		expect(navigationToolbar?.attributes).toBeDefined();
		expect(typeof navigationToolbar?.attributes).toBe("object");
	});
});

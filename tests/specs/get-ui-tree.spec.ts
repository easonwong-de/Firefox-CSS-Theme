import { describe, expect, test } from "bun:test";

import { firefoxManager } from "../../src/firefox.js";

describe("Get UI Tree", () => {
	test("retrieves UI tree hierarchy", async () => {
		const tree = await firefoxManager.getUiTree("#nav-bar", 2);

		expect(tree).toBeDefined();
		expect(typeof tree).toBe("object");
		expect(tree.id).toBe("nav-bar");
		expect(tree.tagName).toBe("toolbar");
		expect(Array.isArray(tree.children)).toBe(true);
		expect(tree.children.length).toBeGreaterThan(0);
	});
});

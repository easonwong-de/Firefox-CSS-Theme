import { describe, expect, test } from "bun:test";
import { firefoxManager } from "../../src/firefox.js";

describe("Customise Toolbar Mode", () => {
	test("enters and exits customisation mode", async () => {
		const enterResult = await firefoxManager.customiseToolbar("enter");
		expect(enterResult.success).toBe(true);
		expect(enterResult.isCustomising).toBe(true);

		const exitResult = await firefoxManager.customiseToolbar("exit");
		expect(exitResult.success).toBe(true);
		expect(exitResult.isCustomising).toBe(false);
	});
});

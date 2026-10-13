import { describe, expect, test } from "bun:test";
import { firefoxManager } from "../../src/firefox.js";

describe("Execute Chrome JavaScript", () => {
	test("executes script in chrome context", async () => {
		const executionResult =
			await firefoxManager.executeChromeScript<string>(() => {
				return document.documentElement.tagName.toLowerCase();
			});

		expect(typeof executionResult).toBe("string");
		expect(["html", "window"]).toContain(executionResult);
	});
});

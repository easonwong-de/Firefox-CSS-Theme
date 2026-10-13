import { describe, expect, test } from "bun:test";
import { firefoxManager } from "../../src/firefox.js";

describe("Take UI Screenshot", () => {
	test("captures full window screenshot as PNG base64", async () => {
		const fullScreenshot = await firefoxManager.getScreenshot();
		expect(fullScreenshot.format).toBe("png");
		expect(typeof fullScreenshot.base64Image).toBe("string");
		expect(fullScreenshot.base64Image.length).toBeGreaterThan(100);
	});

	test("captures navbar element screenshot as PNG base64", async () => {
		const elementScreenshot =
			await firefoxManager.getScreenshot("#nav-bar");
		expect(elementScreenshot.format).toBe("png");
		expect(typeof elementScreenshot.base64Image).toBe("string");
		expect(elementScreenshot.base64Image.length).toBeGreaterThan(100);
	});
});

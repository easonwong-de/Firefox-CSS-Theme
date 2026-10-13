import { afterAll, beforeAll } from "bun:test";
import { firefoxManager } from "../src/firefox.js";

beforeAll(async () => {
	const isHeadless = !process.argv.includes("--no-headless");
	await firefoxManager.initialiseBrowser(undefined, undefined, isHeadless);
});

afterAll(async () => {
	await firefoxManager.terminateBrowser().catch(() => {});
});
